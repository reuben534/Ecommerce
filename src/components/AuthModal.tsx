import React, { useEffect, useState } from 'react';
import { LockKeyhole, Mail, UserRound, X } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, submitSignIn, isAuthLoading } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isAuthModalOpen) {
      setName('');
      setEmail('');
      setPassword('');
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitSignIn({ name, email, password });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onMouseDown={closeAuthModal}>
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">AURA ACCOUNT</p>
            <h2 className="mt-2 text-2xl font-black text-white">Sign in to continue</h2>
            <p className="mt-2 text-xs text-neutral-400">Use your account details to access orders, addresses, and saved items.</p>
          </div>
          <button type="button" onClick={closeAuthModal} aria-label="Close sign in" className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold text-neutral-300">
            Name
            <span className="relative mt-1 block">
              <UserRound className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Mercer" className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-500" />
            </span>
          </label>
          <label className="block text-xs font-semibold text-neutral-300">
            Email address
            <span className="relative mt-1 block">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@domain.com" className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-500" />
            </span>
          </label>
          <label className="block text-xs font-semibold text-neutral-300">
            Password
            <span className="relative mt-1 block">
              <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-500" />
            </span>
          </label>
          <button disabled={isAuthLoading} type="submit" className="w-full rounded-xl bg-amber-400 py-3 text-sm font-black text-neutral-950 transition-colors hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60">
            {isAuthLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}