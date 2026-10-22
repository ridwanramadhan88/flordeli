// Daftar menu FLOR DELI. Ubah file ini saja untuk menambah / mengganti menu.
// - image: path gambar, mis. "/assets/menu/nasi-goreng.jpg". Kosongkan ("") untuk memakai gambar ilustrasi bawaan.
// - price: angka dalam Rupiah (tanpa titik). Kosongkan (0) untuk menyembunyikan harga.
// - sample: true = data contoh. HAPUS baris-baris sample sebelum dipublikasikan.
window.FLOR_MENU = [
  {
    id: 'makanan',
    title: 'Makanan',
    items: [
      { name: 'Contoh Makanan 1', desc: 'Deskripsi singkat menu.', price: 25000, image: '', sample: true },
      { name: 'Contoh Makanan 2', desc: 'Deskripsi singkat menu.', price: 32000, image: '', sample: true }
    ]
  },
  {
    id: 'minuman',
    title: 'Minuman',
    items: [
      { name: 'Contoh Minuman 1', desc: 'Deskripsi singkat menu.', price: 18000, image: '', sample: true }
    ]
  },
  {
    id: 'dessert',
    title: 'Dessert',
    items: [
      { name: 'Contoh Dessert 1', desc: 'Deskripsi singkat menu.', price: 22000, image: '', sample: true }
    ]
  }
];
