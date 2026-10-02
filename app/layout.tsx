import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voucher & Kupon Engine",
  description: "Kelola kode promo, simulasi checkout, deteksi penyalahgunaan, dan laporan efektivitas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">{children}</body>
    </html>
  );
}
