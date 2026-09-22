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

const WEEK_DAYS = [
  { id: 'Sen', day: 'SEN', date: 16, dot: 'bg-slate-300' },
  { id: 'Sel', day: 'SEL', date: 17, dot: 'bg-emerald-500' },
  { id: 'Rab', day: 'RAB', date: 18, dot: 'bg-transparent' },
  { id: 'Kam', day: 'KAM', date: 19, dot: 'bg-amber-500' },
  { id: 'Jum', day: 'JUM', date: 20, dot: 'bg-emerald-500' },
  { id: 'Sab', day: 'SAB', date: 21, dot: 'bg-emerald-500' },
  { id: 'Min', day: 'MIN', date: 22, dot: 'bg-transparent', off: true },
];

const AVATAR_PRESETS = [
  { id: '1', name: 'Kucing Jenius', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4' },
  { id: '2', name: 'Rubah Cerdas', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Milo&backgroundColor=ffdfbf' },
  { id: '3', name: 'Panda Bijak', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Panda&backgroundColor=c0aede' },
  { id: '4', name: 'Burung Hantu Sains', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Oliver&backgroundColor=d1d4f9' },
  { id: '5', name: 'Astronot Ceria', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Luna&backgroundColor=ffd5dc' },
];

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
  const [scheduleFilterTab, setScheduleFilterTab] = useState<'mendatang' | 'riwayat' | 'izin'>('mendatang');
  const [studentJenjangFilter, setStudentJenjangFilter] = useState('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isReadyToTeach, setIsReadyToTeach] = useState(true);

  // Modal Profil & Sandi
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // State Edit Profil Publik Mentor
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editCampus, setEditCampus] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [editAchievements, setEditAchievements] = useState('');
  const [editAvatarOptionType, setEditAvatarOptionType] = useState<'preset' | 'upload'>('preset');
  const [editAvatarPreset, setEditAvatarPreset] = useState(AVATAR_PRESETS[0].url);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

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
        syncEditFormValues(data);
        setIsLoggedIn(true);
        fetchTutorData(data.full_name);
      }
    } catch (err) {
      console.error('Auto login guru gagal:', err);
    }
  };

  const syncEditFormValues = (profile: any) => {
    setEditFullName(profile?.full_name || '');
    setEditCampus(profile?.campus || '');
    setEditMajor(profile?.major || '');
    setEditAchievements(profile?.achievements || '');
    if (profile?.avatar_url) {
      setEditAvatarPreset(profile.avatar_url);
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
      syncEditFormValues(tutorData);
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

  const handleSaveProfileUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorProfile) return;

    setSavingProfile(true);
    try {
      let finalAvatar = editAvatarPreset;

      if (editAvatarOptionType === 'upload' && editAvatarFile) {
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true };
        const compressed = await imageCompression(editAvatarFile, options);
        const ext = editAvatarFile.name.split('.').pop();
        const path = `tutors/avatars/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage.from('transfer-receipts').upload(path, compressed);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('transfer-receipts').getPublicUrl(path);
        finalAvatar = urlData.publicUrl;
      }

      const newName = editFullName.trim();
      const oldName = tutorProfile.full_name;

      const updatePayload = {
        full_name: newName,
        campus: editCampus.trim(),
        major: editMajor.trim(),
        achievements: editAchievements.trim(),
        avatar_url: finalAvatar
      };

      const { data, error } = await supabase
        .from('tutor_applications')
        .update(updatePayload)
        .eq('id', tutorProfile.id)
        .select()
        .single();

      if (error) throw error;

      if (newName !== oldName) {
        await supabase
          .from('schedules')
          .update({ claimed_by_tutor_name: newName })
          .eq('claimed_by_tutor_name', oldName);
      }

      setTutorProfile(data);
      confetti({ particleCount: 80, spread: 60 });
      alert('Profil berhasil diperbarui! Perubahan Anda kini langsung tayang di etalase beranda utama.');
      setShowEditProfileModal(false);
      fetchTutorData(newName);
    } catch (err: any) {
      alert('Gagal memperbarui profil: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
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

  const myAssignedSchedules = schedules.filter(
    (s) => (s.claimed_by_tutor_name?.toLowerCase() === tutorProfile?.full_name?.toLowerCase() || 
            s.substitute_tutor_name?.toLowerCase() === tutorProfile?.full_name?.toLowerCase()) 
           && s.status === 'claimed'
           && !s.is_substitute_needed
  );

  const emergencySubstitutes = schedules.filter(
    (s) => s.is_substitute_needed && s.claimed_by_tutor_name !== tutorProfile?.full_name
  );

  const openVacancies = schedules.filter(
    (s) => (s.status === 'open' || !s.claimed_by_tutor_name) && !s.is_substitute_needed
  );

  const totalCompletedSessions = myAssignedSchedules.reduce((sum, sch) => sum + (sch.completed_sessions || 0), 0);
  const totalEarnedHonor = totalCompletedSessions * 30000;

  const tutorAvatarDisplay = tutorProfile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(tutorProfile?.full_name || 'Tutor')}&backgroundColor=b6e3f4`;

  // Siswa sesi aktif hari ini / kartu utama
  const activeKbmSchedule = myAssignedSchedules[0] || null;

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
                  <img
                    src={tutorAvatarDisplay}
                    alt={tutorProfile?.full_name || 'Tutor'}
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 bg-white"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1c1f29]"></span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{tutorProfile?.full_name || 'Tutor Cerdas'}</span>
                    <Icon name="verified" className="text-emerald-600 dark:text-[#4edea3] text-[14px]" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-[#bbcabf] truncate">{tutorProfile?.campus || 'Tutor Utama MIPA'}</span>
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
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Cari siswa, topik pelajaran, atau alamat..."
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

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Icon name="monetization_on" className="text-[18px] text-amber-600" />
              <span>+340.000 Hari Ini</span>
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
              <img
                src={tutorAvatarDisplay}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-emerald-500 bg-white shadow-sm"
              />
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
                {/* TAB 1: BERANDA LENGKAP DENGAN 3 KOLOM UTAMA */}
                {activeTab === 'beranda' && (
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={tutorAvatarDisplay}
                          alt={tutorProfile?.full_name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 bg-white shrink-0 shadow-xs"
                        />
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
                          onClick={() => setShowEditProfileModal(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Icon name="edit" className="text-[18px]" />
                          <span>Edit Profil Publik</span>
                        </button>
                        <button
                          onClick={() => setShowProfileModal(true)}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#262a34] text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
                        >
                          <Icon name="lock_reset" className="text-[18px]" />
                          <span>Ganti Sandi</span>
                        </button>
                      </div>
                    </div>

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

                    {/* 3 KOLOM BERANDA PERSIS SEPERTI DI DESAIN REFERENSI */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* KOLOM 1: Sesi Tatap Muka Sedang Berjalan (Dengan Peta Mini & Stopwatch) */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                              Sesi Tatap Muka Sedang Berjalan
                            </h2>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#4edea3] text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-900">
                            {activeKbmSchedule?.session_time ? `${activeKbmSchedule.session_time.substring(0, 5)} WIB` : '16:00 - 17:30 WIB'}
                          </span>
                        </div>

                        {activeKbmSchedule ? (
                          <div className="p-5 rounded-[2rem] bg-white dark:bg-[#121622] border-2 border-slate-200/80 dark:border-[#23293a] text-slate-800 dark:text-white shadow-xl space-y-4 transition-colors">
                            {/* Profil Murid & Kontak */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeKbmSchedule.student_name)}&backgroundColor=b6e3f4`}
                                    alt={activeKbmSchedule.student_name}
                                    className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/80 bg-slate-100 dark:bg-slate-800 p-0.5 shadow-sm"
                                  />
                                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#121622] flex items-center justify-center text-white text-[9px] font-bold">
                                    ✓
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">{activeKbmSchedule.student_name}</h3>
                                    <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-[#23293a] text-amber-800 dark:text-amber-400 font-bold text-[9px] border border-amber-200 dark:border-amber-400/20">
                                      {activeKbmSchedule.student_grade || 'SMP'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{activeKbmSchedule.today_topic || 'Program Bimbingan Belajar'}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Wali: {activeKbmSchedule.student_phone ? `+62 ${activeKbmSchedule.student_phone.slice(-9, -4)}-xxxx` : 'Terdaftar'}</p>
                                </div>
                              </div>

                              <a
                                href={activeKbmSchedule.student_phone ? `https://wa.me/${activeKbmSchedule.student_phone.replace(/^0/, '62')}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-[#1c2233] hover:bg-slate-200 dark:hover:bg-[#283149] border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0 cursor-pointer"
                                title="Hubungi Wali Murid"
                              >
                                <Icon name="call" className="text-[16px]" />
                              </a>
                            </div>

                            {/* Alamat & Jarak */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                                <Icon name="location_on" className="text-amber-500 text-[15px] shrink-0" />
                                <span className="truncate">{activeKbmSchedule.student_address || 'Jl. Boulevard Raya, Kelapa Gading'}</span>
                              </div>
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] shrink-0">1.2 km (ETA 4 min)</span>
                            </div>

                            {/* Mini Map Interaktif */}
                            <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-900 shadow-inner">
                              <iframe
                                title="Peta Mini KBM"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(activeKbmSchedule.student_address || 'Kelapa Gading Jakarta')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                className="w-full h-full filter contrast-105 pointer-events-none"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                              <div className="absolute bottom-2 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-950/85 border border-slate-200 dark:border-slate-700 text-[9px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>GPS Aktif: Presensi Valid (8m)</span>
                              </div>
                              <a
                                href={activeKbmSchedule.maps_url || (activeKbmSchedule.student_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeKbmSchedule.student_address)}` : 'https://maps.google.com')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-2 right-2.5 px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md cursor-pointer"
                              >
                                <Icon name="near_me" className="text-[12px]" />
                                <span>Rute Maps 🚗</span>
                              </a>
                            </div>

                            {/* Stopwatch Box */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181e2e] border border-slate-200 dark:border-slate-800 space-y-2.5">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">SISA WAKTU BELAJAR EFEKTIF</span>
                                <span className="text-amber-600 dark:text-amber-400 font-extrabold">Telah Berjalan: 65 Menit</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-3xl font-black font-mono tracking-widest text-emerald-600 dark:text-emerald-400">
                                  01 <span className="text-slate-400">:</span> 10 <span className="text-slate-400">:</span> 31
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-slate-400 block font-semibold">Target 90 Menit</span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{activeKbmSchedule.completed_sessions || 0} / {activeKbmSchedule.target_sessions || 8} Sesi</span>
                                </div>
                              </div>

                              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: '72%' }} />
                              </div>

                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[150px]">Materi: Persamaan Kuadrat</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">72% Lengkap</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  onClick={() => alert('Sesi KBM sedang berjalan aktif.')}
                                  className="py-2 rounded-xl bg-slate-200/80 dark:bg-[#232a3d] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Icon name="pause_circle" className="text-[15px] text-amber-500" /> Jeda Sesi
                                </button>
                                <button
                                  onClick={() => { setPhotoModalTarget(activeKbmSchedule); setKbmPhotoFile(null); }}
                                  className="py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Icon name="stop_circle" className="text-[15px] text-rose-500" /> Selesaikan Sesi
                                </button>
                              </div>
                            </div>

                            {/* Tombol Check In */}
                            <button
                              onClick={() => { setPhotoModalTarget(activeKbmSchedule); setKbmPhotoFile(null); }}
                              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Icon name="photo_camera" className="text-[18px]" />
                              <span>Check-In Foto KBM &amp; Lapor Ortu Langsung</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-8 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] text-center text-xs text-slate-400">
                            Belum ada jadwal bimbingan aktif hari ini.
                          </div>
                        )}

                        {/* Catatan Khusus Orang Tua */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-slate-200 dark:border-slate-800 text-xs space-y-1 shadow-sm">
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                            <Icon name="lightbulb" className="text-[16px]" />
                            <span>Catatan Khusus Orang Tua</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 italic pl-5 leading-relaxed text-[11px]">
                            "Raditya perlu penguatan konsep faktorisasi aljabar untuk persiapan ujian tengah semester pekan depan."
                          </p>
                        </div>
                      </div>

                      {/* KOLOM 2: Quick Tools Mengajar & Bantuan Tanya PR Kilat */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quick Tools Mengajar</h2>
                          <span className="text-[10px] text-slate-400">Akses Sekali Klik</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <button
                            onClick={() => {
                              const target = myAssignedSchedules[0];
                              if (target) { setActiveAssignmentSchedule(target); setAssignmentTitle(''); }
                              else alert('Pilih siswa terlebih dahulu.');
                            }}
                            className="p-3 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] hover:border-emerald-500 flex flex-col gap-1 text-left cursor-pointer transition-all shadow-xs"
                          >
                            <Icon name="assignment" className="text-cyan-600 text-[20px]" />
                            <span className="font-bold text-slate-900 dark:text-white mt-1">Tugas &amp; PR</span>
                            <span className="text-[10px] text-slate-400">Buat &amp; periksa tugas</span>
                          </button>

                          <button
                            onClick={() => {
                              const target = myAssignedSchedules[0];
                              if (target) { setActiveGoalSchedule(target); setNewGoalText(''); }
                              else alert('Pilih siswa terlebih dahulu.');
                            }}
                            className="p-3 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] hover:border-emerald-500 flex flex-col gap-1 text-left cursor-pointer transition-all shadow-xs"
                          >
                            <Icon name="track_changes" className="text-emerald-600 text-[20px]" />
                            <span className="font-bold text-slate-900 dark:text-white mt-1">Target Belajar</span>
                            <span className="text-[10px] text-slate-400">Update kurikulum</span>
                          </button>

                          <button
                            onClick={() => {
                              const target = myAssignedSchedules[0];
                              if (target) { setActiveQuizSchedule(target); setQuizTopic(target.today_topic || ''); }
                              else alert('Pilih siswa terlebih dahulu.');
                            }}
                            className="p-3 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] hover:border-purple-500 flex flex-col gap-1 text-left cursor-pointer transition-all shadow-xs"
                          >
                            <Icon name="quiz" className="text-purple-600 text-[20px]" />
                            <span className="font-bold text-slate-900 dark:text-white mt-1">Kuis Diagnostik</span>
                            <span className="text-[10px] text-slate-400">Rilis 5 soal kilat</span>
                          </button>

                          <button
                            onClick={() => {
                              const target = myAssignedSchedules[0];
                              if (target) { setMaterialModalTarget(target); setMaterialTitle(''); }
                              else alert('Pilih siswa terlebih dahulu.');
                            }}
                            className="p-3 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] hover:border-indigo-500 flex flex-col gap-1 text-left cursor-pointer transition-all shadow-xs"
                          >
                            <Icon name="picture_as_pdf" className="text-indigo-600 text-[20px]" />
                            <span className="font-bold text-slate-900 dark:text-white mt-1">Modul PDF</span>
                            <span className="text-[10px] text-slate-400">Unggah ringkasan</span>
                          </button>

                          <button
                            onClick={() => {
                              const target = myAssignedSchedules[0];
                              if (target) { setActiveReportSchedule(target); setReportTopic(target.today_topic || ''); }
                              else alert('Pilih siswa terlebih dahulu.');
                            }}
                            className="p-3 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] hover:border-amber-500 flex flex-col gap-1 text-left cursor-pointer transition-all shadow-xs"
                          >
                            <Icon name="grade" className="text-amber-600 text-[20px]" />
                            <span className="font-bold text-slate-900 dark:text-white mt-1">Input Rapor</span>
                            <span className="text-[10px] text-slate-400">Skor pemahaman</span>
                          </button>

                          <button
                            onClick={() => {
                              const target = myAssignedSchedules[0];
                              if (target) handleRequestSubstitute(target);
                              else alert('Pilih siswa terlebih dahulu.');
                            }}
                            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex flex-col gap-1 text-left cursor-pointer transition-all shadow-xs"
                          >
                            <Icon name="published_with_changes" className="text-rose-600 text-[20px]" />
                            <span className="font-bold text-rose-700 dark:text-rose-400 mt-1">Ajukan Pengganti</span>
                            <span className="text-[10px] text-rose-500">Izin &amp; delegasi KBM</span>
                          </button>
                        </div>

                        {/* Card Bantuan Tanya PR Kilat */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                              <Icon name="bolt" className="text-amber-500 text-[18px]" />
                              <span>Bantuan Tanya PR Kilat</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">2 Menunggu</span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] space-y-2 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">Raditya Pratama</span>
                                <span className="text-[10px] text-slate-400">Aljabar Linear • Tenggat 19:00</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"Berapakah nilai x dari persamaan: 3x - 5 = 16?"</p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-bold text-emerald-600">+Rp 5.000 Honor</span>
                              <button
                                onClick={() => setActiveTab('tanya-pr')}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Beri Petunjuk Cepat
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* KOLOM 3: Lowongan Les Privat Baru & Jadwal Sesi Hari Ini */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Lowongan Les Privat Baru</h2>
                          <span className="text-[10px] text-slate-400">Area Anda</span>
                        </div>

                        {/* Kartu Lowongan Bursa */}
                        <div className="space-y-2.5">
                          {openVacancies.slice(0, 2).map((v) => (
                            <div key={v.id} className="p-3.5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-1.5 text-xs">
                              <div className="flex justify-between items-start font-bold">
                                <div>
                                  <span className="text-slate-900 dark:text-white block font-bold">{v.student_name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">{v.student_grade || 'Kelas 5 SD'} • {v.today_topic || 'Matematika Dasar'}</span>
                                </div>
                                <span className="text-emerald-600 font-extrabold text-[11px]">Rp 30k/sesi</span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">{v.student_address || 'Kelapa Gading'}</p>
                              <button
                                onClick={() => handleClaimSchedule(v)}
                                disabled={claimLoading === v.id || !tutorProfile?.is_approved}
                                className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] cursor-pointer transition-colors"
                              >
                                {claimLoading === v.id ? 'Memproses...' : 'Ambil Mengajar'}
                              </button>
                            </div>
                          ))}

                          {openVacancies.length === 0 && (
                            <div className="p-4 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] text-center text-xs text-slate-400">
                              Belum ada lowongan baru saat ini.
                            </div>
                          )}
                        </div>

                        {/* Jadwal Sesi Hari Ini List */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">Jadwal Sesi Hari Ini</span>
                            <span className="text-[10px] text-slate-400">{myAssignedSchedules.length} Sesi</span>
                          </div>

                          <div className="space-y-2">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/60 dark:border-transparent flex items-center justify-between">
                              <div>
                                <span className="font-semibold block text-slate-800 dark:text-white">16:00 • {activeKbmSchedule?.student_name || 'Raditya P.'}</span>
                                <span className="text-[10px] text-emerald-600 font-bold">Sedang Aktif</span>
                              </div>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-[#1c1f29]/60 border border-slate-200/60 dark:border-transparent flex items-center justify-between opacity-80">
                              <div>
                                <span className="font-semibold block text-slate-800 dark:text-white">19:00 • Nabila K. (Kelas 12)</span>
                                <span className="text-[10px] text-slate-400">Kalkulus UTBK • Daring Zoom</span>
                              </div>
                              <Icon name="videocam" className="text-slate-400 text-[16px]" />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* TABEL SEMUA MURID BIMBINGAN SAYA */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#31353f] pb-3">
                        <div className="flex items-center gap-2">
                          <Icon name="table_chart" className="text-emerald-600 text-[22px]" />
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">Tabel Daftar Murid Bimbingan Saya</h3>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-[#4edea3] bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                          Total: {myAssignedSchedules.length} Murid
                        </span>
                      </div>

                      {myAssignedSchedules.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          Belum ada murid bimbingan yang terdaftar pada akun Anda.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-[#1c1f29] text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#31353f]">
                              <tr>
                                <th className="p-3">Nama Siswa</th>
                                <th className="p-3">Mata Pelajaran</th>
                                <th className="p-3">Jadwal Les</th>
                                <th className="p-3">Pertemuan</th>
                                <th className="p-3">Lokasi / Peta</th>
                                <th className="p-3 text-center">Aksi Cepat</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#31353f]">
                              {myAssignedSchedules.map((sch) => {
                                const mapLink = sch.maps_url || (sch.student_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sch.student_address)}` : 'https://maps.google.com');
                                return (
                                  <tr key={sch.id} className="hover:bg-slate-50/60 dark:hover:bg-[#202533] transition-colors">
                                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                                      {sch.student_name}
                                      <span className="block text-[10px] text-slate-400 font-normal">WA: {sch.student_phone}</span>
                                    </td>
                                    <td className="p-3 font-medium text-emerald-600 dark:text-[#4edea3]">
                                      {sch.today_topic || 'Bimbingan Belajar'}
                                    </td>
                                    <td className="p-3 font-semibold text-amber-600">
                                      {sch.day_of_week} • {sch.session_time?.substring(0, 5)} WIB
                                    </td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-[#4edea3] font-bold text-[10px]">
                                        {sch.completed_sessions || 0} / {sch.target_sessions || 8} Sesi
                                      </span>
                                    </td>
                                    <td className="p-3 max-w-[200px]">
                                      <div className="truncate text-slate-500" title={sch.student_address}>
                                        {sch.student_address || 'Alamat Siswa'}
                                      </div>
                                      <a
                                        href={mapLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline inline-flex items-center gap-1 mt-0.5"
                                      >
                                        <Icon name="near_me" className="text-[12px] text-rose-500" /> Buka Google Maps
                                      </a>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => setOnlineClassSchedule(sch)}
                                          title="Kelas Online"
                                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                                        >
                                          <Icon name="video_camera_front" className="text-[16px]" />
                                        </button>
                                        <button
                                          onClick={() => openChat(sch)}
                                          title="Chat Siswa"
                                          className="p-1.5 bg-slate-100 dark:bg-[#262a34] text-slate-700 dark:text-white rounded-lg hover:bg-slate-200 cursor-pointer"
                                        >
                                          <Icon name="chat" className="text-[16px]" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setActiveReportSchedule(sch);
                                            setReportTopic(sch.today_topic || '');
                                          }}
                                          title="Input Rapor"
                                          className="p-1.5 bg-slate-100 dark:bg-[#262a34] text-slate-700 dark:text-white rounded-lg hover:bg-slate-200 cursor-pointer"
                                        >
                                          <Icon name="grade" className="text-[16px] text-amber-500" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: JADWAL MENGAJAR & MANAJEMEN KBM LENGKAP DENGAN STRIP HARI YANG BERFUNGSI */}
                {activeTab === 'jadwal' && (
                  <div className="space-y-6">
                    {/* Top Control Bar / Command Horizon */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Jadwal Mengajar &amp; Manajemen KBM
                          </h1>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-[#4edea3] text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Auto-Sync Google Calendar &amp; HP Aktif
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Kelola agenda les privat tatap muka dan sesi online mingguan {tutorProfile?.full_name || 'Tutor Cerdas'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="p-1 rounded-xl bg-slate-200/80 dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] flex items-center gap-1 text-xs">
                          <button
                            onClick={() => setScheduleFilterTab('mendatang')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                              scheduleFilterTab === 'mendatang' ? 'bg-white dark:bg-[#262a34] text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            Mendatang <span className="ml-1 text-emerald-600 font-bold">{myAssignedSchedules.length}</span>
                          </button>
                          <button
                            onClick={() => setScheduleFilterTab('riwayat')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                              scheduleFilterTab === 'riwayat' ? 'bg-white dark:bg-[#262a34] text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            Riwayat Selesai <span className="ml-1 text-slate-400">{totalCompletedSessions}</span>
                          </button>
                          <button
                            onClick={() => setScheduleFilterTab('izin')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                              scheduleFilterTab === 'izin' ? 'bg-white dark:bg-[#262a34] text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            Izin &amp; Ganti Jadwal
                          </button>
                        </div>

                        <button
                          onClick={() => alert('Jadwal les ditentukan langsung oleh murid atau diambil melalui Bursa Jadwal.')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                        >
                          <Icon name="add_circle" className="text-[18px]" />
                          <span>Tambah Slot Mengajar</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Workspace (65% Agenda / 35% Logistics & Dispatch) */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
                      
                      {/* LEFT WORKSPACE (65% -> 8 columns on 12-col grid) */}
                      <div className="xl:col-span-8 flex flex-col gap-6">
                        
                        {/* Interactive Weekly Date Picker Strip (HARI SEKARANG BISA DI-KLIK) */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] flex flex-col gap-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon name="calendar_month" className="text-emerald-600 text-[20px]" />
                              <span className="font-bold text-sm text-slate-900 dark:text-white">Oktober 2026</span>
                              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold pl-1">Pekan ke-3</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <button className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] hover:bg-slate-200 dark:hover:bg-[#31353f] flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
                                <Icon name="chevron_left" className="text-[18px]" />
                              </button>
                              <button 
                                onClick={() => setActiveCalendarDay('Sel')}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#262a34] hover:bg-slate-200 dark:hover:bg-[#31353f] text-slate-700 dark:text-slate-200 font-semibold transition-colors"
                              >
                                Hari Ini
                              </button>
                              <button className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#262a34] hover:bg-slate-200 dark:hover:bg-[#31353f] flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
                                <Icon name="chevron_right" className="text-[18px]" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-7 gap-2">
                            {WEEK_DAYS.map((item) => {
                              const isSelected = activeCalendarDay === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setActiveCalendarDay(item.id)}
                                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-all cursor-pointer select-none ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                      : item.off
                                      ? 'bg-slate-100/60 dark:bg-[#141720] text-slate-400 opacity-60'
                                      : 'bg-slate-50 dark:bg-[#1c1f29] hover:bg-emerald-50/50 dark:hover:bg-[#202636] border border-slate-200/70 dark:border-[#31353f] text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                    {item.day}
                                  </span>
                                  <span className="font-extrabold text-base">{item.date}</span>
                                  {item.off ? (
                                    <span className="text-[9px] font-bold text-slate-400 mt-1">LIBUR</span>
                                  ) : (
                                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : item.dot}`}></span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* PRIORITY CARD: Sesi Hari Ini */}
                        {activeKbmSchedule ? (
                          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4 p-6">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                  Prioritas Utama Hari Ini
                                </span>
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#262a34] text-slate-600 dark:text-slate-300 text-xs font-medium">
                                  Mulai dlm 45 Menit
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 px-3 py-1 rounded-lg font-semibold">
                                <Icon name="payments" className="text-[16px] text-emerald-600" />
                                <span>Honor: Rp 30.000 + Bonus Rp 10.000</span>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeKbmSchedule.student_name)}&backgroundColor=b6e3f4`}
                                    alt={activeKbmSchedule.student_name}
                                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                                  />
                                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                    8
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">{activeKbmSchedule.student_name}</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#262a34] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">VIP Privat</span>
                                  </div>
                                  <span className="text-xs text-emerald-700 dark:text-[#4edea3] font-semibold mt-0.5">
                                    {activeKbmSchedule.student_grade || 'Kelas 8 SMP MIPA Unggulan'} • SMP Labschool
                                  </span>
                                  <div className="flex items-center gap-3 mt-1.5 text-slate-500 dark:text-slate-400 text-xs flex-wrap">
                                    <span className="inline-flex items-center gap-1">
                                      <Icon name="schedule" className="text-[16px] text-amber-500" />
                                      {activeKbmSchedule.session_time?.substring(0, 5) || '16:00'} - 17:30 WIB (90 Menit)
                                    </span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1">
                                      <Icon name="home_pin" className="text-[16px] text-emerald-600" />
                                      Tatap Muka di Rumah Siswa
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Countdown Dial */}
                              <div className="hidden sm:flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200 dark:border-[#31353f] self-start md:self-auto">
                                <div className="relative w-12 h-12">
                                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-slate-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                                    <path className="text-amber-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="75, 100" strokeLinecap="round" strokeWidth="3.5"></path>
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-white">45m</div>
                                </div>
                                <div className="flex flex-col text-xs">
                                  <span className="text-[10px] uppercase text-slate-400 font-bold">Check-In Terbuka</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">Pukul 15:50 WIB</span>
                                </div>
                              </div>
                            </div>

                            {/* Academic Target Block */}
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-600">
                                  <Icon name="menu_book" className="text-[20px]" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Materi Target Hari Ini</span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                                    {activeKbmSchedule.today_topic || 'Persiapan UTS: Aljabar Lanjutan & Pemfaktoran Kuadrat'}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-[#4edea3] text-xs font-semibold">
                                Modul Bab 4 Siap
                              </span>
                            </div>

                            {/* Location preview details */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <Icon name="pin_drop" className="text-[16px] text-slate-400" />
                              <span className="truncate">{activeKbmSchedule.student_address || 'Jl. Boulevard Raya Blok A4 No. 18, Kelapa Gading'} • Jarak 1.2 km dari posisi Anda</span>
                            </div>

                            {/* Primary CTA Row */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                onClick={() => handleStartSessionTimer(activeKbmSchedule)}
                                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                              >
                                <Icon name="timer" className="text-[20px]" />
                                <span>Mulai Sesi &amp; Stopwatch KBM</span>
                              </button>
                              <a
                                href={activeKbmSchedule.maps_url || (activeKbmSchedule.student_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeKbmSchedule.student_address)}` : 'https://maps.google.com')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                              >
                                <Icon name="directions" className="text-[18px] text-emerald-600" />
                                <span>Buka Google Maps</span>
                              </a>
                              <button
                                onClick={() => openChat(activeKbmSchedule)}
                                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                              >
                                <Icon name="chat" className="text-[18px] text-amber-500" />
                                <span>Chat Siswa / Ortu</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] text-center text-xs text-slate-400">
                            Tidak ada sesi bimbingan yang terjadwal untuk hari ini.
                          </div>
                        )}

                        {/* Sesi Pekan Ini Tersaring Berdasarkan Hari yang Dipilih */}
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon name="upcoming" className="text-slate-400 text-[20px]" />
                              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                                Sesi Hari {activeCalendarDay} ({myAssignedSchedules.filter(s => s.day_of_week === activeCalendarDay).length} Agenda)
                              </h2>
                            </div>
                            <span className="text-xs text-emerald-600 font-semibold">Tersinkron Otomatis</span>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {myAssignedSchedules
                              .filter((sch) => !activeCalendarDay || sch.day_of_week === activeCalendarDay)
                              .map((sch) => (
                                <div
                                  key={sch.id}
                                  className="p-4 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                                >
                                  <div className="flex items-start gap-3.5">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200 dark:border-[#31353f] flex flex-col items-center justify-center flex-shrink-0 text-center">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">{sch.day_of_week?.slice(0, 3) || 'SES'}</span>
                                      <span className="font-extrabold text-base text-slate-900 dark:text-white leading-none">
                                        {sch.day_of_week === 'Sen' ? '16' : sch.day_of_week === 'Sel' ? '17' : sch.day_of_week === 'Rab' ? '18' : sch.day_of_week === 'Kam' ? '19' : sch.day_of_week === 'Jum' ? '20' : '21'}
                                      </span>
                                    </div>
                                    <div className="flex flex-col text-xs">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">{sch.student_name}</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#262a34] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                                          {sch.student_grade || 'Kelas 5 SD'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-[#4edea3] text-[11px] font-semibold">
                                          Tatap Muka
                                        </span>
                                      </div>
                                      <span className="text-slate-600 dark:text-slate-400 mt-1">
                                        {sch.session_time?.substring(0, 5) || '16:00'} WIB • {sch.today_topic || 'Matematika & IPA Kreatif'}
                                      </span>
                                      <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-1">
                                        <Icon name="location_on" className="text-[14px]" />
                                        <span className="truncate max-w-sm">{sch.student_address || 'Kelapa Gading, Jakarta Utara'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end md:self-center">
                                    <button
                                      onClick={() => setOnlineClassSchedule(sch)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                      Detail Sesi
                                    </button>
                                    <button
                                      onClick={() => handleRequestSubstitute(sch)}
                                      className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                      Reschedule
                                    </button>
                                  </div>
                                </div>
                              ))}

                            {myAssignedSchedules.filter((sch) => !activeCalendarDay || sch.day_of_week === activeCalendarDay).length === 0 && (
                              <div className="p-6 text-center text-xs text-slate-400 bg-white dark:bg-[#181b25] rounded-xl border border-slate-200 dark:border-[#31353f]">
                                Tidak ada jadwal mengajar pada hari {activeCalendarDay}.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* RIGHT COLUMN (35% -> 4 columns on 12-col grid: Route, Availability & SOS Procedures) */}
                      <div className="xl:col-span-4 flex flex-col gap-6">
                        
                        {/* Live GPS Navigation & Route Card */}
                        <div className="rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] overflow-hidden shadow-xs flex flex-col">
                          <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-900">
                            <iframe
                              title="Live Navigation Route Map"
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              scrolling="no"
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(activeKbmSchedule?.student_address || 'Kelapa Gading Jakarta Utara')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                              className="w-full h-full filter contrast-105 pointer-events-none"
                            />
                            {/* Map Overlay floating badge */}
                            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-white/95 dark:bg-[#181b25]/95 backdrop-blur-md border border-slate-200/80 dark:border-[#31353f] flex items-center justify-between shadow-md">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#4edea3] flex items-center justify-center">
                                  <Icon name="two_wheeler" className="text-[18px]" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">Rute Tercepat</span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-white">7 Menit • 1.2 km</span>
                                </div>
                              </div>
                              <a
                                href={activeKbmSchedule?.maps_url || (activeKbmSchedule?.student_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeKbmSchedule.student_address)}` : 'https://maps.google.com')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <span>Navigasi</span>
                                <Icon name="navigation" className="text-[14px]" />
                              </a>
                            </div>
                          </div>

                          <div className="p-4 flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">Tujuan: Rumah {activeKbmSchedule?.student_name || 'Raditya P.'}</span>
                              <span className="text-emerald-700 dark:text-[#4edea3] font-semibold text-[11px]">Kondisi Jalan Lancar</span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 truncate">
                              {activeKbmSchedule?.student_address || 'Jl. Boulevard Raya Blok A4 No. 18, Kelapa Gading Barat'}
                            </span>
                          </div>
                        </div>

                        {/* Manajemen Ketersediaan Jam Mengajar */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] flex flex-col gap-2 shadow-xs text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon name="tune" className="text-amber-500 text-[20px]" />
                              <span className="font-bold text-sm text-slate-900 dark:text-white">Slot Tersedia</span>
                            </div>
                            <button
                              onClick={() => alert('Jadwal jam mengajar otomatis sinkron dengan profil tutor.')}
                              className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                            >
                              Edit Jam
                            </button>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                            Waktu aktif dibuka otomatis untuk order privat murid baru &amp; booking mingguan:
                          </p>
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/70 dark:border-[#31353f] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold text-slate-800 dark:text-white">Senin - Kamis</span>
                              </div>
                              <span className="text-slate-600 dark:text-slate-400 font-medium">15:00 - 20:30 WIB</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/70 dark:border-[#31353f] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold text-slate-800 dark:text-white">Jumat - Sabtu</span>
                              </div>
                              <span className="text-slate-600 dark:text-slate-400 font-medium">08:30 - 18:00 WIB</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50/60 dark:bg-[#1c1f29]/60 border border-dashed border-slate-200 dark:border-[#31353f] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                <span className="text-slate-400">Minggu</span>
                              </div>
                              <span className="text-slate-400">Istirahat / Off</span>
                            </div>
                          </div>
                        </div>

                        {/* Prosedur Penggantian & Darurat KBM */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] flex flex-col gap-2 shadow-xs text-xs">
                          <div className="flex items-center gap-2 text-rose-600">
                            <Icon name="assignment_late" className="text-[20px]" />
                            <span className="font-bold text-sm text-slate-900 dark:text-white">Izin Sakit / Tutor Pengganti</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                            Berhalangan hadir mendadak? Ajukan minimal <strong className="text-slate-800 dark:text-white font-semibold">H-4 jam</strong> sebelum sesi dimulai agar reputasi tutor tetap terjaga sempurna.
                          </p>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] flex items-start gap-2.5">
                            <Icon name="smart_toy" className="text-emerald-600 text-[20px] flex-shrink-0 mt-0.5" />
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                              Sistem cerdas akan mencarikan tutor cadangan terakreditasi otomatis untuk menjaga retensi dan kenyamanan muridmu.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const target = myAssignedSchedules[0];
                              if (target) handleRequestSubstitute(target);
                              else alert('Tidak ada jadwal aktif untuk diajukan izin.');
                            }}
                            className="w-full mt-1 py-2 px-4 rounded-xl bg-slate-50 dark:bg-[#262a34] hover:bg-slate-100 dark:hover:bg-[#31353f] border border-slate-200 dark:border-[#31353f] text-slate-700 dark:text-slate-200 font-semibold transition-colors text-center flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Icon name="edit_calendar" className="text-[16px] text-slate-500" />
                            <span>Form Izin Cepat</span>
                          </button>
                        </div>

                        {/* Performance & Discipline Scorecard */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#4edea3]/20 border border-emerald-100 dark:border-transparent text-emerald-600 dark:text-[#4edea3] flex items-center justify-center">
                              <Icon name="verified" className="text-[22px]" />
                            </div>
                            <div className="flex flex-col text-xs">
                              <span className="font-bold text-slate-900 dark:text-white">{totalCompletedSessions} Sesi Selesai</span>
                              <span className="text-emerald-600 dark:text-[#4edea3] font-semibold text-[11px]">100% Disiplin &amp; Tepat Waktu</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-[#262a34] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                            0 Ghosting
                          </span>
                        </div>

                      </div>

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
                  </div>
                )}

                {/* TAB 5: PROFIL & KEUANGAN */}
                {activeTab === 'profil' && (
                  <div className="max-w-2xl space-y-6">
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={tutorAvatarDisplay}
                          alt={tutorProfile?.full_name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 bg-white shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-bold">{tutorProfile?.full_name}</h2>
                          <span className="text-xs font-bold text-emerald-600">ID Pengajar: #TTR-20419</span>
                          <p className="text-xs text-slate-400 mt-0.5">{tutorProfile?.campus} • {tutorProfile?.major}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </main>

        {/* MODAL EDIT PROFIL PUBLIK GURU */}
        <AnimatePresence>
          {showEditProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Icon name="badge" className="text-emerald-600" /> Edit Profil Publik Mentor
                  </h3>
                  <button onClick={() => setShowEditProfileModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>

                <form onSubmit={handleSaveProfileUpdates} className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 dark:bg-[#1c1f29] rounded-2xl border border-slate-200/80 dark:border-transparent space-y-2.5">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-slate-800 dark:text-white">Tampilan Foto / Avatar</label>
                      <div className="flex gap-1 p-0.5 bg-white dark:bg-[#262a34] rounded-lg border border-slate-200 dark:border-transparent text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setEditAvatarOptionType('preset')}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${editAvatarOptionType === 'preset' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                        >
                          Kartun
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditAvatarOptionType('upload')}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${editAvatarOptionType === 'upload' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                        >
                          Foto Asli
                        </button>
                      </div>
                    </div>

                    {editAvatarOptionType === 'preset' ? (
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                        {AVATAR_PRESETS.map((preset) => (
                          <div
                            key={preset.id}
                            onClick={() => setEditAvatarPreset(preset.url)}
                            className={`flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded-xl border-2 transition-all bg-white dark:bg-[#262a34] shrink-0 ${
                              editAvatarPreset === preset.url ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105' : 'border-slate-200 dark:border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-10 h-10 rounded-lg" />
                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{preset.name.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditAvatarFile(e.target.files ? e.target.files[0] : null)}
                          className="w-full text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-500/20 file:text-emerald-600 font-bold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">*Pilih foto tersenyum ramah dan jelas.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Contoh: Dimas Ramadhan, S.Pd."
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-semibold">Asal Kampus</label>
                      <input
                        type="text"
                        required
                        value={editCampus}
                        onChange={(e) => setEditCampus(e.target.value)}
                        placeholder="Contoh: UI, ITB, UGM"
                        className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Jurusan / Prodi</label>
                      <input
                        type="text"
                        required
                        value={editMajor}
                        onChange={(e) => setEditMajor(e.target.value)}
                        placeholder="Contoh: Matematika"
                        className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Daftar Prestasi & Bio Singkat</label>
                    <textarea
                      rows={3}
                      required
                      value={editAchievements}
                      onChange={(e) => setEditAchievements(e.target.value)}
                      placeholder="Tuliskan pengalaman mengajar atau prestasi lomba yang akan dibaca oleh calon murid & orang tua..."
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    {savingProfile ? 'Menyimpan Pembaruan...' : 'Simpan Perubahan Profil'}
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