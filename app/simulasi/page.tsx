"use client";
import { useState } from "react";
import { rupiah } from "@/lib/format";

type Baris = { nama: string; kategori: string; harga: string; qty: string };
const BARIS_KOSONG: Baris = { nama: "", kategori: "", harga: "", qty: "1" };

export default function Simulasi() {
  const [userId, setUserId] = useState("user-1");
  const [kode, setKode] = useState("HEMAT10");
  const [baris, setBaris] = useState<Baris[]>([{ ...BARIS_KOSONG, nama: "Kopi 250g", kategori: "makanan", harga: "60000" }]);
  const [hasil, setHasil] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const ubah = (i: number, k: keyof Baris, v: string) =>
    setBaris((b) => b.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const kirim = async () => {
    setLoading(true); setHasil(null);
    const items = baris.map((b) => ({
      nama: b.nama, kategori: b.kategori, harga: Number(b.harga), qty: Number(b.qty),
    }));
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, kode, items }),
    });
    const j = await r.json();
    setHasil({ ok: r.ok, status: r.status, body: j });
    setLoading(false);
  };

  const inp = "border rounded px-2 py-1.5 w-full text-sm";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Simulasi Checkout / Redeem</h1>
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <label className="text-sm">User ID<input className={inp} value={userId} onChange={(e) => setUserId(e.target.value)} /></label>
          <label className="text-sm">Kode voucher<input className={inp + " font-mono"} value={kode} onChange={(e) => setKode(e.target.value)} /></label>
        </div>
        <h2 className="font-bold text-sm mb-2">Keranjang</h2>
        {baris.map((b, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
            <input className={inp} placeholder="Nama produk" value={b.nama} onChange={(e) => ubah(i, "nama", e.target.value)} />
            <input className={inp} placeholder="Kategori" value={b.kategori} onChange={(e) => ubah(i, "kategori", e.target.value)} />
            <input type="number" className={inp} placeholder="Harga" value={b.harga} onChange={(e) => ubah(i, "harga", e.target.value)} />
            <input type="number" className={inp} placeholder="Qty" value={b.qty} onChange={(e) => ubah(i, "qty", e.target.value)} />
            <button onClick={() => setBaris((x) => x.filter((_, j) => j !== i))} className="text-red-600 text-sm">Hapus</button>
          </div>
        ))}
        <div className="flex gap-2 mt-3">
          <button onClick={() => setBaris((b) => [...b, { ...BARIS_KOSONG }])} className="border px-3 py-1.5 rounded text-sm">+ Tambah item</button>
          <button onClick={kirim} disabled={loading} className="bg-slate-900 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50">
            {loading ? "Memproses…" : "Checkout dengan voucher"}
          </button>
        </div>
      </div>

      {hasil && (
        <div className={`rounded shadow p-4 ${hasil.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          {hasil.ok ? (
            <div>
              <p className="font-bold text-green-800 mb-2">✅ Voucher berhasil dipakai</p>
              <table className="text-sm w-full max-w-md">
                <tbody>
                  <tr><td className="py-1">Total awal</td><td className="text-right font-bold">{rupiah(hasil.body.totalAwal)}</td></tr>
                  <tr><td className="py-1">Diskon ({hasil.body.rincian.tipeDiskon === "persen" ? `${hasil.body.rincian.nilaiDiskon}%` : rupiah(hasil.body.rincian.nilaiDiskon)})</td><td className="text-right font-bold text-green-700">−{rupiah(hasil.body.diskon)}</td></tr>
                  <tr className="border-t"><td className="py-1 font-bold">Total akhir</td><td className="text-right font-bold text-lg">{rupiah(hasil.body.totalAkhir)}</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-slate-500 mt-2">Redemption #{hasil.body.redemptionId} · subtotal yang memenuhi syarat: {rupiah(hasil.body.rincian.subtotalCocok)}</p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-red-800">❌ Gagal ({hasil.status})</p>
              <p className="text-sm mt-1"><span className="font-mono bg-white px-1 rounded">{hasil.body.error}</span> — {hasil.body.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
