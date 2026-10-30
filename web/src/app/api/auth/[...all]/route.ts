import { handleAuthRequest } from '@/lib/auth-http';
import { accountConfig } from '@/lib/auth-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const paths = new Set([
  'sign-up/email', 'sign-in/email', 'sign-out', 'get-session', 'verify-email',
  'send-verification-email', 'request-password-reset', 'reset-password',
]);
async function handle(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth\//, '');
  const recoveryRedirect = request.method === 'GET' && /^reset-password\/[^/]{1,256}$/.test(path);
  if (!paths.has(path) && !recoveryRedirect) return new Response(null, { status: 404 });
  if (request.method === 'GET' && !['get-session', 'verify-email'].includes(path) && !recoveryRedirect) return new Response(null, { status: 405 });
  if (!accountConfig().configured) return Response.json({ error: 'Account service is not configured.' }, { status: 503 });
  return handleAuthRequest(request);
}
export const GET = handle;
export const POST = handle;
