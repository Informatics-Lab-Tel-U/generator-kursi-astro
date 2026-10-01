export interface Student {
  id: string;
  name: string;
  kelas: string;
  asprak: string;
}

export const MATKUL_OPTIONS = [
  { value: 'ALPRO2', label: 'Algoritma & Pemrograman 2' },
  { value: 'SISDIG', label: 'Sistem Digital' },
  { value: 'JARKOM', label: 'Jaringan Komputer' },
];

export const KELAS_MAP: Record<string, { value: string; label: string }[]> = {
  ALPRO2: [
    { value: 'IF-GABREM', label: 'IF-GABREM' },
    { value: 'IF-43-01', label: 'IF-43-01' },
    { value: 'IF-43-02', label: 'IF-43-02' },
  ],
  SISDIG: [
    { value: 'DS-49-01', label: 'DS-49-01' },
    { value: 'DS-49-02', label: 'DS-49-02' },
  ],
  JARKOM: [
    { value: 'TK-44-01', label: 'TK-44-01' },
    { value: 'TK-44-02', label: 'TK-44-02' },
  ],
};

export const STUDENTS: Student[] = [
  
  
  
  { id: 'g01', name: 'ADAM MUHAMMAD ROBBANI', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g02', name: 'RAHMAT FARHAN', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g03', name: 'RAFA ANDHARA RIZQI', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g04', name: 'MUHAMMAD LEUNTAYON GUNAWAN', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g05', name: 'A. NAJWA SABRINA NUSAWAN', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g06', name: 'RAVADANDI OUDENY PUNCA', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g07', name: 'DENY PRATAMA SUKARDI', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g08', name: 'SATRIA HAMIZAN YODHANI', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g09', name: 'PUTRI SACHARINA', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g10', name: 'BERTO JDOYVAN PURBA', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g11', name: 'HANA PRAMUDITA BUDIARJO', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g12', name: 'FAQIH AHMAD NABIYL RIFAI', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g13', name: 'FARIEZA SAVA AURELIA', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g14', name: 'NURUL AULIA ZAINAL', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g15', name: 'MUHAMMAD IRVAN NURCHASAN', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g16', name: 'MARSHA DEVIANA WIDODO', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g17', name: 'FATHIYA ALYA RUASNADITA', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g18', name: 'RAFAEL ONKEI WIJAYANTO', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g19', name: 'ASTI ROSIANA PUTRI', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g20', name: 'FRIDIO HUTABARAT', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g21', name: 'FAIRUZ AKMAL', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g22', name: 'ALFARIZI ZALVIAN', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g23', name: 'FADZLAN MASYIAN', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g24', name: 'MUHAMMAD ILHAM HABIBI', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g25', name: 'MARCO SYAHIN MAULANA MAFAU', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g26', name: 'NAUFAL FATHIN PRABOWO', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g27', name: 'ALFREDO LIONEL NOVARIANTO', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g28', name: 'KADEK ADIKANANDA ESAPUTRA', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g29', name: 'DHIAFAH SYASYA FRISTI RAMADHANI', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g30', name: 'ISNA SABRINA IFTINAN', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g31', name: 'FAYZA MUTIARA HANUN', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g32', name: 'ABDUL KHALIK ESA PERKASA', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g33', name: 'DAFFA WISHNUHIMARU', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g34', name: 'TAZKY HAFIDZAN', kelas: 'IF-GABREM', asprak: 'MNH' },
  { id: 'g35', name: 'NI PUTU GITALI HRDAYANI RAJAN', kelas: 'IF-GABREM', asprak: 'AFF' },
  { id: 'g36', name: 'SALMA NAIL FAUZIYYAH', kelas: 'IF-GABREM', asprak: 'MNH' },

  
  
  
  { id: 'a01', name: 'ARKAN FADILLAH ZUBAIDI', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a02', name: 'GALIH PRATAMA PUTRA', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a03', name: 'NAILA ZAHRA KAMILA', kelas: 'IF-43-01', asprak: 'NAH' },
  { id: 'a04', name: 'RIZKY ADITYA HERMAWAN', kelas: 'IF-43-01', asprak: 'NAH' },
  { id: 'a05', name: 'SITI NURHALIZA PUTRI', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a06', name: 'BAYU SEGARA WICAKSONO', kelas: 'IF-43-01', asprak: 'RHF' },
  { id: 'a07', name: 'ANISA RAHMA DEWI', kelas: 'IF-43-01', asprak: 'RHF' },
  { id: 'a08', name: 'DIMAS ARYA NUGRAHA', kelas: 'IF-43-01', asprak: 'NAH' },
  { id: 'a09', name: 'KEISHA AMELIA SARI', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a10', name: 'FARREL ATHAILLAH PUTRA', kelas: 'IF-43-01', asprak: 'RHF' },
  { id: 'a11', name: 'ZAHRA AULIA RAHMADANI', kelas: 'IF-43-01', asprak: 'NAH' },
  { id: 'a12', name: 'HAFIZ MUHAMMAD RASYID', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a13', name: 'ALYSSA KHAIRUNNISA', kelas: 'IF-43-01', asprak: 'RHF' },
  { id: 'a14', name: 'RANGGA DWIPRATAMA', kelas: 'IF-43-01', asprak: 'NAH' },
  { id: 'a15', name: 'NAZWA PUTRI AZZAHRA', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a16', name: 'ILHAM BAGASKARA SAPUTRA', kelas: 'IF-43-01', asprak: 'RHF' },
  { id: 'a17', name: 'SYIFA AMIRA RAMADHANI', kelas: 'IF-43-01', asprak: 'NAH' },
  { id: 'a18', name: 'AQIL FAUZAN HAKIM', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a19', name: 'CANTIKA MAHARANI PUTRI', kelas: 'IF-43-01', asprak: 'RHF' },
  { id: 'a20', name: 'RAFFI AHMAD HIDAYAT', kelas: 'IF-43-01', asprak: 'NAH' },
  { id: 'a21', name: 'DINDA PERMATA SARI', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a22', name: 'NABIL FIKRI ABDURRAHMAN', kelas: 'IF-43-01', asprak: 'RHF' },
  { id: 'a23', name: 'LUTHFIA AZZAHRA PUTRI', kelas: 'IF-43-01', asprak: 'NAH' },
  { id: 'a24', name: 'REYHAN DZAKI PRATAMA', kelas: 'IF-43-01', asprak: 'SRP' },
  { id: 'a25', name: 'AURELIA JASMINE HARTONO', kelas: 'IF-43-01', asprak: 'RHF' },

  
  
  
  { id: 'b01', name: 'AHMAD ZULFIKAR RAMADHAN', kelas: 'IF-43-02', asprak: 'APY' },
  { id: 'b02', name: 'TASYA NABILA HERMAWAN', kelas: 'IF-43-02', asprak: 'APY' },
  { id: 'b03', name: 'FAREL GIBRAN PUTRA', kelas: 'IF-43-02', asprak: 'AAG' },
  { id: 'b04', name: 'SHAFIRA AULIA RAHMAN', kelas: 'IF-43-02', asprak: 'AAG' },
  { id: 'b05', name: 'KEMAL ATTAR FIRDAUS', kelas: 'IF-43-02', asprak: 'MRA' },
  { id: 'b06', name: 'ALYA PUTRI MAHARANI', kelas: 'IF-43-02', asprak: 'MRA' },
  { id: 'b07', name: 'DANISH RAYHAAN WIBOWO', kelas: 'IF-43-02', asprak: 'APY' },
  { id: 'b08', name: 'NADIA SAFITRI KUSUMO', kelas: 'IF-43-02', asprak: 'AAG' },
  { id: 'b09', name: 'RADITYA PUTRA NUGRAHA', kelas: 'IF-43-02', asprak: 'MRA' },
  { id: 'b10', name: 'CHELSEA AMANDA PUTRI', kelas: 'IF-43-02', asprak: 'APY' },
  { id: 'b11', name: 'SULTAN MALIK IBRAHIM', kelas: 'IF-43-02', asprak: 'AAG' },
  { id: 'b12', name: 'FARAH DIBA ANGGRAINI', kelas: 'IF-43-02', asprak: 'MRA' },
  { id: 'b13', name: 'GIBRAN RAFAEL KUSUMA', kelas: 'IF-43-02', asprak: 'APY' },
  { id: 'b14', name: 'SAFINA KHAIRIYAH AZZAHRA', kelas: 'IF-43-02', asprak: 'AAG' },
  { id: 'b15', name: 'ATTALA RASHIF HARAHAP', kelas: 'IF-43-02', asprak: 'MRA' },
  { id: 'b16', name: 'KAYLA AZZURA PERMATA', kelas: 'IF-43-02', asprak: 'APY' },
  { id: 'b17', name: 'ZAFRAN MAULANA AKBAR', kelas: 'IF-43-02', asprak: 'AAG' },
  { id: 'b18', name: 'ADELIA PUTRI RAHMAWATI', kelas: 'IF-43-02', asprak: 'MRA' },
  { id: 'b19', name: 'RAYHAN ATHALLA PRATAMA', kelas: 'IF-43-02', asprak: 'APY' },
  { id: 'b20', name: 'NABILA CITRA DEWANTI', kelas: 'IF-43-02', asprak: 'AAG' },

  
  
  
  { id: 'd01', name: 'BINTANG ARIO WICAKSONO', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd02', name: 'MAHARANI INDAH PERTIWI', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd03', name: 'YUSUF HABIBI ISKANDAR', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd04', name: 'AZZAHRA FEBRIANI UTAMI', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd05', name: 'FATHAN MUBARAK SAPUTRA', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd06', name: 'SALWA NURAINI HIDAYAT', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd07', name: 'KENZO ADITYA WARDHANA', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd08', name: 'INTAN PERMATA HATI', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd09', name: 'ARJUNA SAKTI MAHENDRA', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd10', name: 'RAHMANIA AZZAHRA PUTRI', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd11', name: 'ERLANGGA PUTRA UTAMA', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd12', name: 'KAMILA AZZAHRA SALSABILA', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd13', name: 'VARIAN PUTRA SETIAWAN', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd14', name: 'AISYAH RAMADHANI LUBIS', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd15', name: 'NAUFAL AZIZI PRATAMA', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd16', name: 'TIARA ANDINI MAHARANI', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd17', name: 'ALFAROS BINTANG SAPUTRA', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd18', name: 'JENIFER ANGGRAINI PUTRI', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd19', name: 'DAFFA ALGHIFARI RAMADHAN', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd20', name: 'PUTRI AMELIA HANDAYANI', kelas: 'DS-49-01', asprak: 'FRZ' },
  { id: 'd21', name: 'RAYENDRA PUTRA MAHARDIKA', kelas: 'DS-49-01', asprak: 'DWP' },
  { id: 'd22', name: 'SARAH NABILA KARTIKA', kelas: 'DS-49-01', asprak: 'FRZ' },

  
  
  
  { id: 'e01', name: 'FADHLAN RIZKY MAULANA', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e02', name: 'ALMA SAFIRA WULANDARI', kelas: 'DS-49-02', asprak: 'FRZ' },
  { id: 'e03', name: 'JIHAN FATIMAH ZAHRA', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e04', name: 'REVAN ALDIANSYAH', kelas: 'DS-49-02', asprak: 'FRZ' },
  { id: 'e05', name: 'KEYSHA AMIRA BALQIS', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e06', name: 'ALTHAF IBRAHIM PUTRA', kelas: 'DS-49-02', asprak: 'FRZ' },
  { id: 'e07', name: 'MEYSHA AULIA ANINDYA', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e08', name: 'SULTAN RIFQI FATHURRAHMAN', kelas: 'DS-49-02', asprak: 'FRZ' },
  { id: 'e09', name: 'AZZURA NADHIFA PUTRI', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e10', name: 'DAVIN HAKIM PRATAMA', kelas: 'DS-49-02', asprak: 'FRZ' },
  { id: 'e11', name: 'RAISA MAHARANI WIJAYA', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e12', name: 'ATHALLAH PUTRA DHARMA', kelas: 'DS-49-02', asprak: 'FRZ' },
  { id: 'e13', name: 'KIARA ANINDITA PERMATA', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e14', name: 'DZAKY FAUZAN HIDAYAT', kelas: 'DS-49-02', asprak: 'FRZ' },
  { id: 'e15', name: 'NATASYA AMANDA SETIAWAN', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e16', name: 'RESKY BAYU PAMUNGKAS', kelas: 'DS-49-02', asprak: 'FRZ' },
  { id: 'e17', name: 'AULIA RAHMA SALSABILA', kelas: 'DS-49-02', asprak: 'DWP' },
  { id: 'e18', name: 'FARHAN RIZALDI AKBAR', kelas: 'DS-49-02', asprak: 'FRZ' },

  
  
  
  { id: 'j01', name: 'ANANDA PUTRA FIRMANSYAH', kelas: 'TK-44-01', asprak: 'HND' },
  { id: 'j02', name: 'BERLIANA OKTAVIANI PUTRI', kelas: 'TK-44-01', asprak: 'HND' },
  { id: 'j03', name: 'CHANDRA WIJAYA KUSUMA', kelas: 'TK-44-01', asprak: 'BYU' },
  { id: 'j04', name: 'DEVITA AULIA RAHMADANI', kelas: 'TK-44-01', asprak: 'BYU' },
  { id: 'j05', name: 'ELANG SAPUTRA MAHARDIKA', kelas: 'TK-44-01', asprak: 'HND' },
  { id: 'j06', name: 'FIRDA NAILA AZZAHRA', kelas: 'TK-44-01', asprak: 'BYU' },
  { id: 'j07', name: 'GHANI FATHURRAHMAN', kelas: 'TK-44-01', asprak: 'HND' },
  { id: 'j08', name: 'HASNA MAULIDA PUTRI', kelas: 'TK-44-01', asprak: 'BYU' },
  { id: 'j09', name: 'IRFAN HAKIM NUGROHO', kelas: 'TK-44-01', asprak: 'HND' },
  { id: 'j10', name: 'JASMINE AULIA PERMATA', kelas: 'TK-44-01', asprak: 'BYU' },
  { id: 'j11', name: 'KEVIN ALEXANDER PUTRA', kelas: 'TK-44-01', asprak: 'HND' },
  { id: 'j12', name: 'LARASATI DEWI ANGGRAINI', kelas: 'TK-44-01', asprak: 'BYU' },
  { id: 'j13', name: 'MALIK IBRAHIM HARAHAP', kelas: 'TK-44-01', asprak: 'HND' },
  { id: 'j14', name: 'NADIA KHAIRUNNISA PUTRI', kelas: 'TK-44-01', asprak: 'BYU' },
  { id: 'j15', name: 'OSCAR PRADITYA RAMADHAN', kelas: 'TK-44-01', asprak: 'HND' },
  { id: 'j16', name: 'PRISCILLA AMANDA WIJAYA', kelas: 'TK-44-01', asprak: 'BYU' },

  
  
  
  { id: 'k01', name: 'QIANDRA HAIKAL PRATAMA', kelas: 'TK-44-02', asprak: 'HND' },
  { id: 'k02', name: 'RACHMANIA AULIA SAFITRI', kelas: 'TK-44-02', asprak: 'BYU' },
  { id: 'k03', name: 'SATRIA BIMA NUGRAHA', kelas: 'TK-44-02', asprak: 'HND' },
  { id: 'k04', name: 'THALITA ZAHRA AZZAHRA', kelas: 'TK-44-02', asprak: 'BYU' },
  { id: 'k05', name: 'ULRICH FERNANDO SIAHAAN', kelas: 'TK-44-02', asprak: 'HND' },
  { id: 'k06', name: 'VALENCIA PUTRI ASMARA', kelas: 'TK-44-02', asprak: 'BYU' },
  { id: 'k07', name: 'WAHYU HIDAYAT PRATAMA', kelas: 'TK-44-02', asprak: 'HND' },
  { id: 'k08', name: 'XENA MAHARANI LESTARI', kelas: 'TK-44-02', asprak: 'BYU' },
  { id: 'k09', name: 'YUDHISTIRA ARYA WIBOWO', kelas: 'TK-44-02', asprak: 'HND' },
  { id: 'k10', name: 'ZAHRA SAFIRA KAMILA', kelas: 'TK-44-02', asprak: 'BYU' },
  { id: 'k11', name: 'ABIMANYU PUTRA WIJAYA', kelas: 'TK-44-02', asprak: 'HND' },
  { id: 'k12', name: 'BUNGA CITRA ANINDYA', kelas: 'TK-44-02', asprak: 'BYU' },
  { id: 'k13', name: 'CALISTA AZZAHRA MAHARANI', kelas: 'TK-44-02', asprak: 'HND' },
  { id: 'k14', name: 'DARREN PUTRA SETIAWAN', kelas: 'TK-44-02', asprak: 'BYU' },
];
