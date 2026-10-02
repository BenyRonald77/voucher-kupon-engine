"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

export default function Laporan() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/reports/promo-summary").then((r) => r.json()).then(setData);
  }, []);
  if (!data) return <p>Memuat…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Laporan Efektivitas Promo</h1>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Kode</th>
              <th className="text-right p-2">Pemakaian</th>
              <th className="text-right p-2">Diskon diberikan</th>
              <th className="text-right p-2">Omzet terpengaruh</th>
              <th className="text-right p-2">Sisa kuota</th>
              <th className="text-right p-2">Gagal</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.perKode.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-mono font-bold">{r.kode}<div className="font-sans font-normal text-xs text-slate-500">{r.nama}</div></td>
                <td className="p-2 text-right">{r.totalPemakaian}</td>
                <td className="p-2 text-right">{rupiah(r.totalDiskonDiberikan)}</td>
                <td className="p-2 text-right">{rupiah(r.omzetTerpengaruh)}</td>
                <td className="p-2 text-right">{r.sisaKuota === null ? "∞" : r.sisaKuota}</td>
                <td className="p-2 text-right">{r.percobaanGagal}</td>
                <td className="p-2">{r.aktif ? "✅" : "⛔"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold">
            <tr>
              <td className="p-2">Total</td>
              <td className="p-2 text-right">{data.total.totalPemakaian}</td>
              <td className="p-2 text-right">{rupiah(data.total.totalDiskonDiberikan)}</td>
              <td className="p-2 text-right">{rupiah(data.total.omzetTerpengaruh)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
