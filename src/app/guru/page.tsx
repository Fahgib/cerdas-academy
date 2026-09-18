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

const DAYS_NAME = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function GuruDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'beranda' | 'jadwal' | 'siswa-kbm' | 'tanya-pr' | 'profil'>('beranda');

  // Autentikasi
  const [tutorPhone, setTutorPhone] = useState('');
  const [tutorPassword, setTutorPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<any | null>(null);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Data Operasional
  const [schedules, setSchedules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [homeworkHelpList, setHomeworkHelpList] = useState<any[]>([]);
  const [claimLoading, setClaimLoading] = useState<string | null>(null);

  // Status & Filter
  const [activeCalendarDay, setActiveCalendarDay] = useState('Sel');
  const [studentJenjangFilter, setStudentJenjangFilter] = useState('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isReadyToTeach, setIsReadyToTeach] = useState(true);

  // Modal Profil & Sandi
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Stopwatch Live KBM
  const [activeTimers, setActiveTimers] = useState<{ [scheduleId: string]: number }>({});

  // Ruang Kelas Online (Jitsi Meet)
  const [onlineClassSchedule, setOnlineClassSchedule] = useState<any | null>(null);

  // Modal-modal Aksi
  const [photoModalTarget, setPhotoModalTarget] = useState<any | null>(null);
  const [kbmPhotoFile, setKbmPhotoFile] = useState<File | null>(null);
  const [submittingPhoto, setSubmittingPhoto] = useState(false);

  const [activeReportSchedule, setActiveReportSchedule] = useState<any | null>(null);
  const [reportTopic, setReportTopic] = useState('');
  const [reportScore, setReportScore] = useState(85);
  const [reportNotes, setReportNotes] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const [materialModalTarget, setMaterialModalTarget] = useState<any | null>(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const [activeAssignmentSchedule, setActiveAssignmentSchedule] = useState<any | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [activeGoalSchedule, setActiveGoalSchedule] = useState<any | null>(null);
  const [newGoalText, setNewGoalText] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const [activeQuizSchedule, setActiveQuizSchedule] = useState<any | null>(null);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [savingQuiz, setSavingQuiz] = useState(false);

  const [activeHelpTarget, setActiveHelpTarget] = useState<any | null>(null);
  const [tutorAnswerText, setTutorAnswerText] = useState('');
  const [tutorMediaFile, setTutorMediaFile] = useState<File | null>(null);
  const [submittingHelpAnswer, setSubmittingHelpAnswer] = useState(false);

  const [previewMediaUrl, setPreviewMediaUrl] = useState<{ url: string; type: 'image' | 'video'; title: string } | null>(null);

  const [activeChatSchedule, setActiveChatSchedule] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cerdas_theme');
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedPhone = localStorage.getItem('cerdas_tutor_phone');
    if (savedPhone) {
      setTutorPhone(savedPhone);
      autoLoginWithSavedPhone(savedPhone);
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

  const autoLoginWithSavedPhone = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('tutor_applications')
        .select('*')
        .eq('phone_number', phone.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data && data.is_approved) {
        setTutorProfile(data);
        setIsLoggedIn(true);
        fetchTutorData(data.full_name);
      }
    } catch (err) {
      console.error('Auto login guru gagal:', err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        const next: { [key: string]: number } = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] > 0) next[k] -= 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Logika Login dengan Kunci Verifikasi Kepala Sekolah
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorPhone.trim() || !tutorPassword.trim()) {
      setAuthError('Masukkan nomor WhatsApp dan kata sandi akun guru!');
      return;
    }

    setLoading(true);
    setAuthError('');
    try {
      const { data: tutorData, error: tutorErr } = await supabase
        .from('tutor_applications')
        .select('*')
        .eq('phone_number', tutorPhone.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (tutorErr || !tutorData) {
        setAuthError('Nomor WhatsApp belum terdaftar sebagai guru.');
        setLoading(false);
        return;
      }

      // KUNCI VERIFIKASI ACC DARI KEPALA SEKOLAH
      if (!tutorData.is_approved) {
        setAuthError('Pendaftaran akun guru Anda masih dalam peninjauan oleh Kepala Sekolah. Silakan tunggu konfirmasi aktivasi via WhatsApp.');
        setLoading(false);
        return;
      }

      const validPassword = tutorData.password || '123456';
      if (tutorPassword.trim() !== validPassword) {
        setAuthError('Kata sandi yang Anda masukkan salah!');
        setLoading(false);
        return;
      }

      setTutorProfile(tutorData);
      localStorage.setItem('cerdas_tutor_phone', tutorPhone.trim());
      setIsLoggedIn(true);
      fetchTutorData(tutorData.full_name);
    } catch (err: any) {
      setAuthError('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorData = async (tutorName: string) => {
    const { data: schData } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (schData) {
      setSchedules(schData);
      const timersObj: { [key: string]: number } = {};
      schData.forEach((s) => {
        const isMyStudent = 
          (s.claimed_by_tutor_name?.toLowerCase() === tutorName?.toLowerCase() || 
           s.substitute_tutor_name?.toLowerCase() === tutorName?.toLowerCase()) && 
          !s.is_substitute_needed;
        if (isMyStudent && s.is_timer_active && s.session_started_at) {
          const elapsedSec = Math.floor((Date.now() - new Date(s.session_started_at).getTime()) / 1000);
          timersObj[s.id] = Math.max(0, 90 * 60 - elapsedSec);
        }
      });
      setActiveTimers(timersObj);
    }

    const { data: assData } = await supabase
      .from('student_assignments')
      .select('*')
      .eq('tutor_name', tutorName)
      .order('created_at', { ascending: false });
    if (assData) setAssignments(assData);

    const { data: goalData } = await supabase
      .from('learning_goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (goalData) setGoals(goalData);

    const { data: qzData } = await supabase
      .from('diagnostic_quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    if (qzData) setQuizzes(qzData);

    const { data: evalData } = await supabase
      .from('tutor_evaluations')
      .select('*')
      .eq('tutor_name', tutorName)
      .order('created_at', { ascending: false });
    if (evalData) setEvaluations(evalData);

    const { data: helpData } = await supabase
      .from('quick_homework_help')
      .select('*')
      .eq('tutor_name', tutorName)
      .order('created_at', { ascending: false });
    if (helpData) setHomeworkHelpList(helpData);
  };

  const handleLogout = () => {
    if (!confirm('Keluar dari portal pengajar Cerdas?')) return;
    localStorage.removeItem('cerdas_tutor_phone');
    setIsLoggedIn(false);
    setTutorProfile(null);
    setTutorPassword('');
    setSchedules([]);
    setAssignments([]);
    setGoals([]);
    setQuizzes([]);
    setEvaluations([]);
    setHomeworkHelpList([]);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.trim().length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase
        .from('tutor_applications')
        .update({ password: newPassword.trim() })
        .eq('id', tutorProfile.id);

      if (error) throw error;

      confetti({ particleCount: 70, spread: 50 });
      alert('Kata sandi berhasil diperbarui!');
      setShowProfileModal(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal menyimpan sandi.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleStartSessionTimer = async (sch: any) => {
    if (!confirm(`Mulai sesi les untuk ${sch.student_name}? Timer 90 menit akan diaktifkan.`)) return;

    try {
      await supabase
        .from('schedules')
        .update({
          is_timer_active: true,
          session_started_at: new Date().toISOString(),
        })
        .eq('id', sch.id);

      setActiveTimers((prev) => ({ ...prev, [sch.id]: 90 * 60 }));
      alert('Sesi KBM dimulai! Stopwatch 90 menit berjalan.');
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal memulai timer: ' + err.message);
    }
  };

  const handleRequestSubstitute = async (sch: any) => {
    if (!confirm(`Ajukan izin pengganti untuk murid "${sch.student_name}"? Jadwal akan masuk ke antrean alokasi darurat Kepala Sekolah.`)) return;
    try {
      await supabase
        .from('schedules')
        .update({ 
          is_substitute_needed: true,
          is_timer_active: false,
          session_started_at: null
        })
        .eq('id', sch.id);

      alert('Permohonan diajukan! Murid dialihkan ke antrean darurat Kepala Sekolah.');
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  const handleAcceptSubstitute = async (sch: any) => {
    try {
      await supabase
        .from('schedules')
        .update({
          substitute_tutor_name: tutorProfile.full_name,
          is_substitute_needed: false,
        })
        .eq('id', sch.id);

      confetti({ particleCount: 70, spread: 50 });
      alert(`Anda telah menerima tugas pengganti darurat untuk murid ${sch.student_name}!`);
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  // Mengambil Jadwal dari Bursa
  const handleClaimSchedule = async (sch: any) => {
    if (!tutorProfile?.is_approved) {
      return alert('Akun Anda belum di-ACC oleh Kepala Sekolah.');
    }

    setClaimLoading(sch.id);
    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          status: 'claimed',
          claimed_by_tutor_name: tutorProfile.full_name,
          is_substitute_needed: false,
        })
        .eq('id', sch.id);

      if (error) throw error;

      confetti({ particleCount: 90, spread: 70 });
      alert(`Jadwal murid ${sch.student_name} berhasil diambil!`);
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal mengambil jadwal: ' + err.message);
    } finally {
      setClaimLoading(null);
    }
  };

  const handleConfirmKbmPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoModalTarget || !kbmPhotoFile) return alert('Pilih foto bukti KBM!');

    setSubmittingPhoto(true);
    try {
      const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressed = await imageCompression(kbmPhotoFile, options);

      const ext = kbmPhotoFile.name.split('.').pop();
      const path = `kbm-proofs/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from('transfer-receipts').upload(path, compressed);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('transfer-receipts').getPublicUrl(path);
      const newCount = (photoModalTarget.completed_sessions || 0) + 1;

      await supabase
        .from('schedules')
        .update({
          completed_sessions: newCount,
          last_kbm_photo_url: urlData.publicUrl,
          is_timer_active: false,
          session_started_at: null,
        })
        .eq('id', photoModalTarget.id);

      await supabase.from('session_attendance_logs').insert([
        {
          schedule_id: photoModalTarget.id,
          student_name: photoModalTarget.student_name,
          tutor_name: photoModalTarget.substitute_tutor_name || tutorProfile.full_name,
          session_number: newCount,
          duration_minutes: 90,
          photo_url: urlData.publicUrl,
          notes: 'Sesi selesai tatap muka / online.',
        }
      ]);

      try {
        const { data: gmData } = await supabase
          .from('student_gamification')
          .select('xp_points')
          .eq('student_name', photoModalTarget.student_name)
          .single();

        const currentXp = gmData ? gmData.xp_points : 0;
        await supabase
          .from('student_gamification')
          .upsert({
            student_name: photoModalTarget.student_name,
            student_phone: photoModalTarget.student_phone || '',
            xp_points: currentXp + 30,
            level: Math.floor((currentXp + 30) / 100) + 1
          }, { onConflict: 'student_name' });
      } catch (errXp) {
        console.error('Error XP update:', errXp);
      }

      confetti({ particleCount: 80, spread: 60 });
      alert(`Sesi ke-${newCount} sukses diverifikasi! Laporan otomatis masuk ke portal orang tua.`);

      setPhotoModalTarget(null);
      setKbmPhotoFile(null);
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal mengunggah foto: ' + err.message);
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const handleAnswerHomeworkHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHelpTarget || (!tutorAnswerText.trim() && !tutorMediaFile)) {
      return alert('Tuliskan petunjuk pengerjaan atau lampirkan gambar/video!');
    }

    setSubmittingHelpAnswer(true);
    try {
      let attachmentUrl = null;
      let mediaType = null;

      if (tutorMediaFile) {
        const isVideo = tutorMediaFile.type.startsWith('video/');
        mediaType = isVideo ? 'video' : 'image';
        let fileToUpload: File = tutorMediaFile;

        if (!isVideo) {
          fileToUpload = await imageCompression(tutorMediaFile, {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
        }

        const ext = tutorMediaFile.name.split('.').pop();
        const path = `homework-help/tutor-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage.from('transfer-receipts').upload(path, fileToUpload);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('transfer-receipts').getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('quick_homework_help')
        .update({
          tutor_answer: tutorAnswerText.trim(),
          tutor_attachment_url: attachmentUrl,
          tutor_media_type: mediaType,
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', activeHelpTarget.id);

      if (error) throw error;

      alert(`Petunjuk PR berhasil dikirim ke murid ${activeHelpTarget.student_name}!`);
      setActiveHelpTarget(null);
      setTutorAnswerText('');
      setTutorMediaFile(null);
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal menyimpan jawaban: ' + err.message);
    } finally {
      setSubmittingHelpAnswer(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentSchedule) return;

    setSavingAssignment(true);
    try {
      const { error } = await supabase.from('student_assignments').insert([
        {
          schedule_id: activeAssignmentSchedule.id,
          student_name: activeAssignmentSchedule.student_name,
          tutor_name: tutorProfile.full_name,
          title: assignmentTitle,
          instructions: assignmentInstructions,
          due_date: assignmentDueDate || null,
          status: 'pending'
        }
      ]);
      if (error) throw error;

      alert('Tugas / PR berhasil diberikan ke murid!');
      setActiveAssignmentSchedule(null);
      setAssignmentTitle('');
      setAssignmentInstructions('');
      setAssignmentDueDate('');
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal membuat PR: ' + err.message);
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalSchedule || !newGoalText.trim()) return;

    setSavingGoal(true);
    try {
      const { error } = await supabase.from('learning_goals').insert([
        {
          schedule_id: activeGoalSchedule.id,
          student_name: activeGoalSchedule.student_name,
          goal_text: newGoalText.trim(),
          is_completed: false
        }
      ]);
      if (error) throw error;

      alert('Target capaian belajar murid berhasil ditambahkan!');
      setNewGoalText('');
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal menambah target: ' + err.message);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleToggleGoal = async (goal: any) => {
    try {
      await supabase.from('learning_goals').update({ is_completed: !goal.is_completed }).eq('id', goal.id);
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizSchedule) return;

    setSavingQuiz(true);
    try {
      const { error } = await supabase.from('diagnostic_quizzes').insert([
        {
          schedule_id: activeQuizSchedule.id,
          student_name: activeQuizSchedule.student_name,
          subject_topic: quizTopic,
          question: quizQuestion,
          option_a: optA,
          option_b: optB,
          option_c: optC,
          option_d: optD,
          correct_option: correctOpt
        }
      ]);
      if (error) throw error;

      alert('Soal kuis diagnostik persiapan sesi berhasil disimpan!');
      setActiveQuizSchedule(null);
      setQuizTopic('');
      setQuizQuestion('');
      setOptA(''); setOptB(''); setOptC(''); setOptD('');
      fetchTutorData(tutorProfile.full_name);
    } catch (err: any) {
      alert('Gagal membuat kuis: ' + err.message);
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialModalTarget || !materialFile) return alert('Pilih berkas modul!');

    setUploadingMaterial(true);
    try {
      const path = `materials/${Date.now()}-${materialFile.name}`;
      const { error: uploadErr } = await supabase.storage.from('transfer-receipts').upload(path, materialFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('transfer-receipts').getPublicUrl(path);

      await supabase.from('learning_materials').insert([
        {
          schedule_id: materialModalTarget.id,
          tutor_name: tutorProfile?.full_name || 'Guru',
          title: materialTitle,
          file_url: urlData.publicUrl,
        }
      ]);

      alert('Modul materi berhasil diunggah!');
      setMaterialModalTarget(null);
      setMaterialTitle('');
      setMaterialFile(null);
    } catch (err: any) {
      alert('Gagal unggah materi: ' + err.message);
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportSchedule) return;

    setSavingReport(true);
    try {
      await supabase.from('student_reports').insert([
        {
          schedule_id: activeReportSchedule.id,
          student_name: activeReportSchedule.student_name,
          tutor_name: tutorProfile?.full_name || 'Guru',
          subject_topic: reportTopic,
          score: reportScore,
          mentor_notes: reportNotes,
        }
      ]);

      alert('Rapor penilaian berhasil disimpan!');
      setActiveReportSchedule(null);
      setReportTopic('');
      setReportNotes('');
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setSavingReport(false);
    }
  };

  const openChat = async (sch: any) => {
    setActiveChatSchedule(sch);
    setChatLoading(true);
    const { data } = await supabase
      .from('session_chats')
      .select('*')
      .eq('schedule_id', sch.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    setChatLoading(false);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChatSchedule) return;

    const { error } = await supabase.from('session_chats').insert([
      {
        schedule_id: activeChatSchedule.id,
        sender_role: 'guru',
        sender_name: tutorProfile?.full_name || 'Guru',
        message: newMsg,
      }
    ]);

    if (!error) {
      setNewMsg('');
      const { data } = await supabase.from('session_chats').select('*').eq('schedule_id', activeChatSchedule.id).order('created_at', { ascending: true });
      if (data) setChatMessages(data);
    }
  };

  const formatTimerSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Murid yang khusus dibimbing oleh guru ini (Login saat ini)
  const myAssignedSchedules = schedules.filter(
    (s) => (s.claimed_by_tutor_name?.toLowerCase() === tutorProfile?.full_name?.toLowerCase() || 
            s.substitute_tutor_name?.toLowerCase() === tutorProfile?.full_name?.toLowerCase()) 
           && s.status === 'claimed'
           && !s.is_substitute_needed
  );

  const emergencySubstitutes = schedules.filter(
    (s) => s.is_substitute_needed && s.claimed_by_tutor_name !== tutorProfile?.full_name
  );

  // 2. Bursa Jadwal Terbuka (HANYA yang belum diambil oleh siapa pun)
  const openVacancies = schedules.filter(
    (s) => (s.status === 'open' || !s.claimed_by_tutor_name) && !s.is_substitute_needed
  );

  // 3. Jadwal yang SUDAH DIAMBIL oleh guru lain (Untuk notifikasi/informasi)
  const takenByOthers = schedules.filter(
    (s) => s.claimed_by_tutor_name && 
           s.claimed_by_tutor_name?.toLowerCase() !== tutorProfile?.full_name?.toLowerCase() &&
           s.status === 'claimed'
  );

  const totalCompletedSessions = myAssignedSchedules.reduce((sum, sch) => sum + (sch.completed_sessions || 0), 0);
  const totalEarnedHonor = totalCompletedSessions * 30000;

  const filteredStudents = myAssignedSchedules.filter((sch) => {
    const matchSearch = sch.student_name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                        (sch.student_address || '').toLowerCase().includes(studentSearchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (studentJenjangFilter === 'all') return true;
    return (sch.student_grade || '').toLowerCase().includes(studentJenjangFilter.toLowerCase());
  });

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="bg-[#f8fafc] text-[#0f172a] dark:bg-[#0a0e17] dark:text-[#dfe2ef] font-['Plus_Jakarta_Sans',sans-serif] min-h-screen flex flex-col antialiased transition-colors duration-200">

        {/* 1. DESKTOP FIXED SIDEBAR */}
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#181b25] z-50 flex-col justify-between border-r border-slate-200/80 dark:border-[#31353f] shadow-sm">
          <div className="flex flex-col">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-[#31353f]/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#4edea3]/20 border border-emerald-100 dark:border-transparent flex items-center justify-center text-emerald-600 dark:text-[#4edea3] shadow-sm">
                  <Icon name="school" className="text-[24px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight leading-none">Cerdas Tutor</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-[#bbcabf] uppercase tracking-widest mt-1">Academy Network</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-[#4edea3]/20 text-emerald-700 dark:text-[#4edea3] text-[11px] font-bold tracking-wider">PORTAL</span>
            </div>

            <div className="px-4 py-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/70 dark:border-transparent flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    <Icon name="person" className="text-[20px]" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1c1f29]"></span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{tutorProfile?.full_name || 'Tutor Cerdas'}</span>
                    <Icon name="verified" className="text-emerald-600 dark:text-[#4edea3] text-[14px]" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-[#bbcabf] truncate">Tutor Utama MIPA • Siaga</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-[#86948a] uppercase tracking-wider">Menu Utama Tutor</span>
            </div>

            <nav className="px-3 flex flex-col gap-1 text-sm font-semibold">
              {[
                { id: 'beranda', label: 'Beranda', icon: 'grid_view' },
                { id: 'jadwal', label: 'Jadwal Mengajar', icon: 'calendar_month' },
                { id: 'siswa-kbm', label: 'Siswa & KBM', icon: 'groups' },
                { id: 'tanya-pr', label: 'Tanya PR Kilat', icon: 'bolt', badge: homeworkHelpList.filter(h => h.status === 'pending').length || undefined },
                { id: 'profil', label: 'Profil & Keuangan', icon: 'account_balance_wallet' },
              ].map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white dark:bg-[#10b981] dark:text-[#003824] shadow-sm font-bold'
                        : 'text-slate-600 dark:text-[#bbcabf] hover:bg-slate-100 dark:hover:bg-[#262a34]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name={item.icon} className="text-[20px]" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 flex flex-col gap-3 border-t border-slate-100 dark:border-[#31353f]/40 bg-slate-50/50 dark:bg-[#181b25]/50">
            <div className="p-4 rounded-xl bg-white dark:bg-[#1c1f29] border border-slate-200 dark:border-transparent flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-[#bbcabf] uppercase tracking-wider">Dompet Honor</span>
                <Icon name="payments" className="text-amber-500 text-[18px]" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">Rp {totalEarnedHonor.toLocaleString('id-ID')}</div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-[#4edea3] flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Tersedia untuk ditarik
                </span>
              </div>
              <button
                onClick={() => alert(`Penarikan honor Rp ${totalEarnedHonor.toLocaleString('id-ID')} diproses otomatis ke rekening terdaftar.`)}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-slate-50 dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] hover:bg-slate-100 text-slate-700 dark:text-white text-xs font-bold transition-all text-center shadow-xs cursor-pointer"
              >
                Tarik Saldo
              </button>
            </div>

            <button
              onClick={() => {
                const target = myAssignedSchedules[0];
                if (target) handleRequestSubstitute(target);
                else alert('Tidak ada jadwal aktif untuk dialihkan.');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900 text-xs font-bold transition-colors cursor-pointer"
            >
              <Icon name="emergency" className="text-[18px] text-rose-600" />
              <span>SOS Bantuan Tutor</span>
            </button>
          </div>
        </aside>

        {/* 2. TOP EXECUTIVE NAVBAR */}
        <header className="fixed top-0 left-0 md:left-72 right-0 h-16 bg-white/90 dark:bg-[#0a0e17]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#31353f] z-40 flex items-center justify-between px-4 sm:px-8 shadow-xs">
          <div className="w-full max-w-md hidden sm:flex items-center">
            <div className="relative flex items-center w-full">
              <Icon name="search" className="absolute left-3.5 text-slate-400 text-[20px]" />
              <input
                type="text"
                placeholder="Cari siswa, topik pelajaran, atau ID soal..."
                className="w-full h-10 pl-10 pr-12 rounded-xl bg-slate-50 dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] text-slate-800 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1c1f29] transition-all"
              />
              <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] text-slate-400 text-[11px] font-bold">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={toggleTheme}
              className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold border transition-all cursor-pointer bg-slate-100 dark:bg-[#262a34] text-slate-700 dark:text-amber-400 border-slate-200 dark:border-[#31353f]"
              title="Ganti Mode Tampilan"
            >
              <Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} className="text-[17px]" />
              <span className="uppercase text-[10px]">{isDarkMode ? 'Terang' : 'Gelap'}</span>
            </button>

            <div
              onClick={() => setIsReadyToTeach(!isReadyToTeach)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900 cursor-pointer select-none"
            >
              <span className={`w-2 h-2 rounded-full ${isReadyToTeach ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="text-xs font-bold text-emerald-700 dark:text-[#4edea3]">
                {isReadyToTeach ? 'Siap Mengajar' : 'Mode Istirahat'}
              </span>
            </div>

            <button
              onClick={() => alert('Tidak ada notifikasi baru.')}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#262a34] transition-colors cursor-pointer"
            >
              <Icon name="notifications" className="text-[22px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0a0e17]"></span>
            </button>

            <div
              onClick={() => setActiveTab('profil')}
              className="flex items-center gap-2 pl-1 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-[#4edea3] text-white dark:text-[#003824] flex items-center justify-center font-bold text-xs shadow-sm">
                <Icon name="person" className="text-[18px]" />
              </div>
            </div>
          </div>
        </header>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className="relative pt-20 md:pl-72 min-h-screen w-full px-4 sm:px-8 py-6">
          <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto pb-20">

            {!isLoggedIn ? (
              /* FORM LOGIN GURU */
              <div className="max-w-md mx-auto mt-12 p-6 rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xl space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#4edea3] border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                    <Icon name="school" className="text-[26px]" />
                  </div>
                  <h2 className="text-lg font-bold">Masuk Portal Pengajar</h2>
                  <p className="text-xs text-slate-400">Gunakan nomor WhatsApp terdaftar dan kata sandi akun tutor Anda</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-2 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Nomor WhatsApp Guru</label>
                    <input
                      type="tel"
                      required
                      value={tutorPhone}
                      onChange={(e) => setTutorPhone(e.target.value)}
                      placeholder="Contoh: 0812xxxxxxxx"
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kata Sandi</label>
                    <div className="relative flex items-center">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={tutorPassword}
                        onChange={(e) => setTutorPassword(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                        className="w-full p-2.5 pr-10 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-medium outline-none focus:border-emerald-600"
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
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#4edea3] dark:text-[#003824] shadow-md transition-all cursor-pointer"
                  >
                    {loading ? 'Memverifikasi Akun...' : 'Buka Portal Mengajar'}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* TAB 1: BERANDA */}
                {activeTab === 'beranda' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#4edea3]/20 border border-emerald-100 dark:border-transparent flex items-center justify-center text-emerald-600 dark:text-[#4edea3] shrink-0 shadow-xs">
                          <Icon name="workspace_premium" className="text-[32px]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold tracking-tight">Selamat Mengajar, {tutorProfile?.full_name} 👋</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#ffb95f] border border-amber-200 text-xs font-semibold">
                              Akreditasi Bintang 5
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-[#bbcabf] mt-1">
                            {tutorProfile?.campus} • {tutorProfile?.major} • {tutorProfile?.is_approved ? 'Resmi Di-ACC' : 'Menunggu Verifikasi'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowProfileModal(true)}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
                        >
                          <Icon name="lock_reset" className="text-[18px]" />
                          <span>Ganti Sandi</span>
                        </button>
                      </div>
                    </div>

                    {/* Panggilan Pengganti Darurat */}
                    {emergencySubstitutes.length > 0 && (
                      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-rose-50 via-white to-amber-50/40 dark:from-rose-950/40 dark:via-[#181b25] dark:to-amber-950/20 border border-rose-200 dark:border-rose-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start md:items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Icon name="e911_emergency" className="text-[24px] animate-bounce" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Panggilan Darurat • Butuh Tutor Pengganti</span>
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">+Rp 15.000 Bonus Kilat</span>
                            </div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                              {emergencySubstitutes[0].student_name} ({emergencySubstitutes[0].day_of_week} • {emergencySubstitutes[0].session_time?.substring(0, 5)} WIB)
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-[#bbcabf]">{emergencySubstitutes[0].student_address}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAcceptSubstitute(emergencySubstitutes[0])}
                          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Icon name="bolt" className="text-[18px]" />
                          <span>Ambil Sesi Ini Sekarang</span>
                        </button>
                      </div>
                    )}

                    {/* 4 Cards Metrik */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[11px] font-bold uppercase tracking-wider">Total Honor Bulan Ini</span>
                          <Icon name="payments" className="text-emerald-600 text-[20px]" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-emerald-600 dark:text-[#4edea3]">Rp {totalEarnedHonor.toLocaleString('id-ID')}</div>
                          <p className="text-xs text-slate-400 mt-0.5">{totalCompletedSessions} Sesi terselesaikan (@ Rp 30.000)</p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[11px] font-bold uppercase tracking-wider">Siswa Bimbingan Aktif</span>
                          <Icon name="groups" className="text-amber-500 text-[20px]" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-slate-900 dark:text-white">{myAssignedSchedules.length} Murid</div>
                          <p className="text-xs text-slate-400 mt-0.5">Kapasitas mingguan terisi</p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[11px] font-bold uppercase tracking-wider">Bursa Jadwal Baru Murid</span>
                          <Icon name="add_location_alt" className="text-emerald-600 text-[20px]" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-slate-900 dark:text-white">{openVacancies.length} Slot</div>
                          <p className="text-xs text-slate-400 mt-0.5">Dibuat langsung oleh murid</p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col justify-between">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[11px] font-bold uppercase tracking-wider">Supervisi Kepala Sekolah</span>
                          <Icon name="military_tech" className="text-amber-500 text-[20px]" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {evaluations[0]?.score || '98'} <span className="text-sm font-bold text-emerald-600">/ 100</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Catatan performa mengajar</p>
                        </div>
                      </div>
                    </div>

                    {/* Sesi KBM Aktif & Bursa Lowongan */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-5 space-y-6">
                        {myAssignedSchedules.length === 0 ? (
                          <div className="p-6 bg-white dark:bg-[#181b25] rounded-2xl border border-slate-200 dark:border-[#31353f] text-center text-xs text-slate-400 space-y-2">
                            <Icon name="event_busy" className="text-[32px] text-slate-300 mx-auto" />
                            <p>Anda belum memiliki jadwal murid aktif.</p>
                            <p className="text-emerald-600 font-bold">Silakan ambil jadwal baru di kolom Bursa Lowongan Murid di sebelah kanan!</p>
                          </div>
                        ) : (
                          myAssignedSchedules.slice(0, 1).map((sch) => {
                            const timerSec = activeTimers[sch.id] || 0;
                            const isTimerRunning = sch.is_timer_active && timerSec > 0;

                            return (
                              <div key={sch.id} className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-emerald-700 dark:text-[#4edea3] flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                                    {sch.day_of_week} • {sch.session_time?.substring(0, 5)} WIB
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                    {sch.completed_sessions || 0} / {sch.target_sessions || 8} Sesi
                                  </span>
                                </div>

                                <div>
                                  <h3 className="font-bold text-base">{sch.student_name}</h3>
                                  <p className="text-xs text-emerald-600 font-semibold">{sch.today_topic || 'Bimbingan Belajar'}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{sch.student_address}</p>
                                </div>

                                {/* TOMBOL MASUK KELAS ONLINE JITSI MEET */}
                                <button
                                  onClick={() => setOnlineClassSchedule(sch)}
                                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                  <Icon name="video_camera_front" className="text-[18px]" />
                                  <span>Buka Ruang Kelas Online (Jitsi Meet)</span>
                                </button>

                                {/* Stopwatch Durasi KBM */}
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-transparent flex flex-col items-center text-center space-y-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sisa Waktu Sesi (Target 90 Menit)</span>
                                  <div className={`text-3xl font-black font-mono tracking-wider ${isTimerRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                                    {isTimerRunning ? formatTimerSeconds(timerSec) : '90:00'}
                                  </div>
                                  {!sch.is_timer_active ? (
                                    <button
                                      onClick={() => handleStartSessionTimer(sch)}
                                      className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                                    >
                                      Mulai Sesi & Stopwatch KBM
                                    </button>
                                  ) : (
                                    <span className="text-xs text-emerald-600 font-bold">Sesi KBM Sedang Berjalan</span>
                                  )}
                                </div>

                                <button
                                  onClick={() => { setPhotoModalTarget(sch); setKbmPhotoFile(null); }}
                                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Icon name="photo_camera" className="text-[18px]" />
                                  <span>Check-In Foto KBM & Lapor Ortu (+1 Sesi)</span>
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* 6 Quick Tools Guru */}
                      <div className="lg:col-span-4 space-y-6">
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                          <h3 className="font-bold text-base">Alat Manajemen Pembelajaran</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <button
                              onClick={() => {
                                const target = myAssignedSchedules[0];
                                if (target) {
                                  setActiveAssignmentSchedule(target);
                                  setAssignmentTitle('');
                                } else alert('Pilih jadwal bimbingan terlebih dahulu.');
                              }}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-transparent hover:border-emerald-500 flex flex-col gap-1 text-left cursor-pointer transition-all"
                            >
                              <Icon name="assignment" className="text-cyan-600 text-[22px]" />
                              <span className="font-bold text-slate-900 dark:text-white mt-1">Tugas & PR</span>
                              <span className="text-[11px] text-slate-400">Beri latihan murid</span>
                            </button>

                            <button
                              onClick={() => {
                                const target = myAssignedSchedules[0];
                                if (target) {
                                  setActiveGoalSchedule(target);
                                  setNewGoalText('');
                                } else alert('Pilih jadwal bimbingan terlebih dahulu.');
                              }}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-transparent hover:border-emerald-500 flex flex-col gap-1 text-left cursor-pointer transition-all"
                            >
                              <Icon name="track_changes" className="text-emerald-600 text-[22px]" />
                              <span className="font-bold text-slate-900 dark:text-white mt-1">Target Belajar</span>
                              <span className="text-[11px] text-slate-400">Milestone siswa</span>
                            </button>

                            <button
                              onClick={() => {
                                const target = myAssignedSchedules[0];
                                if (target) {
                                  setActiveQuizSchedule(target);
                                  setQuizTopic(target.today_topic || '');
                                } else alert('Pilih jadwal bimbingan terlebih dahulu.');
                              }}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-transparent hover:border-purple-500 flex flex-col gap-1 text-left cursor-pointer transition-all"
                            >
                              <Icon name="quiz" className="text-purple-600 text-[22px]" />
                              <span className="font-bold text-slate-900 dark:text-white mt-1">Kuis Kilat</span>
                              <span className="text-[11px] text-slate-400">Diagnostik 5 soal</span>
                            </button>

                            <button
                              onClick={() => {
                                const target = myAssignedSchedules[0];
                                if (target) {
                                  setMaterialModalTarget(target);
                                  setMaterialTitle('');
                                } else alert('Pilih jadwal bimbingan terlebih dahulu.');
                              }}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-transparent hover:border-indigo-500 flex flex-col gap-1 text-left cursor-pointer transition-all"
                            >
                              <Icon name="picture_as_pdf" className="text-indigo-600 text-[22px]" />
                              <span className="font-bold text-slate-900 dark:text-white mt-1">Modul PDF</span>
                              <span className="text-[11px] text-slate-400">Ringkasan rumus</span>
                            </button>

                            <button
                              onClick={() => {
                                const target = myAssignedSchedules[0];
                                if (target) {
                                  setActiveReportSchedule(target);
                                  setReportTopic(target.today_topic || '');
                                } else alert('Pilih jadwal bimbingan terlebih dahulu.');
                              }}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-transparent hover:border-amber-500 flex flex-col gap-1 text-left cursor-pointer transition-all"
                            >
                              <Icon name="grade" className="text-amber-600 text-[22px]" />
                              <span className="font-bold text-slate-900 dark:text-white mt-1">Input Rapor</span>
                              <span className="text-[11px] text-slate-400">Nilai & catatan</span>
                            </button>

                            <button
                              onClick={() => {
                                const target = myAssignedSchedules[0];
                                if (target) handleRequestSubstitute(target);
                                else alert('Pilih jadwal bimbingan terlebih dahulu.');
                              }}
                              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex flex-col gap-1 text-left cursor-pointer transition-all"
                            >
                              <Icon name="published_with_changes" className="text-rose-600 text-[22px]" />
                              <span className="font-bold text-rose-700 dark:text-rose-400 mt-1">Copot / Ganti</span>
                              <span className="text-[11px] text-rose-500">Izin pengganti</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* BURSA JADWAL MURID & STATUS ALOKASI MURID */}
                      <div className="lg:col-span-3 space-y-6">
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                          <div className="flex justify-between items-center text-xs">
                            <h3 className="font-bold text-sm">Bursa Jadwal Murid</h3>
                            <span className="text-emerald-600 font-bold">{openVacancies.length} Tersedia</span>
                          </div>

                          <div className="space-y-3 text-xs">
                            {/* Jika tidak ada jadwal sama sekali */}
                            {openVacancies.length === 0 && takenByOthers.length === 0 ? (
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1c1f29] text-center text-slate-400">
                                Belum ada jadwal murid yang terdaftar.
                              </div>
                            ) : (
                              <>
                                {/* DAFTAR 1: Jadwal yang Masih Terbuka (Bisa Diambil) */}
                                {openVacancies.map((v) => (
                                  <div key={v.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#1c1f29] space-y-2 border border-emerald-500/20">
                                    <div className="flex justify-between items-start font-bold">
                                      <span className="text-slate-900 dark:text-white">{v.student_name}</span>
                                      <span className="text-emerald-600 font-extrabold">Rp 30k/sesi</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 font-semibold">{v.today_topic || 'Bimbingan Belajar'}</p>
                                    <p className="text-slate-400">{v.day_of_week} • {v.session_time?.substring(0, 5)} WIB</p>
                                    <p className="text-[11px] text-slate-400 truncate">{v.student_address}</p>
                                    <button
                                      onClick={() => handleClaimSchedule(v)}
                                      disabled={claimLoading === v.id || !tutorProfile?.is_approved}
                                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                                    >
                                      {claimLoading === v.id ? 'Memproses...' : 'Ambil Jadwal Ini'}
                                    </button>
                                  </div>
                                ))}

                                {/* DAFTAR 2: Notifikasi Murid yang SUDAH DIAMBIL oleh Guru Lain */}
                                {takenByOthers.map((t) => (
                                  <div key={t.id} className="p-4 rounded-xl bg-slate-100/70 dark:bg-[#141720] space-y-2 border border-slate-200 dark:border-[#2a2e39] opacity-80">
                                    <div className="flex justify-between items-start font-bold">
                                      <span className="text-slate-700 dark:text-slate-300">{t.student_name}</span>
                                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#262a34] text-slate-600 dark:text-slate-400 text-[10px]">
                                        Terisi
                                      </span>
                                    </div>
                                    <p className="text-slate-500 text-[11px]">{t.day_of_week} • {t.session_time?.substring(0, 5)} WIB</p>
                                    
                                    {/* Box Notifikasi Penugasan */}
                                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                                      <Icon name="lock" className="text-[16px] text-amber-600 shrink-0" />
                                      <span>Sudah diambil oleh <b>Kak {t.claimed_by_tutor_name}</b></span>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: JADWAL MENGAJAR */}
                {activeTab === 'jadwal' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h1 className="text-2xl font-bold">Jadwal Mengajar & KBM</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola agenda les privat tatap muka & online mingguan</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center">
                      {DAYS_NAME.map((d, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveCalendarDay(d)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            activeCalendarDay === d
                              ? 'bg-emerald-600 text-white font-bold shadow-md'
                              : 'bg-white dark:bg-[#181b25] border-slate-200 dark:border-[#31353f] text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="text-[10px] uppercase">{d}</span>
                          <span className="text-base font-black mt-0.5">{16 + idx}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {myAssignedSchedules.map((sch) => (
                        <div key={sch.id} className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-600">{sch.day_of_week} • {sch.session_time?.substring(0, 5)} WIB</span>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                {sch.completed_sessions || 0} / {sch.target_sessions || 8} Sesi
                              </span>
                            </div>
                            <h4 className="text-base font-bold mt-1">{sch.student_name}</h4>
                            <p className="text-xs text-slate-500">{sch.today_topic || 'Bimbingan Belajar'} • {sch.student_address}</p>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setOnlineClassSchedule(sch)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                            >
                              <Icon name="video_camera_front" className="text-[16px]" /> Kelas Online
                            </button>
                            <button
                              onClick={() => {
                                setActiveReportSchedule(sch);
                                setReportTopic(sch.today_topic || '');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold hover:bg-slate-200 cursor-pointer"
                            >
                              Input Rapor
                            </button>
                            <button
                              onClick={() => openChat(sch)}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
                            >
                              <Icon name="chat" className="text-[16px]" /> Chat
                            </button>
                            <button
                              onClick={() => handleRequestSubstitute(sch)}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                            >
                              Izin Ganti
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: SISWA & KBM */}
                {activeTab === 'siswa-kbm' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold">Manajemen Siswa & KBM</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola penugasan PR, target pencapaian, kuis, dan modul</p>
                      </div>
                      <div className="flex gap-2">
                        {['all', 'smp', 'sd', 'sma'].map((j) => (
                          <button
                            key={j}
                            onClick={() => setStudentJenjangFilter(j)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                              studentJenjangFilter === j
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] text-slate-500'
                            }`}
                          >
                            {j === 'all' ? 'Semua' : j}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredStudents.map((sch) => (
                        <div key={sch.id} className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-base">{sch.student_name}</h3>
                              <p className="text-xs text-slate-500">{sch.student_grade || 'Kelas Belajar'} • WA: {sch.student_phone}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                              {sch.completed_sessions || 0} Pertemuan Selesai
                            </span>
                          </div>

                          <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-[#31353f]">
                            <button
                              onClick={() => setOnlineClassSchedule(sch)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                            >
                              <Icon name="video_camera_front" className="text-[16px]" /> Kelas Online
                            </button>
                            <button
                              onClick={() => setActiveAssignmentSchedule(sch)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
                            >
                              <Icon name="assignment" className="text-[16px] text-cyan-500" /> Beri Tugas
                            </button>
                            <button
                              onClick={() => setActiveGoalSchedule(sch)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
                            >
                              <Icon name="track_changes" className="text-[16px] text-emerald-500" /> Target
                            </button>
                            <button
                              onClick={() => setActiveQuizSchedule(sch)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
                            >
                              <Icon name="quiz" className="text-[16px] text-purple-500" /> Kuis
                            </button>
                            <button
                              onClick={() => { setMaterialModalTarget(sch); setMaterialTitle(''); setMaterialFile(null); }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold flex items-center gap-1 hover:bg-slate-200 cursor-pointer"
                            >
                              <Icon name="upload" className="text-[16px] text-indigo-500" /> Upload Modul
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: TANYA PR KILAT 24/7 */}
                {activeTab === 'tanya-pr' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">Pusat Bantuan Tanya PR Kilat</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Jawab pertanyaan sekolah murid Anda di luar jam KBM (+Rp 5.000 / soal)</p>
                    </div>

                    <div className="space-y-4">
                      {homeworkHelpList.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 p-8 bg-white dark:bg-[#181b25] rounded-2xl border border-slate-200 dark:border-[#31353f]">
                          Belum ada pertanyaan PR kilat yang diajukan oleh murid Anda.
                        </p>
                      ) : (
                        homeworkHelpList.map((h) => (
                          <div key={h.id} className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{h.student_name}</span>
                                <h3 className="font-bold text-base mt-0.5">{h.question_title}</h3>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${h.status === 'answered' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                                {h.status === 'answered' ? 'Terjawab' : 'Menunggu Respons'}
                              </span>
                            </div>

                            {h.question_photo_url && (
                              <button
                                onClick={() => setPreviewMediaUrl({ url: h.question_photo_url, type: h.question_media_type || 'image', title: h.question_title })}
                                className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Icon name="visibility" className="text-[16px]" /> Lihat Lampiran Soal ({h.question_media_type === 'video' ? 'Video' : 'Foto'})
                              </button>
                            )}

                            {h.status === 'pending' ? (
                              <button
                                onClick={() => {
                                  setActiveHelpTarget(h);
                                  setTutorAnswerText('');
                                  setTutorMediaFile(null);
                                }}
                                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Icon name="edit_note" className="text-[18px]" />
                                <span>Beri Petunjuk Rumus / Jawaban (+Rp 5.000)</span>
                              </button>
                            ) : (
                              <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl text-xs space-y-1">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Petunjuk Balasan:</span>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">“{h.tutor_answer}”</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: PROFIL & KEUANGAN */}
                {activeTab === 'profil' && (
                  <div className="max-w-2xl space-y-6">
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                          <Icon name="person" className="text-[32px]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">{tutorProfile?.full_name}</h2>
                          <span className="text-xs font-bold text-emerald-600">ID Pengajar: #TTR-20419</span>
                          <p className="text-xs text-slate-400 mt-0.5">{tutorProfile?.campus} • {tutorProfile?.major}</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#31353f] text-xs">
                        <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29]">
                          <span className="text-slate-400">Nomor WhatsApp:</span>
                          <span className="font-bold">{tutorProfile?.phone_number}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29]">
                          <span className="text-slate-400">Total Akumulasi Honor:</span>
                          <span className="font-bold text-emerald-600">Rp {totalEarnedHonor.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] divide-y divide-slate-100 dark:divide-[#31353f] text-xs font-semibold">
                      <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-full p-3.5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#262a34] rounded-xl cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon name="lock_reset" className="text-emerald-600" /> Ganti Kata Sandi Akun Pengajar
                        </span>
                        <Icon name="chevron_right" className="text-slate-400" />
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full p-3.5 flex justify-between items-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl cursor-pointer font-bold"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon name="logout" className="text-[18px]" /> Keluar dari Akun Guru
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
                { id: 'siswa-kbm', label: 'Siswa & KBM', icon: 'groups' },
                { id: 'tanya-pr', label: 'Tanya PR', icon: 'live_help', hasBadge: homeworkHelpList.filter(h => h.status === 'pending').length > 0 },
                { id: 'profil', label: 'Profil', icon: 'account_circle' },
              ].map((bTab) => {
                const active = activeTab === bTab.id;
                return (
                  <button
                    key={bTab.id}
                    onClick={() => setActiveTab(bTab.id as any)}
                    className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all cursor-pointer ${
                      active
                        ? 'text-emerald-600 dark:text-[#4edea3] font-bold'
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
                      Ruang Belajar Online: {onlineClassSchedule.student_name} ({onlineClassSchedule.today_topic || 'Sesi KBM'})
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

        {/* MODAL CHECK-IN FOTO KBM */}
        <AnimatePresence>
          {photoModalTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Foto Dokumentasi Sesi KBM</h3>
                  <button onClick={() => setPhotoModalTarget(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleConfirmKbmPhoto} className="space-y-3">
                  <p className="text-slate-500">Unggah foto bersama murid saat KBM selesai sebagai bukti verifikasi ke portal orang tua (+1 pertemuan).</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    required
                    onChange={(e) => setKbmPhotoFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-500/20 file:text-emerald-600 font-bold"
                  />
                  <button
                    type="submit"
                    disabled={submittingPhoto}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {submittingPhoto ? 'Mengunggah Bukti...' : 'Konfirmasi Pertemuan Selesai'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL JAWAB KONSULTASI PR KILAT */}
        <AnimatePresence>
          {activeHelpTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Jawab Konsultasi PR: {activeHelpTarget.student_name}</h3>
                  <button onClick={() => setActiveHelpTarget(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleAnswerHomeworkHelp} className="space-y-3">
                  <p className="font-semibold text-slate-700 dark:text-white">Soal: {activeHelpTarget.question_title}</p>
                  <textarea
                    rows={3}
                    value={tutorAnswerText}
                    onChange={(e) => setTutorAnswerText(e.target.value)}
                    placeholder="Tuliskan rumus atau petunjuk pengerjaan..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <div>
                    <label className="block mb-1 font-semibold">Lampiran Foto / Video (Opsional)</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setTutorMediaFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-500/20 file:text-emerald-600 font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingHelpAnswer}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {submittingHelpAnswer ? 'Mengirim...' : 'Kirim Jawaban ke Siswa (+Rp 5.000)'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL INPUT RAPOR */}
        <AnimatePresence>
          {activeReportSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Input Nilai Rapor Siswa</h3>
                  <button onClick={() => setActiveReportSchedule(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSaveReport} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={reportTopic}
                    onChange={(e) => setReportTopic(e.target.value)}
                    placeholder="Materi yang diujikan..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <div>
                    <div className="flex justify-between mb-1 font-semibold">
                      <span>Nilai Pemahaman:</span>
                      <span className="text-emerald-600 font-bold">{reportScore}</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={reportScore}
                      onChange={(e) => setReportScore(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Catatan sikap dan daya serap murid..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <button
                    type="submit"
                    disabled={savingReport}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {savingReport ? 'Menyimpan...' : 'Simpan ke Rapor'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL BUAT TUGAS / PR */}
        <AnimatePresence>
          {activeAssignmentSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Beri Tugas Latihan / PR</h3>
                  <button onClick={() => setActiveAssignmentSchedule(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleCreateAssignment} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="Judul Tugas..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <textarea
                    rows={3}
                    required
                    value={assignmentInstructions}
                    onChange={(e) => setAssignmentInstructions(e.target.value)}
                    placeholder="Petunjuk soal atau nomor di buku latihan..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <button
                    type="submit"
                    disabled={savingAssignment}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {savingAssignment ? 'Menyimpan...' : 'Kirim Tugas ke Murid'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL TARGET BELAJAR (GOALS) */}
        <AnimatePresence>
          {activeGoalSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Target Belajar: {activeGoalSchedule.student_name}</h3>
                  <button onClick={() => setActiveGoalSchedule(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleAddGoal} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="Tambah target baru..."
                    className="flex-1 p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <button type="submit" disabled={savingGoal} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                    Tambah
                  </button>
                </form>
                <div className="space-y-2 max-h-56 overflow-y-auto pt-2">
                  {goals.filter(g => g.schedule_id === activeGoalSchedule.id).map((g) => (
                    <div
                      key={g.id}
                      onClick={() => handleToggleGoal(g)}
                      className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-xl flex items-center justify-between cursor-pointer"
                    >
                      <span className={g.is_completed ? 'line-through text-slate-400' : 'font-semibold'}>{g.goal_text}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {g.is_completed ? 'Tercapai' : 'Belum'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL BUAT KUIS DIAGNOSTIK */}
        <AnimatePresence>
          {activeQuizSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Kuis Diagnostik Persiapan Sesi</h3>
                  <button onClick={() => setActiveQuizSchedule(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleCreateQuiz} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    placeholder="Materi (misal: Konsep Aljabar)"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <textarea
                    rows={2}
                    required
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    placeholder="Pertanyaan kuis..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" required value={optA} onChange={(e) => setOptA(e.target.value)} placeholder="Pilihan A" className="p-2 rounded-xl border bg-slate-50 dark:bg-[#1c1f29]" />
                    <input type="text" required value={optB} onChange={(e) => setOptB(e.target.value)} placeholder="Pilihan B" className="p-2 rounded-xl border bg-slate-50 dark:bg-[#1c1f29]" />
                    <input type="text" required value={optC} onChange={(e) => setOptC(e.target.value)} placeholder="Pilihan C" className="p-2 rounded-xl border bg-slate-50 dark:bg-[#1c1f29]" />
                    <input type="text" required value={optD} onChange={(e) => setOptD(e.target.value)} placeholder="Pilihan D" className="p-2 rounded-xl border bg-slate-50 dark:bg-[#1c1f29]" />
                  </div>
                  <select
                    value={correctOpt}
                    onChange={(e) => setCorrectOpt(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] font-bold text-emerald-600"
                  >
                    <option value="A">Pilihan A</option>
                    <option value="B">Pilihan B</option>
                    <option value="C">Pilihan C</option>
                    <option value="D">Pilihan D</option>
                  </select>
                  <button
                    type="submit"
                    disabled={savingQuiz}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {savingQuiz ? 'Menyimpan...' : 'Simpan Kuis'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL UPLOAD MODUL PDF */}
        <AnimatePresence>
          {materialModalTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Bagikan Modul Belajar</h3>
                  <button onClick={() => setMaterialModalTarget(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleUploadMaterial} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Judul Modul..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                  />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    required
                    onChange={(e) => setMaterialFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-500/20 file:text-emerald-600 font-bold"
                  />
                  <button
                    type="submit"
                    disabled={uploadingMaterial}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {uploadingMaterial ? 'Mengunggah...' : 'Unggah Modul'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL GANTI KATA SANDI GURU */}
        <AnimatePresence>
          {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Icon name="lock_reset" className="text-emerald-600" /> Profil & Kata Sandi Guru
                  </h3>
                  <button onClick={() => setShowProfileModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-500 block">Nama Guru Terdaftar</label>
                    <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{tutorProfile?.full_name}</p>
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Kata Sandi Baru (Min. 6 Karakter)</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Ulangi Kata Sandi Baru</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                    />
                  </div>
                  {passwordError && <p className="text-rose-500 font-bold">{passwordError}</p>}
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {savingPassword ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
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
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-5 shadow-2xl space-y-3 text-xs">
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

        {/* MODAL POP-UP CHAT SESI */}
        <AnimatePresence>
          {activeChatSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] p-5 shadow-2xl flex flex-col h-[520px] text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-2.5">
                  <div>
                    <h4 className="font-bold">Chat: {activeChatSchedule.student_name}</h4>
                    <p className="text-[10px] text-emerald-600">Dipantau Kepala Sekolah</p>
                  </div>
                  <button onClick={() => setActiveChatSchedule(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-2">
                  {chatLoading ? (
                    <p className="text-center text-slate-400 py-10">Memuat pesan...</p>
                  ) : chatMessages.length === 0 ? (
                    <p className="text-center text-slate-400 py-10">Belum ada obrolan.</p>
                  ) : (
                    chatMessages.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-2xl max-w-[80%] text-xs shadow-xs ${
                          c.sender_role === 'guru'
                            ? 'bg-emerald-600 text-white ml-auto rounded-tr-none'
                            : 'bg-slate-100 dark:bg-[#262a34] text-slate-800 dark:text-slate-200 mr-auto rounded-tl-none border border-slate-200 dark:border-transparent'
                        }`}
                      >
                        <p className="text-[9px] font-bold opacity-75 uppercase mb-0.5">{c.sender_name}</p>
                        <p>{c.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-[#31353f]">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
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