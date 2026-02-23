# 📚 Aplikasi Generator Perangkat Pembelajaran PAI SD
Aplikasi berbasis Web HTML sederhana (berjalan *offline* tanpa internet) untuk mencetak kelengkapan perangkat administrasi guru secara instan.

## 🚀 Fitur Utama
1. **Otomatisasi 1-Klik:** Cukup unggah file CSV, maka sistem otomatis memecahnya menjadi Prota, Promes, Modul Ajar, KKTP, dan LKPD.
2. **Perhitungan Matematis Pintar:** Promes dan Kalender Pendidikan otomatis melompati (skip) tanggal merah baku (17 Agustus, Natal, Tahun Baru, dll) serta libur khusus yang Anda inputkan secara manual (seperti libur Awal Ramadhan, Idul Fitri).
3. **KKTP Interaktif Real-Time:** Jika Anda mengubah nilai pada kolom *Kompleksitas*, *Daya Dukung*, atau *Intaks Siswa*, nilai rata-rata (KKTP) akan berubah/kalkulasi seketika!
4. **Editable (Bisa Diedit Manual):** Klik teks/tabel pada bagian *preview* (Modul Ajar, Prota, Promes, KKTP, LKPD) untuk mengedit tata bahasa sesuka Anda sebelum menekan tombol Cetak.

---

## 📂 Struktur File
Di dalam paket yang Anda bagikan ini harus memuat dua file utama:
- `Aplikasi_PAI.html` (Aplikasi utamanya, klik 2x untuk membuka di Browser seperti Chrome/Edge/Firefox).
- `cp-pai-sd.csv` (File Database/Bank Data Materi yang memuat Fase, Kelas, dan Tujuan Pembelajaran).

---

## 🛠️ Cara Menggunakan Aplikasi

1. Buka file `Aplikasi_PAI.html` menggunakan browser (Sangat disarankan memakai Google Chrome atau Microsoft Edge di PC/Laptop).
2. Di panel sebelah kiri, klik tombol **"Upload File cp-pai-sd.csv"** (Tombol Oranye).
3. Pilih file `cp-pai-sd.csv` yang disertakan pada folder ini.
4. Anda akan melihat notifikasi "✅ Berhasil sinkronisasi TP".
5. Atur spesifikasi Kelas, Rombel, Semester, dan Nama Guru Anda di panel kiri. Sistem otomatis menyinkronkan data di kanvas kertas sebelah kanan.
6. Anda bisa **MENGKLIK** angka 75 di dalam tabel KKTP. Coba ganti angkanya, maka hasil rata-ratanya akan langsung berubah otomatis!
7. Jika semuanya sudah sesuai, klik tombol hijau **"🖨️ Cetak / Simpan PDF"**.

---

## 📝 Cara Membuat/Mengedit File CSV (Bagi Admin/Guru)
Aplikasi ini membaca data materi dari file `.csv`. Jika sewaktu-waktu Kurikulum/CP/TP berubah, Anda bisa mengubah datanya sendiri menggunakan Microsoft Excel:

1. Buka file `cp-pai-sd.csv` menggunakan Microsoft Excel.
2. Pastikan urutan judul Header baris atas (Kolom A s/d E) *wajib* seperti ini:
   - **A:** Fase
   - **B:** Kelas
   - **C:** Semester
   - **D:** Elemen (atau Bab)
   - **E:** Tujuan Pembelajaran
3. **PERINGATAN KERAS:** Jangan gunakan tanda koma (`,`) di dalam penulisan kalimat *Tujuan Pembelajaran*. Hal ini bisa merusak format CSV saat disimpan.
4. Jika sudah selesai mengubah teks materi, klik `File > Save As`.
5. Pada pilihan *Save as type*, pilih **CSV (Comma delimited) (*.csv)** atau **CSV (MS-DOS)**.

*Catatan: Sistem pada HTML ini membaca pemisah data (delimiter) berupa titik koma (`;`), format standar yang dihasilkan oleh Excel region Indonesia.*

Semoga aplikasi ini dapat mempermudah Bapak/Ibu Guru dalam menyusun administrasi! 🌟
