import twilio from 'twilio';

// Inicialización lazy — no falla si Twilio no está configurado
function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID ?? '';
  const token = process.env.TWILIO_AUTH_TOKEN ?? '';
  if (!sid.startsWith('AC') || !token || token === 'placeholder') {
    throw new Error('Twilio no configurado. Completá TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en el .env');
  }
  return twilio(sid, token);
}

export async function sendWhatsApp(to: string, body: string, from: string): Promise<void> {
  const client = getClient();
  const chunks = splitMessage(body, 4000);
  for (const chunk of chunks) {
    await client.messages.create({ from, to, body: chunk });
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf('\n', maxLen);
    if (cut === -1) cut = maxLen;
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}
