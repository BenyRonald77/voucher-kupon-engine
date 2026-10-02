"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [pr, rp, fl] = await Promise.all([
        fetch("/api/promos").then((r) => r.json()),
        fetch("/api/reports/promo-summary").then((r) => r.json()),
        fetch("/api/flags").then((r) => r.json()),
      ]);
      setData({ promos: pr, report: rp, flags: fl });
    })();
  }, []);

  if (!data) return <p>Memuat…</p>;
  const aktif = data.promos.filter((p: any) => p.aktif).length;
  const t = data.report.total;

  const cards = [
    { label: "Promo aktif", value: `${aktif} / ${data.promos.length}` },
    { label: "Total redeem", value: String(t.totalPemakaian) },
    { label: "Total diskon diberikan", value: rupiah(t.totalDiskonDiberikan) },
    { label: "Omzet terpengaruh", value: rupiah(t.omzetTerpengaruh) },
    { label: "Flag aktif (blokir)", value: String(data.flags.flagsAktif) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded shadow p-4">
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className="text-xl font-bold mt-1">{c.value}</div>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-bold mt-8 mb-2">Kode promo</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Kode</th>
              <th className="text-left p-2">Diskon</th>
              <th className="text-left p-2">Berlaku</th>
              <th className="text-right p-2">Terpakai/Kuota</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.promos.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-mono font-bold">{p.kode}</td>
                <td className="p-2">
                  {p.tipeDiskon === "persen" ? `${p.nilaiDiskon}%` : rupiah(p.nilaiDiskon)}
                </td>
                <td className="p-2">{p.mulaiBerlaku} s/d {p.selesaiBerlaku}</td>
                <td className="p-2 text-right">
                  {p.terpakai}/{p.kuotaTotal === null ? "∞" : p.kuotaTotal}
                </td>
                <td className="p-2">{p.aktif ? "✅ Aktif" : "⛔ Nonaktif"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
