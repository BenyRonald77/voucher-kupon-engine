import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

// Aturan deteksi penyalahgunaan: >5 gagal dalam 10 menit -> blokir 30 menit
export const ABUSE_MAX_GAGAL = 5;
export const ABUSE_WINDOW_MENIT = 10;
export const ABUSE_BLOKIR_MENIT = 30;

export async function userDiblokir(userId: string) {
  const t = nowIso();
  return prisma.abuseFlag.findFirst({
    where: { userId, aktif: true, diblokirSampai: { gt: t } },
    orderBy: { id: "desc" },
  });
}

export async function catatPercobaan(p: {
  promoId: number | null;
  userId: string;
  kode: string;
  sukses: boolean;
  alasanGagal?: string;
}) {
  await prisma.redeemAttempt.create({
    data: {
      promoId: p.promoId,
      userId: p.userId,
      kode: p.kode,
      sukses: p.sukses,
      alasanGagal: p.alasanGagal ?? null,
      createdAt: nowIso(),
    },
  });
}

export async function cekDanTandaiAbuse(userId: string, kode: string) {
  const sejak = new Date(Date.now() - ABUSE_WINDOW_MENIT * 60 * 1000).toISOString();
  const gagal = await prisma.redeemAttempt.count({
    where: { userId, sukses: false, createdAt: { gte: sejak } },
  });
  if (gagal > ABUSE_MAX_GAGAL) {
    const sudah = await userDiblokir(userId);
    if (!sudah) {
      const sampai = new Date(Date.now() + ABUSE_BLOKIR_MENIT * 60 * 1000).toISOString();
      await prisma.abuseFlag.create({
        data: {
          userId,
          alasan: `${gagal} percobaan redeem gagal dalam ${ABUSE_WINDOW_MENIT} menit terakhir (upaya terakhir: ${kode})`,
          diblokirSampai: sampai,
          aktif: true,
          createdAt: nowIso(),
        },
      });
    }
  }
}
