import type { Metadata } from "next";
import "@/styles/admin.css";

export const metadata: Metadata = {
  title: "MoneyWorks admin",
  robots: { index: false, follow: false },
};

// Operator-only and English-only; reached by its direct URL, never linked.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <main className="admin page-width">{children}</main>
      </body>
    </html>
  );
}
