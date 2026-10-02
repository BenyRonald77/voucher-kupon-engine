import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, parseKategori } from "@/lib/voucher";
import { userDiblokir, catatPercobaan, cekDanTandaiAbuse } from "@/lib/abuse";
import { nowIso, today } from "@/lib/format";

type Item = { nama?: string; kategori?: string; harga?: number; qty?: number };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  const kode = String(body?.kode ?? "").trim().toUpperCase();
  const items = Array.isArray(body?.items) ? (body.items as Item[]) : [];

  const gagalAwal = async (status: number, code: string, message: string) => {
    if (userId && kode)
      await catatPercobaan({ promoId: null, userId, kode, sukses: false, alasanGagal: code });
    return NextResponse.json({ error: code, message }, { status });
  };

  if (!userId || !kode || items.length === 0)
    return gagalAwal(400, "VALIDASI_GAGAL", "userId, kode, dan items (min. 1) wajib diisi");
  for (const it of items) {
    if (!Number.isFinite(Number(it.harga)) || Number(it.harga) < 0 || !Number.isInteger(Number(it.qty)) || Number(it.qty) < 1)
      return gagalAwal(400, "VALIDASI_GAGAL", "setiap item wajib punya harga >= 0 dan qty bilangan bulat >= 1");
  }

  try {
    // 1. blokir penyalahgunaan
    const blokir = await userDiblokir(userId);
    if (blokir) {
      await catatPercobaan({ promoId: null, userId, kode, sukses: false, alasanGagal: "USER_DIBLOKIR" });
      throw new ApiError(403, "USER_DIBLOKIR", `User diblokir sementara sampai ${blokir.diblokirSampai}`);
    }

    // 2. kode dikenal? (tetap dicatat untuk deteksi brute-force kode)
    const promo = await prisma.promo.findUnique({ where: { kode } });
    if (!promo) {
      await catatPercobaan({ promoId: null, userId, kode, sukses: false, alasanGagal: "KODE_TIDAK_DIKENAL" });
      await cekDanTandaiAbuse(userId, kode);
      throw new ApiError(404, "KODE_TIDAK_DIKENAL", `Kode ${kode} tidak dikenal`);
    }

    const gagal = async (e: ApiError) => {
      await catatPercobaan({ promoId: promo.id, userId, kode, sukses: false, alasanGagal: e.code });
      await cekDanTandaiAbuse(userId, kode);
      throw e;
    };

    // 3-4. status & masa berlaku
    const t = today();
    if (!promo.aktif) await gagal(new ApiError(422, "PROMO_NONAKTIF", "Promo sedang nonaktif"));
    if (t < promo.mulaiBerlaku)
      await gagal(new ApiError(422, "BELUM_BERLAKU", `Promo berlaku mulai ${promo.mulaiBerlaku}`));
    if (t > promo.selesaiBerlaku)
      await gagal(new ApiError(422, "KEDALUWARSA", `Promo berakhir pada ${promo.selesaiBerlaku}`));

    // 5. kuota (cek cepat; cek atomik menyusul di transaksi)
    if (promo.kuotaTotal !== null && promo.terpakai >= promo.kuotaTotal)
      await gagal(new ApiError(409, "KUOTA_HABIS", "Kuota promo habis"));

    // 6-7. kategori & minimal belanja (dihitung dari item yang cocok kategori)
    const katPromo = parseKategori(promo.kategori);
    const cocok = items.filter((it) =>
      katPromo === null ? true : katPromo.includes(String(it.kategori ?? "").trim().toLowerCase())
    );
    if (cocok.length === 0)
      await gagal(
        new ApiError(422, "KATEGORI_TIDAK_COCIK", `Tidak ada item berkategori ${promo.kategori ?? "-"} di keranjang`)
      );
    const subtotalCocok = cocok.reduce((s, it) => s + Number(it.harga) * Number(it.qty), 0);
    if (subtotalCocok < promo.minBelanja)
      await gagal(
        new ApiError(
          422,
          "MIN_BELANJA_TIDAK_TERPENUHI",
          `Minimal belanja Rp${Math.round(promo.minBelanja).toLocaleString("id-ID")} untuk kategori yang berlaku`
        )
      );

    // 8. batas per user
    const dipakaiUser = await prisma.redemption.count({ where: { promoId: promo.id, userId } });
    if (dipakaiUser >= promo.batasPerUser)
      await gagal(
        new ApiError(409, "BATAS_USER_TERLAMPAUI", `Batas pakai ${promo.batasPerUser}x per user terlampaui`)
      );

    // 9. konsumsi kuota atomik: conditional update single-statement (tanpa
    //    interactive transaction — Prisma+SQLite tidak tahan transaksi
    //    konkurensi). Cek baris terpengaruh: 0 = kuota habis / promo nonaktif.
    const totalAwal = items.reduce((s, it) => s + Number(it.harga) * Number(it.qty), 0);
    let diskon =
      promo.tipeDiskon === "persen"
        ? Math.round((subtotalCocok * promo.nilaiDiskon) / 100)
        : Math.min(Math.round(promo.nilaiDiskon), Math.round(subtotalCocok));
    diskon = Math.min(diskon, Math.round(totalAwal));
    const totalAkhir = Math.round(totalAwal) - diskon;

    const kembalikanKuota = () =>
      prisma.promo.updateMany({ where: { id: promo.id }, data: { terpakai: { decrement: 1 } } });

    const whereKuota: any = { id: promo.id, aktif: true };
    if (promo.kuotaTotal !== null) whereKuota.terpakai = { lt: promo.kuotaTotal };
    const upd = await prisma.promo.updateMany({ where: whereKuota, data: { terpakai: { increment: 1 } } });
    if (upd.count === 0)
      await gagal(new ApiError(409, "KUOTA_HABIS", "Kuota promo habis"));

    // cek ulang batas per user setelah kuota dikonsumsi (sempitkan window race
    // antar request dari user yang sama); kembalikan kuota bila terlampaui
    const dipakaiUlang = await prisma.redemption.count({ where: { promoId: promo.id, userId } });
    if (dipakaiUlang >= promo.batasPerUser) {
      await kembalikanKuota();
      await gagal(
        new ApiError(409, "BATAS_USER_TERLAMPAUI", `Batas pakai ${promo.batasPerUser}x per user terlampaui`)
      );
    }

    let redemption;
    try {
      redemption = await prisma.redemption.create({
        data: {
          promoId: promo.id,
          userId,
          totalAwal: Math.round(totalAwal),
          diskon,
          totalAkhir,
          createdAt: nowIso(),
        },
      });
    } catch (e) {
      await kembalikanKuota();
      throw e;
    }

    await catatPercobaan({ promoId: promo.id, userId, kode, sukses: true });

    return NextResponse.json({
      sukses: true,
      kode,
      userId,
      redemptionId: redemption.id,
      totalAwal: Math.round(totalAwal),
      diskon,
      totalAkhir,
      rincian: {
        subtotalCocok: Math.round(subtotalCocok),
        jumlahItemCocok: cocok.length,
        tipeDiskon: promo.tipeDiskon,
        nilaiDiskon: promo.nilaiDiskon,
      },
    });
  } catch (e: any) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    throw e;
  }
}
