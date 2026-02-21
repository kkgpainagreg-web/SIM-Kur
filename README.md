# 🎓 SIM Kurikulum Merdeka Universal (Freemium)

Aplikasi Web Single-Page berbasis HTML, JS, dan Firebase untuk mempermudah tugas administrasi guru (PAI maupun Umum) dalam menyusun Perangkat Ajar Kurikulum Merdeka.

## ✨ Fitur Utama
1. **Multi Mata Pelajaran:** Dapat digunakan oleh Guru PAI maupun Guru Mapel lainnya.
2. **Setup CP & TP Fleksibel:** Guru dapat mengatur Capaian Pembelajaran dan Tujuan Pembelajaran per Bab. Tersedia data *Default* PAI SD Kelas 1-6.
3. **Data Siswa Otomatis (CSV):** Mengambil data dari file CSV / Google Sheets dan otomatis dipecah per-rombel.
4. **Jadwal Anti-Bentrok:** (Fitur Kolaborasi NPSN) Mencegah tabrakan jadwal antar guru di satu sekolah.
5. **Auto-Generate Perangkat (PDF):** ATP, Prota, Promes, Modul Ajar, LKPD, Jurnal Absensi, dan Buku Nilai siap cetak!
6. **Asisten AI (Prompt):** Template perintah siap pakai untuk ChatGPT / Gemini.

## 💎 Sistem Freemium (Free vs PRO)
Aplikasi ini menerapkan pembatasan akses:
- **FREE:** Dashboard, Profil, Setup CP/TP, Data Siswa, Jadwal Mengajar, dan Tahunan (ATP, Prota, Promes).
- **PRO:** Modul Ajar, LKPD, Absen & Jurnal, Rekap Penilaian, dan Asisten AI.

## 👑 Panel Admin
Akses Panel Admin otomatis terbuka jika login menggunakan email **afifaro@gmail.com**. Fitur Admin meliputi:
- Mengatur Nomor WhatsApp untuk tujuan *Upgrade Akun*.
- Memberikan akses PRO kepada user lain berdasarkan UID / Email.

## 🚀 Instalasi & Cara Penggunaan
1. Pastikan Anda memiliki Web Server lokal (misal: *Live Server* di VS Code) atau hosting (GitHub Pages, Firebase Hosting, Vercel).
2. Letakkan file `index.html` dan `data_default.js` dalam satu folder.
3. Buka `index.html` di browser.
4. Login menggunakan akun Google.

## 🛠️ Konfigurasi Firebase
Aplikasi ini terkoneksi dengan Firebase. Pastikan rules Firestore Anda diatur seperti ini:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} { allow read, write: if request.auth != null; }
    match /settings/{docId} { allow read: if true; allow write: if request.auth.token.email == "afifaro@gmail.com"; }
    match /jadwal/{docId} { allow read, write: if request.auth != null; }
  }
}
