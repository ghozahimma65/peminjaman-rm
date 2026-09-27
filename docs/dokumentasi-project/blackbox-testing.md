# Black Box Testing

Pengujian *Black Box* (*Black Box Testing*) pada Sistem Informasi Peminjaman dan Pengembalian Rekam Medis Rumah Sakit Islam Sultan Agung Semarang bertujuan untuk memverifikasi fungsionalitas sistem berdasarkan spesifikasi kebutuhan tanpa mengamati struktur internal kode program. Pengujian berfokus pada evaluasi terhadap masukan (*input*), proses antarmuka yang tampak, dan luaran (*output*) yang dihasilkan guna memastikan seluruh fitur beroperasi secara benar, andal, dan sesuai dengan alur operasional pelayanan rekam medis.

### Tabel 4.2 Pengujian Black Box Halaman Landing Page dan Login

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Landing Page / Portal | Membuka aplikasi desktop saat belum ada sesi pengguna yang aktif | Sistem menampilkan halaman Portal utama RSI Sultan Agung dengan judul sistem, deskripsi layanan, dan tombol "MASUK KE SISTEM" | Berhasil |
| 2 | Landing Page / Portal | Menekan tombol "MASUK KE SISTEM" pada halaman Portal | Sistem mengalihkan tampilan secara langsung ke halaman formulir Login | Berhasil |
| 3 | Login | Mengakses halaman Login | Sistem menyajikan formulir login dengan input NIP, Password, ikon pengubah visibilitas password, tombol Masuk, dan tautan pendaftaran akun | Berhasil |
| 4 | Login | Menekan tombol "Masuk" dengan membiarkan kolom NIP dan Password kosong | Sistem menampilkan pesan validasi "Username dan password wajib diisi." serta menahan proses otentikasi | Berhasil |
| 5 | Login | Menginputkan NIP yang tidak terdaftar pada sistem lalu menekan tombol "Masuk" | Sistem menolak akses masuk dan menampilkan pesan peringatan "Username atau password salah." | Berhasil |
| 6 | Login | Menginputkan NIP terdaftar dengan kombinasi Password yang salah | Sistem menolak akses masuk, menampilkan pesan peringatan "Username atau password salah.", serta mencatat kegagalan pada log audit sistem | Berhasil |
| 7 | Login | Menginputkan NIP dan Password yang valid dan benar lalu menekan tombol "Masuk" | Sistem berhasil memverifikasi kredensial, membuat sesi pengguna aktif, dan mengarahkan tampilan ke halaman Dashboard | Berhasil |
| 8 | Login | Menekan tombol ikon mata (*eye icon*) pada kolom input Password | Karakter kata sandi beralih tampilan antara teks tersembunyi (disamarkan) dan teks asli yang dapat dibaca | Berhasil |
| 9 | Login | Menekan tombol "Logout" pada menu navigasi aplikasi | Sistem menampilkan jendela dialog konfirmasi "Apakah Anda Yakin Ingin Keluar Dari Sistem?" dengan pilihan "Ya" dan "Tidak" | Berhasil |
| 10 | Login | Mengonfirmasi tindakan keluar dengan memilih opsi "Ya" pada dialog logout | Sesi pengguna dibersihkan secara menyeluruh dari memori dan sistem mengembalikan tampilan ke halaman Portal | Berhasil |

Pada tabel 4.2 dilakukan pengujian black box pada halaman landing page dan login yang bertujuan untuk memastikan sistem dapat menampilkan informasi awal serta memproses input autentikasi pengguna dengan benar. Berdasarkan hasil pengujian, sistem berhasil menampilkan halaman utama portal, mengarahkan pengguna ke formulir login, menangani proses validasi akun, serta mengeksekusi fungsi logout sesuai dengan harapan.

### Tabel 4.3 Pengujian Black Box Halaman Register

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Register | Menekan tautan "Daftar Akun Baru" pada halaman Login | Sistem mengalihkan tampilan ke halaman formulir pendaftaran akun petugas baru | Berhasil |
| 2 | Register | Menekan tombol "Daftar Akun" dengan membiarkan salah satu atau seluruh kolom wajib kosong | Sistem menampilkan pesan peringatan bahwa kolom wajib (NIP, Nama Lengkap, Email, Password, Konfirmasi Password) harus diisi | Berhasil |
| 3 | Register | Menginputkan alamat email dengan format yang tidak valid (tanpa simbol @ atau domain) | Sistem menampilkan pesan validasi "Format email tidak valid." dan pendaftaran tidak diproses | Berhasil |
| 4 | Register | Menginputkan nilai kolom Konfirmasi Password yang tidak sama dengan kolom Password | Sistem menolak pendaftaran dan menampilkan pesan peringatan "Konfirmasi password tidak cocok." | Berhasil |
| 5 | Register | Mengunggah berkas foto profil dengan format selain gambar atau ukuran melebihi 5 MB | Sistem menolak berkas dan menampilkan pesan validasi format gambar atau batasan ukuran berkas | Berhasil |
| 6 | Register | Mendaftarkan akun menggunakan NIP yang telah terdaftar sebelumnya di dalam sistem | Sistem menolak pendaftaran akun baru dan menampilkan pesan kesalahan "NIP sudah terdaftar dalam sistem." | Berhasil |
| 7 | Register | Mengisi seluruh kolom pendaftaran dengan data valid dan lengkap lalu menekan tombol "Daftar Akun" | Akun baru berhasil dibuat dengan peran (*role*) otomatis sebagai "PETUGAS", sistem memunculkan pesan sukses, dan mengarahkan pengguna kembali ke halaman Login | Berhasil |
| 8 | Register | Menekan tautan "Masuk di sini" pada formulir pendaftaran | Sistem membatalkan proses registrasi dan mengembalikan tampilan ke halaman Login | Berhasil |

Pada tabel 4.3 dilakukan pengujian black box pada halaman register yang bertujuan untuk memastikan sistem dapat memvalidasi data masukan dan memproses pendaftaran akun petugas baru dengan benar. Berdasarkan hasil pengujian, sistem berhasil melakukan verifikasi kelengkapan isian formulir, validasi format email dan kecocokan kata sandi, pembatasan unggahan berkas foto, penolakan duplikasi NIP, serta pembuatan akun berstatus petugas sesuai dengan harapan.

### Tabel 4.4 Pengujian Black Box Halaman Dashboard

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Dashboard | Membuka halaman Dashboard setelah berhasil melakukan otentikasi login | Sistem menyajikan kartu metrik statistik peminjaman aktif, jatuh tempo, berkas terlambat, tabel ringkasan sirkulasi terbaru, dan identitas pengguna aktif | Berhasil |
| 2 | Dashboard | Memeriksa panel Sidebar navigasi utama pada sisi kiri aplikasi | Sidebar menampilkan logo rumah sakit, menu Dashboard, kelompok Peminjaman, kelompok Pengembalian, kelompok Master Data, kelompok Export Data, dan tombol Logout | Berhasil |
| 3 | Dashboard | Menekan salah satu menu navigasi pada panel Sidebar | Sistem merespons interaksi dengan memuat dan menampilkan halaman modul yang dipilih secara instan | Berhasil |
| 4 | Dashboard | Menekan tombol pintasan (*shortcut*) "Ajukan Peminjaman" pada kartu aksi cepat Dashboard | Sistem langsung mengarahkan navigasi antarmuka ke halaman formulir Ajukan Peminjaman | Berhasil |
| 5 | Dashboard | Menekan tombol pintasan (*shortcut*) "Konfirmasi Pengembalian" pada kartu aksi cepat Dashboard | Sistem langsung mengarahkan navigasi antarmuka ke halaman formulir Pengembalian RM | Berhasil |
| 6 | Dashboard | Memeriksa indikator notifikasi pada bagian bilah atas (*topbar*) | Ikon lonceng menampilkan indikator titik merah jika terdapat berkas yang memerlukan perhatian dan indikator hilang jika seluruh notifikasi telah dibaca | Berhasil |
| 7 | Dashboard | Menekan area profil pengguna pada bagian kanan bilah atas (*topbar*) | Menu *popover* profil terbuka menampilkan nama pengguna, peran (*role*), status daring, opsi "Lihat Profil Saya", dan opsi "Logout" | Berhasil |

Pada tabel 4.4 dilakukan pengujian black box pada halaman dashboard yang bertujuan untuk memastikan sistem dapat menyajikan informasi ringkasan sirkulasi rekam medis serta menyediakan akses navigasi menuju fitur-fitur utama sistem. Berdasarkan hasil pengujian, sistem berhasil menampilkan metrik data statistik peminjaman, memuat tabel ringkasan transaksi terbaru, menjalankan menu sidebar navigasi, serta merespons tombol pintasan aksi cepat sesuai dengan harapan.

### Tabel 4.5 Pengujian Black Box Halaman Ajukan Peminjaman

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Ajukan Peminjaman | Mengakses halaman modul Ajukan Peminjaman | Sistem menampilkan formulir isian peminjaman berkas rekam medis dan kartu ringkasan detail peminjaman di sebelah kanan | Berhasil |
| 2 | Ajukan Peminjaman | Memeriksa kolom Tanggal Pinjam dan Batas Pengembalian pada formulir peminjaman | Kolom Tanggal Pinjam otomatis terisi waktu aktual saat ini dan kolom Batas Pengembalian terhitung otomatis tepat +48 jam (2x24 jam) dalam kondisi *read-only* | Berhasil |
| 3 | Ajukan Peminjaman | Memasukkan Nomor RM yang tidak terdaftar pada basis data lalu menekan tombol "Cari" | Sistem menampilkan pesan kesalahan "Rekam medis tidak ditemukan. Pastikan nomor RM benar." dan kolom Nama Pasien tetap kosong | Berhasil |
| 4 | Ajukan Peminjaman | Memasukkan Nomor RM yang sedang dalam status peminjaman aktif (DIPINJAM / TERLAMBAT) | Sistem menolak proses peminjaman baru dan menampilkan pesan bahwa berkas masih dipinjam dan belum dikembalikan (proteksi peminjaman ganda) | Berhasil |
| 5 | Ajukan Peminjaman | Memasukkan Nomor RM yang valid dan berkas fisik tersedia di filing | Sistem berhasil menemukan berkas dan secara otomatis mengisi kolom Nama Pasien sesuai data master pasien | Berhasil |
| 6 | Ajukan Peminjaman | Memilih Ruangan Tujuan dari daftar pilihan unit ruangan | Pilihan unit ruangan berhasil ditetapkan pada formulir dan nilai ruangan otomatis terbarukan pada kartu ringkasan detail di sebelah kanan | Berhasil |
| 7 | Ajukan Peminjaman | Menginputkan data Petugas Peminjam, nomor Jilid berkas, dan Catatan / Keperluan peminjaman | Seluruh data masukan teks berhasil diterima oleh kolom formulir dan kartu ringkasan detail terbarukan secara langsung | Berhasil |
| 8 | Ajukan Peminjaman | Memeriksa ketersediaan input kondisi berkas pada formulir peminjaman | Formulir peminjaman tidak meminta masukan kondisi fisik berkas karena pencatatan kondisi (Lengkap / Tidak Lengkap) dialokasikan pada saat berkas fisik diterima kembali di unit filing | Berhasil |
| 9 | Ajukan Peminjaman | Menekan tombol "Reset" pada formulir peminjaman | Seluruh isian kolom (Nomor RM, Nama Pasien, Peminjam, Ruangan Tujuan, Jilid, Catatan) dibersihkan kembali ke kondisi kosong | Berhasil |
| 10 | Ajukan Peminjaman | Menekan tombol "Batalkan Peminjaman" pada panel kartu ringkasan | Sistem menampilkan modal dialog konfirmasi pembatalan peminjaman dan mengosongkan formulir jika pengguna memilih "Ya" | Berhasil |
| 11 | Ajukan Peminjaman | Menekan tombol "Simpan Peminjaman" setelah seluruh data wajib terisi lengkap | Sistem memunculkan jendela dialog modal "Ringkasan Peminjaman" untuk memverifikasi ulang seluruh rincian peminjaman berkas | Berhasil |
| 12 | Ajukan Peminjaman | Mengonfirmasi tombol simpan pada dialog Ringkasan Peminjaman | Data transaksi peminjaman tersimpan ke basis data dengan status "DIPINJAM", sistem menampilkan notifikasi sukses, dan mengarahkan tampilan ke Daftar Peminjaman | Berhasil |

Pada tabel 4.5 dilakukan pengujian black box pada halaman pengajuan peminjaman yang bertujuan untuk memastikan sistem dapat memproses pengajuan peminjaman berkas rekam medis dengan data yang sesuai serta mencegah terjadinya peminjaman aktif ganda. Berdasarkan hasil pengujian, sistem berhasil melakukan pencarian data rekam medis, mengisi data pasien dan tenggat pengembalian 48 jam secara otomatis, memvalidasi ketersediaan berkas, serta menyimpan transaksi peminjaman baru sesuai dengan harapan.

### Tabel 4.6 Pengujian Black Box Halaman Daftar Peminjaman

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Daftar Peminjaman | Mengakses halaman Daftar Peminjaman | Sistem menampilkan tabel daftar transaksi sirkulasi peminjaman berkas lengkap dengan informasi No. RM, Nama Pasien, Asal Ruang, Peminjam, Tanggal Pinjam, Status, dan kontrol halaman | Berhasil |
| 2 | Daftar Peminjaman | Menginputkan kata kunci pencarian (Nomor RM atau Nama Pasien) pada kolom pencarian | Baris tabel secara dinamis menyaring data dan hanya menampilkan baris transaksi yang sesuai dengan kata kunci yang dimasukkan | Berhasil |
| 3 | Daftar Peminjaman | Memilih salah satu unit pada menu pilihan Asal Ruang | Tabel menyaring transaksi dan hanya menampilkan peminjaman berkas dari unit ruangan yang dipilih | Berhasil |
| 4 | Daftar Peminjaman | Memilih salah satu kriteria pada menu pilihan Status Berkas (Semua Status, Aktif, Jatuh Tempo, Kembali) | Tabel hanya menampilkan transaksi peminjaman berkas yang memiliki status sesuai dengan kriteria yang dipilih | Berhasil |
| 5 | Daftar Peminjaman | Memilih opsi penyaringan Rentang Tanggal menjadi "Hari Ini" | Tabel menyaring data dan hanya menampilkan daftar transaksi peminjaman berkas yang dilakukan pada hari yang sama | Berhasil |
| 6 | Daftar Peminjaman | Menekan tombol "Reset" pada bilah penyaringan | Seluruh kriteria filter (ruangan, status, rentang tanggal, kata kunci pencarian) dikembalikan ke nilai default (*Semua*) dan tabel memuat ulang seluruh data | Berhasil |
| 7 | Daftar Peminjaman | Menekan tombol aksi "Konfirmasi" pada baris transaksi yang berstatus aktif (DIPINJAM / TERLAMBAT) | Sistem mengalihkan pengguna ke halaman Pengembalian RM dengan Nomor RM transaksi terkait yang otomatis terisi pada formulir pencarian | Berhasil |
| 8 | Daftar Peminjaman | Memeriksa tombol aksi pada baris transaksi yang telah berstatus "Kembali" (DIKEMBALIKAN) | Tombol aksi menampilkan teks "Selesai" dalam kondisi dinonaktifkan (*disabled*) sehingga mencegah proses pengembalian berulang | Berhasil |

Pada tabel 4.6 dilakukan pengujian black box pada halaman daftar peminjaman yang bertujuan untuk memastikan sistem dapat menampilkan seluruh data transaksi peminjaman aktif serta menyediakan fungsi pencarian dan penyaringan data yang akurat. Berdasarkan hasil pengujian, sistem berhasil menampilkan tabel sirkulasi berkas, menjalankan fungsi filter multi-kriteria berdasarkan asal ruang, status, dan tanggal, serta mengarahkan berkas aktif menuju modul pengembalian sesuai dengan harapan.

### Tabel 4.7 Pengujian Black Box Halaman Pengembalian RM

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Pengembalian | Mengakses halaman modul Pengembalian RM | Sistem menampilkan formulir pencarian berkas, kartu informasi berkas, dan tabel hasil pencarian berkas aktif | Berhasil |
| 2 | Pengembalian | Melakukan pencarian Nomor RM yang tidak memiliki transaksi peminjaman aktif | Sistem menampilkan pesan informasi "Tidak ada peminjaman aktif untuk Nomor RM: [nomor]" dan formulir pengembalian tidak diaktifkan | Berhasil |
| 3 | Pengembalian | Melakukan pencarian Nomor RM yang sedang dipinjam aktif | Sistem menampilkan rincian data pasien, peminjam, unit peminjam, catatan pinjam, batas waktu pengembalian, dan memunculkan baris transaksi pada tabel hasil pencarian | Berhasil |
| 4 | Pengembalian | Memeriksa isian kolom Tanggal Kembali pada formulir | Kolom Tanggal Kembali menampilkan keterangan otomatis saat diproses dan mencatat waktu aktual saat pengembalian dikonfirmasi | Berhasil |
| 5 | Pengembalian | Memilih opsi Kondisi Berkas antara pilihan "Lengkap" atau "Tidak Lengkap" | Pilihan kondisi fisik berkas berhasil ditetapkan dan dipetakan ke dalam status kondisi berkas di basis data (BAIK atau RUSAK) | Berhasil |
| 6 | Pengembalian | Menginputkan keterangan tambahan pada kolom Catatan Pengembalian | Kolom area teks (*textarea*) menerima masukan keterangan kondisi fisik atau catatan pengembalian berkas | Berhasil |
| 7 | Pengembalian | Menekan tombol "Reset" pada formulir pengembalian | Seluruh isian formulir dibersihkan dan tabel hasil pencarian dikembalikan ke kondisi awal | Berhasil |
| 8 | Pengembalian | Menekan tombol aksi "Kembalikan" pada tabel hasil pencarian | Sistem menampilkan jendela dialog modal konfirmasi "Kembalikan RM" dengan pertanyaan verifikasi pengembalian berkas fisik | Berhasil |
| 9 | Pengembalian | Memilih tombol konfirmasi "Ya" pada dialog pengembalian berkas | Sistem mencatat waktu kembali riil, menyimpan kondisi berkas dan catatan pengembalian, memperbarui status peminjaman menjadi "DIKEMBALIKAN", memunculkan pesan sukses, dan beralih ke Daftar Pengembalian | Berhasil |
| 10 | Pengembalian | Memeriksa status ketersediaan berkas di filing setelah transaksi diselesaikan | Berkas rekam medis kembali tercatat berstatus tersedia di filing dan dapat dipinjam kembali jika terdapat permohonan baru | Berhasil |

Pada tabel 4.7 dilakukan pengujian black box pada halaman pengembalian rekam medis yang bertujuan untuk memastikan sistem dapat memproses pengembalian berkas rekam medis dengan benar dan memperbarui ketersediaan fisik berkas. Berdasarkan hasil pengujian, sistem berhasil melakukan pencarian data peminjaman aktif, mencatat waktu pengembalian aktual, mendokumentasikan kondisi berkas dan catatan pengembalian, serta memperbarui status transaksi menjadi dikembalikan sesuai dengan harapan.

### Tabel 4.8 Pengujian Black Box Halaman Daftar Pengembalian

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Daftar Pengembalian | Mengakses halaman modul Daftar Pengembalian | Sistem menyajikan tabel daftar seluruh berkas rekam medis yang telah selesai dikembalikan ke unit filing beserta kontrol filter dan pagination | Berhasil |
| 2 | Daftar Pengembalian | Melakukan penyaringan berdasarkan rentang Tanggal Kembali (tanggal mulai s/d tanggal akhir) | Tabel menyaring dan menyajikan riwayat pengembalian berkas yang diselesaikan dalam rentang tanggal yang ditentukan | Berhasil |
| 3 | Daftar Pengembalian | Melakukan penyaringan data berdasarkan Asal Ruang peminjam berkas | Tabel hanya menampilkan riwayat pengembalian berkas yang berasal dari unit ruangan yang dipilih | Berhasil |
| 4 | Daftar Pengembalian | Melakukan penyaringan data berdasarkan status pengembalian (Semua Status, Dikembalikan, Terlambat) | Tabel memisahkan dan menampilkan riwayat transaksi pengembalian tepat waktu atau pengembalian yang melewati batas tempo | Berhasil |
| 5 | Daftar Pengembalian | Memilih opsi cepat Rentang Data (Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir, Semua Data) | Tabel menyaring riwayat pengembalian sesuai dengan rentang hari preset yang dipilih | Berhasil |
| 6 | Daftar Pengembalian | Melakukan pencarian data pengembalian menggunakan Nomor RM | Tabel menyaring baris data dan menampilkan transaksi pengembalian yang sesuai dengan Nomor RM yang dicari | Berhasil |
| 7 | Daftar Pengembalian | Menekan tombol "Reset" pada bilah penyaringan pengembalian | Seluruh parameter filter tanggal, ruang, status, dan pencarian dibersihkan ke pengaturan awal | Berhasil |
| 8 | Daftar Pengembalian | Memeriksa kolom Catatan / Keperluan Peminjaman dan kolom Catatan Pengembalian pada tabel | Kedua kolom menampilkan catatan masing-masing secara terpisah, jelas, dan tidak tertukar satu sama lain | Berhasil |
| 9 | Daftar Pengembalian | Menekan tombol aksi Edit (ikon pensil) pada baris data pengembalian | Sistem menampilkan jendela modal edit untuk memperbarui kondisi fisik berkas ("Lengkap" / "Tidak Lengkap") dan data terbarukan setelah disimpan | Berhasil |
| 10 | Daftar Pengembalian | Menekan tombol aksi Hapus (ikon tempat sampah) pada baris data pengembalian | Sistem menampilkan jendela modal konfirmasi bahaya dan saat dikonfirmasi, data pengembalian beserta relasi transaksi terkait dihapus secara konsisten | Berhasil |

Pada tabel 4.8 dilakukan pengujian black box pada halaman daftar pengembalian yang bertujuan untuk memastikan data berkas yang telah dikembalikan tersimpan rapi serta dapat dikelola dan disaring secara tepat. Berdasarkan hasil pengujian, sistem berhasil menampilkan daftar pengembalian, menyaring data berdasarkan tanggal dan ruangan, menampilkan kolom catatan peminjaman serta catatan pengembalian secara terpisah tanpa tertukar, serta menjalankan fungsi pengeditan kondisi berkas dan penghapusan data pengembalian sesuai dengan harapan.

### Tabel 4.9 Pengujian Black Box Halaman Riwayat RM

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Riwayat RM | Mengakses halaman modul Riwayat RM | Sistem menampilkan tabel kronologi sirkulasi riwayat peminjaman dan pengembalian rekam medis secara menyeluruh | Berhasil |
| 2 | Riwayat RM | Melakukan pencarian berdasarkan Nomor RM, Nama Pasien, atau Nama Peminjam | Tabel menampilkan seluruh jejak kronologis peminjaman dan pengembalian yang relevan dengan kata kunci pencarian | Berhasil |
| 3 | Riwayat RM | Melakukan penyaringan data riwayat berdasarkan Asal Ruang | Tabel menyajikan seluruh transaksi sirkulasi yang berasal dari unit ruangan yang dipilih | Berhasil |
| 4 | Riwayat RM | Menekan tombol "Reset" pada formulir pencarian riwayat | Kotak pencarian dan pilihan unit ruangan dibersihkan serta tabel memuat kembali seluruh kronologi riwayat sirkulasi | Berhasil |
| 5 | Riwayat RM | Memeriksa indikator status sirkulasi (*badge*) pada tabel (Tepat Waktu, Dipinjam, Terlambat) | Label dan warna *badge* status sirkulasi tampil sesuai dengan kalkulasi waktu peminjaman dan pengembalian berkas | Berhasil |
| 6 | Riwayat RM | Menekan tombol aksi "Lihat Detail RM" (ikon mata) pada baris riwayat | Sistem menampilkan kartu modal pop-up "Informasi RM" yang menyajikan nomor RM, nama pasien, unit, peminjam, kondisi berkas, tanggal pinjam, tanggal kembali beserta durasi hari pinjam, catatan pinjam, catatan kembali, dan status | Berhasil |
| 7 | Riwayat RM | Menekan tombol aksi "Edit data" pada baris riwayat transaksi | Sistem menampilkan modal dialog untuk memperbarui unit asal ruang dan catatan peminjaman | Berhasil |
| 8 | Riwayat RM | Menekan tombol aksi "Hapus data" pada baris riwayat transaksi | Sistem menampilkan modal konfirmasi penghapusan dan menghapus riwayat transaksi sirkulasi yang dipilih saat dikonfirmasi | Berhasil |
| 9 | Riwayat RM | Menekan kontrol navigasi halaman (*pagination*) tabel riwayat (10 baris per halaman) | Tampilan baris riwayat berpindah halaman secara dinamis sesuai nomor halaman yang ditekan (Sebelumnya, Angka Halaman, Selanjutnya) | Berhasil |

Pada tabel 4.9 dilakukan pengujian black box pada halaman riwayat rekam medis yang bertujuan untuk memastikan riwayat pergerakan berkas dapat dilacak secara kronologis dengan data sirkulasi yang lengkap. Berdasarkan hasil pengujian, sistem berhasil menampilkan daftar riwayat transaksi, melakukan pencarian nomor rekam medis, menyajikan kartu pop-up rincian sirkulasi berkas beserta catatan peminjaman dan pengembalian, serta mengeksekusi operasi edit, hapus, dan pagination sesuai dengan harapan.

### Tabel 4.10 Pengujian Black Box Halaman Data Master Pasien dan Rekam Medis

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Data RM | Mengakses halaman Data Master Pasien & Rekam Medis | Sistem menyajikan 3 kartu metrik statistik (Total Pasien/RM, Sedang Dipinjam, RM Baru Bulan Ini), bilah pencarian, dan tabel master rekam medis aktif | Berhasil |
| 2 | Data RM | Melakukan pencarian data master menggunakan Nomor RM atau Nama Pasien | Tabel master data secara langsung menyaring dan menampilkan data pasien yang sesuai dengan kata kunci pencarian | Berhasil |
| 3 | Data RM | Menekan tombol "Tambah RM Baru" pada bagian kanan atas | Sistem mengalihkan antarmuka ke tampilan formulir pendaftaran berkas rekam medis dan identitas pasien baru | Berhasil |
| 4 | Data RM | Menginputkan karakter non-angka (huruf atau simbol) pada kolom Nomor RM | Bidang input secara otomatis menolak karakter non-angka dan hanya menerima angka 0–9 | Berhasil |
| 5 | Data RM | Menginputkan Nomor RM melebihi panjang 8 digit angka | Bidang input membatasi panjang masukan tepat maksimal 8 digit angka | Berhasil |
| 6 | Data RM | Menginputkan Nomor Induk Kependudukan (NIK) kurang dari atau lebih dari 16 digit angka | Sistem menolak pendaftaran dan memunculkan pesan validasi "NIK wajib terdiri dari tepat 16 digit angka (tanpa huruf, spasi, atau simbol)." | Berhasil |
| 7 | Data RM | Mendaftarkan data master RM dengan Nomor RM yang telah ada di dalam basis data | Sistem menolak pendaftaran duplikat dan menampilkan pesan kesalahan "Nomor RM sudah terdaftar. Gunakan nomor RM lain." | Berhasil |
| 8 | Data RM | Menyimpan pendaftaran master rekam medis baru dengan data yang valid dan lengkap | Data master tersimpan ke basis data, bertambah pada daftar pasien, dan memunculkan dialog modal sukses "Data Berhasil Disimpan" | Berhasil |
| 9 | Data RM | Menekan tombol "Lihat" pada modal dialog konfirmasi pendaftaran berhasil | Sistem membuka jendela modal Detail Rekam Medis yang menyajikan informasi lengkap pasien dan tombol salin Nomor RM | Berhasil |
| 10 | Data RM | Menekan tombol salin (*copy*) Nomor RM pada modal detail rekam medis | Nomor RM berhasil tersalin ke *clipboard* sistem operasi dan ikon tombol berubah menampilkan tanda centang | Berhasil |
| 11 | Data RM | Memeriksa kolom Status Fisik Berkas pada tabel data master RM | Berkas yang sedang aktif dipinjam menampilkan status "Dipinjam" (*badge* kuning), sedangkan berkas di rak filing menampilkan "Tersedia di Filing" (*badge* hijau) | Berhasil |
| 12 | Data RM | Menekan tombol aksi "Buka Riwayat RM" (ikon riwayat) pada baris tabel Data RM | Sistem membuka halaman Riwayat RM dan secara otomatis menyaring seluruh riwayat transaksi untuk Nomor RM terkait | Berhasil |
| 13 | Data RM | Mencoba menghapus Data RM yang memiliki riwayat transaksi peminjaman | Sistem menolak penghapusan dan memunculkan pesan peringatan bahwa Data RM tidak dapat dihapus karena masih memiliki riwayat transaksi | Berhasil |
| 14 | Data RM | Menghapus Data RM yang belum pernah memiliki riwayat transaksi peminjaman | Sistem memunculkan modal konfirmasi hapus dan berhasil menghapus data master pasien dari basis data saat disetujui | Berhasil |

Pada tabel 4.10 dilakukan pengujian black box pada halaman data master pasien dan rekam medis yang bertujuan untuk memastikan integritas pengelolaan master data pasien serta validasi ketat terhadap identitas berkas. Berdasarkan hasil pengujian, sistem berhasil menerapkan validasi Nomor RM maksimal 8 digit angka, memvalidasi NIK tepat 16 digit numerik, memantau ketersediaan fisik berkas, melindungi data yang memiliki riwayat dari penghapusan tidak disengaja, serta menghapus data master tanpa transaksi sesuai dengan harapan.

### Tabel 4.11 Pengujian Black Box Halaman Profil Pengguna dan Ubah Password

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Profil | Mengakses halaman Profil Pengguna melalui menu akun di header | Sistem menampilkan kartu identitas pengguna dan kartu formulir pengaturan kata sandi akun | Berhasil |
| 2 | Profil | Memeriksa status keterbacaan kolom NIP dan kolom Peran (*Role*) | Kolom NIP dan kolom Peran terkunci dalam status *read-only* sehingga tidak dapat diubah oleh pengguna | Berhasil |
| 3 | Profil | Menekan tombol "Edit Profil" pada kartu data pengguna | Kolom Nama Lengkap dan kontrol pengelolaan foto profil beralih menjadi aktif (*editable*) | Berhasil |
| 4 | Profil | Mengosongkan kolom Nama Lengkap lalu menekan tombol "Simpan Profil" | Sistem menolak penyimpanan dan menampilkan pesan validasi "Nama Lengkap wajib diisi." | Berhasil |
| 5 | Profil | Mengunggah berkas foto avatar baru lalu menekan tombol "Simpan Profil" | Foto profil tersimpan ke direktori AppData, avatar pengguna di bilah atas langsung terbarukan, dan muncul modal "Data Berhasil Disimpan" | Berhasil |
| 6 | Profil | Menekan tombol "Hapus Foto" pada profil yang memiliki foto avatar | Foto profil terhapus dari sistem dan avatar kembali menampilkan inisial huruf nama pengguna | Berhasil |
| 7 | Profil | Menekan tombol "Batal" saat formulir profil dalam mode pengeditan aktif | Seluruh perubahan masukan dibatalkan dan formulir kembali menampilkan data profil awal | Berhasil |
| 8 | Profil | Menekan tombol "Ubah Password" dengan mengosongkan salah satu kolom kata sandi | Sistem menolak proses dan memunculkan pesan validasi bahwa seluruh kolom kata sandi wajib diisi | Berhasil |
| 9 | Profil | Mengubah kata sandi dengan memasukkan Password Lama yang salah | Sistem menolak pembaruan kata sandi dan memunculkan pesan kesalahan "Password lama tidak sesuai." | Berhasil |
| 10 | Profil | Mengubah kata sandi dengan nilai Konfirmasi Password Baru yang tidak sama dengan Password Baru | Sistem menolak pembaruan kata sandi dan memunculkan pesan peringatan "Konfirmasi password tidak sesuai." | Berhasil |
| 11 | Profil | Mengubah kata sandi dengan memasukkan Password Lama yang benar dan konfirmasi kata sandi cocok | Kata sandi berhasil diperbarui dengan enkripsi bcrypt baru, kolom formulir dibersihkan, muncul pesan sukses, dan modal konfirmasi berhasil ditampilkan | Berhasil |

Pada tabel 4.11 dilakukan pengujian black box pada halaman profil pengguna dan ubah password yang bertujuan untuk memastikan keamanan pengelolaan informasi akun pengguna serta keandalan fitur pembaruan kata sandi. Berdasarkan hasil pengujian, sistem berhasil mengunci kolom NIP dan peran pengguna secara read-only, memproses pembaharuan nama serta foto profil, memverifikasi kata sandi lama, dan mengenkripsi kata sandi baru sesuai dengan harapan.

### Tabel 4.12 Pengujian Black Box Fitur Notifikasi Sistem

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Notifikasi | Memeriksa indikator notifikasi pada ikon lonceng di bilah atas (*topbar*) | Titik merah muncul ketika terdapat notifikasi baru yang belum dibaca dan menghilang secara otomatis saat seluruh notifikasi telah dibaca | Berhasil |
| 2 | Notifikasi | Menekan ikon lonceng notifikasi pada bilah atas | Panel *popover* notifikasi terbuka menampilkan daftar ringkasan notifikasi berkas terbaru beserta waktu dan statusnya | Berhasil |
| 3 | Notifikasi | Sinkronisasi notifikasi peminjaman berkas yang mendekati batas waktu tempo | Sistem secara otomatis memicu notifikasi peringatan bertipe "REMINDER" untuk peminjaman aktif yang memiliki sisa waktu $\le 24$ jam menuju batas waktu | Berhasil |
| 4 | Notifikasi | Sinkronisasi notifikasi peminjaman berkas yang telah melewati batas waktu tempo | Sistem secara otomatis memicu notifikasi peringatan bertipe "TERLAMBAT" untuk peminjaman aktif yang durasi peminjamannya telah melebihi batas 48 jam | Berhasil |
| 5 | Notifikasi | Memeriksa status notifikasi pada transaksi peminjaman baru ($< 24$ jam berjalan) | Sistem tidak memunculkan notifikasi jatuh tempo maupun terlambat selama masa peminjaman berkas masih berada dalam batas waktu normal | Berhasil |
| 6 | Notifikasi | Menekan salah satu item notifikasi yang belum dibaca pada panel *popover* | Status notifikasi terbarukan menjadi terbaca (`isRead = 1`), indikator titik merah berkurang, dan pengguna dialihkan ke halaman modul terkait | Berhasil |
| 7 | Notifikasi | Menekan notifikasi peringatan bertipe "TERLAMBAT" pada panel notifikasi | Sistem secara otomatis mengarahkan pengguna ke halaman Pengembalian RM dengan Nomor RM terkait yang langsung terisi pada form | Berhasil |
| 8 | Notifikasi | Menekan notifikasi peringatan bertipe "REMINDER" (Jatuh Tempo) pada panel notifikasi | Sistem secara otomatis mengarahkan pengguna ke halaman Daftar Peminjaman | Berhasil |
| 9 | Notifikasi | Menekan tautan "Lihat Semua Notifikasi" pada bagian bawah panel notifikasi | Sistem membuka halaman Semua Notifikasi yang menyajikan seluruh daftar notifikasi dan tab penyaringan (Semua, Jatuh Tempo, Terlambat) | Berhasil |
| 10 | Notifikasi | Menekan tombol "Tandai Semua Dibaca" pada halaman Semua Notifikasi | Seluruh notifikasi yang berstatus belum dibaca langsung diubah statusnya menjadi terbaca dan indikator notifikasi pada header hilang | Berhasil |
| 11 | Notifikasi | Menekan tombol aksi "Segera Kembalikan" pada baris notifikasi berkas terlambat | Sistem langsung mengarahkan tampilan ke halaman formulir Pengembalian RM dengan Nomor RM yang otomatis terisi | Berhasil |
| 12 | Notifikasi | Memeriksa daftar notifikasi setelah transaksi peminjaman selesai dikembalikan | Notifikasi terkait peminjaman yang telah berstatus "DIKEMBALIKAN" secara otomatis dibersihkan dari daftar notifikasi sistem | Berhasil |

Pada tabel 4.12 dilakukan pengujian black box pada fitur notifikasi sistem yang bertujuan untuk memastikan mekanisme pengingat batas waktu sirkulasi berkas berjalan secara otomatis dan tepat waktu. Berdasarkan hasil pengujian, sistem berhasil menampilkan indikator visual notifikasi, menghasilkan peringatan dini jatuh tempo 24 jam dan peringatan keterlambatan 48 jam, mengarahkan navigasi ke transaksi terkait, serta membersihkan notifikasi untuk berkas yang telah dikembalikan sesuai dengan harapan.

### Tabel 4.13 Pengujian Black Box Halaman Laporan dan Ekspor Data

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Laporan | Mengakses halaman modul Laporan | Sistem menampilkan panel parameter penyaringan, rentang tanggal, preset waktu, komponen data, format unduhan, dan dokumen preview cetak A4 | Berhasil |
| 2 | Laporan | Mengubah pilihan unit pada menu penyaringan Ruang | Data rekapitulasi pada dokumen preview cetak diperbarui secara langsung sesuai dengan unit ruangan yang dipilih | Berhasil |
| 3 | Laporan | Menentukan rentang tanggal laporan secara kustom (Dari Tanggal dan Sampai Tanggal) | Data rekapitulasi sirkulasi berkas tersaring secara akurat berdasarkan periode tanggal yang ditentukan | Berhasil |
| 4 | Laporan | Menginputkan nilai Dari Tanggal yang lebih besar daripada Sampai Tanggal | Sistem menampilkan pesan validasi "Dari Tanggal tidak boleh lebih besar dari Sampai Tanggal." dan menahan proses ekspor | Berhasil |
| 5 | Laporan | Menekan tombol pilihan cepat rentang waktu (30 Hari Terakhir, Bulan Ini, 3 Bulan Terakhir, 1 Tahun Terakhir) | Kolom Dari Tanggal dan Sampai Tanggal otomatis terisi tanggal yang sesuai dengan rentang hari preset yang dipilih | Berhasil |
| 6 | Laporan | Memilih atau membatalkan pilihan pada kotak centang Komponen Data | Dokumen preview memperbarui perhitungan angka dan persentase rekapitulasi sesuai komponen data yang dicentang | Berhasil |
| 7 | Laporan | Memeriksa susunan dokumen cetak A4 pada panel pratinjau (*preview*) | Dokumen menampilkan kop surat resmi RSI Sultan Agung Semarang, 3 tabel rekapitulasi analitik, persentase otomatis, dan kolom tanda tangan pengesahan | Berhasil |
| 8 | Laporan | Menekan tombol "Buka Layar Penuh" pada bilah atas dokumen preview | Sistem menampilkan dokumen pratinjau cetak A4 dalam jendela modal layar penuh (*fullscreen*) | Berhasil |
| 9 | Laporan | Memilih format Microsoft Excel (.xlsx) lalu menekan tombol "Unduh Laporan & Ekspor Data" | Sistem menampilkan dialog konfirmasi, lalu mengunduh berkas Excel resmi berstandar 13 kolom, formula persentase, dan tanda tangan pengesahan | Berhasil |
| 10 | Laporan | Memilih format PDF (.pdf) lalu menekan tombol "Unduh Laporan & Ekspor Data" | Sistem menampilkan dialog konfirmasi, lalu mengunduh berkas dokumen PDF A4 resmi ber-kop surat RSISA, nomor berita acara, dan tabel rekapitulasi | Berhasil |
| 11 | Laporan | Membandingkan nilai rekapitulasi laporan terhadap transaksi riil di basis data | Seluruh akumulasi jumlah peminjaman, pengembalian, berkas belum kembali, tepat waktu, dan keterlambatan pada laporan terverifikasi akurat dan identik | Berhasil |

Pada tabel 4.13 dilakukan pengujian black box pada halaman laporan dan ekspor data yang bertujuan untuk memastikan keakuratan penyaringan data rekapitulasi serta validitas dokumen cetak luaran yang dihasilkan. Berdasarkan hasil pengujian, sistem berhasil menyaring data berdasarkan ruang dan periode tanggal, menampilkan dokumen pratinjau cetak A4 ber-kop surat resmi, memvalidasi rentang tanggal, serta memproduksi berkas unduhan Microsoft Excel (.xlsx) dan dokumen Adobe PDF (.pdf) sesuai dengan harapan.

### Tabel 4.14 Pengujian Black Box Sesi dan Persistensi Sistem

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Sesi & Persistensi | Memeriksa kelangsungan sesi pengguna selama bernavigasi antar menu di dalam aplikasi | Sesi login pengguna tetap aktif, nama dan peran pengguna tetap konsisten pada bilah atas dan dashboard | Berhasil |
| 2 | Sesi & Persistensi | Melakukan logout dari aplikasi melalui tombol yang tersedia | Sesi aktif dihapus secara tuntas dari penyimpanan sesi dan aplikasi kembali ke halaman Portal | Berhasil |
| 3 | Sesi & Persistensi | Menutup jendela aplikasi desktop lalu membukanya kembali (*Application Restart*) | Sistem secara sengaja memulai aplikasi dari halaman Portal tanpa mempertahankan sesi login terbuka sebelumnya demi keamanan di komputer bersama | Berhasil |
| 4 | Sesi & Persistensi | Memeriksa persistensi seluruh data operasional setelah aplikasi ditutup dan dibuka kembali | Seluruh data master pasien, transaksi peminjaman, transaksi pengembalian, riwayat, dan akun pengguna tetap tersimpan utuh di basis data SQLite lokal | Berhasil |

Pada tabel 4.14 dilakukan pengujian black box pada sesi dan persistensi sistem yang bertujuan untuk memastikan daur hidup sesi pengguna berjalan aman serta data operasional tersimpan secara permanen. Berdasarkan hasil pengujian, sistem berhasil menjaga kontinuitas sesi selama navigasi, menerapkan mekanisme pembersihan sesi saat aplikasi dibuka ulang demi proteksi komputer kerja bersama, serta memelihara persistensi basis data lokal sesuai dengan harapan.

### Tabel 4.15 Pengujian Black Box Regresi dan Konsistensi Data Relasional

| No | Fitur | Kasus Uji | Harapan Hasil | Hasil Pengujian |
|---:|---|---|---|---|
| 1 | Regresi & Konsistensi | Memeriksa status transaksi peminjaman setelah proses pengembalian berkas fisik diselesaikan | Transaksi peminjaman secara konsisten berstatus "DIKEMBALIKAN" dan tidak lagi muncul sebagai peminjaman aktif di modul peminjaman | Berhasil |
| 2 | Regresi & Konsistensi | Memeriksa relasi data saat rekaman transaksi pengembalian dihapus | *Trigger* basis data secara otomatis menghapus rekaman peminjaman terkait saat data pengembalian dihapus sehingga mencegah berkas kembali berstatus aktif tanpa riwayat | Berhasil |
| 3 | Regresi & Konsistensi | Memeriksa data master pasien pada tabel `data_rm` saat transaksi sirkulasi diselesaikan atau dihapus | Data master identitas pasien pada tabel `data_rm` tetap utuh, terverifikasi, dan tidak ikut terhapus saat transaksi sirkulasi berkas diselesaikan | Berhasil |
| 4 | Regresi & Konsistensi | Memeriksa konsistensi penentuan status sirkulasi berkas di seluruh modul aplikasi | Status transaksi (DIPINJAM, DIKEMBALIKAN, TERLAMBAT) terbukti konsisten dan selaras pada Dashboard, Daftar Peminjaman, Pengembalian, Riwayat RM, dan Laporan | Berhasil |

Pada tabel 4.15 dilakukan pengujian black box pada regresi dan konsistensi data relasional yang bertujuan untuk memastikan stabilitas hubungan antar-tabel serta keselarasan status berkas saat terjadi perubahan data. Berdasarkan hasil pengujian, sistem berhasil menjaga konsistensi status transaksi sirkulasi, menegakkan integritas referensial basis data melalui trigger, mempertahankan keutuhan master data pasien, serta menyelaraskan kalkulasi status di seluruh modul antarmuka sesuai dengan harapan.
