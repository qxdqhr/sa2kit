import { defaultPhoneValidator } from './plugins/dev-otp';

type PendingEntry = {
  password: string;
  expiresAt: number;
};

const pendingByPhone = new Map<string, PendingEntry>();
const TTL_MS = 5 * 60 * 1000;

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

export function stashPhoneSignupPassword(phoneNumber: string, password: string): void {
  pendingByPhone.set(normalizePhone(phoneNumber), {
    password,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function consumePhoneSignupPassword(phoneNumber: string): string | undefined {
  const key = normalizePhone(phoneNumber);
  const entry = pendingByPhone.get(key);
  pendingByPhone.delete(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) return undefined;
  return entry.password;
}

export async function handlePhoneSignupIntentRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: { phoneNumber?: string; password?: string };
  try {
    body = (await request.json()) as { phoneNumber?: string; password?: string };
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const phoneNumber = String(body.phoneNumber ?? '').trim();
  const password = String(body.password ?? '');

  if (!defaultPhoneValidator(phoneNumber)) {
    return Response.json({ error: 'invalid_phone' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: 'invalid_password' }, { status: 400 });
  }

  stashPhoneSignupPassword(phoneNumber, password);
  return Response.json({ ok: true });
}
