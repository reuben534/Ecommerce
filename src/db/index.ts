import mongoose from 'mongoose';
import { MongoTable } from './schema.ts';

type Field = { table: string; key: string };
type Condition = { kind: string; field?: Field; value?: any; values?: any[]; conditions?: Condition[]; pattern?: string } | undefined;
type Sort = { field?: Field; direction: 1 | -1 };
type Selection = Record<string, any>;

let connectionPromise: Promise<typeof mongoose> | null = null;
let nextId = 1;

export async function connectMongo() {
  if (!connectionPromise) {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura_goods';
    connectionPromise = mongoose.connect(uri);
  }
  await connectionPromise;
  return mongoose.connection.db;
}

function fieldValue(row: any, field: Field) {
  return row[field.table]?.[field.key] ?? row[field.key];
}

function compare(left: any, right: any) {
  const a = typeof left === 'string' && !Number.isNaN(Number(left)) ? Number(left) : left;
  const b = typeof right === 'string' && !Number.isNaN(Number(right)) ? Number(right) : right;
  return a < b ? -1 : a > b ? 1 : 0;
}

function matches(row: any, condition: Condition): boolean {
  if (!condition) return true;
  switch (condition.kind) {
    case 'eq': return fieldValue(row, condition.field!) === condition.value;
    case 'neq': return fieldValue(row, condition.field!) !== condition.value;
    case 'gte': return compare(fieldValue(row, condition.field!), condition.value) >= 0;
    case 'lte': return compare(fieldValue(row, condition.field!), condition.value) <= 0;
    case 'ilike': return new RegExp(String(condition.pattern).replace(/%/g, '.*'), 'i').test(String(fieldValue(row, condition.field!) ?? ''));
    case 'in': return condition.values!.includes(fieldValue(row, condition.field!));
    case 'and': return condition.conditions!.every((item) => matches(row, item));
    case 'or': return condition.conditions!.some((item) => matches(row, item));
    default: return true;
  }
}

function normalize(doc: any) {
  const result = { ...doc };
  delete result._id;
  delete result.__v;
  return result;
}

class SelectQuery implements PromiseLike<any[]> {
  private source?: MongoTable;
  private condition?: Condition;
  private joins: Array<{ table: MongoTable; condition: Condition }> = [];
  private sort?: Sort;
  private max?: number;
  private skip = 0;
  private groups: Field[] = [];

  constructor(private readonly selection?: Selection) {}
  from(source: MongoTable) { this.source = source; return this; }
  where(condition: Condition) { this.condition = condition; return this; }
  innerJoin(table: MongoTable, condition: Condition) { this.joins.push({ table, condition }); return this; }
  leftJoin(table: MongoTable, condition: Condition) { this.joins.push({ table, condition }); return this; }
  orderBy(sort: Sort) { this.sort = sort; return this; }
  limit(value: number) { this.max = value; return this; }
  offset(value: number) { this.skip = value; return this; }
  groupBy(...fields: Field[]) { this.groups = fields; return this; }

  async exec() {
    if (!this.source) return [];
    const database = await connectMongo();
    const documents = await database.collection(this.source.collection).find({}).toArray();
    let rows: any[] = documents.map((doc) => ({ [this.source!.collection]: normalize(doc) }));

    for (const join of this.joins) {
      const joined = await database.collection(join.table.collection).find({}).toArray();
      const expanded: any[] = [];
      for (const row of rows) {
        for (const document of joined) {
          const candidate = { ...row, [join.table.collection]: normalize(document) };
          if (matches(candidate, join.condition)) expanded.push(candidate);
        }
      }
      rows = expanded;
    }

    rows = rows.filter((row) => matches(row, this.condition));
    if (this.groups.length > 0) {
      const grouped = new Map<string, any[]>();
      for (const row of rows) {
        const key = JSON.stringify(this.groups.map((field) => fieldValue(row, field)));
        grouped.set(key, [...(grouped.get(key) || []), row]);
      }
      rows = [...grouped.values()].map((group) => ({ ...group[0], __group: group }));
    }

    if (this.sort?.field) {
      rows.sort((a, b) => compare(fieldValue(a, this.sort!.field!), fieldValue(b, this.sort!.field!)) * this.sort!.direction);
    }
    rows = rows.slice(this.skip, this.max === undefined ? undefined : this.skip + this.max);

    if (!this.selection) return rows.map((row) => normalize(row[this.source!.collection]));
    return rows.map((row) => {
      const result: any = {};
      for (const [key, expression] of Object.entries(this.selection!)) {
        if (expression?.kind === 'aggregate') {
          const group = row.__group || [row];
          const values = group.map((item: any) => fieldValue(item, expression.field)).filter((value: any) => value !== undefined);
          result[key] = expression.operation === 'count' ? group.length : expression.operation === 'sum' ? values.reduce((sum: number, value: any) => sum + Number(value || 0), 0) : values.length ? values.reduce((sum: number, value: any) => sum + Number(value), 0) / values.length : 0;
        } else if (expression?.kind === 'raw') {
          result[key] = 0;
        } else {
          result[key] = expression?.table ? fieldValue(row, expression) : expression;
        }
      }
      return result;
    });
  }

  then<TResult1 = any[], TResult2 = never>(onfulfilled?: ((value: any[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) {
    return this.exec().then(onfulfilled, onrejected);
  }
}

class InsertQuery {
  private valuesToInsert: any;
  private conflict?: { field: Field; set: any };
  constructor(private readonly source: MongoTable) {}
  values(values: any) { this.valuesToInsert = values; return this; }
  onConflictDoUpdate(options: { target: Field; set: any }) { this.conflict = { field: options.target, set: options.set }; return this; }
  async returning() {
    const database = await connectMongo();
    const values = Array.isArray(this.valuesToInsert) ? this.valuesToInsert : [this.valuesToInsert];
    const result: any[] = [];
    for (const value of values) {
      const data = { ...value, id: value.id || await nextNumericId(database, this.source.collection), createdAt: value.createdAt || new Date(), updatedAt: value.updatedAt || new Date() };
      if (this.conflict) {
        const existing = await database.collection(this.source.collection).findOne({ [this.conflict.field.key]: value[this.conflict.field.key] });
        if (existing) {
          await database.collection(this.source.collection).updateOne({ _id: existing._id }, { $set: this.conflict.set });
          result.push(normalize({ ...existing, ...this.conflict.set }));
          continue;
        }
      }
      await database.collection(this.source.collection).insertOne(data);
      result.push(normalize(data));
    }
    return result;
  }
  then<TResult1 = any[], TResult2 = never>(onfulfilled?: ((value: any[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.returning().then(onfulfilled, onrejected); }
}

class UpdateQuery {
  private changes: any = {};
  private condition?: Condition;
  constructor(private readonly source: MongoTable) {}
  set(changes: any) { this.changes = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)); return this; }
  where(condition: Condition) { this.condition = condition; return this; }
  async returning() {
    const database = await connectMongo();
    const docs = await database.collection(this.source.collection).find({}).toArray();
    const result: any[] = [];
    for (const doc of docs) {
      if (matches({ [this.source.collection]: normalize(doc) }, this.condition)) {
        await database.collection(this.source.collection).updateOne({ _id: doc._id }, { $set: this.changes });
        result.push(normalize({ ...doc, ...this.changes }));
      }
    }
    return result;
  }
  then<TResult1 = any[], TResult2 = never>(onfulfilled?: ((value: any[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.returning().then(onfulfilled, onrejected); }
}

class DeleteQuery {
  private condition?: Condition;
  constructor(private readonly source: MongoTable) {}
  where(condition: Condition) { this.condition = condition; return this; }
  async execute() {
    const database = await connectMongo();
    const docs = await database.collection(this.source.collection).find({}).toArray();
    let deletedCount = 0;
    for (const doc of docs) if (matches({ [this.source.collection]: normalize(doc) }, this.condition)) { await database.collection(this.source.collection).deleteOne({ _id: doc._id }); deletedCount++; }
    return { deletedCount };
  }
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.execute().then(onfulfilled, onrejected); }
}

async function nextNumericId(database: NonNullable<typeof mongoose.connection.db>, collection: string) {
  const last = await database.collection(collection).find({ id: { $exists: true } }).sort({ id: -1 }).limit(1).next();
  return Math.max(nextId++, Number(last?.id || 0) + 1);
}

export const db = {
  select(selection?: Selection) { return new SelectQuery(selection); },
  insert(source: MongoTable) { return new InsertQuery(source); },
  update(source: MongoTable) { return new UpdateQuery(source); },
  delete(source: MongoTable) { return new DeleteQuery(source); },
};

export function eq(field: Field, value: any): Condition { return { kind: 'eq', field, value }; }
export function neq(field: Field, value: any): Condition { return { kind: 'neq', field, value }; }
export function and(...conditions: Condition[]): Condition { return { kind: 'and', conditions: conditions.filter(Boolean) as Condition[] }; }
export function or(...conditions: Condition[]): Condition { return { kind: 'or', conditions: conditions.filter(Boolean) as Condition[] }; }
export function gte(field: Field, value: any): Condition { return { kind: 'gte', field, value }; }
export function lte(field: Field, value: any): Condition { return { kind: 'lte', field, value }; }
export function ilike(field: Field, pattern: string): Condition { return { kind: 'ilike', field, pattern }; }
export function inArray(field: Field, values: any[]): Condition { return { kind: 'in', field, values }; }
export function desc(field: Field): Sort { return { field, direction: -1 }; }
export function asc(field: Field): Sort { return { field, direction: 1 }; }
export function sql<T>(strings: TemplateStringsArray, ...values: any[]): any {
  const text = strings.join('?');
  if (/count\(/i.test(text)) return { kind: 'aggregate', operation: 'count', field: values[0] || { table: '', key: '' } };
  if (/sum\(/i.test(text)) return { kind: 'aggregate', operation: 'sum', field: values[0] };
  if (/avg\(/i.test(text)) return { kind: 'aggregate', operation: 'avg', field: values[0] };
  if (/!=/.test(text)) return { kind: 'neq', field: values[0], value: values[1] };
  return { kind: 'raw', text, values };
}
