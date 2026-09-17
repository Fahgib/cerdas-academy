'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import imageCompression from 'browser-image-compression';

// Helper pemanggil Google Material Symbols Stitch
const Icon = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span 
    className={`material-symbols-outlined select-none inline-flex items-center justify-center leading-none ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }}
  >
    {name}
  </span>
);

const HEADMASTER_PHONE = '6281234567890';
const DAYS_NAME = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function MuridDashboard() {
  // Theme State (Dark / Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 5 Tab Navigasi Aktif
  const [activeTab, setActiveTab] = useState<'beranda' | 'jadwal' | 'tugas' | 'tanya-pr' | 'profil'>('beranda');

  // Autentikasi Siswa
  const [studentPhone, setStudentPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Data Supabase
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reschedules, setReschedules] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any | null>(null);
  const [homeworkHelpList, setHomeworkHelpList] = useState<any[]>([]);

  // Sub-Interaksi & Filter
  const [scheduleFilter, setScheduleFilter] = useState<'mendatang' | 'riwayat'>('mendatang');
  const [activeCalendarDay, setActiveCalendarDay] = useState('Sel');
  const [taskSubTab, setTaskSubTab] = useState<'tugas' | 'kuis' | 'riwayat'>('tugas');
  const [selectedQuizOption, setSelectedQuizOption] = useState<string>('B');
  const [selectedSubject, setSelectedSubject] = useState('Matematika');

  // Ruang Kelas Online Jitsi Meet
  const [onlineClassSchedule, setOnlineClassSchedule] = useState<any | null>(null);

  // Modal State
  const [showProfilePasswordModal, setShowProfilePasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosIssueType, setSosIssueType] = useState('Guru Belum Datang (+15 Menit)');
  const [sosDescription, setSosDescription] = useState('');
  const [submittingSos, setSubmittingSos] = useState(false);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTargetSchedule, setRescheduleTargetSchedule] = useState<any | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState('Sabtu');
  const [rescheduleTime, setRescheduleTime] = useState('16:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const [showUploadPrModal, setShowUploadPrModal] = useState(false);
  const [targetAssignment, setTargetAssignment] = useState<any | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  const [showAskPrModal, setShowAskPrModal] = useState(false);
  const [askPrTitle, setAskPrTitle] = useState('');
  const [askPrFile, setAskPrFile] = useState<File | null>(null);
  const [submittingAskPr, setSubmittingAskPr] = useState(false);

  const [showChatModal, setShowChatModal] = useState(false);
  const [activeChatSchedule, setActiveChatSchedule] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMsgInput, setChatMsgInput] = useState('');

  const [previewMediaUrl, setPreviewMediaUrl] = useState<{ url: string; type: 'image' | 'video'; title: string } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cerdas_theme');
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedPhone = localStorage.getItem('cerdas_student_phone');
    if (savedPhone) {
      setStudentPhone(savedPhone);
      autoLogin(savedPhone);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('cerdas_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const autoLogin = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('phone_number', phone.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setStudentProfile(data);
        setIsLoggedIn(true);
        fetchDashboardData(phone.trim(), data.student_name);
      }
    } catch (e) {
      console.error('Auto login murid gagal:', e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentPhone.trim() || !studentPassword.trim()) {
      setAuthError('Masukkan nomor WhatsApp dan kata sandi akun!');
      return;
    }

    setLoadingAuth(true);
    setAuthError('');
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('phone_number', studentPhone.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        setAuthError('Nomor WhatsApp murid tidak ditemukan!');
        setLoadingAuth(false);
        return;
      }

      const validPw = data.password || '123456';
      if (studentPassword.trim() !== validPw) {
        setAuthError('Kata sandi yang Anda masukkan salah!');
        setLoadingAuth(false);
        return;
      }

      setStudentProfile(data);
      localStorage.setItem('cerdas_student_phone', studentPhone.trim());
      setIsLoggedIn(true);
      fetchDashboardData(studentPhone.trim(), data.student_name);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal masuk akun.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const fetchDashboardData = async (phone: string, name: string) => {
    const { data: schData } = await supabase
      .from('schedules')
      .select('*')
      .eq('student_phone', phone)
      .order('created_at', { ascending: false });

    if (schData) {
      setSchedules(schData);
      const scheduleIds = schData.map((s) => s.id);
      if (scheduleIds.length > 0) {
        const { data: matData } = await supabase
          .from('learning_materials')
          .select('*')
          .in('schedule_id', scheduleIds)
          .order('created_at', { ascending: false });
        if (matData) setMaterials(matData);
      }
    }

    const { data: resData } = await supabase
      .from('schedule_reschedules')
      .select('*')
      .eq('requester_name', name)
      .order('created_at', { ascending: false });
    if (resData) setReschedules(resData);

    const { data: repData } = await supabase
      .from('student_reports')
      .select('*')
      .eq('student_name', name)
      .order('created_at', { ascending: false });
    if (repData) setReports(repData);

    const { data: assData } = await supabase
      .from('student_assignments')
      .select('*')
      .eq('student_name', name)
      .order('created_at', { ascending: false });
    if (assData) setAssignments(assData);

    const { data: goalData } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('student_name', name)
      .order('created_at', { ascending: false });
    if (goalData) setGoals(goalData);

    const { data: qzData } = await supabase
      .from('diagnostic_quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    if (qzData) setQuizzes(qzData);

    const { data: gmData } = await supabase
      .from('student_gamification')
      .select('*')
      .eq('student_name', name)
      .single();
    if (gmData) setGamification(gmData);

    const { data: helpData } = await supabase
      .from('quick_homework_help')
      .select('*')
      .eq('student_name', name)
      .order('created_at', { ascending: false });
    if (helpData) setHomeworkHelpList(helpData);
  };

  const handleLogout = () => {
    if (!confirm('Apakah kamu yakin ingin keluar dari akun murid Cerdas?')) return;
    localStorage.removeItem('cerdas_student_phone');
    setIsLoggedIn(false);
    setStudentProfile(null);
    setStudentPassword('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || newPasswordInput.length < 6) {
      return alert('Kata sandi baru minimal harus 6 karakter!');
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ password: newPasswordInput.trim() })
        .eq('id', studentProfile.id);
      if (error) throw error;

      confetti({ particleCount: 70, spread: 50 });
      alert('Kata sandi berhasil diperbarui!');
      setShowProfilePasswordModal(false);
      setNewPasswordInput('');
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const openChatWithTutor = async (sch: any) => {
    setActiveChatSchedule(sch);
    setShowChatModal(true);
    const { data } = await supabase
      .from('session_chats')
      .select('*')
      .eq('schedule_id', sch.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsgInput.trim() || !activeChatSchedule) return;

    await supabase.from('session_chats').insert([
      {
        schedule_id: activeChatSchedule.id,
        sender_role: 'murid',
        sender_name: studentProfile?.student_name || 'Murid',
        message: chatMsgInput.trim(),
      }
    ]);

    setChatMsgInput('');
    const { data } = await supabase
      .from('session_chats')
      .select('*')
      .eq('schedule_id', activeChatSchedule.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
  };

  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleReason.trim()) return alert('Tuliskan alasan pengajuan ganti jadwal!');

    setSubmittingReschedule(true);
    try {
      const target = rescheduleTargetSchedule || schedules[0];
      const originalInfo = `${target?.day_of_week || 'Hari ini'} pukul ${target?.session_time?.substring(0, 5) || '16:00'}`;
      const proposedInfo = `${rescheduleDay} pukul ${rescheduleTime}`;

      await supabase.from('schedule_reschedules').insert([
        {
          schedule_id: target?.id || null,
          requester_role: 'murid',
          requester_name: studentProfile?.student_name || 'Murid',
          original_day_time: originalInfo,
          proposed_day_time: proposedInfo,
          reason: rescheduleReason.trim(),
          status: 'pending',
        }
      ]);

      confetti({ particleCount: 70, spread: 60 });
      const textWA = encodeURIComponent(
        `Halo Kepala Sekolah Cerdas Academy,\n\nSaya atas nama *${studentProfile?.student_name}* (Murid) mengajukan *Permohonan Ganti Jadwal*:\n\n` +
        `🗓️ Semula: ${originalInfo}\n` +
        `🔄 Usulan Baru: ${proposedInfo}\n` +
        `📝 Alasan: “${rescheduleReason}”\n\n` +
        `Mohon persetujuannya, terima kasih!`
      );
      window.open(`https://wa.me/${HEADMASTER_PHONE}?text=${textWA}`, '_blank');

      alert('Permohonan ganti jadwal berhasil diajukan!');
      setShowRescheduleModal(false);
      setRescheduleReason('');
      fetchDashboardData(studentProfile.phone_number, studentProfile.student_name);
    } catch (err: any) {
      alert('Gagal mengajukan reschedule: ' + err.message);
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleSubmitSos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSos(true);
    try {
      const activeSch = schedules[0];
      const tutorName = activeSch?.claimed_by_tutor_name || 'Tutor Terikat';

      await supabase.from('student_complaints').insert([
        {
          schedule_id: activeSch?.id || null,
          student_name: studentProfile?.student_name || 'Murid',
          tutor_name: tutorName,
          issue_type: sosIssueType,
          description: sosDescription.trim(),
          status: 'pending',
        }
      ]);

      const textWA = encodeURIComponent(
        `🚨 *LAPORAN PENGADUAN KENDALA BELAJAR - CERDAS ACADEMY* 🚨\n\n` +
        `Nama Siswa: *${studentProfile?.student_name}*\n` +
        `Tutor Terikat: ${tutorName}\n` +
        `Kendala: *${sosIssueType}*\n` +
        `Keterangan: “${sosDescription}”\n\n` +
        `Mohon tindak lanjut segera dari Kepala Sekolah.`
      );
      window.open(`https://wa.me/${HEADMASTER_PHONE}?text=${textWA}`, '_blank');

      alert('Laporan kendala berhasil dikirim ke Kepala Sekolah!');
      setShowSosModal(false);
      setSosDescription('');
    } catch (err: any) {
      alert('Gagal mengirim laporan: ' + err.message);
    } finally {
      setSubmittingSos(false);
    }
  };

  const handleSubmitAssignmentPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssignment || !assignmentFile) return alert('Pilih foto berkas tugas!');

    setSubmittingAssignment(true);
    try {
      const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressed = await imageCompression(assignmentFile, options);

      const ext = assignmentFile.name.split('.').pop();
      const path = `assignments/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from('transfer-receipts').upload(path, compressed);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('transfer-receipts').getPublicUrl(path);

      await supabase
        .from('student_assignments')
        .update({
          submission_photo_url: urlData.publicUrl,
          status: 'submitted',
        })
        .eq('id', targetAssignment.id);

      const curXp = gamification ? gamification.xp_points : 1450;
      await supabase
        .from('student_gamification')
        .upsert({
          student_name: studentProfile.student_name,
          student_phone: studentProfile.phone_number,
          xp_points: curXp + 20,
          level: Math.floor((curXp + 20) / 100) + 1,
        }, { onConflict: 'student_name' });

      confetti({ particleCount: 80, spread: 60 });
      alert('Tugas berhasil dikumpulkan! Reward +20 XP ditambahkan.');
      setShowUploadPrModal(false);
      setAssignmentFile(null);
      fetchDashboardData(studentProfile.phone_number, studentProfile.student_name);
    } catch (err: any) {
      alert('Gagal mengunggah tugas: ' + err.message);
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleSubmitAskPr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askPrFile || !askPrTitle.trim()) return alert('Isi judul soal dan lampirkan berkas!');

    setSubmittingAskPr(true);
    try {
      const sch = schedules[0];
      const tutorName = sch?.claimed_by_tutor_name || 'Tutor Siaga MIPA';
      const isVideo = askPrFile.type.startsWith('video/');

      let uploadTargetFile: File = askPrFile;
      if (!isVideo) {
        uploadTargetFile = await imageCompression(askPrFile, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
      }

      const ext = askPrFile.name.split('.').pop();
      const path = `homework-help/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      await supabase.storage.from('transfer-receipts').upload(path, uploadTargetFile);
      const { data: urlData } = supabase.storage.from('transfer-receipts').getPublicUrl(path);

      await supabase.from('quick_homework_help').insert([
        {
          student_name: studentProfile.student_name,
          student_phone: studentProfile.phone_number,
          tutor_name: tutorName,
          question_title: `[${selectedSubject}] ${askPrTitle.trim()}`,
          question_photo_url: urlData.publicUrl,
          question_media_type: isVideo ? 'video' : 'image',
          status: 'pending',
        }
      ]);

      confetti({ particleCount: 60, spread: 50 });
      alert('Pertanyaan PR berhasil dikirim! Tutor akan segera membalas.');
      setShowAskPrModal(false);
      setAskPrTitle('');
      setAskPrFile(null);
      fetchDashboardData(studentProfile.phone_number, studentProfile.student_name);
    } catch (err: any) {
      alert('Gagal mengirim pertanyaan: ' + err.message);
    } finally {
      setSubmittingAskPr(false);
    }
  };

  const handleAnswerQuiz = (opt: string) => {
    setSelectedQuizOption(opt);
    if (opt === 'B') {
      confetti({ particleCount: 60, spread: 50 });
      const curXp = gamification ? gamification.xp_points : 1450;
      supabase
        .from('student_gamification')
        .upsert({
          student_name: studentProfile?.student_name || 'Murid',
          student_phone: studentProfile?.phone_number || '',
          xp_points: curXp + 15,
          level: Math.floor((curXp + 15) / 100) + 1,
        }, { onConflict: 'student_name' })
        .then(() => fetchDashboardData(studentProfile.phone_number, studentProfile.student_name));
    }
  };

  const currentXp = gamification ? gamification.xp_points : 1450;
  const currentLevel = gamification ? gamification.level : 4;
  const progressPercent = Math.min(100, Math.round((currentXp % 2000) / 20));
  const todaySchedule = schedules[0] || null;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="bg-[#f8fafc] text-[#0f172a] dark:bg-[#0a0e17] dark:text-[#dfe2ef] font-['Plus_Jakarta_Sans',sans-serif] min-h-screen flex flex-col antialiased transition-colors duration-200">

        {/* 1. DESKTOP FIXED SIDEBAR */}
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#181b25] z-50 flex-col justify-between border-r border-slate-200/80 dark:border-[#31353f] shadow-xs">
          <div className="flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-[#31353f]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#006948] dark:bg-[#4edea3] flex items-center justify-center text-white dark:text-[#003824] shadow-sm">
                  <Icon name="school" className="text-[22px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-slate-900 dark:text-white leading-none">Cerdas</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#bbcabf] mt-1">Portal Murid</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-[#4edea3]/20 dark:text-[#4edea3] text-[10px] font-bold">
                Aktif
              </span>
            </div>

            <div className="px-6 pt-5 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#86948a]">MENU BELAJAR</span>
            </div>

            <nav className="flex flex-col gap-1 px-4 text-sm font-semibold">
              {[
                { id: 'beranda', label: 'Beranda', icon: 'dashboard' },
                { id: 'jadwal', label: 'Jadwal KBM', icon: 'calendar_month' },
                { id: 'tugas', label: 'Tugas & Kuis', icon: 'assignment' },
                { id: 'tanya-pr', label: 'Tanya PR 24/7', icon: 'chat', badge: 'Siaga' },
                { id: 'profil', label: 'Profil Siswa', icon: 'account_circle' },
              ].map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
                      active
                        ? 'bg-[#006948] text-white dark:bg-[#4edea3] dark:text-[#003824] font-bold shadow-sm'
                        : 'text-slate-600 dark:text-[#bbcabf] hover:bg-slate-100 dark:hover:bg-[#262a34]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name={item.icon} className="text-[20px]" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 m-4 bg-slate-50 dark:bg-[#1c1f29] rounded-2xl flex flex-col gap-2 border border-slate-200/60 dark:border-transparent text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-[#bbcabf] font-medium">Target Semester</span>
              <span className="font-bold text-[#006948] dark:text-[#4edea3]">88%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#31353f] overflow-hidden">
              <div className="h-full bg-[#006948] dark:bg-[#4edea3] rounded-full" style={{ width: '88%' }}></div>
            </div>
            <div className="flex justify-between items-center pt-1 text-[11px]">
              <span className="text-slate-400">Sisa Kuota PR</span>
              <span className="font-bold text-amber-700 dark:text-[#ffb95f]">14 Sesi</span>
            </div>
          </div>
        </aside>

        {/* 2. TOP NAVBAR */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white/95 dark:bg-[#0a0e17]/90 backdrop-blur-xl z-40 flex items-center justify-between px-4 md:px-8 border-b border-slate-200/80 dark:border-[#31353f] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center hidden sm:flex">
              <Icon name="search" className="absolute left-3 text-slate-400 text-[18px]" />
              <input
                type="text"
                placeholder="Cari materi, bab, kuis..."
                className="w-64 lg:w-80 pl-9 pr-10 py-2 rounded-xl bg-slate-100 dark:bg-[#181b25] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none border border-transparent focus:border-[#006948] dark:focus:border-[#4edea3]"
              />
              <span className="absolute right-3 px-1.5 py-0.5 rounded bg-white dark:bg-[#262a34] text-[10px] font-bold text-slate-400 shadow-xs">⌘K</span>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#4edea3] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-[#4edea3] animate-pulse"></span>
              <span>Sesi KBM Terjadwal: {todaySchedule ? `${todaySchedule.day_of_week} • ${todaySchedule.session_time?.substring(0, 5)} WIB` : '16:00 WIB'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold border transition-all cursor-pointer bg-slate-100 dark:bg-[#262a34] text-slate-700 dark:text-amber-400 border-slate-200 dark:border-[#31353f]"
              title="Ganti Mode Terang / Gelap"
            >
              <Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} className="text-[17px]" />
              <span className="uppercase text-[10px]">{isDarkMode ? 'Terang' : 'Gelap'}</span>
            </button>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-[#ffb95f] border border-amber-500/20 text-xs font-bold">
              <Icon name="bolt" fill className="text-[16px] text-amber-500" />
              <span>{currentXp} XP</span>
            </div>

            <div className="flex items-center gap-2 pl-2">
              <div className="flex flex-col text-right hidden lg:flex">
                <span className="text-xs font-bold leading-tight">{studentProfile?.student_name || 'Murid Cerdas'}</span>
                <span className="text-[10px] text-slate-400">Kelas 8 SMP • Level {currentLevel}</span>
              </div>
              <div
                onClick={() => setActiveTab('profil')}
                className="w-8 h-8 rounded-full bg-[#006948] dark:bg-[#4edea3] text-white dark:text-[#003824] flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
              >
                <Icon name="person" className="text-[18px]" />
              </div>
            </div>
          </div>
        </header>

        {/* 3. MAIN WORKSPACE */}
        <main className="w-full pt-16 md:pl-64 flex-1 pb-24">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

            {!isLoggedIn ? (
              /* FORMULIR LOGIN */
              <div className="max-w-md mx-auto mt-12 p-6 rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xl space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#4edea3] border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                    <Icon name="lock" className="text-[24px]" />
                  </div>
                  <h2 className="text-lg font-bold">Masuk Portal Siswa</h2>
                  <p className="text-xs text-slate-400">Gunakan nomor WhatsApp dan kata sandi akun murid Anda</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-2 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Nomor WhatsApp Terdaftar</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3"><Icon name="call" className="text-[18px] text-slate-400" /></div>
                      <input
                        type="tel"
                        required
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="Contoh: 0812xxxxxxxx"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl font-medium outline-none border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#3c4a42] text-slate-900 dark:text-white focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kata Sandi Akun</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3"><Icon name="key" className="text-[18px] text-slate-400" /></div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl font-medium outline-none border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#3c4a42] text-slate-900 dark:text-white focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        <Icon name={showLoginPassword ? 'visibility_off' : 'visibility'} className="text-[18px]" />
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <p className="text-[11px] font-bold text-rose-500 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 text-center">
                      {authError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loadingAuth}
                    className="w-full py-3 rounded-xl font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all bg-[#006948] hover:bg-emerald-700 text-white dark:bg-[#4edea3] dark:hover:bg-[#6ffbbe] dark:text-[#003824] cursor-pointer"
                  >
                    {loadingAuth ? <Icon name="progress_activity" className="animate-spin text-[18px]" /> : <Icon name="arrow_forward" className="text-[18px]" />}
                    <span>Buka Dashboard Belajar</span>
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* 1. TAB: BERANDA */}
                {activeTab === 'beranda' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] font-semibold text-slate-800 dark:text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#4edea3] animate-ping"></span>
                          Portal Terverifikasi
                        </span>
                        <span>• SMPN 115 Jakarta</span>
                        <span>• ID: CRD-88219</span>
                      </div>
                      <span className="font-medium text-emerald-700 dark:text-[#4edea3]">Semester Genap • TA Berjalan</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                      <div className="max-w-2xl">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                          Selamat Datang Kembali, {studentProfile?.student_name || 'Murid Cerdas'} 👋
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#bbcabf] mt-1 leading-relaxed">
                          Semua progres belajarmu tersinkronisasi. Evaluasi KBM pekan ini berpredikat <span className="text-[#006948] dark:text-[#4edea3] font-bold">Sangat Memuaskan (A+)</span>.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowInvoiceModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="download" className="text-[18px] text-emerald-600" />
                          <span>Unduh Kuitansi PDF</span>
                        </button>

                        <button
                          onClick={() => setShowSosModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-bold shadow-xs hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="fmd_bad" className="text-[18px]" />
                          <span>SOS Kendala KBM</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveChatSchedule(todaySchedule || { id: 'default' });
                            setShowChatModal(true);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-[#006948] hover:bg-emerald-700 text-white dark:bg-[#4edea3] dark:text-[#003824] font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="forum" className="text-[18px]" />
                          <span>Tanya Tutor Langsung</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 Cards Metrik Ringkasan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Level Peringkat</span>
                          <p className="text-sm font-bold mt-1">Level {currentLevel}: Penjelajah Sains</p>
                          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Top 5% Siswa</span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#4edea3]/20 flex items-center justify-center text-[#006948] dark:text-[#4edea3]">
                          <Icon name="workspace_premium" className="text-[24px]" />
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">XP Akumulasi</span>
                          <span className="text-amber-600 font-bold text-[11px]">Level Up: 550 XP</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span>{currentXp} <span className="text-slate-400 font-normal">/ 2.000 XP</span></span>
                            <span className="text-emerald-600">{progressPercent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#31353f] overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-600 to-amber-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Streak Belajar</span>
                          <p className="text-sm font-bold mt-1 flex items-center gap-1">
                            14 Hari Beruntun <Icon name="local_fire_department" fill className="text-[18px] text-amber-500" />
                          </p>
                          <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">Reward H-15: +100 XP</span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                          <Icon name="bolt" fill className="text-[24px]" />
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Standar Materi</span>
                          <p className="text-sm font-bold mt-1">Kurikulum Merdeka 2026</p>
                          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Fase D • Target 90+</span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#262a34] flex items-center justify-center text-slate-600">
                          <Icon name="menu_book" className="text-[24px]" />
                        </div>
                      </div>
                    </div>

                    {/* TATA LETAK 2 KOLOM: AREA UTAMA (65%) & PENDUKUNG (35%) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* KOLOM UTAMA (65% / 8 COLS) */}
                      <div className="lg:col-span-8 space-y-6">
                        
                        {/* 1. KARTU SESI & STATUS MENTOR DINAMIS */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-6 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-[#4edea3]">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                              Sesi Hari Ini
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#4edea3] text-xs font-bold">
                              {todaySchedule?.session_time ? `${todaySchedule.session_time.substring(0, 5)} WIB` : '16:00 - 17:30 WIB'}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-lg">{todaySchedule?.today_topic || 'Matematika: Aljabar Lanjutan & Pemfaktoran'}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Fokus: Persamaan Kuadrat, Faktorisasi Bentuk Aljabar, dan Pemecahan Soal Cerita Terapan.
                            </p>
                          </div>

                          {/* SINKRONISASI MENTOR: TERIKAT ATAU SEDANG DIALOKASIKAN */}
                          {todaySchedule?.claimed_by_tutor_name && !todaySchedule?.is_substitute_needed ? (
                            <div className="p-4 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between border border-slate-200/60 dark:border-transparent">
                              <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-xl bg-emerald-600 dark:bg-[#4edea3] text-white dark:text-[#003824] flex items-center justify-center font-bold text-base shadow-xs">
                                  <Icon name="person" className="text-[26px]" />
                                </div>
                                <div className="flex flex-col text-xs">
                                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    {todaySchedule.claimed_by_tutor_name}
                                  </span>
                                  <span className="text-emerald-600 font-semibold text-[11px] mt-0.5">Mentor Utama Aktif • Kurikulum Merdeka</span>
                                </div>
                              </div>
                              <button
                                onClick={() => openChatWithTutor(todaySchedule)}
                                className="px-3.5 py-2 bg-white dark:bg-[#262a34] rounded-xl border border-slate-200 dark:border-transparent text-emerald-600 font-bold hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Icon name="chat" className="text-[16px]" />
                                <span>Chat Mentor</span>
                              </button>
                            </div>
                          ) : (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3.5 text-xs">
                              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                                <Icon name="hourglass_top" className="text-[22px]" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm text-amber-800 dark:text-amber-400">
                                  Sedang Dalam Proses Alokasi Mentor Baru
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                  Mentor sedang dialokasikan ulang oleh Kepala Sekolah. Jadwal dan kuota KBM Anda tetap aman.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* TOMBOL MASUK KELAS ONLINE JITSI MEET */}
                          {todaySchedule && (
                            <button
                              onClick={() => setOnlineClassSchedule(todaySchedule)}
                              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <Icon name="video_camera_front" className="text-[20px]" />
                              <span>Masuk Ruang Kelas Online (Jitsi Meet)</span>
                            </button>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl text-xs space-y-1">
                              <span className="text-slate-400 font-semibold text-[10px] uppercase">Lokasi Pertemuan</span>
                              <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                                <Icon name="home_pin" className="text-emerald-600 text-[16px]" />
                                {studentProfile?.address || 'Kelapa Gading Barat, Jakarta Utara'}
                              </p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl text-xs space-y-1">
                              <span className="text-slate-400 font-semibold text-[10px] uppercase">Akses Wali Murid</span>
                              <button
                                onClick={() => {
                                  if (todaySchedule?.parent_access_token) {
                                    window.open(`${window.location.origin}/pantau/${todaySchedule.parent_access_token}`, '_blank');
                                  } else {
                                    alert('Tautan pantau orang tua akan aktif otomatis saat jadwal KBM berjalan.');
                                  }
                                }}
                                className="font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Icon name="family_restroom" className="text-[16px]" /> Buka Pantauan Ortu Langsung
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-[#31353f]/50">
                            <button
                              onClick={() => {
                                setRescheduleTargetSchedule(todaySchedule);
                                setShowRescheduleModal(true);
                              }}
                              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <Icon name="edit_calendar" className="text-[18px]" /> Ajukan Reschedule
                            </button>
                          </div>
                        </div>

                        {/* 2. TUGAS & PR BERJALAN */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-6 shadow-xs space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Icon name="assignment" className="text-[22px] text-emerald-600" />
                              <h3 className="font-bold text-base">Tugas & PR Berjalan</h3>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-[#ffb95f] text-xs font-bold">
                              {assignments.filter(a => a.status === 'pending').length} Menunggu Penyerahan
                            </span>
                          </div>

                          <div className="space-y-3 text-xs">
                            {assignments.length === 0 ? (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1c1f29] space-y-2 border border-slate-200/60 dark:border-transparent">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Matematika • Latihan #04</span>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">Latihan Aljabar Lanjutan Hal 42</h4>
                                  </div>
                                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">+20 XP</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                  <span className="text-rose-600 font-semibold flex items-center gap-1 text-[11px]">
                                    <Icon name="schedule" className="text-[14px]" /> Batas: Besok, 12:00 WIB
                                  </span>
                                  <button
                                    onClick={() => {
                                      setTargetAssignment({ id: 'dummy', title: 'Latihan Aljabar Lanjutan Hal 42' });
                                      setShowUploadPrModal(true);
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#006948] hover:bg-emerald-700 text-white dark:bg-[#4edea3] dark:text-[#003824] font-bold text-xs shadow-xs cursor-pointer"
                                  >
                                    Unggah Lembar Kerja
                                  </button>
                                </div>
                              </div>
                            ) : (
                              assignments.map((ass) => (
                                <div key={ass.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#1c1f29] space-y-2 border border-slate-200/60 dark:border-transparent">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ass.title}</h4>
                                      <p className="text-slate-400 mt-0.5">{ass.instructions}</p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">+20 XP</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/40">
                                    <span className="text-rose-600 font-semibold text-[11px]">
                                      Batas: {ass.due_date ? new Date(ass.due_date).toLocaleDateString('id-ID') : 'Besok'}
                                    </span>
                                    {ass.status === 'submitted' ? (
                                      <span className="text-emerald-600 font-bold">✓ Terkumpul</span>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setTargetAssignment(ass);
                                          setShowUploadPrModal(true);
                                        }}
                                        className="px-3.5 py-1.5 rounded-lg bg-[#006948] hover:bg-emerald-700 text-white dark:bg-[#4edea3] dark:text-[#003824] font-bold text-xs shadow-xs cursor-pointer"
                                      >
                                        Unggah Lembar Kerja
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* 3. TANTANGAN KUIS & TARGET PEKAN INI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Kuis Diagnostik */}
                          <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Icon name="psychology" className="text-[20px] text-amber-500" />
                                <h3 className="font-bold text-sm">Kuis Diagnostik</h3>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-bold">+15 XP</span>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl space-y-1 text-xs">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                {quizzes[0]?.subject_topic || 'Aljabar Dasar'}
                              </span>
                              <p className="font-bold text-xs">
                                {quizzes[0]?.question || 'Berapakah nilai x dari persamaan: 3x - 5 = 16 ?'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                              {[
                                quizzes[0]?.option_a ? `A. ${quizzes[0].option_a}` : 'A.  x = 5',
                                quizzes[0]?.option_b ? `B. ${quizzes[0].option_b}` : 'B.  x = 7',
                                quizzes[0]?.option_c ? `C. ${quizzes[0].option_c}` : 'C.  x = 8',
                                quizzes[0]?.option_d ? `D. ${quizzes[0].option_d}` : 'D.  x = 9',
                              ].map((opt, idx) => {
                                const optLetter = opt.substring(0, 1);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleAnswerQuiz(optLetter)}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                      selectedQuizOption === optLetter
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/50 dark:text-emerald-300 shadow-xs'
                                        : 'bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-transparent'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {selectedQuizOption === optLetter && <Icon name="check_circle" fill className="text-emerald-600 text-[16px]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Target Belajar Pekan Ini */}
                          <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm">Target Pekan Ini</span>
                              <span className="text-xs font-bold text-emerald-600">66% Selesai</span>
                            </div>
                            <div className="space-y-2 text-xs">
                              {goals.length === 0 ? (
                                <>
                                  <div className="p-2.5 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between">
                                    <span className="line-through text-slate-400">Review Bab 3 Gerak Lurus</span>
                                    <span className="font-semibold text-emerald-600 text-[11px]">Selesai</span>
                                  </div>
                                  <div className="p-2.5 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between">
                                    <span className="line-through text-slate-400">Modul Aljabar Hal 40-42</span>
                                    <span className="font-semibold text-emerald-600 text-[11px]">Selesai</span>
                                  </div>
                                </>
                              ) : (
                                goals.map((g) => (
                                  <div key={g.id} className="p-2.5 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between">
                                    <span className={g.is_completed ? 'line-through text-slate-400' : 'font-bold'}>{g.goal_text}</span>
                                    <span className={`font-semibold text-[11px] ${g.is_completed ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      {g.is_completed ? 'Selesai' : 'Belum'}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* KOLOM PENDUKUNG (35% / 4 COLS) */}
                      <div className="lg:col-span-4 space-y-6">
                        
                        {/* 1. TANYA PR 24/7 CARD */}
                        <div className="bg-gradient-to-br from-[#006948] to-[#00855d] dark:from-[#181b25] dark:to-[#1c1f29] rounded-2xl p-6 text-white shadow-md space-y-3 relative overflow-hidden border border-transparent dark:border-[#31353f]">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">Siaga 24/7</span>
                            <span className="text-[11px] font-semibold text-emerald-200">14 Tutor Aktif</span>
                          </div>
                          <h3 className="text-lg font-bold">Punya Soal Sulit?</h3>
                          <p className="text-xs text-white/85 leading-relaxed">
                            Foto soal matematika atau PR sains Anda. Mentor terverifikasi siap menjawab langkah demi langkah.
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => setShowAskPrModal(true)}
                              className="w-full py-2.5 rounded-xl bg-white text-[#006948] font-bold text-xs shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Icon name="photo_camera" className="text-[18px]" />
                              <span>Tanya Foto / Video PR</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. RAPOR EVALUASI AKADEMIK */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Rapor Akademik</span>
                              <span className="font-bold text-sm">Capaian Terkini</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-[#4edea3]/20 dark:text-[#4edea3] text-xs font-extrabold">
                              {reports[0]?.score ? (reports[0].score >= 90 ? 'Grade A+' : 'Grade A') : 'Grade A+'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-[#1c1f29] rounded-2xl">
                            <div className="text-3xl font-black text-emerald-600 dark:text-[#4edea3] leading-none">
                              {reports[0]?.score || '94'}
                            </div>
                            <div className="text-xs space-y-0.5">
                              <span className="font-bold text-emerald-700 dark:text-[#4edea3] flex items-center gap-1">
                                <Icon name="trending_up" className="text-[15px]" /> +6 Poin Kenaikan
                              </span>
                              <p className="text-slate-500 text-[11px] leading-snug">
                                {reports[0]?.subject_topic ? `Topik: ${reports[0].subject_topic}` : 'Daya serap konsep aljabar sangat baik.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 3. MODUL MATERI PDF */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-sm">Modul Belajar</span>
                            <span className="text-emerald-600 font-bold">{materials.length || 2} Modul Tersedia</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            {materials.length === 0 ? (
                              <>
                                <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <Icon name="picture_as_pdf" className="text-rose-500 text-[20px]" />
                                    <div>
                                      <p className="font-bold text-xs">Rumus Kilat Aljabar</p>
                                      <span className="text-[10px] text-slate-400">PDF • 4.2 MB</span>
                                    </div>
                                  </div>
                                  <Icon name="download" className="text-slate-400 cursor-pointer hover:text-emerald-600" />
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <Icon name="style" className="text-emerald-600 text-[20px]" />
                                    <div>
                                      <p className="font-bold text-xs">Flashcard Gelombang</p>
                                      <span className="text-[10px] text-slate-400">Deck • 2.8 MB</span>
                                    </div>
                                  </div>
                                  <Icon name="download" className="text-slate-400 cursor-pointer hover:text-emerald-600" />
                                </div>
                              </>
                            ) : (
                              materials.map((mat) => (
                                <div key={mat.id} className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <Icon name="picture_as_pdf" className="text-rose-500 text-[20px]" />
                                    <div className="truncate max-w-[140px]">
                                      <p className="font-bold text-xs truncate">{mat.title}</p>
                                      <span className="text-[10px] text-slate-400">Modul Belajar</span>
                                    </div>
                                  </div>
                                  <a href={mat.file_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-600 cursor-pointer">
                                    <Icon name="download" className="text-[18px]" />
                                  </a>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                )}

                {/* 2. TAB: JADWAL KBM */}
                {activeTab === 'jadwal' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold">Jadwal Belajar & Sesi KBM</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Atur dan pantau sesi les tatap muka bersama tutor bimbinganmu.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setScheduleFilter('mendatang')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            scheduleFilter === 'mendatang' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f]'
                          }`}
                        >
                          Mendatang ({schedules.length})
                        </button>
                        <button
                          onClick={() => setScheduleFilter('riwayat')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            scheduleFilter === 'riwayat' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f]'
                          }`}
                        >
                          Riwayat Selesai ({schedules.filter(s => s.completed_sessions > 0).length})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {DAYS_NAME.slice(0, 6).map((d, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveCalendarDay(d)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            activeCalendarDay === d
                              ? 'bg-[#006948] text-white dark:bg-[#4edea3] dark:text-[#003824] font-bold shadow-md'
                              : 'bg-white dark:bg-[#181b25] border-slate-200 dark:border-[#31353f] text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="text-[10px] uppercase">{d}</span>
                          <span className="text-base font-black mt-0.5">{16 + idx}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {schedules.map((s) => (
                        <div key={s.id} className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-600">{s.day_of_week} • {s.session_time?.substring(0, 5) || '16:00'} WIB</span>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                {s.completed_sessions || 0} / {s.target_sessions || 8} Sesi Selesai
                              </span>
                            </div>
                            <h4 className="text-base font-bold mt-1">{s.today_topic || 'Bimbingan Matematika & Sains'}</h4>
                            <p className="text-xs text-slate-500">Tutor: {s.claimed_by_tutor_name || 'Tutor Terikat'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setOnlineClassSchedule(s)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                            >
                              <Icon name="video_camera_front" className="text-[16px]" /> Kelas Online
                            </button>
                            <button
                              onClick={() => {
                                setRescheduleTargetSchedule(s);
                                setShowRescheduleModal(true);
                              }}
                              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold hover:bg-slate-200 cursor-pointer"
                            >
                              Ajukan Reschedule
                            </button>
                            <button
                              onClick={() => openChatWithTutor(s)}
                              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
                            >
                              <Icon name="chat" className="text-[16px]" /> Chat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. TAB: TUGAS & KUIS */}
                {activeTab === 'tugas' && (
                  <div className="space-y-6">
                    <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] text-xs font-bold max-w-md">
                      <button
                        onClick={() => setTaskSubTab('tugas')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${taskSubTab === 'tugas' ? 'bg-white dark:bg-[#262a34] text-[#006948] dark:text-[#4edea3] shadow-xs' : 'text-slate-500'}`}
                      >
                        Tugas Aktif ({assignments.length})
                      </button>
                      <button
                        onClick={() => setTaskSubTab('kuis')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${taskSubTab === 'kuis' ? 'bg-white dark:bg-[#262a34] text-[#006948] dark:text-[#4edea3] shadow-xs' : 'text-slate-500'}`}
                      >
                        Kuis Kilat ({quizzes.length})
                      </button>
                    </div>

                    {taskSubTab === 'tugas' && (
                      <div className="space-y-3">
                        {assignments.length === 0 ? (
                          <div className="p-6 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-amber-600">
                              <span>Besok, 12:00 WIB</span>
                              <span>+20 XP</span>
                            </div>
                            <h3 className="text-base font-bold">Latihan Aljabar Lanjutan Hal 42</h3>
                            <p className="text-xs text-slate-500">5 Soal uraian pemfaktoran bentuk kuadrat sempurna & grafik parabola.</p>
                            <button
                              onClick={() => {
                                setTargetAssignment({ id: 'dummy', title: 'Aljabar Lanjutan Hal 42' });
                                setShowUploadPrModal(true);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-[#006948] text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                            >
                              Unggah Lembar Jawaban PR
                            </button>
                          </div>
                        ) : (
                          assignments.map((ass) => (
                            <div key={ass.id} className="p-6 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs space-y-3">
                              <div className="flex justify-between items-center text-xs font-bold text-amber-600">
                                <span>Batas: {ass.due_date ? new Date(ass.due_date).toLocaleDateString('id-ID') : 'Besok, 12:00 WIB'}</span>
                                <span>+20 XP</span>
                              </div>
                              <h3 className="text-base font-bold">{ass.title}</h3>
                              <p className="text-xs text-slate-500">{ass.instructions}</p>
                              {ass.status === 'submitted' ? (
                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                                  ✓ Jawaban Sudah Diunggah
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setTargetAssignment(ass);
                                    setShowUploadPrModal(true);
                                  }}
                                  className="px-4 py-2.5 rounded-xl bg-[#006948] text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                                >
                                  Unggah Lembar Jawaban PR
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TAB: TANYA PR KILAT */}
                {activeTab === 'tanya-pr' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Icon name="document_scanner" className="text-[26px]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Kirim Pertanyaan Soal / PR Baru</h2>
                          <p className="text-xs text-slate-500">Dapatkan solusi langkah demi langkah terverifikasi dari Master Tutor dalam waktu singkat.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowAskPrModal(true)}
                        className="px-5 py-3 rounded-xl bg-[#006948] text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Icon name="photo_camera" className="text-[18px]" />
                        <span>Ambil Foto / Kirim Video Soal</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-sm">Riwayat Tanya PR Anda ({homeworkHelpList.length})</h3>
                      {homeworkHelpList.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 p-8 bg-white dark:bg-[#181b25] rounded-2xl border border-slate-200 dark:border-[#31353f]">
                          Belum ada pertanyaan PR yang Anda kirimkan.
                        </p>
                      ) : (
                        homeworkHelpList.map((h) => (
                          <div key={h.id} className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-3 text-xs">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm">{h.question_title}</h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${h.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {h.status === 'answered' ? '✓ Terjawab' : 'Menunggu Respons'}
                              </span>
                            </div>

                            {/* Tombol Preview Berkas Soal Murid */}
                            {h.question_photo_url && (
                              <button
                                onClick={() => setPreviewMediaUrl({ 
                                  url: h.question_photo_url, 
                                  type: h.question_media_type || 'image', 
                                  title: h.question_title 
                                })}
                                className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Icon name="visibility" className="text-[15px]" /> Lihat Lampiran Soal ({h.question_media_type === 'video' ? 'Video' : 'Foto'})
                              </button>
                            )}

                            {h.tutor_answer && (
                              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl text-emerald-950 dark:text-emerald-300">
                                <span className="font-bold block text-[10px] uppercase text-emerald-700">Petunjuk Balasan Guru ({h.tutor_name}):</span>
                                <p className="italic mt-0.5">“{h.tutor_answer}”</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 5. TAB: PROFIL SISWA */}
                {activeTab === 'profil' && (
                  <div className="max-w-xl space-y-6">
                    <div className="p-6 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                          <Icon name="person" className="text-[32px]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">{studentProfile?.student_name || 'Murid Cerdas'}</h2>
                          <span className="text-xs font-bold text-emerald-600">ID Siswa: #CRD-89421</span>
                          <p className="text-xs text-slate-400 mt-0.5">Kelas 8 SMP • Juara Matematika</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#31353f] text-xs">
                        <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29]">
                          <span className="text-slate-400">Nomor WhatsApp:</span>
                          <span className="font-bold">{studentProfile?.phone_number || '-'}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29]">
                          <span className="text-slate-400">Paket Langganan:</span>
                          <span className="font-bold text-emerald-600">{studentProfile?.selected_package || 'Bintang Kelas'}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29]">
                          <span className="text-slate-400">Alamat KBM:</span>
                          <span className="font-bold truncate max-w-xs">{studentProfile?.address || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] divide-y divide-slate-100 dark:divide-[#31353f] text-xs font-semibold">
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="w-full p-3.5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#262a34] transition-all rounded-xl cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon name="description" className="text-emerald-600" /> Cetak Lembar Kuitansi PDF
                        </span>
                        <Icon name="chevron_right" className="text-slate-400" />
                      </button>

                      <button
                        onClick={() => setShowProfilePasswordModal(true)}
                        className="w-full p-3.5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#262a34] transition-all rounded-xl cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon name="lock_reset" className="text-emerald-600" /> Ganti Kata Sandi Akun Siswa
                        </span>
                        <Icon name="chevron_right" className="text-slate-400" />
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full p-3.5 flex justify-between items-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all rounded-xl cursor-pointer font-bold"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon name="logout" className="text-[18px]" /> Keluar dari Akun Siswa
                        </span>
                        <Icon name="chevron_right" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </main>

        {/* 4. MOBILE 5-TAB BOTTOM BAR */}
        {isLoggedIn && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#0a0e17]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#1c1f29] pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
            <div className="flex justify-between items-center h-16 max-w-lg mx-auto px-2">
              {[
                { id: 'beranda', label: 'Beranda', icon: 'dashboard' },
                { id: 'jadwal', label: 'Jadwal', icon: 'calendar_month' },
                { id: 'tugas', label: 'Tugas & Kuis', icon: 'assignment' },
                { id: 'tanya-pr', label: 'Tanya PR', icon: 'chat', hasBadge: true },
                { id: 'profil', label: 'Profil', icon: 'account_circle' },
              ].map((bTab) => {
                const active = activeTab === bTab.id;
                return (
                  <button
                    key={bTab.id}
                    onClick={() => setActiveTab(bTab.id as any)}
                    className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all cursor-pointer ${
                      active
                        ? 'text-[#006948] dark:text-[#4edea3] font-bold'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                    }`}
                  >
                    <span className="relative inline-flex items-center">
                      <Icon name={bTab.icon} className="text-[22px]" />
                      {bTab.hasBadge && (
                        <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#0a0e17]"></span>
                      )}
                    </span>
                    <span className="text-[10px] tracking-tight">{bTab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* MODAL KELAS ONLINE JITSI MEET */}
        <AnimatePresence>
          {onlineClassSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] w-full max-w-5xl h-[88vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-slate-200 dark:border-[#31353f] flex items-center justify-between bg-slate-50 dark:bg-[#131823]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Ruang Belajar Online: {onlineClassSchedule.today_topic || 'Sesi KBM'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setOnlineClassSchedule(null)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Tutup Kelas
                  </button>
                </div>
                <div className="flex-1 w-full h-full bg-black">
                  <iframe
                    src={`https://meet.jit.si/CerdasKBM-${onlineClassSchedule.id.slice(0, 8)}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false`}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    className="w-full h-full border-0"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL GANTI JADWAL (RESCHEDULE) */}
        <AnimatePresence>
          {showRescheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Pengajuan Ganti Jadwal KBM</h3>
                  <button onClick={() => setShowRescheduleModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitReschedule} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Pilih Hari Pengganti</label>
                    <select
                      value={rescheduleDay}
                      onChange={(e) => setRescheduleDay(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-semibold"
                    >
                      {DAYS_NAME.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Pukul / Jam Belajar</label>
                    <input
                      type="text"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      placeholder="Contoh: 16:30"
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Alasan Ganti Jadwal</label>
                    <textarea
                      rows={3}
                      required
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="Tulis alasan izin..."
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReschedule}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {submittingReschedule ? 'Mengajukan...' : 'Kirim Permohonan ke Kepala Sekolah'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL KENDALA DARURAT SOS */}
        <AnimatePresence>
          {showSosModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm text-rose-600 flex items-center gap-1.5">
                    <Icon name="e911_emergency" className="text-[20px]" /> Pusat Pengaduan Kendala KBM
                  </h3>
                  <button onClick={() => setShowSosModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitSos} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Jenis Kendala</label>
                    <select
                      value={sosIssueType}
                      onChange={(e) => setSosIssueType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-semibold"
                    >
                      <option value="Guru Belum Datang (+15 Menit)">Guru Belum Datang (+15 Menit)</option>
                      <option value="Guru Berhalangan Tanpa Konfirmasi">Guru Berhalangan Tanpa Konfirmasi</option>
                      <option value="Materi Kurang Sesuai">Materi Kurang Sesuai</option>
                      <option value="Permintaan Ganti Tutor">Permintaan Ganti Tutor</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Keterangan Kendala</label>
                    <textarea
                      rows={3}
                      required
                      value={sosDescription}
                      onChange={(e) => setSosDescription(e.target.value)}
                      placeholder="Ceritakan kendala belajar..."
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingSos}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {submittingSos ? 'Mengirim...' : 'Kirim Pengaduan ke Kepala Sekolah'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL UPLOAD TUGAS PR */}
        <AnimatePresence>
          {showUploadPrModal && targetAssignment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Kirim Lembar Jawaban PR (+20 XP)</h3>
                  <button onClick={() => setShowUploadPrModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitAssignmentPhoto} className="space-y-3">
                  <p className="font-bold text-slate-800 dark:text-white">Tugas: {targetAssignment.title}</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    required
                    onChange={(e) => setAssignmentFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-500/20 file:text-emerald-600 font-bold"
                  />
                  <button
                    type="submit"
                    disabled={submittingAssignment}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {submittingAssignment ? 'Mengunggah Jawaban...' : 'Kirim Berkas Jawaban'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL TANYA PR KILAT 24/7 */}
        <AnimatePresence>
          {showAskPrModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Ajukan Pertanyaan PR Kilat 24/7</h3>
                  <button onClick={() => setShowAskPrModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitAskPr} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Mata Pelajaran</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-semibold"
                    >
                      <option value="Matematika">Matematika</option>
                      <option value="Fisika">Fisika</option>
                      <option value="Kimia">Kimia</option>
                      <option value="Biologi">Biologi</option>
                      <option value="Bahasa Inggris">Bahasa Inggris</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Judul Soal / Pertanyaan</label>
                    <input
                      type="text"
                      required
                      value={askPrTitle}
                      onChange={(e) => setAskPrTitle(e.target.value)}
                      placeholder="Contoh: Nomor 4 Hal 52..."
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Lampirkan Foto Soal / Rekaman Video</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      capture="environment"
                      required
                      onChange={(e) => setAskPrFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-amber-500/20 file:text-amber-600 font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingAskPr}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {submittingAskPr ? 'Mengirimkan...' : 'Kirim Pertanyaan ke Guru'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL PREVIEW MEDIA UNIVERSAL */}
        <AnimatePresence>
          {previewMediaUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-2">
                  <h4 className="font-bold truncate">{previewMediaUrl.title}</h4>
                  <button onClick={() => setPreviewMediaUrl(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[420px]">
                  {previewMediaUrl.type === 'video' ? (
                    <video src={previewMediaUrl.url} controls autoPlay className="w-full max-h-[400px]" />
                  ) : (
                    <img src={previewMediaUrl.url} alt="Berkas" className="w-full h-auto object-contain max-h-[400px]" />
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL INVOICE KUITANSI RESMI */}
        <AnimatePresence>
          {showInvoiceModal && studentProfile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 space-y-4 relative shadow-2xl text-xs">
                <button onClick={() => setShowInvoiceModal(false)} className="absolute top-4 right-4 text-slate-400 print:hidden cursor-pointer"><Icon name="close" /></button>
                
                <div className="border-b-2 border-slate-900 pb-3">
                  <h3 className="font-black text-base">CERDAS ACADEMY</h3>
                  <p className="text-[10px] text-slate-500">Lembaga Bimbingan Belajar Privat Tatap Muka ke Rumah</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1"><span>Nama Siswa:</span><span className="font-bold">{studentProfile.student_name}</span></div>
                  <div className="flex justify-between border-b pb-1"><span>WhatsApp:</span><span className="font-bold">{studentProfile.phone_number}</span></div>
                  <div className="flex justify-between border-b pb-1"><span>Paket Belajar:</span><span className="font-bold">{studentProfile.selected_package}</span></div>
                  <div className="flex justify-between border-b pb-1"><span>Jadwal Sesi:</span><span className="font-bold">{studentProfile.selected_days}</span></div>
                  <div className="flex justify-between pt-1 text-sm font-extrabold text-emerald-700"><span>Status:</span><span>LUNAS & TERVERIFIKASI</span></div>
                </div>

                <button onClick={() => window.print()} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl print:hidden flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                  <Icon name="print" /> Cetak Lembar Kuitansi
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL GANTI KATA SANDI SISWA */}
        <AnimatePresence>
          {showProfilePasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Icon name="lock_reset" className="text-emerald-600" /> Ganti Kata Sandi Akun
                  </h3>
                  <button onClick={() => setShowProfilePasswordModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block mb-1 font-semibold">Kata Sandi Baru (Min. 6 Karakter)</label>
                    <input
                      type="password"
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Masukkan sandi baru..."
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-3 bg-[#006948] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {savingPassword ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL POP-UP CHAT TUTOR */}
        <AnimatePresence>
          {showChatModal && activeChatSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-5 shadow-2xl flex flex-col h-[520px] text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-2.5">
                  <div>
                    <h4 className="font-bold">Chat: {activeChatSchedule.claimed_by_tutor_name || 'Tutor Cerdas'}</h4>
                    <p className="text-[10px] text-emerald-600">Dipantau Kepala Sekolah</p>
                  </div>
                  <button onClick={() => setShowChatModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-slate-400 py-16">Belum ada obrolan dengan tutor.</p>
                  ) : (
                    chatMessages.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-2xl max-w-[80%] ${
                          c.sender_role === 'murid'
                            ? 'bg-emerald-600 text-white ml-auto'
                            : 'bg-slate-100 dark:bg-[#262a34] text-slate-800 dark:text-slate-200 mr-auto'
                        }`}
                      >
                        <p className="text-[9px] font-bold uppercase opacity-75">{c.sender_name}</p>
                        <p>{c.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-[#31353f]">
                  <input
                    type="text"
                    value={chatMsgInput}
                    onChange={(e) => setChatMsgInput(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 p-2 bg-slate-50 dark:bg-[#1c1f29] border border-slate-200 dark:border-[#31353f] rounded-xl outline-none"
                  />
                  <button type="submit" className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer">
                    <Icon name="send" className="text-[18px]" />
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}