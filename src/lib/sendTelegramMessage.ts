import 'server-only';

export async function sendTelegramMessage(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (process.env.NODE_ENV !== 'production' || !token) return;

  // Preserve the previous destination unless explicitly overridden.
  const chatId = process.env.TELEGRAM_CHAT_ID || '1912767327';
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `${message}\n${new Date().toLocaleTimeString('tr-TR')}`,
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new Error('Telegram notification failed');
}
