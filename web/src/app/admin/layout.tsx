import type { Metadata } from "next";
import { ThemeScript } from "@/components/theme-script";
import "@/styles/admin.css";

export const metadata: Metadata = {
  title: "Money Working admin",
  robots: { index: false, follow: false },
};

// Operator-only and English-only; reached by its direct URL, never linked.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Same stored theme as the public site, applied before paint.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <main className="admin page-width">{children}</main>
      </body>
    </html>
  );
}
