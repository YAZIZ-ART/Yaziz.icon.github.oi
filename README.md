# Kuesioner Usahatani (Web)

Formulir web untuk **Kuesioner Usahatani – Mata Kuliah Manajemen Usahatani, Team-Based Project (TBP)**.
Urutan, teks pertanyaan, dan pilihan jawaban sama dengan dokumen Word (97 pertanyaan, bagian A–M).

Jawaban yang dikirim akan masuk otomatis ke folder Google Drive:

| Hasil | Lokasi di Drive |
| --- | --- |
| Lembar jawaban (PDF) | subfolder `Lembar Jawaban (PDF)` |
| Rekap untuk Excel/Sheets | file `Rekap Kuesioner Usahatani` (tab `Responden` + tab tabel 46, 57, 61, 62, 63) |
| Cadangan data mentah | subfolder `Data Mentah (JSON)` |

## Isi folder

```
index.html          halaman utama
config.js           tempat menempel alamat Web App (langkah 2)
assets/             tampilan, daftar pertanyaan, dan program formulir
apps-script/Code.gs penerima data yang dipasang di Google Apps Script
```

## Langkah 1 – Pasang penerima di Google Drive (sekali saja)

Lakukan dengan akun Google pemilik folder Drive.

1. Buka https://script.google.com lalu klik **Proyek baru**.
2. Hapus isi `Code.gs` bawaan, lalu tempel seluruh isi file `apps-script/Code.gs`.
3. Pada baris `FOLDER_ID` sudah terisi ID folder Drive Anda. Ganti jika ingin folder lain.
4. Pilih fungsi **setup** di bilah atas, klik **Jalankan**, lalu setujui izin akses Drive dan Sheets.
   (Jika muncul "Google belum memverifikasi aplikasi ini": **Lanjutan** → **Buka … (tidak aman)**. Ini skrip milik Anda sendiri.)
5. Klik **Deploy** → **Deployment baru** → jenis **Aplikasi web**:
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
6. Klik **Deploy**, lalu salin **URL aplikasi web** (berakhiran `/exec`).

> Setiap kali Anda mengubah `Code.gs`, buat **Deployment baru** (atau *Kelola deployment → Edit → Versi baru*) agar perubahan berlaku.

## Langkah 2 – Hubungkan ke situs

Buka `config.js`, tempel URL tadi:

```js
window.APP_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec',
};
```

## Langkah 3 – Taruh di GitHub Pages

1. Buat repositori baru di GitHub, unggah seluruh isi folder ini.
2. **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**.
3. Tunggu 1–2 menit; alamat situs muncul di halaman Pages.

Uji dengan satu data contoh, lalu cek folder Drive.

## Cara pakai di lapangan

- Isian tersimpan otomatis di perangkat sebagai draf; jika halaman tertutup, isian tetap ada.
- Tombol **TT** di samping kolom angka mengisi "TT" (petani tidak tahu/lupa).
- Pada tabel, kolom **Total (Rp)** terisi otomatis (jumlah × harga), tetapi bisa diubah manual.
- **Isi responden baru** mengosongkan jawaban tetapi mempertahankan komoditas, desa, pewawancara, dan tanggal.
- Jika sinyal hilang saat mengirim, isian tidak hilang: coba kirim lagi (data tidak akan ganda), atau pakai **Cetak / simpan PDF**.

## Mengubah pertanyaan

Semua pertanyaan ada di `assets/questions.js`. Pilihan yang boleh dipilih lebih dari satu memakai `type: 'check'`; pilihan tunggal memakai `type: 'radio'`.

## Catatan keamanan dan privasi

- Repositori hanya berisi program, **bukan data responden**. Data hanya ada di Drive Anda.
- URL Web App bersifat "siapa saja dapat mengirim". Jangan membagikannya di luar kelompok. Jika perlu, hapus deployment lama dan buat yang baru untuk mengganti URL.
- Jawaban memuat nama dan nomor HP petani. Atur akses folder Drive hanya untuk anggota kelompok.
