/*
  Daftar pertanyaan Kuesioner Usahatani (urutan & pilihan sama dengan dokumen Word).
  Untuk mengubah teks/pilihan, cukup edit file ini.

  Jenis isian (type):
    text, tel, textarea, date, num (angka, boleh "TT"), radio (pilih satu), check (boleh lebih dari satu)
  Pilihan (opts): teks biasa, atau objek:
    { v: 'Lainnya', input: 'text' }                       -> muncul kolom tulis
    { v: 'Ya', input: 'num', unit: 'kali per tahun' }     -> muncul kolom angka
    { v: 'Tidak pernah', excl: true }                     -> tidak bisa digabung dengan pilihan lain
*/

const OTHER = { v: 'Lainnya', input: 'text' };
const NONE = (v) => ({ v, excl: true });
const OPT = (v, x) => Object.assign({ v }, x);

window.FORM = {
  title: 'Kuesioner Usahatani',
  subtitle: 'Mata Kuliah Manajemen Usahatani – Team-Based Project (TBP)',

  meta: [
    { key: 'h_komoditas', label: 'Komoditas', type: 'text', req: true },
    { key: 'h_varietas', label: 'Varietas/jenis', type: 'text' },
    { key: 'h_desa', label: 'Desa Wisata', type: 'text' },
    { key: 'h_jenis', label: 'Jenis tanaman', type: 'radio', opts: ['Musiman', 'Tahunan'] },
    { key: 'h_pewawancara', label: 'Pewawancara', type: 'text', req: true },
    { key: 'h_tanggal', label: 'Tanggal', type: 'date', req: true },
    { key: 'h_kode', label: 'Kode responden', type: 'text', req: true },
    { key: 'h_periode', label: 'Periode data', type: 'radio', opts: ['1 musim tanam', '1 musim panen', OTHER] },
  ],

  consentText:
    'Data ini hanya dipakai untuk tugas perkuliahan dan dijaga kerahasiaannya. Bapak/Ibu bersedia diwawancarai?',
  consent: { key: 'h_consent', label: 'Persetujuan responden', type: 'radio', opts: ['Bersedia', 'Tidak bersedia'], req: true },

  howTo:
    'Beri tanda ✓ pada kotak yang sesuai, atau tulis jawaban pada kolom yang tersedia. Tulis satuan setiap angka (Rp, kg, are, hari). ' +
    'Jika jawaban tidak ada di pilihan, pilih "Lainnya" lalu tulis jawabannya. Jika petani tidak tahu atau lupa, tulis "TT". ' +
    'Semua data diambil dari satu periode yang sama (satu musim tanam terakhir untuk tanaman musiman, satu musim panen untuk tanaman tahunan).',

  sections: [
    {
      id: 'A',
      title: 'Karakteristik Petani',
      items: [
        { no: 1, q: 'Siapa nama Bapak/Ibu?', f: [{ type: 'text' }] },
        { no: 2, q: 'Alamat tinggal (banjar/dusun, desa)?', f: [{ type: 'text' }] },
        { no: 3, q: 'Nomor HP yang bisa dihubungi (boleh dikosongkan)?', f: [{ type: 'tel' }] },
        { no: 4, q: 'Jenis kelamin?', f: [{ type: 'radio', opts: ['Laki-laki', 'Perempuan'] }] },
        { no: 5, q: 'Umur Bapak/Ibu sekarang?', f: [{ type: 'num', unit: 'tahun' }] },
        { no: 6, q: 'Status perkawinan?', f: [{ type: 'radio', opts: ['Belum menikah', 'Menikah', 'Cerai', 'Duda/Janda', OTHER] }] },
        { no: 7, q: 'Pendidikan terakhir?', f: [{ type: 'radio', opts: ['Tidak sekolah', 'TK', 'SD', 'SMP', 'SMA/SMK', 'Kuliah (Diploma/Sarjana)', OTHER] }] },
        { no: 8, q: 'Sudah berapa tahun bertani?', f: [{ type: 'num', unit: 'tahun' }] },
        { no: 9, q: 'Pekerjaan utama Bapak/Ibu apa?', f: [{ type: 'radio', opts: ['Bertani', 'Buruh tani', 'Berdagang', 'Pegawai (negeri/swasta)', 'Kerja di pariwisata', OTHER] }] },
        { no: 10, q: 'Apakah ada pekerjaan lain selain bertani?', f: [{ type: 'radio', opts: ['Tidak', OPT('Ada', { input: 'text', ask: 'yaitu' })] }] },
        { no: 11, q: 'Berapa orang yang tinggal serumah dan ditanggung?', f: [{ type: 'num', unit: 'orang' }] },
        { no: 12, q: 'Dari jumlah itu, berapa orang yang ikut bekerja di kebun/sawah?', f: [{ type: 'num', unit: 'orang' }] },
        { no: 13, q: 'Apakah ikut kelompok tani/subak?', f: [{ type: 'radio', opts: [OPT('Ya', { input: 'text', ask: 'nama kelompok' }), 'Tidak'] }] },
      ],
    },
    {
      id: 'B',
      title: 'Lahan',
      items: [
        { no: 14, q: 'Berapa total luas lahan yang digarap?', f: [{ type: 'num', unit: 'are' }] },
        { no: 15, q: 'Lahan itu status apa?', f: [{ type: 'check', opts: ['Milik sendiri', 'Sewa', 'Bagi hasil', OTHER] }] },
        {
          no: 16,
          q: 'Berapa luas lahan menurut statusnya?',
          f: [
            { k: 'milik', label: 'Milik sendiri', type: 'num', unit: 'are' },
            { k: 'sewa', label: 'Sewa', type: 'num', unit: 'are' },
            { k: 'bagi', label: 'Bagi hasil', type: 'num', unit: 'are' },
            { k: 'lain', label: 'Lainnya', type: 'num', unit: 'are' },
          ],
        },
        { no: 17, q: 'Jika bagi hasil, berapa bagian untuk pemilik lahan?', f: [{ type: 'num', unit: '% dari hasil panen' }] },
        {
          no: 18,
          q: 'Lahan ada di mana, dan berapa jauh dari rumah?',
          f: [
            { k: 'lokasi', label: 'Lokasi', type: 'text' },
            { k: 'jarak', label: 'Jarak', type: 'num', unit: 'km' },
          ],
        },
        { no: 19, q: 'Lahan termasuk jenis apa?', f: [{ type: 'check', opts: ['Sawah', 'Tegalan/ladang', 'Kebun', 'Pekarangan', OTHER] }] },
        { no: 20, q: 'Lahan terdiri dari berapa petak/bidang?', f: [{ type: 'num', unit: 'petak' }] },
        { no: 21, q: 'Bentuk permukaan lahan?', f: [{ type: 'radio', opts: ['Datar', 'Miring/berteras', 'Curam', OTHER] }] },
        { no: 22, q: 'Bagaimana kesuburan tanah menurut Bapak/Ibu?', f: [{ type: 'radio', opts: ['Subur', 'Sedang', 'Kurang subur', 'Tidak tahu'] }] },
        { no: 23, q: 'Air untuk tanaman berasal dari mana?', f: [{ type: 'check', opts: ['Subak/irigasi', 'Hujan', 'Sumur/pompa', OTHER] }] },
        { no: 24, q: 'Apakah air cukup selama masa tanam?', f: [{ type: 'radio', opts: ['Cukup', 'Kadang kurang', 'Sering kurang'] }] },
      ],
    },
    {
      id: 'C',
      title: 'Komoditas dan Cara Budidaya',
      items: [
        { no: 25, q: 'Tanaman apa yang ditanam? (tulis nama tanamannya)', f: [{ type: 'text' }] },
        { no: 26, q: 'Varietas/jenis apa yang ditanam? (tulis nama bibit/benihnya)', f: [{ type: 'text' }] },
        {
          no: 27,
          q: 'Tanaman ini termasuk jenis apa?',
          f: [{ type: 'radio', opts: ['Musiman (sekali panen, mis. padi, sayur, cabai)', 'Tahunan (mis. kopi, jeruk, manggis)', OTHER] }],
        },
        { no: 28, q: 'Berapa luas lahan untuk tanaman ini?', f: [{ type: 'num', unit: 'are' }] },
        { no: 29, q: 'Bagaimana cara tanamnya?', f: [{ type: 'radio', opts: ['Satu jenis tanaman saja', OPT('Dicampur dengan tanaman lain', { input: 'text', ask: 'yaitu' })] }] },
        { no: 30, q: 'Berapa kali tanam dalam satu tahun?', f: [{ type: 'num', unit: 'kali' }] },
        { no: 31, q: 'Sebelum ini, lahan ditanami apa?', f: [{ type: 'text' }] },
        {
          no: 32,
          q: 'Kapan mulai tanam dan kapan panen terakhir?',
          f: [
            { k: 'tanam', label: 'Tanam', type: 'text', ph: 'mis. Maret 2026' },
            { k: 'panen', label: 'Panen', type: 'text', ph: 'mis. Juli 2026' },
          ],
        },
        {
          no: 33,
          q: 'Khusus tanaman tahunan: berapa jumlah pohon dan umurnya?',
          f: [
            { k: 'pohon', label: 'Jumlah pohon', type: 'num', unit: 'pohon' },
            { k: 'umur', label: 'Umur', type: 'num', unit: 'tahun' },
          ],
        },
        { no: 34, q: 'Khusus tanaman tahunan: berapa pohon yang sudah berbuah?', f: [{ type: 'num', unit: 'pohon' }] },
        {
          no: 35,
          q: 'Berapa jarak tanam, dan berapa jumlah tanaman/rumpun?',
          f: [
            { k: 'jarak1', label: 'Jarak antar tanaman', type: 'num', unit: 'cm' },
            { k: 'jarak2', label: 'Jarak antar baris', type: 'num', unit: 'cm' },
            { k: 'jumlah', label: 'Jumlah tanaman/rumpun', type: 'num' },
          ],
        },
        { no: 36, q: 'Bibit/benih didapat dari mana?', f: [{ type: 'check', opts: ['Beli di toko pertanian', 'Penangkar/petani lain', 'Buat/simpan sendiri', 'Bantuan', OTHER] }] },
        { no: 37, q: 'Apakah bibit/benih bersertifikat (ada labelnya)?', f: [{ type: 'radio', opts: ['Ya', 'Tidak', 'Tidak tahu'] }] },
        { no: 38, q: 'Bagaimana cara mengolah lahan sebelum tanam?', f: [{ type: 'check', opts: ['Dicangkul', 'Traktor/mesin', 'Dibajak sapi', 'Tanpa diolah', OTHER] }] },
        {
          no: 39,
          q: 'Bagaimana cara memupuk, dan berapa kali dipupuk dalam satu musim?',
          f: [
            { k: 'cara', label: 'Cara memupuk', type: 'check', opts: ['Ditabur', 'Dikocor/disiram', 'Dibenamkan', 'Disemprot daun', OTHER] },
            { k: 'kali', label: 'Dipupuk', type: 'num', unit: 'kali' },
          ],
        },
        { no: 40, q: 'Apakah memakai pupuk bersubsidi?', f: [{ type: 'radio', opts: ['Ya', 'Tidak', 'Sebagian'] }] },
        { no: 41, q: 'Pupuk dibeli di mana?', f: [{ type: 'check', opts: ['Kios/toko tani', 'Kelompok tani/koperasi', 'Buat sendiri', OTHER] }] },
        {
          no: 42,
          q: 'Hama/penyakit apa yang menyerang tanaman, dan seberapa berat?',
          f: [
            { k: 'nama', label: 'Nama hama/penyakit', type: 'text' },
            { k: 'berat', label: 'Tingkat serangan', type: 'radio', opts: ['Tidak ada', 'Ringan', 'Sedang', 'Berat'] },
          ],
        },
        {
          no: 43,
          q: 'Bagaimana cara mengatasi hama/penyakit?',
          f: [
            { k: 'cara', label: 'Cara mengatasi', type: 'check', opts: ['Obat kimia', 'Obat alami/nabati', 'Diambil/dicabut manual', 'Dibiarkan', OTHER] },
            { k: 'kali', label: 'Disemprot', type: 'num', unit: 'kali per musim' },
          ],
        },
        {
          no: 44,
          q: 'Bagaimana cara membersihkan rumput/gulma?',
          f: [
            { k: 'cara', label: 'Cara membersihkan', type: 'check', opts: ['Dicabut/dibabat', 'Obat rumput', 'Mesin potong rumput', OTHER] },
            { k: 'kali', label: 'Frekuensi', type: 'num', unit: 'kali per musim' },
          ],
        },
        {
          no: 45,
          q: 'Khusus tanaman tahunan: apakah tanaman dipangkas atau disulam (diganti yang mati)?',
          f: [{ type: 'radio', opts: [OPT('Ya', { input: 'num', unit: 'kali per tahun' }), 'Tidak'] }],
        },
      ],
    },
    {
      id: 'D',
      title: 'Tenaga Kerja',
      items: [
        {
          no: 46,
          q: 'Pekerjaan apa saja yang dikerjakan, oleh berapa orang, dan berapa hari?',
          sheet: '46 Tenaga Kerja',
          table: {
            rowHead: 'Pekerjaan',
            cols: [
              { h: 'Keluarga: orang', t: 'num' },
              { h: 'Keluarga: hari', t: 'num' },
              { h: 'Dibayar: orang', t: 'num' },
              { h: 'Dibayar: hari', t: 'num' },
              { h: 'Upah (Rp per hari)', t: 'num' },
              { h: 'Jam kerja per hari', t: 'num' },
            ],
            rows: ['Menyiapkan lahan', 'Menanam', 'Merawat (menyiang, pupuk, semprot)', 'Mengairi/menyiram', 'Memanen', 'Setelah panen (sortir, kemas)'],
            other: true,
          },
        },
        { no: 47, q: 'Apakah ada pekerja yang dibayar upah?', f: [{ type: 'radio', opts: ['Ya', 'Tidak'] }] },
        { no: 48, q: 'Upah dibayar dengan cara apa?', f: [{ type: 'check', opts: ['Harian', 'Borongan', 'Bagi hasil/bawon', 'Saling bantu/gotong royong', OTHER] }] },
        {
          no: 49,
          q: 'Dari pekerja yang dibayar, berapa laki-laki dan perempuan, dan berapa upahnya per hari?',
          f: [
            { k: 'l_orang', label: 'Laki-laki', type: 'num', unit: 'orang' },
            { k: 'l_upah', label: 'Upah laki-laki per hari', type: 'num', prefix: 'Rp' },
            { k: 'p_orang', label: 'Perempuan', type: 'num', unit: 'orang' },
            { k: 'p_upah', label: 'Upah perempuan per hari', type: 'num', prefix: 'Rp' },
          ],
        },
        {
          no: 50,
          q: 'Jika borongan atau bawon: berapa uang atau bagian hasil yang diberikan?',
          f: [
            { k: 'uang', label: 'Uang', type: 'num', prefix: 'Rp' },
            { k: 'persen', label: 'atau bagian hasil', type: 'num', unit: '% dari hasil' },
          ],
        },
      ],
    },
    {
      id: 'E',
      title: 'Modal Usaha',
      items: [
        { no: 51, q: 'Modal usaha berasal dari mana?', f: [{ type: 'radio', opts: ['Sendiri', OPT('Pinjaman', { input: 'text', ask: 'sebutkan' })] }] },
        { no: 52, q: 'Jika pinjam, pinjam dari mana?', f: [{ type: 'check', opts: ['Bank', 'Koperasi/LPD', 'KUR', 'Keluarga/teman', 'Pengumpul/tengkulak', 'Bantuan pemerintah', OTHER] }] },
        { no: 53, q: 'Berapa uang yang dikeluarkan untuk usahatani ini dalam satu musim?', f: [{ type: 'num', prefix: 'Rp' }] },
        {
          no: 54,
          q: 'Jika meminjam uang, berapa jumlah pinjaman dan berapa lama meminjam?',
          f: [
            { k: 'jumlah', label: 'Jumlah pinjaman', type: 'num', prefix: 'Rp' },
            { k: 'lama', label: 'Lama meminjam', type: 'num', unit: 'bulan' },
          ],
        },
        {
          no: 55,
          q: 'Jika meminjam uang, berapa bunganya?',
          f: [
            { k: 'bunga', label: 'Bunga', type: 'num', unit: '%' },
            { k: 'per', label: 'Per', type: 'radio', opts: ['bulan', 'tahun'] },
          ],
        },
        { no: 56, q: 'Apakah modal cukup untuk usahatani ini?', f: [{ type: 'radio', opts: ['Cukup', 'Kadang kurang', 'Sering kurang'] }] },
      ],
    },
    {
      id: 'F',
      title: 'Alat dan Biaya Tetap',
      items: [
        {
          no: 57,
          q: 'Alat apa saja yang dipakai?',
          sheet: '57 Alat',
          table: {
            rowHead: 'Nama alat',
            cols: [
              { h: 'Jumlah', t: 'num' },
              { h: 'Harga beli (Rp)', t: 'num' },
              { h: 'Tahun beli', t: 'num' },
              { h: 'Tahan berapa tahun', t: 'num' },
              { h: 'Milik sendiri / Sewa', t: 'select', opts: ['Milik sendiri', 'Sewa'] },
              { h: 'Biaya sewa atau perawatan (Rp)', t: 'num' },
            ],
            rows: [
              'Cangkul',
              'Sabit/parang',
              'Gunting pangkas/galah petik',
              'Alat semprot (tangki punggung)',
              'Pompa air/mesin',
              'Mesin potong rumput',
              'Traktor/mesin bajak',
              'Motor/pikap/gerobak angkut',
              'Keranjang/ember/karung',
              'Selang/pipa/paralon',
            ],
            other: true,
          },
        },
        { no: 58, q: 'Berapa pajak lahan atau sewa lahan?', f: [{ type: 'num', prefix: 'Rp' }] },
        { no: 59, q: 'Berapa iuran subak/kelompok tani?', f: [{ type: 'num', prefix: 'Rp' }] },
        { no: 60, q: 'Berapa iuran lain (banjar, desa adat, pengelola desa wisata)?', f: [{ type: 'num', prefix: 'Rp' }] },
      ],
    },
    {
      id: 'G',
      title: 'Biaya Variabel',
      items: [
        {
          no: 61,
          q: 'Apa saja yang dibeli untuk usahatani ini?',
          sheet: '61 Biaya Variabel',
          table: {
            rowHead: 'Jenis',
            cols: [
              { h: 'Nama/merek', t: 'text' },
              { h: 'Jumlah', t: 'num' },
              { h: 'Satuan', t: 'text' },
              { h: 'Harga per satuan (Rp)', t: 'num', money: true },
              { h: 'Total (Rp)', t: 'num', money: true, auto: [1, 3], sum: true },
              { h: 'Asal (beli/ sendiri/ bantuan)', t: 'select', opts: ['Beli', 'Sendiri', 'Bantuan'] },
            ],
            rows: [
              'Bibit/benih',
              'Pupuk kandang',
              'Pupuk kompos buatan sendiri',
              'Pupuk Urea',
              'Pupuk ZA',
              'Pupuk SP-36/TSP',
              'Pupuk NPK/Phonska',
              'Pupuk KCl',
              'Pupuk cair/organik',
              'Obat hama/penyakit kimia',
              'Obat hama/penyakit alami/nabati',
              'Obat rumput',
              'Kapur/dolomit',
            ],
            other: true,
          },
        },
        {
          no: 62,
          q: 'Berapa biaya lain-lain?',
          sheet: '62 Biaya Lain-lain',
          table: {
            rowHead: 'Jenis biaya',
            narrow: true,
            cols: [{ h: 'Jumlah (Rp)', t: 'num', money: true, sum: true }],
            rows: ['Air/listrik', 'Bahan bakar', 'Plastik, tali, ajir', 'Mulsa/penutup tanah', 'Kemasan', 'Pengangkutan hasil', 'Perbaikan alat'],
            other: true,
          },
        },
      ],
    },
    {
      id: 'H',
      title: 'Hasil, Penerimaan, dan Pemasaran',
      items: [
        {
          no: 63,
          q: 'Berapa hasil panen dan harga jualnya?',
          sheet: '63 Hasil Panen',
          table: {
            rowHead: 'Jenis hasil',
            cols: [
              { h: 'Jumlah panen', t: 'num' },
              { h: 'Satuan', t: 'text' },
              { h: 'Harga jual per satuan (Rp)', t: 'num', money: true },
              { h: 'Total (Rp)', t: 'num', money: true, auto: [0, 2], sum: true },
            ],
            rows: ['Hasil utama', 'Hasil sedang/kecil', 'Hasil sampingan'],
          },
        },
        { no: 64, q: 'Berapa kali panen dalam satu periode?', f: [{ type: 'num', unit: 'kali' }] },
        {
          no: 65,
          q: 'Berapa hasil yang dimakan sendiri atau rusak?',
          f: [
            { k: 'jumlah', label: 'Jumlah', type: 'num' },
            { k: 'satuan', label: 'Satuan', type: 'text', ph: 'mis. kg' },
          ],
        },
        {
          no: 66,
          q: 'Berapa hasil yang disimpan untuk bibit atau diberikan/dibagikan?',
          f: [
            { k: 'jumlah', label: 'Jumlah', type: 'num' },
            { k: 'satuan', label: 'Satuan', type: 'text', ph: 'mis. kg' },
          ],
        },
        { no: 67, q: 'Hasil dijual dalam bentuk apa?', f: [{ type: 'check', opts: ['Segar', 'Dikeringkan', 'Olahan', OTHER] }] },
        {
          no: 68,
          q: 'Hasil dijual kepada siapa?',
          f: [{ type: 'check', opts: ['Pengumpul', 'Tengkulak', 'Pasar', 'Hotel/restoran', 'Wisatawan', 'Koperasi/kelompok tani', 'Pedagang besar', 'Langsung ke pembeli', OTHER] }],
        },
        { no: 69, q: 'Hasil dijual dengan cara apa?', f: [{ type: 'check', opts: ['Per kg/satuan', 'Borongan/tebas', OTHER] }] },
        { no: 70, q: 'Pembayaran dari pembeli bagaimana?', f: [{ type: 'check', opts: ['Tunai', 'Dibayar belakangan', 'Dibayar di depan (ijon)', OTHER] }] },
        { no: 71, q: 'Siapa yang menentukan harga jual?', f: [{ type: 'radio', opts: ['Petani', 'Pembeli', 'Musyawarah', 'Harga pasar', OTHER] }] },
        {
          no: 72,
          q: 'Berapa harga jual tertinggi dan terendah dalam satu tahun?',
          f: [
            { k: 'max', label: 'Tertinggi', type: 'num', prefix: 'Rp' },
            { k: 'max_sat', label: 'per', type: 'text', ph: 'mis. kg' },
            { k: 'min', label: 'Terendah', type: 'num', prefix: 'Rp' },
            { k: 'min_sat', label: 'per', type: 'text', ph: 'mis. kg' },
          ],
        },
        { no: 73, q: 'Berapa jauh tempat jual dari kebun?', f: [{ type: 'num', unit: 'km' }] },
        { no: 74, q: 'Informasi harga didapat dari mana?', f: [{ type: 'check', opts: ['Sesama petani', 'Pengumpul', 'HP/internet', 'Penyuluh', OTHER] }] },
        {
          no: 75,
          q: 'Apakah ada penghasilan lain dari kebun ini (hasil sampingan, wisata petik)?',
          f: [{ type: 'radio', opts: ['Tidak', OPT('Ada', { input: 'num', prefix: 'Rp' })] }],
        },
      ],
    },
    {
      id: 'I',
      title: 'Pendapatan Keluarga',
      items: [
        { no: 76, q: 'Berapa perkiraan penghasilan keluarga per bulan dari usahatani ini?', f: [{ type: 'num', prefix: 'Rp' }] },
        { no: 77, q: 'Berapa perkiraan penghasilan keluarga per bulan dari luar usahatani?', f: [{ type: 'num', prefix: 'Rp' }] },
        { no: 78, q: 'Apakah hasil usahatani cukup untuk kebutuhan keluarga?', f: [{ type: 'radio', opts: ['Lebih dari cukup', 'Cukup', 'Kurang'] }] },
      ],
    },
    {
      id: 'J',
      title: 'Kelompok Tani dan Penyuluhan',
      items: [
        { no: 79, q: 'Seberapa sering kelompok tani/subak mengadakan pertemuan?', f: [{ type: 'radio', opts: ['Tiap minggu', 'Tiap bulan', 'Jarang', 'Tidak pernah', OTHER] }] },
        { no: 80, q: 'Seberapa sering bertemu penyuluh pertanian?', f: [{ type: 'radio', opts: ['Sering', 'Kadang-kadang', 'Tidak pernah'] }] },
        { no: 81, q: 'Apakah pernah ikut pelatihan dalam 3 tahun terakhir?', f: [{ type: 'radio', opts: [OPT('Pernah', { input: 'text', ask: 'tentang' }), 'Tidak'] }] },
        { no: 82, q: 'Bantuan apa yang pernah diterima?', f: [{ type: 'check', opts: ['Bibit', 'Pupuk', 'Alat', 'Uang/modal', NONE('Tidak pernah'), OTHER] }] },
        { no: 83, q: 'Informasi bertani didapat dari mana?', f: [{ type: 'check', opts: ['Sesama petani', 'Penyuluh', 'HP/internet/medsos', 'Kios tani', OTHER] }] },
      ],
    },
    {
      id: 'K',
      title: 'Keberlanjutan, Teknologi, dan Keselamatan Kerja',
      items: [
        { no: 84, q: 'Apakah memakai pupuk kandang/organik?', f: [{ type: 'radio', opts: ['Ya', 'Tidak'] }] },
        { no: 85, q: 'Apakah sisa panen dimanfaatkan (kompos, pakan ternak)?', f: [{ type: 'radio', opts: ['Ya', 'Tidak'] }] },
        { no: 86, q: 'Apakah memakai HP, aplikasi, atau alat modern dalam bertani?', f: [{ type: 'radio', opts: [OPT('Ya', { input: 'text', ask: 'yaitu' }), 'Tidak'] }] },
        { no: 87, q: 'Apa yang dipakai saat menyemprot?', f: [{ type: 'check', opts: ['Masker', 'Sarung tangan', 'Baju lengan panjang', 'Sepatu bot', NONE('Tidak memakai apa-apa'), OTHER] }] },
        { no: 88, q: 'Wadah/sisa obat semprot dibuang ke mana?', f: [{ type: 'check', opts: ['Dikumpulkan/dikubur', 'Dibuang di kebun/sungai', 'Dipakai lagi', OTHER] }] },
        { no: 89, q: 'Apakah ada keluhan setelah menyemprot?', f: [{ type: 'check', opts: [NONE('Tidak ada'), 'Pusing', 'Mual', 'Gatal', 'Mudah lelah', OTHER] }] },
      ],
    },
    {
      id: 'L',
      title: 'Kunjungan Wisatawan',
      items: [
        { no: 90, q: 'Apakah kebun sering dikunjungi wisatawan?', f: [{ type: 'radio', opts: ['Ya', 'Tidak'] }] },
        {
          no: 91,
          q: 'Apakah wisatawan menambah penghasilan?',
          f: [{ type: 'radio', opts: ['Tidak', OPT('Ya', { input: 'num', ask: 'sekitar', prefix: 'Rp', unit: 'per bulan' })] }],
        },
      ],
    },
    {
      id: 'M',
      title: 'Risiko, Kendala, dan Harapan',
      items: [
        { no: 92, q: 'Apakah pernah gagal panen dalam 3 tahun terakhir?', f: [{ type: 'radio', opts: ['Tidak', OPT('Pernah', { input: 'text', ask: 'penyebab' })] }] },
        {
          no: 93,
          q: 'Kejadian apa yang pernah dialami dalam 1 tahun terakhir?',
          f: [
            {
              type: 'check',
              opts: ['Hama/penyakit', 'Kekeringan', 'Banjir/hujan lebat', 'Harga jual turun', 'Pupuk mahal/langka', 'Upah naik', 'Modal kurang', 'Air sulit', 'Bibit sulit didapat', 'Sulit menjual', OTHER],
            },
          ],
        },
        { no: 94, q: 'Bagaimana cara Bapak/Ibu mengatasi kejadian itu?', f: [{ type: 'textarea' }] },
        { no: 95, q: 'Apa kendala terbesar dalam bertani?', f: [{ type: 'textarea' }] },
        { no: 96, q: 'Bantuan apa yang paling dibutuhkan?', f: [{ type: 'textarea' }] },
        { no: 97, q: 'Saran atau harapan Bapak/Ibu?', f: [{ type: 'textarea' }] },
      ],
    },
  ],

  note: { key: 'h_catatan', label: 'Catatan pewawancara', type: 'textarea' },
  closing: 'Terima kasih atas waktu dan jawaban Bapak/Ibu.',
};
