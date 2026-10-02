# PRD — Voucher & Kupon Engine

## Ringkasan
Mesin voucher/kupon untuk e-commerce kecil: kelola kode promo dengan aturan
fleksibel, simulasi checkout yang menerapkan voucher secara atomik, deteksi
penyalahgunaan redeem, dan laporan efektivitas tiap kode promo.

## Stack
Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS, App Router.

## Model Data

### Promo
| Field | Tipe | Keterangan |
|---|---|---|
| id | Int PK | autoincrement |
| kode | String unique | kode promo, mis. `HEMAT10` |
| nama | String | nama tampilan |
| tipeDiskon | String | `persen` \| `nominal` |
| nilaiDiskon | Float | persen (0–100) atau nominal rupiah |
| minBelanja | Float | minimal subtotal belanja yang memenuhi syarat |
| kategori | String? | daftar kategori dipisah koma, mis. `elektronik,fashion`; null/kosong = semua kategori |
| kuotaTotal | Int? | total redeem maksimal; null = tanpa batas |
| batasPerUser | Int | maksimal redeem per user (default 1) |
| mulaiBerlaku | String | tanggal mulai `YYYY-MM-DD` |
| selesaiBerlaku | String | tanggal selesai `YYYY-MM-DD` |
| aktif | Boolean | status aktif/nonaktif |
| terpakai | Int | counter redeem, dinaikkan atomik |

### Redemption
Catatan setiap redeem sukses: promoId, userId, totalAwal, diskon, totalAkhir,
createdAt (ISO).

### RedeemAttempt
Log SEMUA percobaan redeem (sukses + gagal): promoId?, userId, kode, sukses,
alasanGagal?, createdAt (ISO). Dasar deteksi penyalahgunaan.

### AbuseFlag
userId, alasan, diblokirSampai (ISO, nullable), aktif, createdAt.

## Aturan Bisnis

### F2 — CRUD Promo
- Buat/ubah/hapus kode promo beserta seluruh aturan.
- Validasi: kode wajib unik & tidak kosong; tipeDiskon `persen|nominal`;
  persen 0–100; nilaiDiskon > 0; kuotaTotal ≥ 0 atau null; batasPerUser ≥ 1;
  mulaiBerlaku ≤ selesaiBerlaku (format YYYY-MM-DD).

### F3 — Simulasi Checkout / Redeem (atomik)
`POST /api/checkout` menerima `{ userId, kode, items: [{nama, kategori, harga, qty}] }`.
Langkah validasi berurutan:
1. User diblokir flag aktif → **403**.
2. Kode tidak dikenal → **404**.
3. Promo nonaktif → **422** (`PROMO_NONAKTIF`).
4. Hari ini < mulaiBerlaku → **422** (`BELUM_BERLAKU**Belum berlaku**`);
   hari ini > selesaiBerlaku → **422** (`KEDALUWARSA`).
5. Kuota habis (terpakai ≥ kuotaTotal) → **409** (`KUOTA_HABIS`).
6. Tidak ada item yang kategorinya cocok → **422** (`KATEGORI_TIDAK_COCIK`).
7. Subtotal item yang cocok < minBelanja → **422** (`MIN_BELANJA_TIDAK_TERPENUHI`).
8. Jumlah redeem user untuk kode ini ≥ batasPerUser → **409** (`BATAS_USER_TERLAMPAUI`).
9. Konsumsi kuota via **conditional update atomik**
   (`updateMany` where `terpakai < kuotaTotal`, cek `count` terpengaruh);
   jika 0 baris terpengaruh → **409** (`KUOTA_HABIS`) — ini yang membuat
   redeem bersamaan tidak bisa menjebol kuota.
10. Hitung diskon: persen → `nilaiDiskon% × subtotalCocok`; nominal →
    `min(nilaiDiskon, subtotalCocok)`; diskon tidak boleh melebihi totalAwal.
    Kembalikan `{ totalAwal, diskon, totalAkhir, rincian }`.

Setiap percobaan (sukses/gagal) dicatat ke `RedeemAttempt`.

### F4 — Deteksi Penyalahgunaan
- Aturan: **> 5 percobaan gagal** dari user yang sama dalam **10 menit**
  → buat `AbuseFlag` aktif + blokir redeem user tersebut **30 menit**.
- Flag aktif yang masih dalam masa blokir membuat `/api/checkout` menolak
  dengan **403** (`USER_DIBLOKIR`).
- `GET /api/flags` daftar flag + riwayat percobaan; `POST /api/flags/:id/unblock`
  mencabut blokir manual.

### F5 — Laporan Efektivitas
`GET /api/reports/promo-summary` → per kode: total pemakaian, total diskon
diberikan, omzet terpengaruh (Σ totalAwal redeem), sisa kuota, jumlah
percobaan gagal.

## UI (Bahasa Indonesia)
- `/` — Dashboard: ringkasan promo aktif, total redeem, total diskon, flag aktif.
- `/promo` — Kelola kode promo (CRUD + aturan).
- `/simulasi` — Simulasi checkout/redeem: isi userId, kode, daftar item →
  tampilkan total awal, diskon, total akhir / pesan error.
- `/flag` — Daftar flag penyalahgunaan + log percobaan, tombol cabut blokir.
- `/laporan` — Efektivitas per kode promo.

## Seed
- `HEMAT10` — 10% semua kategori, min 50rb, kuota 100, berlaku ±30 hari.
- `POTONG25K` — nominal Rp25.000, min 100rb, kuota 50.
- `ELEKTRO15` — 15% khusus kategori `elektronik`, min 200rb, kuota 30.
- `RACE5` — 20% semua kategori, kuota 5 (untuk test race-condition).
- `KEDALUARSA` — 50% tapi sudah kedaluwarsa (untuk test 422).
- `FASHION5K` — nominal Rp5.000 khusus `fashion`, tanpa min belanja, tanpa kuota.

## Non-fungsional
- `npm run build` wajib lolos.
- Tanpa browser; testing via curl.
- Tanpa atribusi AI di commit/repo.
