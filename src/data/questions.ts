import { Major, Question, ColorTest } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Apa yang paling membuatmu tertarik saat melihat sebuah produk baru?',
    options: [
      { text: 'Bagaimana mesin di dalamnya bekerja', weight: { [Major.TKR]: 3, [Major.PEMESINAN_KAPAL]: 2 } },
      { text: 'Tampilan visual, warna, dan desain kemasannya', weight: { [Major.DKV]: 5 } },
      { text: 'Kecepatan pengiriman dan cara barang sampai ke tanganmu', weight: { [Major.LOGISTIK]: 4 } },
      { text: 'Kekuatan bahan logam dan presisi buatannya', weight: { [Major.PEMESINAN_KAPAL]: 4, [Major.TKR]: 1 } }
    ]
  },
  {
    id: 'q2',
    text: 'Di waktu luang, kamu lebih suka melakukan...',
    options: [
      { text: 'Menggambar, mengedit video, atau fotografi', weight: { [Major.DKV]: 5 } },
      { text: 'Membongkar pasang mainan atau memperbaiki barang rusak', weight: { [Major.TKR]: 4, [Major.PEMESINAN_KAPAL]: 3 } },
      { text: 'Menyusun barang agar rapi dan efisien', weight: { [Major.LOGISTIK]: 5 } },
      { text: 'Mempelajari cara kerja kapal atau mesin besar', weight: { [Major.PEMESINAN_KAPAL]: 5 } }
    ]
  },
  {
    id: 'q3',
    text: 'Jika ada masalah teknis pada sepeda motor, apa reaksimu?',
    options: [
      { text: 'Mencoba mencari tahu bagian mesin yang bermasalah', weight: { [Major.TKR]: 5 } },
      { text: 'Melihat apakah ada kerusakan fisik pada body-nya', weight: { [Major.DKV]: 1, [Major.TKR]: 2 } },
      { text: 'Memikirkan cara membawa motor tersebut ke bengkel dengan aman', weight: { [Major.LOGISTIK]: 3 } },
      { text: 'Tertarik melihat komponen logam yang aus', weight: { [Major.PEMESINAN_KAPAL]: 3 } }
    ]
  },
  {
    id: 'q4',
    text: 'Bagaimana kamu mengatur barang-barang di kamarmu?',
    options: [
      { text: 'Sangat rapi, dikelompokkan berdasarkan jenis dan ukuran', weight: { [Major.LOGISTIK]: 5 } },
      { text: 'Penuh dengan poster, gambar, dan elemen estetik', weight: { [Major.DKV]: 4 } },
      { text: 'Banyak peralatan teknik atau suku cadang', weight: { [Major.TKR]: 4, [Major.PEMESINAN_KAPAL]: 4 } },
      { text: 'Biasa saja, yang penting fungsional', weight: { [Major.LOGISTIK]: 2 } }
    ]
  },
  {
    id: 'q5',
    text: 'Pelajaran sekolah mana yang paling kamu sukai?',
    options: [
      { text: 'Seni Budaya atau TIK', weight: { [Major.DKV]: 5 } },
      { text: 'Fisika atau Matematika Terapan', weight: { [Major.PEMESINAN_KAPAL]: 4, [Major.TKR]: 3, [Major.LOGISTIK]: 2 } },
      { text: 'Ekonomi atau Manajemen', weight: { [Major.LOGISTIK]: 5 } },
      { text: 'Olahraga (kegiatan fisik)', weight: { [Major.PEMESINAN_KAPAL]: 3, [Major.TKR]: 3 } }
    ]
  }
];

export const INTEREST_QUESTIONS: Question[] = [
  {
    id: 'i1',
    text: 'Seberapa tertarik kamu bekerja di lingkungan industri/pabrik?',
    options: [
      { text: 'Sangat Tertarik', weight: { [Major.PEMESINAN_KAPAL]: 3, [Major.TKR]: 2, [Major.LOGISTIK]: 2 } },
      { text: 'Tertarik', weight: { [Major.PEMESINAN_KAPAL]: 1 } },
      { text: 'Biasa Saja', weight: {} }
    ]
  },
  {
    id: 'i2',
    text: 'Seberapa suka kamu bekerja di depan komputer untuk membuat karya?',
    options: [
      { text: 'Sangat Suka', weight: { [Major.DKV]: 4, [Major.LOGISTIK]: 1 } },
      { text: 'Suka', weight: { [Major.DKV]: 2 } },
      { text: 'Tidak Suka', weight: { [Major.PEMESINAN_KAPAL]: 2, [Major.TKR]: 2 } }
    ]
  }
];

export const COLOR_TESTS: ColorTest[] = [
  { id: 'c1', image: 'plate_12', answer: '12' },
  { id: 'c2', image: 'plate_8', answer: '8' },
  { id: 'c3', image: 'plate_6', answer: '6' },
  { id: 'c4', image: 'plate_29', answer: '29' },
  { id: 'c5', image: 'plate_74', answer: '74' }
];
