import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const promos = await prisma.promo.findMany({ orderBy: { id: "asc" } });
  const rows = await Promise.all(
    promos.map(async (p) => {
      const agg = await prisma.redemption.aggregate({
        where: { promoId: p.id },
        _count: { id: true },
        _sum: { diskon: true, totalAwal: true },
      });
      const gagal = await prisma.redeemAttempt.count({
        where: { promoId: p.id, sukses: false },
      });
      const totalPemakaian = agg._count.id;
      return {
        id: p.id,
        kode: p.kode,
        nama: p.nama,
        tipeDiskon: p.tipeDiskon,
        nilaiDiskon: p.nilaiDiskon,
        aktif: p.aktif,
        kuotaTotal: p.kuotaTotal,
        terpakai: p.terpakai,
        sisaKuota: p.kuotaTotal === null ? null : Math.max(p.kuotaTotal - p.terpakai, 0),
        totalPemakaian,
        totalDiskonDiberikan: Math.round(agg._sum.diskon ?? 0),
        omzetTerpengaruh: Math.round(agg._sum.totalAwal ?? 0),
        percobaanGagal: gagal,
      };
    })
  );
  const total = rows.reduce(
    (s, r) => ({
      totalPemakaian: s.totalPemakaian + r.totalPemakaian,
      totalDiskonDiberikan: s.totalDiskonDiberikan + r.totalDiskonDiberikan,
      omzetTerpengaruh: s.omzetTerpengaruh + r.omzetTerpengaruh,
    }),
    { totalPemakaian: 0, totalDiskonDiberikan: 0, omzetTerpengaruh: 0 }
  );
  return NextResponse.json({ perKode: rows, total });
}
