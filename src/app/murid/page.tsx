'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import imageCompression from 'browser-image-compression';

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

const WEEK_DAYS = [
  { id: 'Sen', day: 'SEN', date: 16, dot: 'bg-slate-300' },
  { id: 'Sel', day: 'SEL', date: 17, dot: 'bg-emerald-500', isToday: true },
  { id: 'Rab', day: 'RAB', date: 18, dot: 'bg-transparent' },
  { id: 'Kam', day: 'KAM', date: 19, dot: 'bg-amber-500' },
  { id: 'Jum', day: 'JUM', date: 20, dot: 'bg-emerald-500' },
  { id: 'Sab', day: 'SAB', date: 21, dot: 'bg-emerald-500' },
  { id: 'Min', day: 'MIN', date: 22, dot: 'bg-transparent', off: true },
];

export default function MuridDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'beranda' | 'tugas' | 'jadwal' | 'rapor' | 'tanya-pr' | 'profil'>('beranda');

  // Autentikasi Siswa
  const [studentPhone, setStudentPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Data Supabase & Gamifikasi
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reschedules, setReschedules] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any | null>(null);
  const [homeworkHelpList, setHomeworkHelpList] = useState<any[]>([]);

  // Sub-filter & State Halaman
  const [scheduleFilterTab, setScheduleFilterTab] = useState<'mendatang' | 'riwayat' | 'izin'>('mendatang');
  const [activeCalendarDay, setActiveCalendarDay] = useState('Sel');
  const [taskSubTab, setTaskSubTab] = useState<'tugas' | 'kuis' | 'riwayat'>('tugas');
  const [selectedQuizOption, setSelectedQuizOption] = useState<string>('B');
  const [selectedSubject, setSelectedSubject] = useState('Matematika');

  // Modal & Formulir
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);
  const [newScheduleDay, setNewScheduleDay] = useState('Sen');
  const [newScheduleTime, setNewScheduleTime] = useState('16:00');
  const [newScheduleTopic, setNewScheduleTopic] = useState('Matematika & Logika');
  const [newScheduleAddress, setNewScheduleAddress] = useState('');
  const [newScheduleMapsUrl, setNewScheduleMapsUrl] = useState('');
  const [selectedTutorChoice, setSelectedTutorChoice] = useState('');
  const [availableTutors, setAvailableTutors] = useState<any[]>([]);
  const [savingNewSchedule, setSavingNewSchedule] = useState(false);

  // Ruang Kelas Online Jitsi Meet
  const [onlineClassSchedule, setOnlineClassSchedule] = useState<any | null>(null);

  // Modal State Tambahan
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

  // Switch Pengaturan Profil
  const [notifWaH2, setNotifWaH2] = useState(true);
  const [notifTugasHarian, setNotifTugasHarian] = useState(true);
  const [laporRaporWa, setLaporRaporWa] = useState(true);
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState(true);

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

      if (!error && data && (data.is_approved || data.is_verified)) {
        setStudentProfile(data);
        setNewScheduleAddress(data.address || '');
        setNewScheduleMapsUrl(data.maps_url || '');
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

      if (!data.is_approved && !data.is_verified) {
        setAuthError('Akun Anda masih dalam antrean verifikasi pembayaran oleh Kepala Sekolah.');
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
      setNewScheduleAddress(data.address || '');
      setNewScheduleMapsUrl(data.maps_url || '');
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

  const fetchTutorsForSelection = async () => {
    try {
      const { data, error } = await supabase
        .from('tutor_applications')
        .select('*')
        .order('full_name', { ascending: true });

      if (data && !error) setAvailableTutors(data);
    } catch (err) {
      console.error('Gagal mengambil daftar guru:', err);
    }
  };

  const handleSaveNewSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;

    setSavingNewSchedule(true);
    try {
      const tutorAssigned = selectedTutorChoice.trim() !== '' ? selectedTutorChoice.trim() : null;
      const scheduleStatus = tutorAssigned ? 'claimed' : 'open';

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const payload: Record<string, any> = {
        student_name: studentProfile.student_name,
        student_phone: studentProfile.phone_number,
        student_address: newScheduleAddress || studentProfile.address || 'Alamat Siswa',
        maps_url: newScheduleMapsUrl || studentProfile.maps_url || null,
        day_of_week: newScheduleDay,
        session_time: `${newScheduleTime}:00`,
        today_topic: newScheduleTopic,
        month_period: firstDayOfMonth,
        target_sessions: 8,
        completed_sessions: 0,
        status: scheduleStatus,
        claimed_by_tutor_name: tutorAssigned,
        is_substitute_needed: false
      };

      const { data: existingSchedules } = await supabase
        .from('schedules')
        .select('id')
        .eq('student_phone', studentProfile.phone_number);

      if (existingSchedules && existingSchedules.length > 0) {
        const { error: updErr } = await supabase
          .from('schedules')
          .update(payload)
          .eq('student_phone', studentProfile.phone_number);
        if (updErr) throw updErr;
      } else {
        const { error: schErr } = await supabase
          .from('schedules')
          .insert([{ ...payload, student_grade: studentProfile.grade || 'SMP' }]);
        if (schErr) throw schErr;
      }

      await supabase
        .from('registrations')
        .update({ 
          has_scheduled: true,
          address: payload.student_address,
          maps_url: payload.maps_url 
        })
        .eq('id', studentProfile.id);

      confetti({ particleCount: 90, spread: 70 });
      alert(tutorAssigned ? `Horeee! 🎉 Mentor kamu adalah Kak ${tutorAssigned}.` : 'Jadwal berhasil disimpan!');

      setShowCreateScheduleModal(false);
      fetchDashboardData(studentProfile.phone_number, studentProfile.student_name);
    } catch (err: any) {
      alert('Gagal mengatur jadwal: ' + err.message);
    } finally {
      setSavingNewSchedule(false);
    }
  };

  const handleLogout = () => {
    if (!confirm('Apakah kamu yakin ingin keluar dari akun murid Cerdas?')) return;
    localStorage.removeItem('cerdas_student_phone');
    setIsLoggedIn(false);
    setStudentProfile(null);
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
    if (!rescheduleReason.trim()) return alert('Tuliskan alasan ganti jadwal!');

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

      const textWA = encodeURIComponent(
        `Halo Kepala Sekolah Cerdas Academy,\nSaya atas nama *${studentProfile?.student_name}* (Murid) mengajukan ganti jadwal:\nSemula: ${originalInfo}\nUsulan: ${proposedInfo}\nAlasan: ${rescheduleReason}`
      );
      window.open(`https://wa.me/${HEADMASTER_PHONE}?text=${textWA}`, '_blank');

      alert('Permohonan ganti jadwal berhasil diajukan!');
      setShowRescheduleModal(false);
      setRescheduleReason('');
      fetchDashboardData(studentProfile.phone_number, studentProfile.student_name);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
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
        `🚨 *LAPORAN PENGADUAN KENDALA KBM CERDAS ACADEMY* 🚨\nSiswa: *${studentProfile?.student_name}*\nKendala: *${sosIssueType}*\nKet: ${sosDescription}`
      );
      window.open(`https://wa.me/${HEADMASTER_PHONE}?text=${textWA}`, '_blank');

      alert('Laporan kendala berhasil dikirim!');
      setShowSosModal(false);
      setSosDescription('');
    } catch (err: any) {
      alert('Gagal: ' + err.message);
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
        .update({ submission_photo_url: urlData.publicUrl, status: 'submitted' })
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
      alert('Tugas berhasil dikumpulkan! (+20 XP)');
      setShowUploadPrModal(false);
      setAssignmentFile(null);
      fetchDashboardData(studentProfile.phone_number, studentProfile.student_name);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
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
      alert('Gagal: ' + err.message);
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
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#bbcabf] mt-1">PORTAL MURID</span>
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
                { id: 'tanya-pr', label: 'Tanya PR 24/7', icon: 'chat', badge: 'Bantuan' },
                { id: 'rapor', label: 'Rapor & Modul', icon: 'grade' },
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
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
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

        {/* 2. TOP EXECUTIVE NAVBAR */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white/95 dark:bg-[#0a0e17]/90 backdrop-blur-xl z-40 flex items-center justify-between px-4 md:px-8 border-b border-slate-200/80 dark:border-[#31353f] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center hidden sm:flex">
              <Icon name="search" className="absolute left-3 text-slate-400 text-[18px]" />
              <input
                type="text"
                placeholder="Cari materi, bab, kuis..."
                className="w-64 lg:w-80 pl-9 pr-10 py-2 rounded-xl bg-slate-100 dark:bg-[#181b25] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none border border-transparent focus:border-[#006948]"
              />
              <span className="absolute right-3 px-1.5 py-0.5 rounded bg-white dark:bg-[#262a34] text-[10px] font-bold text-slate-400 shadow-xs">⌘K</span>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#4edea3] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-[#4edea3] animate-pulse"></span>
              <span>Sesi Hari Ini: 16:00 WIB • Matematika</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold border transition-all cursor-pointer bg-slate-100 dark:bg-[#262a34] text-slate-700 dark:text-amber-400 border-slate-200 dark:border-[#31353f]"
              title="Ganti Mode Tampilan"
            >
              <Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} className="text-[17px]" />
              <span className="uppercase text-[10px]">{isDarkMode ? 'Terang' : 'Gelap'}</span>
            </button>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-[#ffb95f] border border-amber-500/20 text-xs font-bold">
              <Icon name="bolt" fill className="text-[16px] text-amber-500" />
              <span>1.840 XP</span>
            </div>

            <div className="flex items-center gap-2 pl-2">
              <div className="flex flex-col text-right hidden lg:flex">
                <span className="text-xs font-bold leading-tight">{studentProfile?.student_name || 'Raditya Pratama'}</span>
                <span className="text-[10px] text-slate-400">{studentProfile?.grade || 'Kelas 8 SMP'} • Level 4</span>
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
                    <input
                      type="tel"
                      required
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="Contoh: 0812xxxxxxxx"
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#3c4a42] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kata Sandi Akun</label>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#3c4a42] text-slate-900 dark:text-white"
                    />
                  </div>

                  {authError && <p className="text-rose-500 font-bold">{authError}</p>}

                  <button
                    type="submit"
                    disabled={loadingAuth}
                    className="w-full py-3 rounded-xl font-extrabold bg-[#006948] text-white shadow-md cursor-pointer"
                  >
                    {loadingAuth ? 'Memverifikasi...' : 'Buka Dashboard Belajar'}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* ========================================================================= */}
                {/* 1. TAB: BERANDA (GAMBAR 1)                                                */}
                {/* ========================================================================= */}
                {activeTab === 'beranda' && (
                  <div className="space-y-6">
                    {/* Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] font-semibold text-slate-800 dark:text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                          Portal Terverifikasi
                        </span>
                        <span>• SMPN 115 Jakarta Selatan</span>
                        <span>• ID: CRD-88219</span>
                      </div>
                      <span className="font-medium text-slate-600 dark:text-slate-400">Semester Genap 2024 • TA 2023/2024</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                          Selamat Datang Kembali, Raditya Pratama 👋
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#bbcabf] mt-1">
                          Semua progres semester genap tersinkronisasi. Evaluasi KBM pekan ini berpredikat <strong className="text-emerald-600 font-bold">Sangat Memuaskan (A+)</strong>.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowInvoiceModal(true)}
                          className="px-4 py-2 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Icon name="download" className="text-emerald-600" /> Unduh Rapor PDF
                        </button>
                        <button
                          onClick={() => setShowSosModal(true)}
                          className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Icon name="fmd_bad" /> SOS Kendala KBM
                        </button>
                        <button
                          onClick={() => {
                            setActiveChatSchedule(todaySchedule || { id: 'default' });
                            setShowChatModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#006948] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="forum" /> Tanya Tutor Langsung
                        </button>
                      </div>
                    </div>

                    {/* 4 Cards Metrik Ringkasan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">LEVEL PERINGKAT</span>
                          <p className="text-sm font-bold mt-0.5">Level 4: Penjelajah Sains</p>
                          <span className="text-[11px] text-slate-400 font-medium">Top 5% Se-Kabupaten</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#4edea3]/20 flex items-center justify-center text-[#006948] dark:text-[#4edea3]">
                          <Icon name="workspace_premium" className="text-[22px]" />
                        </div>
                      </div>

                      <div className="p-4 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400">XP AKUMULASI</span>
                          <span className="text-amber-600 font-bold text-[10px]">Level Up: 550 XP lagi</span>
                        </div>
                        <div className="mt-1">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span>1.450 <span className="text-slate-400 font-normal">/ 2.000 XP</span></span>
                            <span className="text-emerald-600 font-bold">72%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#31353f] overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">STREAK BELAJAR</span>
                          <p className="text-sm font-bold mt-0.5 flex items-center gap-1">
                            14 Hari Beruntun <Icon name="local_fire_department" fill className="text-[16px] text-amber-500" />
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium">Reward Hari ke-15: +100 XP</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                          <Icon name="bolt" fill className="text-[22px]" />
                        </div>
                      </div>

                      <div className="p-4 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">STANDAR MATERI</span>
                          <p className="text-sm font-bold mt-0.5">Kurikulum Merdeka 2024</p>
                          <span className="text-[11px] text-slate-400 font-medium">Fase D • Target Rerata 90+</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#262a34] flex items-center justify-center text-slate-600">
                          <Icon name="menu_book" className="text-[22px]" />
                        </div>
                      </div>
                    </div>

                    {/* 3 KOLOM UTAMA BERANDA */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* KOLOM KIRI: SESI HARI INI & EVALUASI */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                              SESI HARI INI
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                              16:00 - 17:30 WIB
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-base">Matematika: Persiapan UTS</h3>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              Fokus: Persamaan Kuadrat, Faktorisasi Bentuk Aljabar, dan Pemecahan Soal Cerita Terapan.
                            </p>
                          </div>

                          {/* Profil Tutor */}
                          <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <img
                                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
                                alt="Kak Sarah"
                                className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                              />
                              <div className="text-xs">
                                <span className="font-bold block">Kak Sarah Nabilah, S.Si</span>
                                <span className="text-[10px] text-slate-400">Alumni Matematika UI • Rating 4.98 ★</span>
                              </div>
                            </div>
                            <span className="text-amber-500 text-sm">★</span>
                          </div>

                          {/* Radar Tutor Perjalanan */}
                          <div className="p-3 bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between items-center text-[11px] font-semibold text-sky-900 dark:text-sky-300">
                              <span>Tutor dalam Radius 1.2 km</span>
                              <span>Tiba: ~15:46 WIB</span>
                            </div>
                            <div className="relative h-24 rounded-lg overflow-hidden border border-sky-200">
                              <iframe
                                title="Radar Tutor"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                src="https://maps.google.com/maps?q=Kelapa+Gading+Jakarta&t=&z=14&ie=UTF8&iwloc=&output=embed"
                                className="w-full h-full pointer-events-none"
                              />
                              <div className="absolute bottom-1 left-2 px-2 py-0.5 rounded bg-white/90 text-[10px] font-bold text-slate-800">
                                Tatap Muka di Rumah (Kelapa Gading Barat)
                              </div>
                            </div>
                          </div>

                          {/* Action Row */}
                          <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                            <button onClick={() => setShowChatModal(true)} className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-center flex items-center justify-center gap-1 cursor-pointer">
                              <Icon name="chat" className="text-[14px]" /> Chat
                            </button>
                            <button onClick={() => setActiveTab('jadwal')} className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-center flex items-center justify-center gap-1 cursor-pointer">
                              <Icon name="calendar_month" className="text-[14px]" /> Kalender
                            </button>
                            <button onClick={() => alert('Fitur pantau lokasi tutor aktif via GPS.')} className="py-2 px-2 rounded-xl bg-emerald-50 text-emerald-800 text-center flex items-center justify-center gap-1 cursor-pointer">
                              <Icon name="location_searching" className="text-[14px]" /> Pantau Ortu
                            </button>
                          </div>
                        </div>

                        {/* Rapor Akademik Periode Februari */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">RAPOR AKADEMIK</span>
                              <h4 className="font-bold text-sm">Evaluasi Periode Februari</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                              Sangat Memuaskan (A+)
                            </span>
                          </div>

                          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl">
                            <div className="w-14 h-14 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-xl text-slate-900 dark:text-white shrink-0">
                              94<span className="text-[10px] text-slate-400">/100</span>
                            </div>
                            <div className="text-xs space-y-0.5">
                              <span className="font-bold text-emerald-600 block">📈 +6 Poin dari Januari</span>
                              <p className="text-[11px] text-slate-500 leading-snug">
                                Daya serap konsep kalkulus dasar dan trigonometri naik tajam dengan tingkat ketelitian 96%.
                              </p>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 italic border-l-2 border-emerald-500 pl-3 leading-relaxed">
                            "Raditya menunjukkan pemahaman analitis yang sangat konsisten. Latihan kecepatan penyelesaian soal persamaan kuadrat sudah berada di atas rerata target kurikulum."
                          </p>
                        </div>
                      </div>

                      {/* KOLOM TENGAH: TUGAS, KUIS CEPAT & CHECKLIST */}
                      <div className="lg:col-span-4 space-y-4">
                        {/* Tugas & PR Berjalan */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm flex items-center gap-1.5">
                              <Icon name="assignment" className="text-emerald-600 text-[18px]" /> Tugas &amp; PR Berjalan
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400">2 Menunggu Penyerahan</span>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl border space-y-2 text-xs">
                            <div className="flex justify-between items-start font-bold">
                              <div>
                                <span className="text-[10px] text-emerald-600 uppercase block">MATEMATIKA • PR #04</span>
                                <span className="text-slate-900 dark:text-white">Latihan Aljabar Lanjutan Hal 42</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">+20 XP</span>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-rose-600 text-[10px] font-semibold">Batas: Besok, 12:00 WIB</span>
                              <button onClick={() => setShowUploadPrModal(true)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer">
                                📤 Unggah Lembar Kerja
                              </button>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl border space-y-2 text-xs">
                            <div className="flex justify-between items-start font-bold">
                              <div>
                                <span className="text-[10px] text-blue-600 uppercase block">FISIKA • KUIS MANDIRI</span>
                                <span className="text-slate-900 dark:text-white">Gerak Lurus Beraturan (GLB) &amp; GLBB</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">+20 XP</span>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-slate-400 text-[10px]">Batas: Jumat, 18:00 WIB</span>
                              <button onClick={() => setActiveTab('tugas')} className="px-3 py-1 bg-slate-200 text-slate-800 rounded-lg font-bold text-[10px] cursor-pointer">
                                Mulai Kuis
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tantangan Harian Kuis Cepat */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm flex items-center gap-1.5">
                              <Icon name="psychology" className="text-amber-500 text-[18px]" /> Tantangan Harian Kuis Cepat
                            </span>
                            <span className="text-[10px] font-bold text-amber-600">+15 XP Bonus</span>
                          </div>
                          <p className="text-[11px] text-slate-400">Uji pemahaman spontan Anda sebelum sesi bimbingan sore ini dimulai.</p>

                          <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl space-y-1 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400">SOAL ALJABAR DASAR</span>
                            <p className="font-bold">Berapakah nilai x dari persamaan: 3x - 5 = 16 ?</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                            {['A.  x = 5', 'B.  x = 7', 'C.  x = 8', 'D.  x = 9'].map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAnswerQuiz(opt.substring(0, 1))}
                                className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                  selectedQuizOption === opt.substring(0, 1)
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                            <Icon name="check_circle" className="text-emerald-600 text-[16px]" />
                            <span>Jawaban Anda Benar! (3x = 21 → x = 7). Bonus XP telah ditambahkan.</span>
                          </div>
                        </div>

                        {/* Checklist Mandiri Target Pekan Ini */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400 uppercase text-[10px]">CHECKLIST MANDIRI</span>
                            <span className="font-bold text-emerald-600">66%</span>
                          </div>
                          <h4 className="font-bold text-sm">Target Pekan Ini (2/3 Selesai)</h4>
                          <div className="space-y-2 text-xs">
                            <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center">
                              <span className="line-through text-slate-400">Review Bab 3 Gerak Lurus Fisika</span>
                              <span className="text-[10px] font-bold text-emerald-600">Selesai</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center">
                              <span className="line-through text-slate-400">Selesaikan Modul Aljabar Hal 40-42</span>
                              <span className="text-[10px] font-bold text-emerald-600">Selesai</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center">
                              <span className="font-bold">Simulasi Try Out UTS Bahasa Inggris</span>
                              <span className="text-[10px] font-bold text-amber-600">+50 XP</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* KOLOM KANAN: TANYA PR KILAT, MODUL & JADWAL MENDATANG */}
                      <div className="lg:col-span-4 space-y-4">
                        {/* Punya PR Sulit? 24/7 */}
                        <div className="bg-gradient-to-br from-[#006948] to-[#00855d] text-white p-5 rounded-2xl shadow-md space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="px-2 py-0.5 rounded-full bg-white/20">Siaga 24/7</span>
                            <span className="text-emerald-200">● 14 Tutor Aktif</span>
                          </div>
                          <h3 className="text-base font-bold">Punya PR Sulit?</h3>
                          <p className="text-xs text-white/85 leading-relaxed">
                            Foto soal matematika, fisika, atau sains Anda. Tutor responsif menjawab via whiteboard digital dalam &lt; 5 menit.
                          </p>
                          <div className="space-y-2 pt-1">
                            <button onClick={() => setShowAskPrModal(true)} className="w-full py-2 bg-white text-[#006948] rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
                              <Icon name="photo_camera" className="text-[16px]" /> Tanya Foto PR
                            </button>
                            <button onClick={() => alert('Fitur Voice/Video Room bimbingan kilat aktif.')} className="w-full py-2 bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                              <Icon name="video_camera_front" className="text-[16px]" /> Voice / Video Room
                            </button>
                          </div>
                          <div className="p-2.5 bg-white/10 rounded-xl text-[11px] space-y-0.5">
                            <span className="font-bold text-[9px] uppercase tracking-wider text-emerald-200 block">SOLUSI TERBARU DIJAWAB</span>
                            <p className="font-semibold text-white">Rumus Vektor Gaya 2D</p>
                            <span className="text-[10px] text-emerald-200 block">✓ Dijawab oleh Kak Dimas • 12m lalu</span>
                          </div>
                        </div>

                        {/* Modul Belajar */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">Modul Belajar</span>
                            <span onClick={() => setActiveTab('rapor')} className="text-emerald-600 font-bold hover:underline cursor-pointer">Lihat Semua</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon name="picture_as_pdf" className="text-rose-500 text-[20px]" />
                                <div>
                                  <p className="font-bold text-xs">Rumus Kilat Aljabar</p>
                                  <span className="text-[10px] text-slate-400">PDF • 4.2 MB</span>
                                </div>
                              </div>
                              <Icon name="download" className="text-slate-400 cursor-pointer hover:text-emerald-600" />
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon name="style" className="text-emerald-600 text-[20px]" />
                                <div>
                                  <p className="font-bold text-xs">Flashcard Optik &amp; Cahaya</p>
                                  <span className="text-[10px] text-slate-400">Deck • 2.8 MB</span>
                                </div>
                              </div>
                              <Icon name="download" className="text-slate-400 cursor-pointer hover:text-emerald-600" />
                            </div>
                          </div>
                        </div>

                        {/* Jadwal Les Mendatang */}
                        <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-5 shadow-xs space-y-3 text-xs">
                          <span className="font-bold text-sm block">Jadwal Les Mendatang</span>
                          <div className="space-y-2">
                            <div className="p-2.5 bg-slate-50 rounded-xl flex items-start gap-2.5">
                              <div className="text-center font-bold px-2 py-1 bg-white rounded border">
                                <span className="text-[9px] text-slate-400 block">KAM</span>
                                <span className="text-base text-slate-900 leading-none">19</span>
                              </div>
                              <div>
                                <span className="font-bold block">Fisika: Gelombang Bunyi</span>
                                <span className="text-[10px] text-slate-400">15:30 WIB • Kak Ardi (Online)</span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl flex items-start gap-2.5">
                              <div className="text-center font-bold px-2 py-1 bg-white rounded border">
                                <span className="text-[9px] text-slate-400 block">SAB</span>
                                <span className="text-base text-slate-900 leading-none">21</span>
                              </div>
                              <div>
                                <span className="font-bold block">B. Inggris: Narrative Text</span>
                                <span className="text-[10px] text-slate-400">10:00 WIB • Tatap Muka di Rumah</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. TAB: TUGAS, PR & KUIS HARIAN (GAMBAR 2)                                 */}
                {/* ========================================================================= */}
                {activeTab === 'tugas' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">
                          SEMESTER GENAP 2024/2025 • KURIKULUM MERDEKA PLUS • TARGET EVALUASI MANDIRI
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                          Tugas, PR &amp; Kuis Harian Siswa
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Selesaikan evaluasi terjadwal untuk menjaga rekor belajar, mempertahankan peringkat beasiswa, dan membuka badge penguasaan konsep.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                          14 Hari Beruntun Streak Aktif
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          +40 XP Siap Diklaim
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border">
                          0 / 2 Tugas Target Hari Ini
                        </div>
                      </div>
                    </div>

                    {/* Filter Tabs Sub */}
                    <div className="flex items-center justify-between p-2 bg-white rounded-2xl border text-xs">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTaskSubTab('tugas')}
                          className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all ${
                            taskSubTab === 'tugas' ? 'bg-[#006948] text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Tugas Aktif <span className="ml-1 px-1.5 py-0.5 bg-emerald-700 text-white rounded-full text-[10px]">2</span>
                        </button>
                        <button
                          onClick={() => setTaskSubTab('kuis')}
                          className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all ${
                            taskSubTab === 'kuis' ? 'bg-[#006948] text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Kuis Kilat <span className="ml-1 opacity-75">3</span>
                        </button>
                        <button
                          onClick={() => setTaskSubTab('riwayat')}
                          className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all ${
                            taskSubTab === 'riwayat' ? 'bg-[#006948] text-white shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Riwayat Nilai <span className="ml-1 opacity-75">12</span>
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 pr-2">Terakhir disinkronkan: Hari Ini, 15:42 WIB</span>
                    </div>

                    {/* 2 Kolom Layout Tugas & Kuis */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Kolom Kiri: Kartu Tugas Aktif */}
                      <div className="lg:col-span-8 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900">● Tugas &amp; PR Berjalan (2 Menunggu Kirim)</span>
                          <span className="text-slate-400">Urutkan: Tenggat Terdekat</span>
                        </div>

                        {/* Tugas 1: Matematika Murni */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-600 block">MATEMATIKA MURNI • BAB 4: POLINOMIAL</span>
                              <h3 className="font-bold text-base text-slate-900">Latihan Aljabar Lanjutan Hal 42</h3>
                            </div>
                            <span className="text-rose-600 font-bold text-xs flex items-center gap-1">
                              <Icon name="schedule" className="text-[14px]" /> Besok, 12:00 WIB
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            5 Soal uraian pemfaktoran bentuk kuadrat sempurna &amp; grafik parabola. Pastikan menyertakan langkah eliminasi/substitusi secara terstruktur pada lembar berpetak.
                          </p>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80" alt="Tutor" className="w-7 h-7 rounded-full object-cover" />
                              <div>
                                <span className="font-bold block">Kak Sarah Nabilah, S.Si</span>
                                <span className="text-[10px] text-slate-400">Pemeriksa Tugas • Pendamping UI</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">Feedback Cepat • +20 XP</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowUploadPrModal(true)} className="flex-1 py-2.5 bg-[#006948] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                              <Icon name="upload" className="text-[16px]" /> Unggah Lembar Kerja / Foto
                            </button>
                            <button onClick={() => alert('Kisi-kisi soal: gunakan rumus kuadratik.')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
                              <Icon name="visibility" className="text-[16px]" /> Tinjau Kisi-kisi &amp; Petunjuk
                            </button>
                          </div>
                        </div>

                        {/* Tugas 2: Fisika Sains */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-blue-600 block">FISIKA SAINS • KINEMATIKA GERAK</span>
                              <h3 className="font-bold text-base text-slate-900">Fisika: Gerak Lurus Beraturan (GLB)</h3>
                            </div>
                            <span className="text-slate-500 font-bold text-xs flex items-center gap-1">
                              <Icon name="schedule" className="text-[14px]" /> Jumat, 18:00 WIB
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Analisis grafik kecepatan vs waktu pada data percobaan mobil mainan di laboratorium. Hitung nilai perpindahan total dan tentukan deviasi rata-rata alat sensor.
                          </p>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">DP</div>
                              <div>
                                <span className="font-bold block">Pak Dimas Prasetyo, M.T.</span>
                                <span className="text-[10px] text-slate-400">Pengampu Fisika • ITB Alum</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold">Praktikum Mandiri • +20 XP</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowUploadPrModal(true)} className="flex-1 py-2.5 bg-[#006948] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                              <Icon name="upload" className="text-[16px]" /> Unggah Jawaban PR
                            </button>
                            <button onClick={() => alert('Membuka tabel data percobaan.')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
                              <Icon name="table_chart" className="text-[16px]" /> Data Tabel Percobaan
                            </button>
                          </div>
                        </div>

                        {/* Bank Modul & Rumus Cepat */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-900">Bank Modul &amp; Rumus Cepat</span>
                            <span className="text-slate-400">3 Berkas Tersedia</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl flex flex-col justify-between">
                              <span className="font-bold text-xs block">Rumus Kilat Aljabar</span>
                              <span className="text-[10px] text-slate-400 block mt-1">PDF • 4.2 MB</span>
                              <button onClick={() => alert('Mengunduh modul PDF.')} className="mt-2 text-emerald-600 font-bold text-[11px] text-left hover:underline">Unduh PDF ↓</button>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl flex flex-col justify-between">
                              <span className="font-bold text-xs block">Rangkuman GLB &amp; GLBB</span>
                              <span className="text-[10px] text-slate-400 block mt-1">PDF • 2.8 MB</span>
                              <button onClick={() => alert('Mengunduh modul PDF.')} className="mt-2 text-emerald-600 font-bold text-[11px] text-left hover:underline">Unduh PDF ↓</button>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl flex flex-col justify-between">
                              <span className="font-bold text-xs block">Flashcard Sains</span>
                              <span className="text-[10px] text-slate-400 block mt-1">PDF • 1.9 MB</span>
                              <button onClick={() => alert('Mengunduh modul PDF.')} className="mt-2 text-emerald-600 font-bold text-[11px] text-left hover:underline">Unduh PDF ↓</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kolom Kanan: Kuis Kilat & Leaderboard */}
                      <div className="lg:col-span-4 space-y-4">
                        {/* Kuis Kilat Harian */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Kuis Kilat Harian</span>
                            <span className="text-amber-600 font-bold">+15 XP Tambahan</span>
                          </div>

                          <div className="text-xs space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">SOAL DIAGNOSTIK • ALJABAR LINEAR • TINGKAT: SEDANG</span>
                            <h4 className="font-bold text-sm">Berapakah nilai x dari persamaan:</h4>
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-lg font-black tracking-widest my-2">
                              3x - 5 = 16
                            </div>
                          </div>

                          <div className="space-y-2 text-xs font-semibold">
                            {['A.  x = 5', 'B.  x = 7', 'C.  x = 8', 'D.  x = 9'].map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAnswerQuiz(opt.substring(0, 1))}
                                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                  selectedQuizOption === opt.substring(0, 1)
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <span>{opt}</span>
                                {selectedQuizOption === opt.substring(0, 1) && (
                                  <span className="text-[10px] text-emerald-600 font-bold">Jawaban Benar! (3 x 7 - 5 = 16) ✓</span>
                                )}
                              </button>
                            ))}
                          </div>

                          <div className="p-3 bg-sky-50 rounded-xl text-[11px] text-sky-900 space-y-1">
                            <span className="font-bold text-[10px] uppercase block text-sky-700">PETUNJUK KAK SARAH:</span>
                            <p className="italic">
                              "Pindahkan konstanta -5 ke ruas kanan menjadi +5 terlebih dahulu (16 + 5 = 21), lalu bagi kedua ruas dengan angka 3."
                            </p>
                          </div>

                          <button onClick={() => alert('Melanjutkan ke soal kuis berikutnya.')} className="w-full py-2.5 bg-[#006948] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer">
                            Klaim +15 XP &amp; Lanjut ke Soal Berikutnya →
                          </button>
                        </div>

                        {/* Leaderboard Pekanan */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">Leaderboard Pekanan</span>
                            <span className="text-slate-400 text-[10px]">Kelas 8 • Wilayah Barat</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400">#1</span>
                                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">AN</div>
                                <div>
                                  <span className="font-bold block">Anindya Naura</span>
                                  <span className="text-[9px] text-slate-400">SMP Negeri 1 Jakarta</span>
                                </div>
                              </div>
                              <span className="font-black text-slate-900">520 XP</span>
                            </div>

                            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-700">#2</span>
                                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">RP</div>
                                <div>
                                  <span className="font-bold block text-emerald-900">Raditya Pratama (Kamu) <span className="px-1 py-0.2 bg-emerald-200 text-emerald-900 rounded text-[9px]">YOU</span></span>
                                  <span className="text-[9px] text-emerald-700">↗ Naik 1 posisi pekan ini</span>
                                </div>
                              </div>
                              <span className="font-black text-emerald-800">480 XP</span>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400">#3</span>
                                <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px]">FF</div>
                                <div>
                                  <span className="font-bold block">Farrel Faris</span>
                                  <span className="text-[9px] text-slate-400">SMP Labschool Rawamangun</span>
                                </div>
                              </div>
                              <span className="font-black text-slate-900">445 XP</span>
                            </div>
                          </div>
                        </div>

                        {/* Tren Pemahaman Materi */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">Tren Pemahaman Materi</span>
                            <span className="text-emerald-600 font-bold text-[11px]">92.6% Rata-rata</span>
                          </div>
                          <div className="space-y-1.5 pt-1">
                            <div>
                              <div className="flex justify-between text-[11px] mb-0.5">
                                <span>Matematika Terapan (Aljabar &amp; Geometri)</span>
                                <span className="font-bold text-emerald-600">96%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '96%' }} /></div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] mb-0.5">
                                <span>Fisika Kinematika &amp; Dinamika</span>
                                <span className="font-bold text-emerald-600">90%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} /></div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] mb-0.5">
                                <span>Bahasa Inggris Akademik</span>
                                <span className="font-bold text-emerald-600">92%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} /></div>
                            </div>
                          </div>
                          <div className="pt-2 border-t text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Konsistensi Skor: Stabil Membaik</span>
                            <span className="text-emerald-600 font-bold">📈 Sangat Baik</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. TAB: JADWAL BELAJAR & SESI KBM (GAMBAR 3)                              */}
                {/* ========================================================================= */}
                {activeTab === 'jadwal' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">AKADEMIK &gt; KBM TATAP MUKA</span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Jadwal Belajar &amp; Sesi KBM</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Atur dan pantau sesi les tatap muka dengan tutor terverifikasi terbaikmu.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold">🔄 Sync Aktif • G-Cal &amp; WA</span>
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold">✓ 4 Pekan Disiplin (100% Hadir)</span>
                        <button onClick={() => setShowRescheduleModal(true)} className="px-3 py-1.5 rounded-xl bg-white border text-xs font-bold cursor-pointer">
                          Ajukan Reschedule
                        </button>
                      </div>
                    </div>

                    {/* Filter Tabs & Date Header */}
                    <div className="flex items-center justify-between p-2 bg-white rounded-2xl border text-xs">
                      <div className="flex gap-2">
                        <button onClick={() => setScheduleFilterTab('mendatang')} className={`px-4 py-2 rounded-xl font-bold cursor-pointer ${scheduleFilterTab === 'mendatang' ? 'bg-[#006948] text-white' : 'text-slate-500'}`}>
                          Mendatang <span className="ml-1 px-1.5 py-0.2 bg-emerald-700 rounded-full text-[10px]">3</span>
                        </button>
                        <button onClick={() => setScheduleFilterTab('riwayat')} className={`px-4 py-2 rounded-xl font-bold cursor-pointer ${scheduleFilterTab === 'riwayat' ? 'bg-[#006948] text-white' : 'text-slate-500'}`}>
                          Riwayat Selesai <span className="ml-1 opacity-75">18</span>
                        </button>
                        <button onClick={() => setScheduleFilterTab('izin')} className={`px-4 py-2 rounded-xl font-bold cursor-pointer ${scheduleFilterTab === 'izin' ? 'bg-[#006948] text-white' : 'text-slate-500'}`}>
                          Permintaan Perubahan
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pr-2">
                        <span className="font-bold text-slate-700">&lt; OKTOBER 2024 • MINGGU KE-3 &gt;</span>
                        <button onClick={() => setActiveCalendarDay('Sel')} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold cursor-pointer">HARI INI</button>
                      </div>
                    </div>

                    {/* 2 Kolom Layout KBM */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Kolom Kiri: Kalender Strip & Sesi Utama */}
                      <div className="lg:col-span-8 space-y-4">
                        {/* Kalender Strip 7 Hari */}
                        <div className="grid grid-cols-7 gap-2">
                          {WEEK_DAYS.map((d) => (
                            <button
                              key={d.id}
                              onClick={() => setActiveCalendarDay(d.id)}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                                activeCalendarDay === d.id
                                  ? 'bg-emerald-600 text-white font-bold shadow-md'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="text-[10px] uppercase">{d.day}</span>
                              <span className="text-base font-black mt-0.5">{d.date}</span>
                              {d.isToday && <span className="text-[9px] font-bold mt-1 text-emerald-100">HARI INI</span>}
                            </button>
                          ))}
                        </div>

                        {/* Kartu Sesi Utama Hari Ini */}
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs">
                              ● DIMULAI DALAM 42 MENIT • Tatap Muka Langsung
                            </span>
                            <span className="text-xs font-bold text-slate-600">16:00 - 17:30 WIB (90 Menit Intensif)</span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">PERSIAPAN PENILAIAN TENGAH SEMESTER</span>
                            <h3 className="font-bold text-xl text-slate-900 mt-0.5">Matematika: Aljabar Lanjutan &amp; Pemfaktoran Kuadrat</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              🏠 Rumah Siswa • Kelapa Gading, Jakarta Utara (Jl. Boulevard Raya Blok A4 No. 18, Kode Pintu Gerbang: 4421)
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80" alt="Kak Sarah" className="w-11 h-11 rounded-full object-cover border" />
                              <div className="text-xs">
                                <span className="font-bold block text-sm">Kak Sarah Nabilah, S.Si ✓</span>
                                <span className="text-slate-400">Alumni Matematika MIPA UI • Pengajar Utama • ★ 4.98 (142 Ulasan) • Tiba: ~15:46 WIB</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setShowChatModal(true)} className="px-3 py-1.5 bg-white border rounded-xl text-xs font-bold cursor-pointer">Chat Tutor</button>
                              <a href="tel:08123456789" className="p-2 bg-white border rounded-xl text-emerald-600 cursor-pointer"><Icon name="call" className="text-[16px]" /></a>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-xs font-semibold pt-1">
                            <button onClick={() => alert('Tersinkron dengan Google Calendar.')} className="py-2.5 bg-slate-100 rounded-xl text-center">📅 Sync G-Calendar</button>
                            <button onClick={() => setShowRescheduleModal(true)} className="py-2.5 bg-slate-100 rounded-xl text-center">⏱ Ajukan Pindah Jam</button>
                            <button onClick={() => alert('Kirim catatan persiapan awal ke tutor.')} className="py-2.5 bg-slate-100 rounded-xl text-center">📝 Beri Catatan Awal</button>
                            <button onClick={() => alert('Pantau presensi langsung orang tua.')} className="py-2.5 bg-emerald-600 text-white rounded-xl text-center font-bold">👁 Pantau Ortu Live</button>
                          </div>
                        </div>

                        {/* Jadwal Sesi Berikutnya */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-900">Jadwal Sesi Berikutnya</span>
                            <span className="text-slate-400">2 Sesi Terkonfirmasi Pekan Ini</span>
                          </div>

                          <div className="p-4 bg-white border rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className="text-center font-bold px-3 py-1.5 bg-slate-50 rounded-xl border">
                                <span className="text-[9px] text-slate-400 block">KAMIS</span>
                                <span className="text-base leading-none">19</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-blue-600 font-bold block">16:00 - 17:30 WIB • Fisika Terapan</span>
                                <h4 className="font-bold text-sm">GLB, GLBB &amp; Hukum Dinamika Gaya Newton</h4>
                                <span className="text-slate-400 text-[11px]">Pak Dimas Ramadhan, M.T (Fisika ITB) • Tatap Muka Rumah</span>
                              </div>
                            </div>
                            <button onClick={() => alert('Membuka modul pra-KBM.')} className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-bold">Modul Pra-KBM</button>
                          </div>

                          <div className="p-4 bg-white border rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className="text-center font-bold px-3 py-1.5 bg-slate-50 rounded-xl border">
                                <span className="text-[9px] text-slate-400 block">SABTU</span>
                                <span className="text-base leading-none">21</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-emerald-600 font-bold block">10:00 - 11:30 WIB • Bahasa Inggris</span>
                                <h4 className="font-bold text-sm">Advanced Grammar Synthesis &amp; OSN Drill Focus</h4>
                                <span className="text-slate-400 text-[11px]">Kak Anindya Putri, S.Pd (Sastra Inggris UGM) • Tatap Muka Rumah</span>
                              </div>
                            </div>
                            <button onClick={() => alert('Membuka modul pra-KBM.')} className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-bold">Modul Pra-KBM</button>
                          </div>
                        </div>

                        {/* Garansi Fleksibilitas */}
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-emerald-900 block">Garansi Fleksibilitas Jadwal Tanpa Penalti</span>
                            <p className="text-emerald-700 text-[11px] mt-0.5">
                              Butuh pergantian jam darurat? Hubungi Academic Counselor hingga 3 jam sebelum sesi tanpa biaya penalti pembatalan.
                            </p>
                          </div>
                          <button onClick={() => setShowCreateScheduleModal(true)} className="px-4 py-2 bg-[#006948] text-white font-bold rounded-xl shrink-0 cursor-pointer">
                            Pesan Sesi Tambahan
                          </button>
                        </div>
                      </div>

                      {/* Kolom Kanan: Radar GPS & SOP Presensi */}
                      <div className="lg:col-span-4 space-y-4">
                        {/* Radar Tutor Menuju Lokasi */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">Radar Tutor Menuju Lokasi</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">LIVE GPS</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                            <span>Jarak: 1.2 km</span>
                            <span className="text-emerald-600 font-bold">ETA ~14 Menit</span>
                          </div>
                          <div className="relative h-44 rounded-xl overflow-hidden border">
                            <iframe
                              title="Live Radar"
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              scrolling="no"
                              src="https://maps.google.com/maps?q=Kelapa+Gading+Jakarta&t=&z=14&ie=UTF8&iwloc=&output=embed"
                              className="w-full h-full pointer-events-none"
                            />
                            <div className="absolute bottom-2 left-2 right-2 p-2 bg-white/95 rounded-lg border text-[10px] flex justify-between items-center">
                              <div>
                                <span className="font-bold block">Honda Beat • B 3829 UKL</span>
                                <span className="text-slate-400">Jl. Mandiri Utara Raya</span>
                              </div>
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold">Radius Valid (8m)</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-1 text-[11px]">
                            <span>Geofence Rumah Siswa Terpasang</span>
                            <span className="text-sky-600 font-bold cursor-pointer hover:underline">Cek Rute</span>
                          </div>
                        </div>

                        {/* SOP Presensi Terkunci */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">SOP Presensi Terkunci</span>
                            <span className="text-[10px] text-slate-400">2 Tahap Aman</span>
                          </div>

                          <div className="space-y-3">
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                                <span>Presensi Mulai KBM</span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Foto bersama via kamera aplikasi &amp; verifikasi PIN 4 digit saat tutor tiba di ruang belajar.
                              </p>
                              <div className="flex justify-between items-center pt-1">
                                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border">PIN Siaga: 8492</span>
                                <span className="text-[10px] text-slate-400">Menunggu Kedatangan</span>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px]">2</span>
                                <span>Presensi Selesai &amp; Lembar Evaluasi</span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Tutor mengunggah ringkasan materi, catatan kemajuan murid, dan lembar tugas mandiri sebelum meninggalkan sesi.
                              </p>
                              <span className="text-[10px] text-slate-400 block pt-1">Terkunci otomatis hingga pukul 17:30 WIB</span>
                            </div>
                          </div>
                        </div>

                        {/* Log Belajar Pekan Ini */}
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">Log Belajar Pekan Ini</span>
                            <span className="text-slate-400 font-semibold">4.5 / 6 Jam Target</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center pt-1">
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                              <span className="text-[10px] text-slate-400 block">RATA-RATA KUIS</span>
                              <span className="text-lg font-black text-slate-900">92.4</span>
                              <span className="text-[9px] text-emerald-600 font-bold block">+3.2 poin</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                              <span className="text-[10px] text-slate-400 block">PR TUNTAS</span>
                              <span className="text-lg font-black text-slate-900">14 Soal</span>
                              <span className="text-[9px] text-slate-400 block">100% On-time</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. TAB: RAPOR AKADEMIK & BANK MODUL (GAMBAR 4 KIRI)                       */}
                {/* ========================================================================= */}
                {activeTab === 'rapor' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">AKADEMIK &gt; RAPOR &amp; MODUL BELAJAR</span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Rapor Akademik &amp; Bank Modul Terstruktur</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Pantau perkembangan berkala, hasil evaluasi tutor, serta akses seluruh modul latihan Kurikulum Merdeka Plus.</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowInvoiceModal(true)} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer">
                          Unduh Rapor Semester (PDF)
                        </button>
                      </div>
                    </div>

                    {/* 4 Kartu Metrik Rapor */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 bg-white border rounded-2xl shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">RATA-RATA KOMPREHENSIF</span>
                        <div className="text-2xl font-black text-emerald-600">94.2 <span className="text-xs text-slate-400">/ 100</span></div>
                        <span className="text-[11px] text-emerald-600 font-semibold">100% Lulus KKM Target</span>
                      </div>
                      <div className="p-5 bg-white border rounded-2xl shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">TINGKAT KEHADIRAN KBM</span>
                        <div className="text-2xl font-black text-slate-900">100% <span className="text-xs text-slate-400">Sempurna</span></div>
                        <span className="text-[11px] text-slate-400">24/24 Sesi Terjadwal</span>
                      </div>
                      <div className="p-5 bg-white border rounded-2xl shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">PEMAHAMAN HOTS</span>
                        <div className="text-2xl font-black text-emerald-600">92.8% <span className="text-xs text-slate-400">Tinggi</span></div>
                        <span className="text-[11px] text-emerald-600 font-semibold">Aljabar &amp; Fisika Dasar: Level 4</span>
                      </div>
                      <div className="p-5 bg-white border rounded-2xl shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">MODUL &amp; KUIS SELESAI</span>
                        <div className="text-2xl font-black text-slate-900">38 <span className="text-xs text-slate-400">/ 40 Modul</span></div>
                        <span className="text-[11px] text-slate-400">95% Tuntas Kurikulum</span>
                      </div>
                    </div>

                    {/* Evaluasi Mentor & Bank Modul Unduhan */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-7 space-y-4">
                        <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-3.5">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-bold text-sm">Evaluasi &amp; Catatan Mentor</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">Rekomendasi A+</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80" alt="Mentor" className="w-10 h-10 rounded-full object-cover" />
                            <div className="text-xs">
                              <span className="font-bold block">Kak Sarah Nabilah, S.Si ✓</span>
                              <span className="text-slate-400">Tutor Utama Matematika &amp; Sains Dasar • Verifikasi Terakreditasi Bandung</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border">
                            "Raditya menunjukkan ketajaman logika yang luar biasa pada bab sistem persamaan linear dua variabel. Ketelitian perhitungan meningkat pesat setelah pembiasaan metode eliminasi terstruktur. Rekomendasi lanjutan: dorong eksplorasi soal-soal olimpiade OSN tingkat Kabupaten."
                          </p>
                        </div>

                        {/* Pencapaian Kompetensi per Bab */}
                        <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold">Pencapaian Kompetensi per Bab</span>
                            <span className="text-slate-400">4 Mata Pelajaran Aktif</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="font-bold block">Matematika: Aljabar &amp; Relasi Fungsi</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">Sangat Menguasai</span>
                              </div>
                              <span className="font-black text-sm">96 / 100</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="font-bold block">Fisika: Kinematika &amp; Hukum Newton</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">Menguasai</span>
                              </div>
                              <span className="font-black text-sm">91 / 100</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="font-bold block">Bahasa Inggris: Academic Writing &amp; Syntax</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">Sangat Menguasai</span>
                              </div>
                              <span className="font-black text-sm">94 / 100</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="font-bold block">Biologi: Sistem Organ &amp; Sirkulasi</span>
                                <span className="text-[10px] text-amber-600 font-semibold">Cukup Menguasai</span>
                              </div>
                              <span className="font-black text-sm">89 / 100</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kolom Kanan: Bank Modul & Tryout */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="p-5 bg-white border rounded-2xl shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">Bank Modul &amp; Unduhan</span>
                            <span className="text-slate-400 text-[10px]">Kurikulum Merdeka Plus</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="font-bold block">Modul Ringkas Rumus Cepat Matematika</span>
                                <span className="text-[10px] text-slate-400">PDF • 4.2 MB • 48 Halaman</span>
                              </div>
                              <Icon name="download" className="text-slate-400 hover:text-emerald-600 cursor-pointer" />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="font-bold block">Rangkuman Infografis Gerak Lurus Fisika</span>
                                <span className="text-[10px] text-slate-400">PDF • 2.8 MB • Warna &amp; Diagram</span>
                              </div>
                              <Icon name="download" className="text-slate-400 hover:text-emerald-600 cursor-pointer" />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="font-bold block">Drill Soal HOTS Persiapan Olimpiade</span>
                                <span className="text-[10px] text-slate-400">PDF • 5.1 MB • Kunci &amp; Penjelasan</span>
                              </div>
                              <Icon name="download" className="text-slate-400 hover:text-emerald-600 cursor-pointer" />
                            </div>
                          </div>
                        </div>

                        {/* Tryout Nasional */}
                        <div className="p-5 bg-white border rounded-2xl shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">Bank Soal Tryout Nasional 2025</span>
                            <span className="text-amber-600 font-bold text-[10px]">3 Seri Tersedia</span>
                          </div>
                          <p className="text-slate-500 text-[11px] leading-relaxed">
                            Simulasi ujian komputer adaptif dengan timer otomatis dan pembobotan nilai IRT (Item Response Theory) standar nasional.
                          </p>
                          <button onClick={() => alert('Memulai simulasi tryout.')} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer">
                            Mulai Simulasi Tryout 3 →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 5. TAB: PUSAT TANYA PR & SOLUSI KILAT 24 JAM (GAMBAR 4 KANAN)              */}
                {/* ========================================================================= */}
                {activeTab === 'tanya-pr' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">AKADEMIK &gt; TANYA PR KILAT 24/7</span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Pusat Tanya PR &amp; Solusi Kilat 24 Jam</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Dapatkan solusi langkah demi langkah terverifikasi dari Master Tutor dalam waktu kurang dari 5 menit.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">● Sistem Siaga Realtime • LATENCY: 42ms</span>
                        <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold">14 Sesi Belajar Tersedia</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Kolom Kiri: Form Tanya & Riwayat Jawaban Terpilih */}
                      <div className="lg:col-span-8 space-y-4">
                        {/* Form Kirim Pertanyaan Baru dengan OCR */}
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 text-xs">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-bold text-sm">Kirim Pertanyaan Baru</span>
                            <span className="text-[10px] text-slate-400">SIAGA 24/7</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setShowAskPrModal(true)} className="py-2.5 px-3 bg-emerald-50 text-emerald-800 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer">
                              <Icon name="photo_camera" /> Foto / Kamera
                            </button>
                            <button onClick={() => alert('Ketik teks & rumus LaTeX.')} className="py-2.5 px-3 bg-slate-100 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer">
                              <Icon name="edit" /> Ketik Teks &amp; Rumus
                            </button>
                            <button onClick={() => alert('Rekam pesan suara/audio.')} className="py-2.5 px-3 bg-slate-100 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer">
                              <Icon name="mic" /> Voice Note
                            </button>
                          </div>

                          {/* Hasil Ekstraksi OCR Otomatis */}
                          <div className="p-3.5 bg-slate-50 rounded-xl border space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">OCR Berhasil Terdeteksi</span>
                              <div className="flex gap-2 text-[10px] text-slate-400">
                                <span className="hover:underline cursor-pointer">Sesuaikan Crop</span>
                                <span>•</span>
                                <span className="hover:underline cursor-pointer">Ganti Foto</span>
                              </div>
                            </div>
                            <p className="font-bold text-slate-800">
                              HASIL EKSTRAKSI TEKS OTOMATIS: "Persamaan Linear Satu Variabel: 2(3x - 4) + 5 = 4x + 9. Tentukan nilai x dan gambarkan garis bilangan koordinat cartesius!"
                            </p>
                            <span className="text-[10px] text-slate-400 block">Akurasi AI: 99.4% ✓</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex gap-2">
                              <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold text-[11px]">Matematika</span>
                              <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold text-[11px]">Kelas 8 SMP</span>
                            </div>
                            <button onClick={() => setShowAskPrModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer">
                              Kirim ke Tutor Jaga →
                            </button>
                          </div>
                        </div>

                        {/* Papan Kelas Virtual Kak Sarah (Whiteboard Interaktif) */}
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3.5 text-xs">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80" alt="Kak Sarah" className="w-9 h-9 rounded-full object-cover" />
                              <div>
                                <span className="font-bold block">Kak Sarah Nabilah, S.Si ★ 4.98</span>
                                <span className="text-[10px] text-slate-400">Master Tutor Matematika MIPA • ITB Alum • Selesai dlm 3.4 Menit</span>
                              </div>
                            </div>
                            <span className="text-slate-400 text-[11px]">12 menit lalu</span>
                          </div>

                          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 font-mono text-xs">
                            <span className="text-emerald-400 font-bold text-[10px] uppercase block"># PAPANKELAS VIRTUAL KAK SARAH - SOLUSI TERVERIFIKASI</span>
                            <div className="p-2 bg-slate-800 rounded-lg text-emerald-300">
                              Tahap 1: Jabarkan tanda kurung distributif: 2(3x - 4) + 5 = 4x + 9 → 6x - 8 + 5 = 4x + 9
                            </div>
                            <div className="p-2 bg-slate-800 rounded-lg text-emerald-300">
                              Tahap 2: Sederhanakan konstanta ruas kiri: 6x - 3 = 4x + 9
                            </div>
                            <div className="p-2 bg-slate-800 rounded-lg text-emerald-300">
                              Tahap 3: Pindahkan variabel ke ruas kiri &amp; konstanta ke ruas kanan: 6x - 4x = 9 + 3 → 2x = 12 → x = 6
                            </div>
                            <span className="text-amber-400 block pt-1 text-[11px]">Visualisasi Garis Bilangan Titik Penyelesaian (x = 6) [Valid]</span>
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[11px] text-slate-400">Beri Nilai Solusi: ★★★★★</span>
                            <div className="flex gap-2">
                              <button onClick={() => alert('Melanjutkan tanya soal.')} className="px-3 py-1.5 bg-slate-100 rounded-xl font-bold">Tanya Lanjutan</button>
                              <button onClick={() => alert('Membuka pembahasan lengkap.')} className="px-3.5 py-1.5 bg-[#006948] text-white rounded-xl font-bold">Buka Pembahasan Lengkap</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kolom Kanan: Tutor Standby & Statistik */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="p-5 bg-white border rounded-2xl shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">Tutor Standby Saat Ini</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">8 Siaga</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                              <span className="font-bold">Kak Sarah Nabilah (Matematika &amp; OSN Aljabar)</span>
                              <span className="text-emerald-600 font-bold text-[10px]">Resp. 99.4%</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                              <span className="font-bold">Pak Dimas Ramadhan (Fisika Mekanika)</span>
                              <span className="text-emerald-600 font-bold text-[10px]">Resp. 98.8%</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                              <span className="font-bold">Kak Anindya Putri (Bahasa Inggris)</span>
                              <span className="text-emerald-600 font-bold text-[10px]">Resp. 99.1%</span>
                            </div>
                          </div>
                        </div>

                        {/* Statistik Bulanan */}
                        <div className="p-5 bg-white border rounded-2xl shadow-xs space-y-3 text-xs">
                          <span className="font-bold block">Statistik Belajar Bulan Ini</span>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                              <span className="text-[10px] text-slate-400 block">TOTAL SOAL</span>
                              <span className="text-base font-black">26</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                              <span className="text-[10px] text-slate-400 block">KEPUASAN</span>
                              <span className="text-base font-black text-emerald-600">99.2%</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                              <span className="text-[10px] text-slate-400 block">PEMAHAMAN</span>
                              <span className="text-base font-black">A+</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 6. TAB: PROFIL SISWA & PENGATURAN AKUN (GAMBAR 5)                         */}
                {/* ========================================================================= */}
                {activeTab === 'profil' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase">PENGATURAN &gt; PROFIL SISWA &amp; AKADEMIK</span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Profil Siswa &amp; Pengaturan Akun</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola informasi identitas siswa, wali murid, paket langganan aktif, preferensi belajar, dan keamanan akun terpusat.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => alert('Log aktivitas akun aman.')} className="px-3.5 py-2 bg-white border rounded-xl text-xs font-bold cursor-pointer">
                          👁 Log Aktivitas
                        </button>
                        <button onClick={() => alert('Perubahan akun berhasil disimpan!')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md">
                          Simpan Perubahan
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Kolom Kiri: Kartu Identitas & Paket Bimbel */}
                      <div className="lg:col-span-5 space-y-6">
                        {/* Identitas Siswa */}
                        <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-4 text-xs">
                          <div className="flex items-center gap-4">
                            <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80" alt="Raditya" className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500" />
                            <div>
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase">SISWA BERPRESTASI TERDAFTAR</span>
                              <h2 className="text-base font-bold text-slate-900 mt-0.5">Raditya Pratama</h2>
                              <p className="text-slate-500 text-[11px]">SMPN 115 Jakarta Selatan • Kelas 8 Program Kelas Unggulan</p>
                              <div className="flex gap-3 text-slate-400 text-[10px] mt-1">
                                <span>ID: CRD-88219</span>
                                <span>NISN: 0089281729</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">Level 4: Penjelajah Sains</span>
                              <span className="text-[10px] text-amber-600 font-bold">Top 5% Angkatan</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold">
                              <span>1.840 XP</span>
                              <span>2.000 XP</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: '92%' }} /></div>
                          </div>
                        </div>

                        {/* Paket Bimbel VIP */}
                        <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-4 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-400 uppercase text-[10px]">PAKET BIMBEL TERPADU</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">Aktif</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-600 uppercase font-bold block">TIER VIP PRESTISIUS</span>
                            <h3 className="font-bold text-base text-slate-900">Paket Bintang Juara Eksekutif</h3>
                            <p className="text-slate-500 text-[11px] mt-0.5">Tatap Muka Langsung Guru Spesialis &amp; Akses Digital Penuh 24 Jam.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center pt-1">
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                              <span className="text-[10px] text-slate-400 block">SISA KBM RUTIN</span>
                              <span className="text-lg font-black text-slate-900">8 <span className="text-xs font-normal">/ 16 Sesi</span></span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                              <span className="text-[10px] text-slate-400 block">TANYA PR 24/7</span>
                              <span className="text-lg font-black text-emerald-600">14 <span className="text-xs font-normal">Pertanyaan</span></span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowInvoiceModal(true)} className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                              Perpanjang Paket
                            </button>
                            <button onClick={() => setShowCreateScheduleModal(true)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">
                              Ubah Jadwal Rutin
                            </button>
                          </div>
                        </div>

                        {/* Kontak Wali Murid */}
                        <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">Kontak Wali Murid</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">Terverifikasi</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">WALI UTAMA / AYAH KANDUNG</span>
                            <span className="font-bold text-sm block">Ir. Hendra Pratama</span>
                            <span className="text-slate-500 text-[11px]">+62 811-9874-5432 • Tersinkron</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            Laporan rekap KBM, nilai kuis, dan absensi otomatis terkirim via WhatsApp resmi tiap selesai sesi belajar.
                          </p>
                        </div>
                      </div>

                      {/* Kolom Kanan: Preferensi, Keamanan & Notifikasi */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Preferensi & Kebutuhan Belajar */}
                        <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-4 text-xs">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-bold text-sm">Preferensi &amp; Kebutuhan Belajar</span>
                            <span className="text-slate-400 text-[10px]">Kurikulum Merdeka Plus</span>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded font-bold text-[9px]">Utama</span>
                              <span className="font-bold block text-xs">Matematika Terapan</span>
                              <p className="text-[10px] text-slate-400">Aljabar, Geometri Ruang &amp; Logika</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[9px]">Intensif</span>
                              <span className="font-bold block text-xs">Fisika Terapan</span>
                              <p className="text-[10px] text-slate-400">Mekanika Gerak &amp; Dinamika</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded font-bold text-[9px]">Sertifikasi</span>
                              <span className="font-bold block text-xs">Bahasa Inggris</span>
                              <p className="text-[10px] text-slate-400">TOEFL Junior Listening &amp; Reading</p>
                            </div>
                          </div>

                          {/* Tutor Favorit Ditugaskan */}
                          <div className="p-3.5 bg-slate-50 rounded-xl space-y-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">TUTOR FAVORIT &amp; MENTOR UTAMA DITUGASKAN</span>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80" alt="Kak Sarah" className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                  <span className="font-bold block text-xs">Kak Sarah Nabilah, S.Si</span>
                                  <span className="text-[10px] text-slate-400">Matematika UI • Tetap</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">DP</div>
                                <div>
                                  <span className="font-bold block text-xs">Pak Dimas Ramadhan, M.T</span>
                                  <span className="text-[10px] text-slate-400">Fisika ITB • Tetap</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pengaturan Notifikasi & Sinkronisasi */}
                        <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-3.5 text-xs">
                          <span className="font-bold text-sm block">Pengaturan Notifikasi &amp; Sinkronisasi</span>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                              <div>
                                <span className="font-bold block">Notifikasi WhatsApp H-2 Jam</span>
                                <span className="text-[10px] text-slate-400">Kirim pengingat konfirmasi kehadiran sesi bimbel ke HP siswa &amp; ortu</span>
                              </div>
                              <input type="checkbox" checked={notifWaH2} onChange={() => setNotifWaH2(!notifWaH2)} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                            </div>

                            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                              <div>
                                <span className="font-bold block">Pengingat Tugas &amp; Kuis Harian</span>
                                <span className="text-[10px] text-slate-400">Pemberitahuan batas pengumpulan PR dan tantangan XP kilat setiap pukul 17:00</span>
                              </div>
                              <input type="checkbox" checked={notifTugasHarian} onChange={() => setNotifTugasHarian(!notifTugasHarian)} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                            </div>

                            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                              <div>
                                <span className="font-bold block">Laporan Rapor ke WA Orang Tua</span>
                                <span className="text-[10px] text-slate-400">Ringkasan mingguan pemahaman materi dan catatan observasi dari tutor</span>
                              </div>
                              <input type="checkbox" checked={laporRaporWa} onChange={() => setLaporRaporWa(!laporRaporWa)} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                            </div>

                            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                              <div>
                                <span className="font-bold block">Sinkronisasi Google Calendar</span>
                                <span className="text-[10px] text-slate-400">Update kalender otomatis untuk jadwal kelas, try out, dan sesi review</span>
                              </div>
                              <input type="checkbox" checked={syncGoogleCalendar} onChange={() => setSyncGoogleCalendar(!syncGoogleCalendar)} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                            </div>
                          </div>
                        </div>

                        {/* Keamanan Akun & Sesi */}
                        <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-3.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">Keamanan Akun &amp; Sesi</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Tingkat Keamanan: Tinggi</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                              <span className="font-bold block">Kata Sandi &amp; 6-Digit PIN</span>
                              <p className="text-[10px] text-slate-400">Terakhir diperbarui 24 hari yang lalu.</p>
                              <button onClick={() => setShowProfilePasswordModal(true)} className="text-emerald-600 font-bold text-[11px] hover:underline cursor-pointer">
                                Ubah Kata Sandi &amp; PIN
                              </button>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                              <span className="font-bold block">Autentikasi Biometrik</span>
                              <p className="text-[10px] text-slate-400">Face ID &amp; Touch ID aktif.</p>
                              <span className="text-emerald-600 font-bold text-[10px]">✓ Aktif &amp; Terpercaya</span>
                            </div>
                          </div>

                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center">
                            <div>
                              <span className="font-bold text-rose-900 block text-xs">Kontak Darurat Belajar (Emergency SOS)</span>
                              <span className="text-[10px] text-rose-700">Ibu Ratna (+62 812-3364-5566) • Hotline Satpam Komplek</span>
                            </div>
                            <button onClick={() => setShowSosModal(true)} className="px-3 py-1 bg-white border border-rose-300 text-rose-700 font-bold rounded-lg text-[10px] cursor-pointer">
                              Ubah Kontak SOS
                            </button>
                          </div>

                          <button onClick={handleLogout} className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-xl cursor-pointer">
                            Keluar dari Akun Siswa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        {isLoggedIn && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
            <div className="flex justify-between items-center h-16 max-w-lg mx-auto px-2">
              {[
                { id: 'beranda', label: 'Beranda', icon: 'dashboard' },
                { id: 'jadwal', label: 'Jadwal', icon: 'calendar_month' },
                { id: 'tugas', label: 'Tugas', icon: 'assignment' },
                { id: 'rapor', label: 'Rapor', icon: 'grade' },
                { id: 'tanya-pr', label: 'Tanya PR', icon: 'chat' },
                { id: 'profil', label: 'Profil', icon: 'account_circle' },
              ].map((bTab) => {
                const active = activeTab === bTab.id;
                return (
                  <button
                    key={bTab.id}
                    onClick={() => setActiveTab(bTab.id as any)}
                    className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer ${
                      active ? 'text-[#006948] font-bold' : 'text-slate-400'
                    }`}
                  >
                    <Icon name={bTab.icon} className="text-[20px]" />
                    <span className="text-[9px]">{bTab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* MODAL PENGATURAN JADWAL MANDIRI */}
        <AnimatePresence>
          {showCreateScheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-3xl bg-white p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm">Pengaturan Jadwal KBM Siswa</h3>
                  <button onClick={() => setShowCreateScheduleModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSaveNewSchedule} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Mata Pelajaran / Topik Belajar</label>
                    <input
                      type="text"
                      required
                      value={newScheduleTopic}
                      onChange={(e) => setNewScheduleTopic(e.target.value)}
                      className="w-full p-2.5 rounded-xl border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Pilih Hari Les</label>
                      <select
                        value={newScheduleDay}
                        onChange={(e) => setNewScheduleDay(e.target.value)}
                        className="w-full p-2.5 rounded-xl border font-semibold"
                      >
                        {DAYS_NAME.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Jam / Pukul (WIB)</label>
                      <input
                        type="text"
                        value={newScheduleTime}
                        onChange={(e) => setNewScheduleTime(e.target.value)}
                        className="w-full p-2.5 rounded-xl border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Alamat Rumah KBM</label>
                    <textarea
                      rows={2}
                      required
                      value={newScheduleAddress}
                      onChange={(e) => setNewScheduleAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl border"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingNewSchedule}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    {savingNewSchedule ? 'Menyimpan...' : 'Konfirmasi Jadwal Belajar'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL KELAS ONLINE JITSI MEET */}
        <AnimatePresence>
          {onlineClassSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-5xl h-[88vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-sm">Ruang Belajar Online: {onlineClassSchedule.today_topic || 'Sesi KBM'}</h3>
                  <button onClick={() => setOnlineClassSchedule(null)} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold cursor-pointer">
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

        {/* MODAL RESCHEDULE */}
        <AnimatePresence>
          {showRescheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm">Pengajuan Ganti Jadwal KBM</h3>
                  <button onClick={() => setShowRescheduleModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitReschedule} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Pilih Hari Pengganti</label>
                    <select
                      value={rescheduleDay}
                      onChange={(e) => setRescheduleDay(e.target.value)}
                      className="w-full p-2.5 rounded-xl border font-semibold"
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
                      placeholder="16:30"
                      className="w-full p-2.5 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Alasan Izin</label>
                    <textarea
                      rows={3}
                      required
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="Tulis alasan..."
                      className="w-full p-2.5 rounded-xl border"
                    />
                  </div>
                  <button type="submit" disabled={submittingReschedule} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                    {submittingReschedule ? 'Mengajukan...' : 'Kirim Permohonan ke Kepala Sekolah'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL SOS */}
        <AnimatePresence>
          {showSosModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm text-rose-600 flex items-center gap-1.5">
                    <Icon name="e911_emergency" /> Pusat Pengaduan Kendala KBM
                  </h3>
                  <button onClick={() => setShowSosModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitSos} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Jenis Kendala</label>
                    <select
                      value={sosIssueType}
                      onChange={(e) => setSosIssueType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border font-semibold"
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
                      className="w-full p-2.5 rounded-xl border"
                    />
                  </div>
                  <button type="submit" disabled={submittingSos} className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl cursor-pointer">
                    {submittingSos ? 'Mengirim...' : 'Kirim Pengaduan ke Kepala Sekolah'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL UPLOAD TUGAS PR */}
        <AnimatePresence>
          {showUploadPrModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm">Kirim Lembar Jawaban PR (+20 XP)</h3>
                  <button onClick={() => setShowUploadPrModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitAssignmentPhoto} className="space-y-3">
                  <p className="font-bold text-slate-800">Tugas: {targetAssignment?.title || 'Tugas Siswa'}</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    required
                    onChange={(e) => setAssignmentFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-500/20 file:text-emerald-600 font-bold"
                  />
                  <button type="submit" disabled={submittingAssignment} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                    {submittingAssignment ? 'Mengunggah...' : 'Kirim Berkas Jawaban'}
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
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm">Ajukan Pertanyaan PR Kilat 24/7</h3>
                  <button onClick={() => setShowAskPrModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitAskPr} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Mata Pelajaran</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-2.5 rounded-xl border font-semibold"
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
                      className="w-full p-2.5 rounded-xl border"
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
                  <button type="submit" disabled={submittingAskPr} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl cursor-pointer">
                    {submittingAskPr ? 'Mengirimkan...' : 'Kirim Pertanyaan ke Guru'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL INVOICE KUITANSI RESMI */}
        <AnimatePresence>
          {showInvoiceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 space-y-4 relative shadow-2xl text-xs">
                <button onClick={() => setShowInvoiceModal(false)} className="absolute top-4 right-4 text-slate-400 print:hidden cursor-pointer"><Icon name="close" /></button>
                <div className="border-b-2 border-slate-900 pb-3">
                  <h3 className="font-black text-base">CERDAS ACADEMY</h3>
                  <p className="text-[10px] text-slate-500">Lembaga Bimbingan Belajar Privat Tatap Muka ke Rumah</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1"><span>Nama Siswa:</span><span className="font-bold">{studentProfile?.student_name || 'Raditya Pratama'}</span></div>
                  <div className="flex justify-between border-b pb-1"><span>WhatsApp:</span><span className="font-bold">{studentProfile?.phone_number || '0812xxxxxxxx'}</span></div>
                  <div className="flex justify-between border-b pb-1"><span>Paket Belajar:</span><span className="font-bold">{studentProfile?.selected_package || 'Bintang Juara Eksekutif'}</span></div>
                  <div className="flex justify-between pt-1 text-sm font-extrabold text-emerald-700"><span>Status:</span><span>TERVERIFIKASI &amp; AKTIF</span></div>
                </div>
                <button onClick={() => window.print()} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl print:hidden flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                  <Icon name="print" /> Cetak Lembar Kuitansi
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL GANTI KATA SANDI */}
        <AnimatePresence>
          {showProfilePasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
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
                      className="w-full p-2.5 rounded-xl border font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button type="submit" disabled={savingPassword} className="w-full py-3 bg-[#006948] text-white font-bold rounded-xl shadow-md cursor-pointer">
                    {savingPassword ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL CHAT TUTOR */}
        <AnimatePresence>
          {showChatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl flex flex-col h-[520px] text-xs">
                <div className="flex justify-between items-center border-b pb-2.5">
                  <div>
                    <h4 className="font-bold">Chat: {activeChatSchedule?.claimed_by_tutor_name || 'Kak Sarah Nabilah, S.Si'}</h4>
                    <p className="text-[10px] text-emerald-600">Dipantau Kepala Sekolah</p>
                  </div>
                  <button onClick={() => setShowChatModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <div className="flex-1 overflow-y-auto py-3 space-y-2">
                  {chatMessages.length === 0 ? (
                    <div className="p-3 rounded-2xl max-w-[80%] bg-slate-100 text-slate-800 mr-auto">
                      <p className="text-[9px] font-bold opacity-75 uppercase mb-0.5">Kak Sarah Nabilah</p>
                      <p>Halo Raditya! Jangan lupa siapkan buku latihan bab 4 aljabar ya, saya sedang di jalan menuju rumahmu.</p>
                    </div>
                  ) : (
                    chatMessages.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-2xl max-w-[80%] ${
                          c.sender_role === 'murid' ? 'bg-emerald-600 text-white ml-auto' : 'bg-slate-100 text-slate-800 mr-auto'
                        }`}
                      >
                        <p className="text-[9px] font-bold opacity-75 uppercase mb-0.5">{c.sender_name}</p>
                        <p>{c.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t">
                  <input
                    type="text"
                    value={chatMsgInput}
                    onChange={(e) => setChatMsgInput(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 p-2 bg-slate-50 border rounded-xl outline-none"
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