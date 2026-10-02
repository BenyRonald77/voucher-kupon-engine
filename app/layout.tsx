import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voucher & Kupon Engine",
  description: "Kelola kode promo, simulasi checkout, deteksi penyalahgunaan, dan laporan efektivitas.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/promo", label: "Kelola Promo" },
  { href: "/simulasi", label: "Simulasi Checkout" },
  { href: "/flag", label: "Penyalahgunaan" },
  { href: "/laporan", label: "Laporan" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <header className="bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-4">
            <span className="font-bold text-lg">🎟️ Voucher Engine</span>
            <nav className="flex flex-wrap gap-1">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded hover:bg-slate-700 text-sm"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
