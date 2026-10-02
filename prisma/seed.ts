import { PrismaClient } from "@prisma/client";
import { nowIso, shiftDate } from "../lib/format";

const prisma = new PrismaClient();

async function main() {
  const n = await prisma.promo.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }
  const t = nowIso();
  await prisma.promo.createMany({
    data: [
      {
        kode: "HEMAT10",
        nama: "Hemat 10% Semua Kategori",
        tipeDiskon: "persen",
        nilaiDiskon: 10,
        minBelanja: 50000,
        kategori: null,
        kuotaTotal: 100,
        batasPerUser: 2,
        mulaiBerlaku: shiftDate(-1),
        selesaiBerlaku: shiftDate(30),
        aktif: true,
        createdAt: t,
      },
      {
        kode: "POTONG25K",
        nama: "Potongan Rp25.000",
        tipeDiskon: "nominal",
        nilaiDiskon: 25000,
        minBelanja: 100000,
        kategori: null,
        kuotaTotal: 50,
        batasPerUser: 1,
        mulaiBerlaku: shiftDate(-1),
        selesaiBerlaku: shiftDate(30),
        aktif: true,
        createdAt: t,
      },
      {
        kode: "ELEKTRO15",
        nama: "15% Khusus Elektronik",
        tipeDiskon: "persen",
        nilaiDiskon: 15,
        minBelanja: 200000,
        kategori: "elektronik",
        kuotaTotal: 30,
        batasPerUser: 1,
        mulaiBerlaku: shiftDate(-1),
        selesaiBerlaku: shiftDate(14),
        aktif: true,
        createdAt: t,
      },
      {
        kode: "RACE5",
        nama: "20% Kuota 5 (test race)",
        tipeDiskon: "persen",
        nilaiDiskon: 20,
        minBelanja: 0,
        kategori: null,
        kuotaTotal: 5,
        batasPerUser: 10,
        mulaiBerlaku: shiftDate(-1),
        selesaiBerlaku: shiftDate(30),
        aktif: true,
        createdAt: t,
      },
      {
        kode: "KEDALUARSA",
        nama: "50% Sudah Kedaluwarsa",
        tipeDiskon: "persen",
        nilaiDiskon: 50,
        minBelanja: 0,
        kategori: null,
        kuotaTotal: 100,
        batasPerUser: 1,
        mulaiBerlaku: shiftDate(-60),
        selesaiBerlaku: shiftDate(-1),
        aktif: true,
        createdAt: t,
      },
      {
        kode: "FASHION5K",
        nama: "Rp5.000 Khusus Fashion",
        tipeDiskon: "nominal",
        nilaiDiskon: 5000,
        minBelanja: 0,
        kategori: "fashion",
        kuotaTotal: null,
        batasPerUser: 3,
        mulaiBerlaku: shiftDate(-1),
        selesaiBerlaku: shiftDate(30),
        aktif: true,
        createdAt: t,
      },
    ],
  });
  console.log("seed selesai: 6 kode promo");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
