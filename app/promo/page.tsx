"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

const KOSONG = {
  kode: "", nama: "", tipeDiskon: "persen", nilaiDiskon: "",
  minBelanja: "0", kategori: "", kuotaTotal: "", batasPerUser: "1",
  mulaiBerlaku: "", selesaiBerlaku: "", aktif: true,
};

export default function KelolaPromo() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(KOSONG);
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const muat = () => fetch("/api/promos").then((r) => r.json()).then(setRows);
  useEffect(() => { muat(); }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const simpan = async () => {
    setMsg("");
    const payload: any = { ...form };
    ["nilaiDiskon", "minBelanja", "batasPerUser"].forEach((k) => (payload[k] = Number(payload[k])));
    payload.kuotaTotal = payload.kuotaTotal === "" ? null : Number(payload.kuotaTotal);
    const url = editId ? `/api/promos/${editId}` : "/api/promos";
    const r = await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) { setMsg(`❌ ${j.message || j.error}`); return; }
    setForm(KOSONG); setEditId(null); setMsg("✅ Tersimpan"); muat();
  };

  const edit = (p: any) => {
    setEditId(p.id);
    setForm({
      kode: p.kode, nama: p.nama, tipeDiskon: p.tipeDiskon,
      nilaiDiskon: String(p.nilaiDiskon), minBelanja: String(p.minBelanja),
      kategori: p.kategori ?? "", kuotaTotal: p.kuotaTotal === null ? "" : String(p.kuotaTotal),
      batasPerUser: String(p.batasPerUser), mulaiBerlaku: p.mulaiBerlaku,
      selesaiBerlaku: p.selesaiBerlaku, aktif: p.aktif,
    });
    window.scrollTo(0, 0);
  };

  const hapus = async (id: number) => {
    if (!confirm("Hapus promo ini?")) return;
    await fetch(`/api/promos/${id}`, { method: "DELETE" });
    muat();
  };

  const inp = "border rounded px-2 py-1.5 w-full text-sm";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{editId ? "Ubah Promo" : "Tambah Promo"}</h1>
      {msg && <p className="mb-3 text-sm">{msg}</p>}
      <div className="bg-white rounded shadow p-4 grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <label className="text-sm">Kode*<input className={inp} value={form.kode} onChange={(e) => set("kode", e.target.value)} /></label>
        <label className="text-sm">Nama*<input className={inp} value={form.nama} onChange={(e) => set("nama", e.target.value)} /></label>
        <label className="text-sm">Tipe diskon
          <select className={inp} value={form.tipeDiskon} onChange={(e) => set("tipeDiskon", e.target.value)}>
            <option value="persen">Persen (%)</option>
            <option value="nominal">Nominal (Rp)</option>
          </select>
        </label>
        <label className="text-sm">Nilai diskon*<input type="number" className={inp} value={form.nilaiDiskon} onChange={(e) => set("nilaiDiskon", e.target.value)} /></label>
        <label className="text-sm">Min. belanja (Rp)<input type="number" className={inp} value={form.minBelanja} onChange={(e) => set("minBelanja", e.target.value)} /></label>
        <label className="text-sm">Kategori (koma, kosongkan = semua)<input className={inp} value={form.kategori} onChange={(e) => set("kategori", e.target.value)} placeholder="elektronik,fashion" /></label>
        <label className="text-sm">Kuota total (kosong = tanpa batas)<input type="number" className={inp} value={form.kuotaTotal} onChange={(e) => set("kuotaTotal", e.target.value)} /></label>
        <label className="text-sm">Batas per user<input type="number" className={inp} value={form.batasPerUser} onChange={(e) => set("batasPerUser", e.target.value)} /></label>
        <label className="text-sm">Mulai berlaku<input type="date" className={inp} value={form.mulaiBerlaku} onChange={(e) => set("mulaiBerlaku", e.target.value)} /></label>
        <label className="text-sm">Selesai berlaku<input type="date" className={inp} value={form.selesaiBerlaku} onChange={(e) => set("selesaiBerlaku", e.target.value)} /></label>
        <label className="text-sm flex items-end gap-2 pb-2">
          <input type="checkbox" checked={form.aktif} onChange={(e) => set("aktif", e.target.checked)} /> Aktif
        </label>
        <div className="flex items-end gap-2">
          <button onClick={simpan} className="bg-slate-900 text-white px-4 py-1.5 rounded text-sm">Simpan</button>
          {editId && <button onClick={() => { setEditId(null); setForm(KOSONG); }} className="px-4 py-1.5 rounded text-sm border">Batal</button>}
        </div>
      </div>

      <h2 className="text-lg font-bold mb-2">Daftar Promo</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Kode</th><th className="text-left p-2">Nama</th>
              <th className="text-left p-2">Diskon</th><th className="text-right p-2">Min</th>
              <th className="text-left p-2">Kategori</th><th className="text-right p-2">Kuota</th>
              <th className="text-left p-2">Berlaku</th><th className="text-left p-2">Status</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-mono font-bold">{p.kode}</td>
                <td className="p-2">{p.nama}</td>
                <td className="p-2">{p.tipeDiskon === "persen" ? `${p.nilaiDiskon}%` : rupiah(p.nilaiDiskon)}</td>
                <td className="p-2 text-right">{rupiah(p.minBelanja)}</td>
                <td className="p-2">{p.kategori ?? "semua"}</td>
                <td className="p-2 text-right">{p.terpakai}/{p.kuotaTotal === null ? "∞" : p.kuotaTotal}</td>
                <td className="p-2">{p.mulaiBerlaku} s/d {p.selesaiBerlaku}</td>
                <td className="p-2">{p.aktif ? "✅" : "⛔"}</td>
                <td className="p-2 whitespace-nowrap">
                  <button onClick={() => edit(p)} className="text-blue-600 mr-2 text-sm">Ubah</button>
                  <button onClick={() => hapus(p.id)} className="text-red-600 text-sm">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
