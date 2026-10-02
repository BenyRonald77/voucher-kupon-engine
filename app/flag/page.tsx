"use client";
import { useEffect, useState } from "react";

export default function Flag() {
  const [data, setData] = useState<any>(null);

  const muat = () =>
    fetch("/api/flags").then((r) => r.json()).then(setData);
  useEffect(() => { muat(); }, []);

  const unblock = async (id: number) => {
    await fetch(`/api/flags/${id}/unblock`, { method: "POST" });
    muat();
  };

  if (!data) return <p>Memuat…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Deteksi Penyalahgunaan</h1>
      <p className="text-sm text-slate-600 mb-4">
        Aturan: lebih dari 5 percobaan redeem gagal dari user yang sama dalam 10
        menit → user ditandai dan diblokir redeem selama 30 menit.
      </p>

      <h2 className="text-lg font-bold mb-2">Flag ({data.flags.length}, aktif diblokir: {data.flagsAktif})</h2>
      <div className="bg-white rounded shadow overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">User</th><th className="text-left p-2">Alasan</th>
              <th className="text-left p-2">Diblokir sampai</th><th className="text-left p-2">Status</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.flags.map((f: any) => (
              <tr key={f.id} className="border-t">
                <td className="p-2 font-mono">{f.userId}</td>
                <td className="p-2">{f.alasan}</td>
                <td className="p-2">{f.diblokirSampai ?? "-"}</td>
                <td className="p-2">{f.aktif ? "🔴 Aktif" : "⚪ Dicabut"}</td>
                <td className="p-2">
                  {f.aktif && (
                    <button onClick={() => unblock(f.id)} className="text-blue-600 text-sm">Cabut blokir</button>
                  )}
                </td>
              </tr>
            ))}
            {data.flags.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">Belum ada flag.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-bold mb-2">Log percobaan redeem</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Waktu</th><th className="text-left p-2">User</th>
              <th className="text-left p-2">Kode</th><th className="text-left p-2">Hasil</th>
              <th className="text-left p-2">Alasan gagal</th>
            </tr>
          </thead>
          <tbody>
            {data.attempts.map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{a.createdAt.replace("T", " ").slice(0, 19)}</td>
                <td className="p-2 font-mono">{a.userId}</td>
                <td className="p-2 font-mono">{a.kode}</td>
                <td className="p-2">{a.sukses ? "✅ Sukses" : "❌ Gagal"}</td>
                <td className="p-2 font-mono text-xs">{a.alasanGagal ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
