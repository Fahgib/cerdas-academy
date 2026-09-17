'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, X, Eye, EyeOff, Lock, Phone, 
  ArrowRight, KeyRound, Loader2, Fingerprint, 
  GraduationCap, User, School, Sparkles
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();

  // Role Tab: 'murid' | 'guru' | 'kepsek'
  const [role, setRole] = useState<'murid' | 'guru' | 'kepsek'>('murid');

  // Input Murid & Guru
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Input Khusus Kepala Sekolah
  const [kepsekMode, setKepsekMode] = useState<'pin' | 'id'>('pin');
  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [adminPin, setAdminPin] = useState('');

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Input Keypad Angka Kepsek
  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      setAdminPin((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setAdminPin('');
    } else {
      if (adminPin.length < 6) {
        setAdminPin((prev) => prev + val);
      }
    }
  };

  // Eksekusi Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (role === 'murid') {
        if (!phone.trim() || !password.trim()) {
          throw new Error('Masukkan nomor WhatsApp dan kata sandi murid!');
        }

        // Ambil data murid dari Supabase
        const cleanPhone = phone.trim().startsWith('0') ? phone.trim() : phone.trim().startsWith('62') ? phone.trim() : '0' + phone.trim();
        
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .or(`phone_number.eq.${phone.trim()},phone_number.eq.${cleanPhone}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) throw new Error('Akun murid dengan nomor WhatsApp ini tidak ditemukan!');
        
        const validPassword = data.password || '123456';
        if (password.trim() !== validPassword) {
          throw new Error('Kata sandi murid yang Anda masukkan salah!');
        }

        localStorage.setItem('cerdas_student_phone', data.phone_number);
        onClose();
        router.push('/murid');
      } else if (role === 'guru') {
        if (!phone.trim() || !password.trim()) {
          throw new Error('Masukkan nomor WhatsApp dan kata sandi guru!');
        }

        const { data, error } = await supabase
          .from('tutor_applications')
          .select('*')
          .eq('phone_number', phone.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) throw new Error('Akun guru pengajar tidak ditemukan!');

        const validPassword = data.password || '123456';
        if (password.trim() !== validPassword) {
          throw new Error('Kata sandi guru salah. Silakan periksa kembali!');
        }

        localStorage.setItem('cerdas_tutor_phone', data.phone_number);
        onClose();
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

        if (kepsekMode === 'pin') {
          if (adminPin.length !== 6) throw new Error('Masukkan 6 digit PIN otoritas!');
          if (adminPin === defaultPin) {
            sessionStorage.setItem('cerdas_admin_auth', 'true');
            onClose();
            router.push('/admin');
          } else {
            throw new Error('PIN Keamanan 6 digit salah!');
          }
        } else {
          if (adminId.trim() === defaultId && adminPw.trim() === defaultPw) {
            sessionStorage.setItem('cerdas_admin_auth', 'true');
            onClose();
            router.push('/admin');
          } else {
            throw new Error('ID atau Kata Sandi Kepala Sekolah salah!');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#05070B]/80 backdrop-blur-md">
          {/* Outer Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* BEGIN: MobileFrameContainer */}
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-[400px] bg-[#0A0E17] border border-slate-800/80 rounded-t-[36px] sm:rounded-[36px] shadow-2xl overflow-hidden relative backdrop-blur-xl flex flex-col z-10 max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top iOS Grabber Bar */}
            <div className="pt-3 pb-1 flex justify-center w-full select-none">
              <div className="w-12 h-1 bg-slate-700/60 rounded-full" />
            </div>

            {/* Modal Header */}
            <header className="px-6 pt-3 pb-3 flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                {/* Glowing Security Shield */}
                <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#0A0E17]" />
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold tracking-tight text-white">Masuk ke Portal</h2>
                    <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full uppercase">
                      TLS 256
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">Pilih peran akun untuk membuka ruang kerja</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 p-2 rounded-full transition-colors cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Scrollable Container */}
            <main className="px-6 pb-6 pt-1 flex-1 overflow-y-auto no-scrollbar space-y-4">
              {/* 3-Segment Role Selector Pill */}
              <nav className="bg-slate-900/90 p-1 rounded-2xl border border-slate-800 flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => { setRole('murid'); setErrorMsg(''); }}
                  className={`flex-1 flex items-center justify-center py-2 px-2.5 rounded-xl font-bold text-xs transition-all gap-1.5 cursor-pointer ${
                    role === 'murid'
                      ? 'bg-white text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Murid</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setRole('guru'); setErrorMsg(''); }}
                  className={`flex-1 flex items-center justify-center py-2 px-2.5 rounded-xl font-bold text-xs transition-all gap-1.5 cursor-pointer ${
                    role === 'guru'
                      ? 'bg-white text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Guru</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setRole('kepsek'); setErrorMsg(''); }}
                  className={`flex-1 flex items-center justify-center py-2 px-2.5 rounded-xl font-bold text-xs transition-all gap-1.5 cursor-pointer ${
                    role === 'kepsek'
                      ? 'bg-white text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Kepsek</span>
                </button>
              </nav>

              {/* Banner Sapaan Ramah Sesuai Role */}
              {role === 'murid' && (
                <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/20 rounded-2xl p-3 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg shrink-0">
                    🚀
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-emerald-300">Halo Juara!</h3>
                    <p className="text-[11px] text-slate-300 leading-tight">Masuk untuk mulai belajar hari ini dan kejar mimpimu.</p>
                  </div>
                </div>
              )}

              {role === 'guru' && (
                <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900/90 border border-emerald-500/25 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">✨</span>
                    <p className="text-[11px] font-medium text-emerald-300 tracking-tight">
                      Portal Pengajar & Honorarium Resmi
                    </p>
                  </div>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Verified
                  </span>
                </div>
              )}

              {/* Form Input Sesuai Role */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                {role === 'murid' || role === 'guru' ? (
                  <>
                    {/* Input Nomor WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-slate-300">
                        {role === 'murid' ? 'WhatsApp / Nomor HP Siswa' : 'No. WhatsApp / Handphone Tutor'}
                      </label>
                      <div className="relative flex items-center rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                        <div className="flex items-center pl-3.5 pr-2 py-3 border-r border-slate-800 text-slate-300 text-xs font-medium select-none space-x-1.5">
                          <span className="text-sm">🇮🇩</span>
                          <span className="text-slate-300">+62</span>
                        </div>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="812-3456-7890"
                          className="w-full bg-transparent border-0 px-3 py-3 text-xs text-white placeholder:text-slate-500 focus:ring-0 focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    {/* Input Kata Sandi */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] font-medium text-slate-300">
                          {role === 'murid' ? 'Kata Sandi / PIN Akun Siswa' : 'Kata Sandi Akun Pengajar'}
                        </label>
                      </div>
                      <div className="relative flex items-center rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                        <div className="pl-3.5 pr-2 py-3 text-slate-400">
                          <Lock className="w-4 h-4 text-emerald-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Masukkan 6 karakter kata sandi..."
                          className="w-full bg-transparent border-0 px-2 py-3 text-xs text-white placeholder:text-slate-500 focus:ring-0 focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="pr-3.5 pl-2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Checkbox Ingat Saya & Lupa Sandi */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/30 focus:ring-1"
                        />
                        <span className="text-[11px] text-slate-400 font-normal">Ingat Saya</span>
                      </label>
                      <a
                        href={`https://wa.me/6281234567890?text=${encodeURIComponent('Halo Admin Cerdas Academy, saya membutuhkan bantuan reset kata sandi akun ' + role)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                      >
                        Lupa Sandi?
                      </a>
                    </div>
                  </>
                ) : (
                  /* Form Khusus Kepala Sekolah */
                  <div className="space-y-3.5">
                    {/* Sub-toggle: PIN Cepat vs ID & Password */}
                    <div className="flex items-center justify-between p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => { setKepsekMode('pin'); setErrorMsg(''); }}
                        className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          kepsekMode === 'pin'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>PIN Cepat (6-Digit)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setKepsekMode('id'); setErrorMsg(''); }}
                        className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          kepsekMode === 'id'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>ID & Password</span>
                      </button>
                    </div>

                    {kepsekMode === 'pin' ? (
                      /* MODE PIN 6-DIGIT DENGAN KEYPAD */
                      <div className="space-y-3">
                        <div className="text-center">
                          <span className="text-[11px] text-slate-400">Masukkan 6 Digit PIN Otoritas Eksekutif</span>
                        </div>

                        {/* Indikator PIN Bulat / Kotak */}
                        <div className="flex justify-center items-center gap-2">
                          {[0, 1, 2, 3, 4, 5].map((idx) => {
                            const isFilled = adminPin.length > idx;
                            return (
                              <div
                                key={idx}
                                className={`w-9 h-11 rounded-xl border flex items-center justify-center transition-all ${
                                  isFilled
                                    ? 'bg-slate-900 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                    : 'bg-slate-900/60 border-slate-800'
                                }`}
                              >
                                <div
                                  className={`rounded-full transition-all ${
                                    isFilled ? 'w-2.5 h-2.5 bg-emerald-400 animate-pulse' : 'w-2 h-2 bg-white/20'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Keypad Angka On-Screen */}
                        <div className="grid grid-cols-3 gap-1.5 px-2 pt-1 select-none">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleKeypadPress(num)}
                              className="h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/5 text-sm font-bold text-white transition-all flex items-center justify-center cursor-pointer"
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleKeypadPress('clear')}
                            className="h-10 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] active:scale-95 border border-white/5 text-[10px] text-slate-400 font-bold transition-all flex items-center justify-center cursor-pointer"
                          >
                            C
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKeypadPress('0')}
                            className="h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/5 text-sm font-bold text-white transition-all flex items-center justify-center cursor-pointer"
                          >
                            0
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKeypadPress('backspace')}
                            className="h-10 rounded-xl bg-white/[0.02] hover:bg-rose-500/20 active:scale-95 border border-white/5 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center cursor-pointer"
                          >
                            ⌫
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MODE ID & PASSWORD KEPALA SEKOLAH */
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">ID Admin Kepala Sekolah</label>
                          <input
                            type="text"
                            required
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
                            placeholder="Contoh: kepalasekolah2005"
                            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">Kata Sandi Eksekutif</label>
                          <input
                            type="password"
                            required
                            value={adminPw}
                            onChange={(e) => setAdminPw(e.target.value)}
                            placeholder="Masukkan kata sandi..."
                            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <p className="text-[11px] font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30 text-center">
                    {errorMsg}
                  </p>
                )}

                {/* Tombol Masuk Utama */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide shadow-[0_0_24px_-2px_rgba(16,185,129,0.45)] hover:shadow-emerald-500/50 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <span>
                          {role === 'murid'
                            ? 'Masuk Belajar Sekarang'
                            : role === 'guru'
                            ? 'Buka Dashboard Tutor'
                            : 'Buka Dashboard Eksekutif'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Indikator Keamanan Perangkat */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Enkripsi Kunci Aman</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-400/80">
                  <Fingerprint className="w-3.5 h-3.5 inline" />
                  <span>Biometrik Siap</span>
                </div>
              </div>
            </main>

            {/* Bottom iOS Home Indicator */}
            <div className="pb-2 pt-1 flex justify-center w-full select-none">
              <div className="w-28 h-1 bg-slate-700/50 rounded-full" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}