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
  { id: 'Sel', day: 'SEL', date: 17, dot: 'bg-emerald-500' },
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
  const [activeCalendarDay, setActiveCalendarDay] = useState('Sel');
  const [taskSubTab, setTaskSubTab] = useState<'tugas' | 'kuis' | 'riwayat'>('tugas');
  const [selectedQuizOption, setSelectedQuizOption] = useState<string>('B');
  const [selectedSubject, setSelectedSubject] = useState('Matematika');

  // State Pengaturan Jadwal Baru oleh Siswa
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

  // Modal State Lainnya
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
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#bbcabf] mt-1">Portal Murid</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-[#4edea3]/20 dark:text-[#4edea3] text-[10px] font-bold">
                VIP Murid
              </span>
            </div>

            <div className="px-6 pt-5 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#86948a]">MENU BELAJAR</span>
            </div>

            <nav className="flex flex-col gap-1 px-4 text-sm font-semibold">
              {[
                { id: 'beranda', label: 'Beranda', icon: 'dashboard' },
                { id: 'tugas', label: 'Tugas & Kuis', icon: 'assignment' },
                { id: 'jadwal', label: 'Jadwal KBM', icon: 'calendar_month' },
                { id: 'rapor', label: 'Rapor Akademik', icon: 'grade' },
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
              <span>Sesi KBM Terjadwal: {todaySchedule ? `${todaySchedule.day_of_week} • ${todaySchedule.session_time?.substring(0, 5)} WIB` : 'Belum Ada Jadwal'}</span>
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
                <span className="text-xs font-bold leading-tight">{studentProfile?.student_name || 'Raditya Pratama'}</span>
                <span className="text-[10px] text-slate-400">{studentProfile?.grade || 'Kelas 8 SMP'} • Level {currentLevel}</span>
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
                {/* 1. TAB: BERANDA */}
                {activeTab === 'beranda' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] font-semibold text-slate-800 dark:text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#4edea3] animate-ping"></span>
                          Portal Terverifikasi
                        </span>
                        <span>• {studentProfile?.address || 'Jakarta Utara'}</span>
                      </div>
                      <span className="font-medium text-emerald-700 dark:text-[#4edea3]">Semester Genap • TA Berjalan</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                          Selamat Datang Kembali, {studentProfile?.student_name || 'Raditya Pratama'} 👋
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#bbcabf] mt-1">
                          Siap lanjutkan pembelajaran hari ini? Pantau jadwal bimbingan dan kumpulkan PR tepat waktu.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowInvoiceModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Icon name="download" className="text-emerald-600" /> Unduh Kuitansi PDF
                        </button>
                        <button
                          onClick={() => setShowSosModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Icon name="fmd_bad" /> SOS Kendala KBM
                        </button>
                      </div>
                    </div>

                    {/* 4 Cards Metrik Ringkasan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Level Peringkat</span>
                          <p className="text-sm font-bold mt-1">Level {currentLevel}: Penjelajah Sains</p>
                          <span className="text-[11px] text-emerald-600 font-semibold block">Top 5% Siswa Berprestasi</span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#4edea3]/20 flex items-center justify-center text-[#006948] dark:text-[#4edea3]">
                          <Icon name="workspace_premium" className="text-[24px]" />
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400">XP Akumulasi</span>
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
                          <span className="text-[10px] uppercase font-bold text-slate-400">Streak Belajar</span>
                          <p className="text-sm font-bold mt-1 flex items-center gap-1">
                            14 Hari Beruntun <Icon name="local_fire_department" fill className="text-[18px] text-amber-500" />
                          </p>
                          <span className="text-[11px] text-amber-600 font-semibold block">Reward H-15: +100 XP</span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                          <Icon name="bolt" fill className="text-[24px]" />
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Standar Materi</span>
                          <p className="text-sm font-bold mt-1">Kurikulum Merdeka 2026</p>
                          <span className="text-[11px] text-emerald-600 font-semibold block">Fase D • Target 90+</span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#262a34] flex items-center justify-center text-slate-600">
                          <Icon name="menu_book" className="text-[24px]" />
                        </div>
                      </div>
                    </div>

                    {/* 2 Kolom Beranda: Sesi Aktif + Peta & Sidebar Target */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-8 space-y-6">
                        {todaySchedule ? (
                          <div className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-emerald-700 dark:text-[#4edea3]">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                                Sesi Belajar Terdekat
                              </span>
                              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                                {todaySchedule.session_time?.substring(0, 5) || '16:00'} WIB
                              </span>
                            </div>

                            <div>
                              <h3 className="font-bold text-lg">{todaySchedule.today_topic || 'Matematika & Logika Dasar'}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">Jadwal rutin: {todaySchedule.day_of_week} • Tatap Muka ke Rumah</p>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                                  <Icon name="person" />
                                </div>
                                <div className="text-xs">
                                  <span className="font-bold text-sm block">{todaySchedule.claimed_by_tutor_name || 'Kak Sarah Nabilah, S.Si'}</span>
                                  <span className="text-emerald-600 font-semibold">Mentor Utama MIPA</span>
                                </div>
                              </div>
                              <button
                                onClick={() => openChatWithTutor(todaySchedule)}
                                className="px-3 py-1.5 bg-white dark:bg-[#262a34] rounded-xl border border-slate-200 text-emerald-600 text-xs font-bold cursor-pointer hover:bg-slate-100"
                              >
                                Chat Mentor
                              </button>
                            </div>

                            <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                              <iframe
                                title="Peta Lokasi"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(todaySchedule.student_address || 'Kelapa Gading Jakarta Utara')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                className="w-full h-full filter contrast-105 pointer-events-none"
                              />
                              <a
                                href={todaySchedule.maps_url || `https://maps.google.com/?q=${encodeURIComponent(todaySchedule.student_address || 'Jakarta')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute top-2.5 right-3 px-3 py-1 rounded-xl bg-sky-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1 cursor-pointer"
                              >
                                <Icon name="near_me" className="text-[14px]" /> Buka Google Maps
                              </a>
                            </div>

                            <button
                              onClick={() => setOnlineClassSchedule(todaySchedule)}
                              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Icon name="video_camera_front" /> Masuk Ruang Kelas Online (Jitsi Meet)
                            </button>
                          </div>
                        ) : (
                          <div className="p-8 bg-white dark:bg-[#181b25] rounded-2xl border text-center text-xs text-slate-400">
                            Belum ada jadwal yang diatur.
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-4 space-y-6">
                        <div className="bg-gradient-to-br from-[#006948] to-[#00855d] text-white p-6 rounded-2xl shadow-md space-y-3">
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">Siaga 24/7</span>
                          <h3 className="text-lg font-bold">Punya Soal Sulit?</h3>
                          <p className="text-xs text-white/85 leading-relaxed">
                            Foto soal matematika atau PR sains Anda. Mentor siap menjawab langkah demi langkah.
                          </p>
                          <button
                            onClick={() => setShowAskPrModal(true)}
                            className="w-full py-2.5 rounded-xl bg-white text-[#006948] font-bold text-xs cursor-pointer shadow-sm mt-2"
                          >
                            📷 Tanya Foto / Video PR
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TAB: TUGAS PR & KUIS HARIAN */}
                {activeTab === 'tugas' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold">Tugas, PR &amp; Kuis Harian Siswa</h1>
                        <p className="text-xs text-slate-500">Kerjakan tugas mandiri dari tutor dan kuis adaptif untuk mendapatkan tambahan XP.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-8 space-y-4">
                        <div className="p-6 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs space-y-4">
                          <div className="flex justify-between items-center border-b pb-3">
                            <div className="flex items-center gap-2">
                              <Icon name="assignment" className="text-emerald-600 text-[22px]" />
                              <h3 className="font-bold text-base">Tugas Lembar Kerja Mandiri</h3>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">+20 XP per Tugas</span>
                          </div>

                          <div className="space-y-3">
                            {assignments.map((ass) => (
                              <div key={ass.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#1c1f29] space-y-2 border">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-sm">{ass.title}</h4>
                                    <p className="text-slate-500 text-xs mt-0.5">{ass.instructions}</p>
                                  </div>
                                  <span className="text-rose-600 font-bold text-xs">
                                    Batas: {ass.due_date ? new Date(ass.due_date).toLocaleDateString('id-ID') : 'Besok'}
                                  </span>
                                </div>
                                <div className="flex justify-end pt-2 border-t border-slate-200/40">
                                  {ass.status === 'submitted' ? (
                                    <span className="text-emerald-600 font-bold text-xs">✓ Sudah Dikumpulkan</span>
                                  ) : (
                                    <button
                                      onClick={() => { setTargetAssignment(ass); setShowUploadPrModal(true); }}
                                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                                    >
                                      Unggah Lembar Jawaban
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-4 space-y-4">
                        <div className="p-6 bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-2xl shadow-xs space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm flex items-center gap-1.5">
                              <Icon name="psychology" className="text-amber-500" /> Kuis Kilat Diagnostik
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">+15 XP</span>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl text-xs space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Aljabar Lanjutan</span>
                            <p className="font-bold">Berapakah nilai x dari persamaan: 3x - 5 = 16 ?</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                            {['A.  x = 5', 'B.  x = 7', 'C.  x = 8', 'D.  x = 9'].map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAnswerQuiz(opt.substring(0, 1))}
                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                  selectedQuizOption === opt.substring(0, 1)
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TAB: JADWAL BELAJAR & SESI KBM */}
                {activeTab === 'jadwal' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold">Jadwal Belajar &amp; Sesi KBM</h1>
                        <p className="text-xs text-slate-500">Atur dan pantau sesi les tatap muka bersama tutor bimbinganmu.</p>
                      </div>
                      <button
                        onClick={() => { fetchTutorsForSelection(); setShowCreateScheduleModal(true); }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Icon name="edit" /> Ubah / Buat Jadwal
                      </button>
                    </div>

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
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {schedules.map((s) => (
                        <div key={s.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-amber-600">{s.day_of_week} • {s.session_time?.substring(0, 5)} WIB</span>
                            <h4 className="text-base font-bold mt-0.5">{s.today_topic || 'Bimbingan Belajar MIPA'}</h4>
                            <p className="text-xs text-slate-500">Mentor: {s.claimed_by_tutor_name || 'Menunggu Penugasan'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setRescheduleTargetSchedule(s); setShowRescheduleModal(true); }}
                              className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Ajukan Reschedule
                            </button>
                            <button
                              onClick={() => openChatWithTutor(s)}
                              className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                            >
                              <Icon name="chat" /> Chat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. TAB: RAPOR AKADEMIK & BANK MODUL */}
                {activeTab === 'rapor' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">Rapor Akademik &amp; Bank Modul Terstruktur</h1>
                      <p className="text-xs text-slate-500">Pantau evaluasi pencapaian kompetensi dan unduh rangkuman materi dari mentor.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 bg-white border rounded-2xl space-y-1 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">RATA-RATA NILAI</span>
                        <div className="text-2xl font-black text-emerald-600">94.2 <span className="text-xs text-slate-400">/ 100</span></div>
                        <span className="text-[11px] text-emerald-600 font-semibold">Grade A+ (Sangat Baik)</span>
                      </div>
                      <div className="p-5 bg-white border rounded-2xl space-y-1 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">KEHADIRAN KBM</span>
                        <div className="text-2xl font-black text-slate-900">100%</div>
                        <span className="text-[11px] text-slate-500">Tepat Waktu &amp; Disiplin</span>
                      </div>
                      <div className="p-5 bg-white border rounded-2xl space-y-1 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">PENINGKATAN</span>
                        <div className="text-2xl font-black text-emerald-600">+12.8%</div>
                        <span className="text-[11px] text-emerald-600 font-semibold">Kenaikan Daya Serap</span>
                      </div>
                      <div className="p-5 bg-white border rounded-2xl space-y-1 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">SOAL TUNTAS</span>
                        <div className="text-2xl font-black text-slate-900">38 <span className="text-xs text-slate-400">Soal</span></div>
                        <span className="text-[11px] text-slate-500">Latihan Tipe HOTS</span>
                      </div>
                    </div>

                    {/* Bank Modul PDF */}
                    <div className="p-6 bg-white border rounded-2xl shadow-xs space-y-4">
                      <h3 className="font-bold text-base">Modul &amp; Cheat-Sheet Rumus PDF</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-50 border flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <Icon name="picture_as_pdf" className="text-rose-500 text-[22px]" />
                            <div>
                              <p className="font-bold">Rumus Kilat Aljabar &amp; Kuadrat</p>
                              <span className="text-[10px] text-slate-400">PDF • 4.2 MB</span>
                            </div>
                          </div>
                          <Icon name="download" className="text-slate-400 hover:text-emerald-600 cursor-pointer" />
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 border flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <Icon name="picture_as_pdf" className="text-rose-500 text-[22px]" />
                            <div>
                              <p className="font-bold">Rangkuman Fisika: Gaya &amp; Gerak</p>
                              <span className="text-[10px] text-slate-400">PDF • 3.1 MB</span>
                            </div>
                          </div>
                          <Icon name="download" className="text-slate-400 hover:text-emerald-600 cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. TAB: PUSAT TANYA PR & SOLUSI KILAT 24 JAM */}
                {activeTab === 'tanya-pr' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold">Pusat Tanya PR &amp; Solusi Kilat 24 Jam</h1>
                        <p className="text-xs text-slate-500">Tanyakan soal sulit sekolah kapan pun, tutor siaga memberikan panduan langkah demi langkah.</p>
                      </div>
                      <button
                        onClick={() => setShowAskPrModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-[#006948] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Icon name="photo_camera" /> Tanya Soal Baru
                      </button>
                    </div>

                    <div className="space-y-3">
                      {homeworkHelpList.map((h) => (
                        <div key={h.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm">{h.question_title}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${h.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {h.status === 'answered' ? '✓ Terjawab' : 'Menunggu Respons'}
                            </span>
                          </div>
                          {h.tutor_answer && (
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-950">
                              <span className="font-bold block text-[10px] uppercase text-emerald-700">Petunjuk Solusi ({h.tutor_name}):</span>
                              <p className="italic mt-0.5">“{h.tutor_answer}”</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. TAB: PROFIL SISWA & PENGATURAN AKUN */}
                {activeTab === 'profil' && (
                  <div className="max-w-2xl space-y-6">
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                          <Icon name="person" className="text-[32px]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">{studentProfile?.student_name || 'Raditya Pratama'}</h2>
                          <span className="text-xs font-bold text-emerald-600">ID Siswa: #CRD-89421</span>
                          <p className="text-xs text-slate-400 mt-0.5">{studentProfile?.grade || 'Kelas 8 SMP'} • Cerdas Academy</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t text-xs">
                        <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                          <span className="text-slate-400">Nomor WhatsApp Siswa / Wali:</span>
                          <span className="font-bold">{studentProfile?.phone_number || '-'}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                          <span className="text-slate-400">Paket Bimbingan Aktif:</span>
                          <span className="font-bold text-emerald-600">{studentProfile?.selected_package || 'Bintang Kelas (8 Sesi/Bln)'}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                          <span className="text-slate-400">Alamat Rumah KBM:</span>
                          <span className="font-bold truncate max-w-xs">{studentProfile?.address || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-2xl bg-white border border-slate-200 divide-y text-xs font-semibold">
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="w-full p-3.5 flex justify-between items-center hover:bg-slate-50 rounded-xl cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon name="description" className="text-emerald-600" /> Cetak Lembar Kuitansi Pembayaran PDF
                        </span>
                        <Icon name="chevron_right" className="text-slate-400" />
                      </button>

                      <button
                        onClick={() => setShowProfilePasswordModal(true)}
                        className="w-full p-3.5 flex justify-between items-center hover:bg-slate-50 rounded-xl cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon name="lock_reset" className="text-emerald-600" /> Ganti Kata Sandi Akun Siswa
                        </span>
                        <Icon name="chevron_right" className="text-slate-400" />
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full p-3.5 flex justify-between items-center text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer font-bold"
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

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        {isLoggedIn && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
            <div className="flex justify-between items-center h-16 max-w-lg mx-auto px-2">
              {[
                { id: 'beranda', label: 'Beranda', icon: 'dashboard' },
                { id: 'tugas', label: 'Tugas', icon: 'assignment' },
                { id: 'jadwal', label: 'Jadwal', icon: 'calendar_month' },
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

        {/* MODAL GANTI JADWAL (RESCHEDULE) */}
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

        {/* MODAL KENDALA DARURAT SOS */}
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
          {showUploadPrModal && targetAssignment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm">Kirim Lembar Jawaban PR (+20 XP)</h3>
                  <button onClick={() => setShowUploadPrModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSubmitAssignmentPhoto} className="space-y-3">
                  <p className="font-bold">Tugas: {targetAssignment.title}</p>
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
                  <div className="flex justify-between pt-1 text-sm font-extrabold text-emerald-700"><span>Status:</span><span>TERVERIFIKASI &amp; AKTIF</span></div>
                </div>
                <button onClick={() => window.print()} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl print:hidden flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
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

        {/* MODAL POP-UP CHAT TUTOR */}
        <AnimatePresence>
          {showChatModal && activeChatSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl flex flex-col h-[520px] text-xs">
                <div className="flex justify-between items-center border-b pb-2.5">
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
                          c.sender_role === 'murid' ? 'bg-emerald-600 text-white ml-auto' : 'bg-slate-100 text-slate-800 mr-auto'
                        }`}
                      >
                        <p className="text-[9px] font-bold uppercase opacity-75">{c.sender_name}</p>
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