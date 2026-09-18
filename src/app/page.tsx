'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Rocket, Star, Check, Users, Award, 
  GraduationCap, MapPin, KeyRound, Eye, EyeOff, 
  Lock, Phone, Copy, ShieldCheck, 
  X, ArrowRight, Loader2, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';

// 1. Data Tutor Unggulan (Hanya untuk Etalase Profil/Inspirasi Murid)
const TUTORS = [
  {
    id: '1',
    name: 'Kak Sarah Nabilah, S.Si',
    subject: 'Matematika Ceria, Logika & Calistung',
    campus: 'Universitas Indonesia (UI)',
    rating: '4.98',
    sessions: 142,
    badge: 'SUPER SABAR 💕',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    bio: 'Menjelaskan logika rumus dari akarnya lewat permainan edukatif tanpa hafalan buta, bikin matematika jadi pelajaran favorit si kecil.',
  },
  {
    id: '2',
    name: 'Kak Dimas Ramadhan',
    subject: 'IPA, Sains Eksperimen & Fisika Dasar',
    campus: 'Institut Teknologi Bandung (ITB)',
    rating: '4.95',
    sessions: 98,
    badge: 'FAVORIT SAINS 🧪',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Membawa alat peraga dan eksperimen seru ke rumah, melatih nalar kritis dan rasa ingin tahu anak terhadap sains.',
  },
  {
    id: '3',
    name: 'Kak Anindya Putri, M.Hum',
    subject: 'English Phonics, Storytelling & Vocab',
    campus: 'Universitas Gadjah Mada (UGM)',
    rating: '5.00',
    sessions: 186,
    badge: 'FUN ENGLISH 🇬🇧',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    bio: 'Metode pengajaran interaktif dengan flashcards dan roleplay menyenangkan, melatih keberanian anak berbicara bahasa Inggris.',
  },
  {
    id: '4',
    name: 'Kak Farhan Al-Ghifari',
    subject: 'Scratch Game Maker & Logika Robotik',
    campus: 'Universitas Indonesia (UI)',
    rating: '4.97',
    sessions: 85,
    badge: 'CREATIVE TECH 💻',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    bio: 'Mengasah kreativitas anak membuat game animasi sendiri dengan Scratch, melatih computational thinking sejak usia dini.',
  },
];

// 2. Data Paket Bimbingan Belajar
const PACKAGES = [
  {
    daysPerWeek: 1,
    id: 1,
    tier: 'STARTER',
    title: 'Petualang Pemula',
    desc: 'Cocok untuk adaptasi belajar santai & pendampingan PR harian.',
    sessions: '4 Sesi / Bulan',
    price: 180000,
    badge: 'Starter',
    features: [
      '1x Pertemuan Tatap Muka (90 Menit)',
      'Review PR Santai & Bimbingan Tugas',
      'Modul Dasar Ceria & Flashcard',
      'Laporan WhatsApp Tiap Sesi ke Bunda'
    ]
  },
  {
    daysPerWeek: 2,
    id: 2,
    tier: 'BINTANG KELAS',
    title: 'Bintang Kelas',
    desc: 'Paling ideal! Pemahaman konsep tuntas, nilai ujian auto naik drastis.',
    sessions: '8 Sesi / Bulan',
    price: 360000,
    badge: 'PALING FAVORIT BUNDA 💖',
    popular: true,
    features: [
      '2x Pertemuan Tatap Muka (90 Menit)',
      'Eksperimen Mini & Alat Peraga Edukatif',
      'Drill Soal Kuis Juara + Pembahasan',
      'Konsultasi PR 24 Jam via WhatsApp',
      'Gratis Tes Gaya Belajar Anak'
    ]
  },
  {
    daysPerWeek: 3,
    id: 3,
    tier: 'JUARA OLIMPIADE',
    title: 'Super Intensif',
    desc: 'Persiapan ranking paralel, lomba OSN Matematika/IPA & masuk SMP favorit.',
    sessions: '12 Sesi / Bulan',
    price: 520000,
    badge: 'JUARA OLIMPIADE 🏆',
    features: [
      '3x Pertemuan Tatap Muka (90 Menit)',
      'Target Khusus OSN & Ujian Kelulusan',
      'Bank Soal Lengkap HOTS Tingkat Tinggi',
      'Stiker Juara, Piagam & Hadiah Bulanan',
      'Sesi Konseling Belajar Bersama Psikolog'
    ]
  },
];

export default function HomePage() {
  const router = useRouter();

  // Role Tab Form Pendaftaran: 'murid' | 'tutor'
  const [roleTab, setRoleTab] = useState<'murid' | 'tutor'>('murid');

  // Pilihan Paket Murid
  const [selectedPkg, setSelectedPkg] = useState<typeof PACKAGES[0]>(PACKAGES[1]);

  // Input Form Registrasi Murid
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('Kelas 4 SD');
  const [parentPhone, setParentPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [studentAddress, setStudentAddress] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [copiedRek, setCopiedRek] = useState(false);

  // Input Form Registrasi Guru
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [tutorPassword, setTutorPassword] = useState('');
  const [showTutorPassword, setShowTutorPassword] = useState(false);
  const [tutorCampus, setTutorCampus] = useState('');
  const [tutorMajor, setTutorMajor] = useState('');
  const [tutorAchievements, setTutorAchievements] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Modal Login Terpadu (Murid, Guru, Kepsek)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalRole, setModalRole] = useState<'murid' | 'guru' | 'kepsek'>('murid');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [adminAuthType, setAdminAuthType] = useState<'credentials' | 'pin'>('credentials');
  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Salin No Rekening BCA
  const handleCopyBCA = () => {
    navigator.clipboard.writeText('827190284410');
    setCopiedRek(true);
    setTimeout(() => setCopiedRek(false), 2500);
  };

  // 1. Submit Registrasi Akun Murid (Tanpa Jadwal, Belum Di-ACC)
  const handleCheckoutStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingStudent) return;

    if (!studentName.trim() || !parentPhone.trim()) {
      return alert('Lengkapi nama siswa dan nomor WhatsApp orang tua!');
    }
    if (!studentPassword.trim() || studentPassword.length < 6) {
      return alert('Buat kata sandi akun minimal 6 karakter!');
    }
    if (!receiptFile) {
      return alert('Harap lampirkan foto struk/bukti transfer!');
    }

    setLoadingStudent(true);
    try {
      // Kompresi dan unggah struk transfer
      const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressed = await imageCompression(receiptFile, options);
      const ext = receiptFile.name.split('.').pop();
      const path = `receipts/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage.from('transfer-receipts').upload(path, compressed);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('transfer-receipts').getPublicUrl(path);

      // Simpan akun dengan status PENDING (Hari, Jam & Mentor diatur murid setelah di-ACC)
      const { error } = await supabase.from('registrations').insert([
        {
          student_name: studentName.trim(),
          phone_number: parentPhone.trim(),
          password: studentPassword.trim(),
          address: studentAddress.trim(),
          maps_url: `https://maps.google.com/?q=${encodeURIComponent(studentAddress.trim())}`,
          selected_package: selectedPkg.title,
          grade: studentGrade,
          transfer_receipt_url: urlData.publicUrl,
          is_approved: false,         // Kunci: Menunggu persetujuan
          status: 'pending',           // Kunci: Status pendaftaran
          has_scheduled: false         // Kunci: Belum mengatur jadwal
        }
      ]);

      if (error) throw error;

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      alert(
        'Horeee! 🎉 Pendaftaran akun berhasil dikirim!\n\n' +
        'Kepala Sekolah akan memverifikasi pembayaran Ayah/Bunda via WhatsApp. ' +
        'Setelah disetujui, masuk ke Portal Murid untuk menentukan jadwal les dan memilih mentor idola.'
      );

      // Reset Form
      setStudentName('');
      setParentPhone('');
      setStudentPassword('');
      setStudentAddress('');
      setReceiptFile(null);
    } catch (err: any) {
      alert('Gagal mengirim pendaftaran: ' + err.message);
    } finally {
      setLoadingStudent(false);
    }
  };

  // 2. Submit Pendaftaran Mitra Guru
  const handleRegisterTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingTutor) return;

    if (!tutorPassword.trim() || tutorPassword.length < 6) {
      return alert('Kata sandi akun guru minimal 6 karakter!');
    }

    setLoadingTutor(true);
    try {
      let certUrl = '';
      if (certFile) {
        const ext = certFile.name.split('.').pop();
        const path = `certificates/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
        await supabase.storage.from('transfer-receipts').upload(path, certFile);
        const { data } = supabase.storage.from('transfer-receipts').getPublicUrl(path);
        certUrl = data.publicUrl;
      }

      const { error } = await supabase.from('tutor_applications').insert([
        {
          full_name: tutorName.trim(),
          phone_number: tutorPhone.trim(),
          password: tutorPassword.trim(),
          campus: tutorCampus.trim(),
          major: tutorMajor.trim(),
          achievements: tutorAchievements.trim(),
          certificate_url: certUrl || null,
          is_approved: false,         // Kunci: Menunggu persetujuan
          status: 'pending'
        }
      ]);

      if (error) throw error;

      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      alert('Lamaran Mitra Guru Terkirim! Kualifikasi Anda sedang ditinjau Kepala Sekolah. Tunggu konfirmasi akun aktif sebelum login.');
      setTutorName('');
      setTutorPhone('');
      setTutorPassword('');
      setTutorCampus('');
      setTutorMajor('');
      setTutorAchievements('');
      setCertFile(null);
    } catch (err: any) {
      alert('Gagal mengirim lamaran guru: ' + err.message);
    } finally {
      setLoadingTutor(false);
    }
  };

  // 3. Eksekusi Login Terpadu (Dengan Verifikasi Status ACC)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      if (modalRole === 'murid') {
        if (!loginPhone.trim() || !loginPassword.trim()) throw new Error('Isi nomor WA dan kata sandi murid!');
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .eq('phone_number', loginPhone.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) throw new Error('Akun murid tidak ditemukan!');

        // Gembok verifikasi Kepala Sekolah
        if (!data.is_approved && data.status !== 'verified') {
          throw new Error('Akun Anda masih dalam antrean verifikasi pembayaran oleh Kepala Sekolah. Silakan tunggu konfirmasi via WhatsApp.');
        }

        const validPw = data.password || '123456';
        if (loginPassword.trim() !== validPw) throw new Error('Kata sandi murid salah!');

        localStorage.setItem('cerdas_student_phone', loginPhone.trim());
        router.push('/murid');
      } else if (modalRole === 'guru') {
        if (!loginPhone.trim() || !loginPassword.trim()) throw new Error('Isi nomor WA dan kata sandi guru!');
        const { data, error } = await supabase
          .from('tutor_applications')
          .select('*')
          .eq('phone_number', loginPhone.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) throw new Error('Akun guru tidak ditemukan!');

        // Gembok verifikasi Kepala Sekolah
        if (!data.is_approved) {
          throw new Error('Pendaftaran akun guru Anda sedang ditinjau Kepala Sekolah. Akun belum aktif sebelum disetujui.');
        }

        const validPw = data.password || '123456';
        if (loginPassword.trim() !== validPw) throw new Error('Kata sandi guru salah!');

        localStorage.setItem('cerdas_tutor_phone', loginPhone.trim());
        router.push('/guru');
      } else {
        // Kepala Sekolah (Admin)
        const { data: authSettings } = await supabase
          .from('admin_auth_settings')
          .select('*')
          .eq('id', 1)
          .single();

        const defaultId = authSettings?.admin_id || 'kepalasekolah2005';
        const defaultPw = authSettings?.admin_pw || '081346';
        const defaultPin = authSettings?.master_pin || '123456';

        if (adminAuthType === 'credentials') {
          if (adminId.trim() === defaultId && adminPw.trim() === defaultPw) {
            sessionStorage.setItem('cerdas_admin_auth', 'true');
            router.push('/admin');
          } else {
            throw new Error('ID atau Kata Sandi Kepala Sekolah salah!');
          }
        } else {
          if (adminPin.trim() === defaultPin) {
            sessionStorage.setItem('cerdas_admin_auth', 'true');
            router.push('/admin');
          } else {
            throw new Error('PIN Keamanan 6 digit salah!');
          }
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Gagal login.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFF7ED] to-[#F0FDF4] text-slate-800 font-sans pb-32 selection:bg-amber-300 selection:text-slate-900 relative overflow-x-hidden antialiased">
      
      {/* 1. RUNNING MARQUEE TICKER */}
      <div className="w-full bg-[#ffddb8] text-[#2a1700] py-1.5 overflow-hidden select-none border-b border-amber-200">
        <div className="flex whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-8 text-[11px] font-extrabold uppercase tracking-wider animate-[marquee_25s_linear_infinite]">
            <span>⭐ Bunda Raisa (Jaksel): "Nilai Matematika Kevin naik ke 95!"</span>
            <span>•</span>
            <span>🚀 12.450+ Jam Belajar Sukses Terlaksana</span>
            <span>•</span>
            <span>💡 Garansi 100% Ganti Guru jika Kurang Cocok</span>
            <span>•</span>
            <span>🏅 Top 5% Mahasiswa Berprestasi UI, ITB, UGM</span>
            <span>•</span>
            <span>⭐ Bunda Raisa (Jaksel): "Nilai Matematika Kevin naik ke 95!"</span>
            <span>•</span>
            <span>🚀 12.450+ Jam Belajar Sukses Terlaksana</span>
            <span>•</span>
            <span>💡 Garansi 100% Ganti Guru jika Kurang Cocok</span>
            <span>•</span>
            <span>🏅 Top 5% Mahasiswa Berprestasi UI, ITB, UGM</span>
          </div>
        </div>
      </div>

      {/* 2. TOP HEADER NAVBAR */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b-2 border-sky-100 px-4 md:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white flex items-center justify-center text-xl shadow-md">
              <Rocket className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent">
                  CERDAS
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-xs border border-amber-300">
                  JUNIOR ⭐
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 -mt-0.5">Bimbel Privat Seru ke Rumah</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Tab Switcher Role */}
            <div className="hidden sm:flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRoleTab('murid')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  roleTab === 'murid' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎒 Mode Murid
              </button>
              <button
                type="button"
                onClick={() => setRoleTab('tutor')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  roleTab === 'tutor' ? 'bg-amber-500 text-amber-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 Gabung Jadi Tutor
              </button>
            </div>

            {/* Tombol Masuk Portal Terpadu */}
            <button
              onClick={() => {
                setLoginError('');
                setShowLoginModal(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-xs font-bold shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk Portal</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-4 space-y-6">

        {/* 3. HERO PROMO BANNER */}
        <section className="relative rounded-[2rem] p-5 sm:p-6 overflow-hidden border-2 border-amber-300 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black">
                  PROMO BUNDA: Sesi Pertama Garansi 100% Cocok!
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-600 font-black text-[10px] shadow-sm">
                  KODE: JUARABUNDA
                </span>
              </div>
              <p className="text-xs text-yellow-100 font-medium mt-0.5">
                Gak cocok? Guru langsung diganti gratis + Dapatkan Modul Edu-Games Interaktif & Toolkit Juara!
              </p>
            </div>
          </div>

          <a
            href="#workspace-pesan"
            className="px-5 py-2.5 rounded-full bg-white text-orange-600 hover:bg-amber-50 font-black text-xs shadow-md transition-transform hover:scale-105 active:scale-95 shrink-0 z-10 flex items-center gap-1.5"
          >
            <span>Daftar Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>

        {/* 4. HERO VALUE PROPOSITION */}
        <section className="relative rounded-[2.5rem] p-6 sm:p-10 border-2 border-amber-200/80 bg-gradient-to-br from-[#FEFCE8] via-[#FFF7ED] to-[#E0F2FE] shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 border-2 border-amber-300 text-amber-900 text-xs font-bold shadow-xs">
                <span>🎒</span>
                <span>Bimbel Privat No. 1 Kesayangan Bunda & Anak!</span>
                <span className="text-amber-500 font-black flex items-center gap-0.5">★ 4.98</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {roleTab === 'murid' ? (
                  <>Belajar Asyik & Juara Bareng Kakak Tutor Idola di <span className="text-sky-600 underline decoration-orange-400 decoration-wavy decoration-2">Rumah!</span> 🚀✨</>
                ) : (
                  <>Salurkan Bakat Mengajar, Raih Penghasilan Pasti <span className="text-amber-600 underline decoration-sky-400 decoration-wavy decoration-2">Rp 30rb/Sesi</span> 🎓</>
                )}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
                {roleTab === 'murid'
                  ? 'Daftar sekarang, verifikasi pembayaran dengan Kepala Sekolah, lalu tentukan hari les dan pilih mentor idola sendiri langsung di dalam portal belajarmu!'
                  : 'Bergabung bersama 1.200+ mahasiswa & sarjana berprestasi PTN. Ambil jadwal bimbingan belajar murid di bursa tugas dengan honor pasti cair tepat waktu.'}
              </p>

              {/* Metric Pills */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                <div className="bg-white rounded-2xl p-3 border-2 border-emerald-200 text-center shadow-xs">
                  <span className="text-lg">🎈</span>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Biaya Murid</p>
                  <p className="text-xs sm:text-sm font-black text-emerald-600">Rp 45rb<span className="text-[10px] text-slate-400 font-normal">/sesi</span></p>
                </div>
                <div className="bg-white rounded-2xl p-3 border-2 border-amber-200 text-center shadow-xs">
                  <span className="text-lg">⭐</span>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Honor Guru</p>
                  <p className="text-xs sm:text-sm font-black text-amber-600">Rp 30rb<span className="text-[10px] text-slate-400 font-normal">/sesi</span></p>
                </div>
                <div className="bg-white rounded-2xl p-3 border-2 border-sky-200 text-center shadow-xs">
                  <span className="text-lg">⏱️</span>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Durasi KBM</p>
                  <p className="text-xs sm:text-sm font-black text-sky-600">90 Menit</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl bg-white p-3 border-2 border-sky-200 shadow-xl overflow-hidden">
                <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80"
                    alt="Belajar Seru"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[9px]">
                      METODE CERDAS JUNIOR
                    </span>
                    <h3 className="font-black text-sm mt-1">Belajar Mandiri, Seru & Terarah 🍕</h3>
                    <p className="text-[11px] text-slate-200">Jadwal & Guru Ditentukan Sendiri Oleh Murid</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 5. KONTEN BERDASARKAN ROLE TAB */}
        {roleTab === 'murid' ? (
          /* ================= MODE MURID ================= */
          <div className="space-y-8">
            
            {/* ETALASE INSPIRASI KAKAK TUTOR */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <span>Inspirasi Kakak Mentor Berprestasi</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200">
                      Top 5% Seleksi PTN ⭐
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Bisa kamu pilih langsung setelah akun pendaftaranmu aktif!</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TUTORS.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-3xl p-4 border-2 border-slate-200 relative flex flex-col justify-between shadow-sm"
                  >
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 w-max mb-2">
                      {tutor.badge}
                    </span>
                    
                    <div className="flex items-start gap-3">
                      <img
                        src={tutor.avatar}
                        alt={tutor.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-sky-600 block">{tutor.campus}</span>
                        <h4 className="font-black text-xs text-slate-900 leading-tight mt-0.5">{tutor.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{tutor.subject}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-bold text-amber-500">
                        <span>⭐ {tutor.rating}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({tutor.sessions} sesi)</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Standar PTN
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PILIH PAKET BELAJAR */}
            <section className="space-y-3" id="paket-section">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-1">
                    <span>Pilih Paket Belajar</span>
                    <span>🎁</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Bebas pilih intensitas belajar bulanan sesuai kebutuhan anak</p>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2.5 py-1 rounded-full border border-amber-300">
                  🛡️ Garansi Guru Cocok
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPkg.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg)}
                      className={`bg-white rounded-3xl p-5 border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected ? 'border-sky-500 shadow-xl ring-2 ring-sky-200' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                          🔥 TERLARIS - BINTANG KELAS
                        </span>
                      )}

                      <div>
                        <span className="text-[9px] font-black uppercase text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md">
                          {pkg.tier}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-2">{pkg.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">{pkg.desc}</p>
                        <p className="text-xs font-bold text-sky-600 mt-1">{pkg.sessions}</p>

                        <div className="my-3 py-2 border-y border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Total 1 Bulan:</span>
                          <span className="text-xl font-black text-slate-900">
                            Rp {pkg.price.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                          {pkg.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[3]" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        className={`w-full mt-4 py-2.5 rounded-xl font-black text-xs transition-all ${
                          isSelected
                            ? 'bg-sky-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ Paket Terpilih' : 'Pilih Paket Ini'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* FORM PENDAFTARAN BERSIH (TANPA HARI/JAM/MENTOR) */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-sky-100 shadow-sm space-y-4 max-w-3xl mx-auto" id="workspace-pesan">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Formulir Pendaftaran Siswa Baru</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Setelah diverifikasi, Anda bebas menentukan hari dan memilih mentor di dalam akun.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCheckoutStudent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">👦 Nama Lengkap Murid</label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Contoh: Raditya Pratama"
                      className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">🏫 Jenjang / Kelas Sekolah</label>
                    <select
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                    >
                      <option value="TK / PAUD">TK / PAUD</option>
                      <option value="Kelas 1 SD">Kelas 1 SD</option>
                      <option value="Kelas 2 SD">Kelas 2 SD</option>
                      <option value="Kelas 3 SD">Kelas 3 SD</option>
                      <option value="Kelas 4 SD">Kelas 4 SD</option>
                      <option value="Kelas 5 SD">Kelas 5 SD</option>
                      <option value="Kelas 6 SD">Kelas 6 SD</option>
                      <option value="Kelas 7 SMP">Kelas 7 SMP</option>
                      <option value="Kelas 8 SMP">Kelas 8 SMP</option>
                      <option value="Kelas 9 SMP">Kelas 9 SMP</option>
                      <option value="Kelas 10-12 SMA">Kelas 10 - 12 SMA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">📱 Nomor WhatsApp Aktif (Untuk Login)</label>
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="Contoh: 0812xxxxxxxx"
                      className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      🔒 Buat Kata Sandi Akun Murid (Min. 6 Karakter)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Minimal 6 karakter..."
                        className="w-full p-2.5 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">🏠 Alamat Lengkap Rumah (Tujuan Guru Datang)</label>
                  <textarea
                    required
                    rows={2}
                    value={studentAddress}
                    onChange={(e) => setStudentAddress(e.target.value)}
                    placeholder="Nama Jalan, Nomor Rumah, RT/RW, Kelurahan, Patokan Rumah..."
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Informasi Pembayaran BCA */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border-2 border-blue-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px]">BCA</span>
                      <span className="font-bold text-blue-900 text-xs">Rekening Resmi Bimbel Cerdas</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Verifikasi Kepala Sekolah ⚡
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 flex justify-between items-center shadow-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Nomor Rekening BCA Resmi:</p>
                      <p className="font-black text-sm text-blue-900 tracking-wider">8271 9028 4410</p>
                      <p className="text-[9px] text-slate-500">a.n. PT CERDAS AKADEMI NUSANTARA</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBCA}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedRek ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="text-slate-600 font-medium">Paket Terpilih ({selectedPkg.title}):</span>
                    <span className="text-base font-black text-orange-600">
                      Rp {selectedPkg.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Upload Bukti Pembayaran */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">🧾 Unggah Foto Struk Transfer Pembayaran</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={(e) => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-[11px] text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-sky-100 file:text-sky-800 file:font-bold hover:file:bg-sky-200"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">*Bukti transfer akan diverifikasi oleh Kepala Sekolah sebelum akun diaktifkan.</p>
                </div>

                <button
                  type="submit"
                  disabled={loadingStudent}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-sm shadow-[0_5px_0_#c2410c] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  <span>KIRIM PENDAFTARAN & TUNGGU ACC 🚀</span>
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500 pt-1">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Pembayaran Aman
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <RotateCcw className="w-3.5 h-3.5" /> Garansi Guru Cocok
                  </span>
                </div>
              </form>
            </section>

          </div>
        ) : (
          /* ================= MODE PENDAFTARAN GURU ================= */
          <section className="max-w-2xl mx-auto">
            <form onSubmit={handleRegisterTutor} className="bg-white p-6 sm:p-8 rounded-[2rem] border-2 border-amber-200 shadow-xl space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                  🎓 Karir Pengajar Unggulan
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-2">Formulir Rekrutmen Mitra Guru</h2>
                <p className="text-xs text-slate-500">Honor pasti Rp 30.000 / 90 menit langsung dihitung per kehadiran tatap muka.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={tutorName}
                    onChange={(e) => setTutorName(e.target.value)}
                    placeholder="Contoh: Dimas Ramadhan, S.Pd."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp Aktif</label>
                  <input
                    type="tel"
                    required
                    value={tutorPhone}
                    onChange={(e) => setTutorPhone(e.target.value)}
                    placeholder="Contoh: 0812xxxxxxxx"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">🔒 Buat Kata Sandi Akun Guru (Min. 6 Karakter)</label>
                <div className="relative">
                  <input
                    type={showTutorPassword ? 'text' : 'password'}
                    required
                    value={tutorPassword}
                    onChange={(e) => setTutorPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun pengajar..."
                    className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTutorPassword(!showTutorPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showTutorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Asal Kampus / Universitas</label>
                  <input
                    type="text"
                    required
                    value={tutorCampus}
                    onChange={(e) => setTutorCampus(e.target.value)}
                    placeholder="Contoh: Universitas Indonesia"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jurusan / Program Studi</label>
                  <input
                    type="text"
                    required
                    value={tutorMajor}
                    onChange={(e) => setTutorMajor(e.target.value)}
                    placeholder="Contoh: Pendidikan Matematika"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">Daftar Prestasi & Pengalaman Mengajar</label>
                <textarea
                  rows={3}
                  required
                  value={tutorAchievements}
                  onChange={(e) => setTutorAchievements(e.target.value)}
                  placeholder="Contoh: Juara Olimpiade Matematika, 3 tahun mengajar privat SD, skor TOEFL 580..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">Unggah Ijazah / Sertifikat Pendukung (Opsional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setCertFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-amber-100 file:text-amber-900 file:font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loadingTutor}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black text-xs shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loadingTutor ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                <span>DAFTAR JADI KAKAK GURU SEKARANG 🌟</span>
              </button>
            </form>
          </section>
        )}

      </main>

      {/* 6. STICKY BOTTOM SUMMARY BAR */}
      <aside className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t-2 border-sky-100 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Paket Terpilih ({selectedPkg.title}):</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-orange-600">
                Rp {selectedPkg.price.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] font-bold text-slate-400">/ {selectedPkg.sessions}</span>
            </div>
          </div>
          <a
            href="#workspace-pesan"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-xs shadow-[0_4px_0_#c2410c] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            <span>Daftar Sekarang! 🚀</span>
          </a>
        </div>
      </aside>

      {/* 7. MODAL LOGIN TERPADU MULTI-ROLE */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border-2 border-sky-200 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌟</span>
                  <h3 className="text-base font-black text-slate-900">Universal Portal Login</h3>
                </div>
                <p className="text-xs text-slate-500">Satu pintu portal pintar Cerdas Kids Academy</p>
              </div>

              {/* Role Switcher Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setModalRole('murid'); setLoginError(''); }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                    modalRole === 'murid' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  🎒 Murid
                </button>
                <button
                  type="button"
                  onClick={() => { setModalRole('guru'); setLoginError(''); }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                    modalRole === 'guru' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  🧑‍🏫 Guru
                </button>
                <button
                  type="button"
                  onClick={() => { setModalRole('kepsek'); setLoginError(''); }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                    modalRole === 'kepsek' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  🏫 Kepsek
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                {modalRole === 'murid' || modalRole === 'guru' ? (
                  <>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nomor WhatsApp ({modalRole === 'murid' ? 'Siswa / Wali' : 'Tutor'})
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          required
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Kata Sandi / PIN</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type={showModalPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowModalPassword(!showModalPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Admin / Kepala Sekolah Auth */
                  <div className="space-y-2.5">
                    <div className="flex bg-slate-100 p-0.5 rounded-xl border text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => { setAdminAuthType('credentials'); setLoginError(''); }}
                        className={`flex-1 py-1 rounded-lg ${adminAuthType === 'credentials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                      >
                        ID & Password
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAdminAuthType('pin'); setLoginError(''); }}
                        className={`flex-1 py-1 rounded-lg ${adminAuthType === 'pin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                      >
                        PIN 6 Digit
                      </button>
                    </div>

                    {adminAuthType === 'credentials' ? (
                      <>
                        <input
                          type="text"
                          required
                          value={adminId}
                          onChange={(e) => setAdminId(e.target.value)}
                          placeholder="ID Kepala Sekolah..."
                          className="w-full p-2 bg-slate-50 border rounded-xl font-bold"
                        />
                        <input
                          type="password"
                          required
                          value={adminPw}
                          onChange={(e) => setAdminPw(e.target.value)}
                          placeholder="Kata Sandi..."
                          className="w-full p-2 bg-slate-50 border rounded-xl font-bold"
                        />
                      </>
                    ) : (
                      <input
                        type="password"
                        maxLength={6}
                        required
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="w-full tracking-[1em] text-center text-xl font-black py-2 bg-slate-50 border rounded-xl"
                      />
                    )}
                  </div>
                )}

                {loginError && (
                  <p className="text-[11px] font-bold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200 text-center">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-black text-xs shadow-[0_4px_0_#0284C7] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>MASUK KE RUANG BELAJAR</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}