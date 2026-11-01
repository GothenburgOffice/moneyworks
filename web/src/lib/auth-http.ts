import "server-only";
import { isIP } from "node:net";
import { getAuth } from "./auth";

export async function boundedBody(request: Request): Promise<Uint8Array | null> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      return null;
    }
    chunks.push(part.value);
  }
  return new Uint8Array(Buffer.concat(chunks));
}

export async function handleAuthRequest(request: Request) {
  const headers = new Headers(request.headers);
  // Never accept the internal limiter header from a client. By default all
  // callers share a conservative bucket. An operator may trust ONE header only
  // when their reverse proxy overwrites it and the origin is not public.
  const trusted = process.env.AUTH_TRUSTED_IP_HEADER || "";
  const candidate = trusted ? (headers.get(trusted) || "").trim() : "";
  headers.set("x-moneyworks-client-ip", isIP(candidate) ? candidate : "127.0.0.1");
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await boundedBody(request);
  if (body === null) return new Response(null, { status: 413 });
  headers.delete("content-length");
  const result = await getAuth().handler(
    new Request(request.url, {
      method: request.method,
      headers,
      body: body as BodyInit | undefined,
    }),
  );
  result.headers.set("Cache-Control", "no-store");
  result.headers.set("Referrer-Policy", "no-referrer");
  return result;
}
