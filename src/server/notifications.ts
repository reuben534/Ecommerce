export interface NotificationPayload {
  type: 'order_confirmed' | 'order_shipped' | 'order_cancelled' | 'welcome';
  toEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

export async function sendNotification(payload: NotificationPayload) {
  const { type, toEmail, recipientName, data } = payload;
  const timestamp = new Date().toISOString();

  let subject = '';
  let preview = '';

  switch (type) {
    case 'order_confirmed':
      subject = `Order Confirmed #${data.orderNumber} - Thank you for your purchase!`;
      preview = `We are preparing your order of ${data.itemCount || 1} item(s) for a total of $${data.total}.`;
      break;
    case 'order_shipped':
      subject = `Your Order #${data.orderNumber} Has Shipped!`;
      preview = `Shipped via ${data.carrier || 'Express Carrier'}. Tracking Number: ${data.trackingNumber}.`;
      break;
    case 'order_cancelled':
      subject = `Order #${data.orderNumber} Has Been Cancelled`;
      preview = `Your order has been cancelled and a refund of $${data.total} has been issued.`;
      break;
    case 'welcome':
      subject = `Welcome to AURA Minimal Goods!`;
      preview = `Thank you for joining our community. Enjoy 10% off with code WELCOME10.`;
      break;
  }

  console.log(`\n======================================================`);
  console.log(`[TRANSACTIONAL EMAIL DISPATCH] [${timestamp}]`);
  console.log(`To: ${recipientName} <${toEmail}>`);
  console.log(`Subject: ${subject}`);
  console.log(`Preview: ${preview}`);
  console.log(`Payload Data:`, JSON.stringify(data, null, 2));
  console.log(`======================================================\n`);

  return { success: true, timestamp, subject };
}
