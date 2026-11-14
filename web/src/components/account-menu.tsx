"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { AccountCopy } from "@/content/account";
import type { Locale } from "@/content/site";
import { PersonIcon } from "./ui-icons";

export type AccountMenuCopy = Pick<
  AccountCopy,
  "account" | "accountMenu" | "accountSettings" | "admin" | "signedIn" | "login" | "logout"
>;
type Member = { email: string; isAdmin: boolean };

// Who is signed in, or null when signed out or the request fails.
async function fetchMember(signal?: AbortSignal): Promise<Member | null> {
  try {
    const response = await fetch("/api/account/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
    const data: unknown = response.ok ? await response.json() : null;
    if (
      data &&
      typeof data === "object" &&
      "signedIn" in data &&
      data.signedIn === true &&
      "email" in data &&
      typeof data.email === "string"
    )
      return { email: data.email, isAdmin: "isAdmin" in data && data.isAdmin === true };
  } catch {
    // Offline or the endpoint is down: render signed out.
  }
  return null;
}

// The header's account control. Pages are cached for everyone, so the server always
// renders the signed-out link (also the no-JavaScript fallback); the browser then asks
// /api/account/session who is signed in. A failed request leaves the link as it is.
export function AccountMenu({ locale, copy }: { locale: Locale; copy: AccountMenuCopy }) {
  const [member, setMember] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    const controller = new AbortController();
    const load = (signal?: AbortSignal) =>
      fetchMember(signal).then((value) => {
        if (!signal?.aborted) setMember(value);
      });
    void load(controller.signal);
    // Back/Forward can restore a page from memory after signing in or out elsewhere.
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setOpen(false);
        void load();
      }
    };
    window.addEventListener("pageshow", restored);
    return () => {
      controller.abort();
      window.removeEventListener("pageshow", restored);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (!member) {
    return (
      <a className="account-control" href={`/${locale}/account`} data-account-control>
        <PersonIcon />
        <span className="account-control-label">{copy.login}</span>
      </a>
    );
  }

  return (
    <div
      className="account-menu"
      ref={root}
      onBlur={(event) => {
        // Tabbing past the last item closes the menu; clicks are handled above.
        const next = event.relatedTarget as Node | null;
        if (next && !root.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        className="account-control"
        aria-label={copy.accountMenu}
        aria-expanded={open}
        aria-controls={panelId}
        data-account-control
        onClick={() => setOpen((value) => !value)}
      >
        <PersonIcon />
        <span className="account-control-label" aria-hidden="true">
          {copy.account}
        </span>
      </button>
      <div id={panelId} className="account-menu-panel" hidden={!open}>
        <p className="account-menu-identity">
          {copy.signedIn}
          <strong>{member.email}</strong>
        </p>
        <a href={`/${locale}/account`}>{copy.accountSettings}</a>
        {member.isAdmin && <Link href="/admin">{copy.admin}</Link>}
        <form action="/api/account/logout" method="post">
          <input type="hidden" name="locale" value={locale} />
          <button type="submit">{copy.logout}</button>
        </form>
      </div>
    </div>
  );
}
