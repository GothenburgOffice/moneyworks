import Link from "next/link";

const pages = [
  { href: "/admin", label: "Site settings" },
  { href: "/admin/users", label: "Users" },
] as const;

// Shown only after the admin check, so the admin area never reveals itself to others.
export function AdminNav({ current, email }: { current: string; email: string }) {
  return (
    <>
      <nav className="admin-nav" aria-label="Admin">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            aria-current={page.href === current ? "page" : undefined}
          >
            {page.label}
          </Link>
        ))}
      </nav>
      <form method="post" action="/api/account/logout" className="admin-inline">
        <input type="hidden" name="locale" value="en" />
        Signed in as {email}. <Link href="/en/account">Account</Link>{" "}
        <button type="submit">Sign out</button>
      </form>
    </>
  );
}
