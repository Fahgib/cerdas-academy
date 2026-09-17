'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';

const Icon = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span 
    className={`material-symbols-outlined select-none inline-flex items-center justify-center leading-none ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }}
  >
    {name}
  </span>
);

const AUTO_LOCK_MINUTES = 5;

const formatWA = (phone: string) => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export default function AdminDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ================= STATE KEAMANAN & AUTENTIKASI =================
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'pin'>('credentials');
  
  const [adminIdDb, setAdminIdDb] = useState('kepalasekolah2005');
  const [adminPwDb, setAdminPwDb] = useState('081346');
  const [masterPinDb, setMasterPinDb] = useState('123456');

  const [inputId, setInputId] = useState('');
  const [inputPw, setInputPw] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminPw, setNewAdminPw] = useState('');
  const [newMasterPin, setNewMasterPin] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ================= STATE DASHBOARD OPERASIONAL =================
  const [activeTab, setActiveTab] = useState<'monitoring_relasi' | 'analytics' | 'murid' | 'guru' | 'reschedule' | 'honor' | 'complaints' | 'evaluasi' | 'pr_help' | 'monitoring' | 'users' | 'logs'>('monitoring_relasi');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reschedules, setReschedules] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [homeworkHelpList, setHomeworkHelpList] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Modal Preview Media
  const [previewMediaModal, setPreviewMediaModal] = useState<{ url: string; type: 'image' | 'video'; title: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal Supervisi Guru
  const [selectedTutorForEval, setSelectedTutorForEval] = useState<string>('');
  const [evalScore, setEvalScore] = useState<number>(98);
  const [evalCategory, setEvalCategory] = useState<string>('Metode Mengajar');
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [submittingEval, setSubmittingEval] = useState(false);

  // Modal Alokasi Mentor Pengganti Cepat (Re-Assign)
  const [reassignModalTarget, setReassignModalTarget] = useState<any | null>(null);
  const [selectedNewMentor, setSelectedNewMentor] = useState<string>('');
  const [savingReassign, setSavingReassign] = useState(false);

  // Modal Edit Akun
  const [editModalData, setEditModalData] = useState<{
    isOpen: boolean;
    type: 'murid' | 'guru';
    data: any;
  }>({
    isOpen: false,
    type: 'murid',
    data: null,
  });

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCampus, setEditCampus] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cerdas_theme');
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    fetchAuthSettings();
    const sessionAuth = sessionStorage.getItem('cerdas_admin_auth');
    if (sessionAuth === 'true') {
      setIsUnlocked(true);
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

  const fetchAuthSettings = async () => {
    try {
      const { data } = await supabase
        .from('admin_auth_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) {
        setAdminIdDb(data.admin_id);
        setAdminPwDb(data.admin_pw);
        setMasterPinDb(data.master_pin);
      }
    } catch (err) {
      console.error('Error load auth settings:', err);
    }
  };

  const resetInactivityTimer = useCallback(() => {
    if (!isUnlocked) return;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);

    lockTimerRef.current = setTimeout(() => {
      handleLockConsole();
      alert('Sesi dikunci otomatis demi keamanan karena tidak ada aktivitas selama 5 menit.');
    }, AUTO_LOCK_MINUTES * 60 * 1000);
  }, [isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [isUnlocked, resetInactivityTimer]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === 'credentials') {
      if (inputId.trim() === adminIdDb && inputPw.trim() === adminPwDb) {
        setIsUnlocked(true);
        setAuthError('');
        sessionStorage.setItem('cerdas_admin_auth', 'true');
        fetchDashboardData();
      } else {
        setAuthError('ID Pengguna atau Kata Sandi salah!');
      }
    } else {
      if (pinInput.trim() === masterPinDb) {
        setIsUnlocked(true);
        setAuthError('');
        sessionStorage.setItem('cerdas_admin_auth', 'true');
        fetchDashboardData();
      } else {
        setAuthError('PIN Keamanan 6 digit salah!');
        setPinInput('');
      }
    }
  };

  const handleLockConsole = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('cerdas_admin_auth');
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
  };

  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMasterPin.length !== 6) {
      return alert('PIN Keamanan harus tepat 6 digit angka!');
    }

    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('admin_auth_settings')
        .upsert({
          id: 1,
          admin_id: newAdminId.trim(),
          admin_pw: newAdminPw.trim(),
          master_pin: newMasterPin.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setAdminIdDb(newAdminId.trim());
      setAdminPwDb(newAdminPw.trim());
      setMasterPinDb(newMasterPin.trim());
      alert('Kredensial login & PIN Kepala Sekolah berhasil diperbarui!');
      setShowSettingsModal(false);
    } catch (err: any) {
      alert('Gagal memperbarui pengaturan: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const logActivity = async (actionType: string, description: string, targetUser: string) => {
    try {
      await supabase.from('admin_activity_logs').insert([
        {
          action_type: actionType,
          actor_name: 'Kepala Sekolah',
          description: description,
          target_user: targetUser,
        }
      ]);
    } catch (e) {
      console.error('Gagal mencatat log:', e);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: regData } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
      if (regData) setRegistrations(regData);

      const { data: tutorData } = await supabase.from('tutor_applications').select('*').order('created_at', { ascending: false });
      if (tutorData) {
        setTutors(tutorData);
        if (!selectedTutorForEval && tutorData.length > 0) {
          setSelectedTutorForEval(tutorData[0].full_name);
        }
      }

      const { data: schData } = await supabase.from('schedules').select('*').order('created_at', { ascending: false });
      if (schData) setSchedules(schData);

      const { data: resData } = await supabase.from('schedule_reschedules').select('*').order('created_at', { ascending: false });
      if (resData) setReschedules(resData);

      const { data: compData } = await supabase.from('student_complaints').select('*').order('created_at', { ascending: false });
      if (compData) setComplaints(compData);

      const { data: evalData } = await supabase.from('tutor_evaluations').select('*').order('created_at', { ascending: false });
      if (evalData) setEvaluations(evalData);

      const { data: helpData } = await supabase.from('quick_homework_help').select('*').order('created_at', { ascending: false });
      if (helpData) setHomeworkHelpList(helpData);

      const { data: logData } = await supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(60);
      if (logData) setActivityLogs(logData);
    } catch (err: any) {
      console.error('Error load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchDashboardData();
    }
  }, [isUnlocked]);

  // ================= LOGIKA PEMBERSIHAN & SINKRONISASI RELASI AKUN =================

  // 1. Hapus Akun Murid -> Bersihkan semua relasi KBM dan histori tugas terkait
  const handleDeleteStudentAccount = async (student: any) => {
    if (!window.confirm(`PERINGATAN: Menghapus akun murid "${student.student_name}" akan otomatis menghapus seluruh jadwal KBM dan membebaskan mentor yang bersangkutan. Lanjutkan?`)) return;

    try {
      // Hapus data pendaftaran
      await supabase.from('registrations').delete().eq('id', student.id);
      
      // Bersihkan jadwal murid di tabel schedules
      await supabase.from('schedules').delete().eq('student_name', student.student_name);

      // Bersihkan gamifikasi
      await supabase.from('student_gamification').delete().eq('student_name', student.student_name);

      await logActivity(
        'HAPUS_MURID_CASCADE',
        `Menghapus murid ${student.student_name} beserta seluruh jadwal relasi mentor terkait.`,
        student.student_name
      );

      alert(`Akun murid ${student.student_name} dan seluruh relasi mentor berhasil dibersihkan!`);
      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal menghapus murid: ' + err.message);
    }
  };

  // 2. Hapus Akun Mentor/Tutor -> Jangan hapus jadwal murid, melainkan ubah status jadwal murid menjadi OPEN / BUTUH MENTOR PENGGANTI
  const handleDeleteTutorAccount = async (tutor: any) => {
    if (!window.confirm(`PERINGATAN: Mentor "${tutor.full_name}" akan dihapus. Murid yang dibimbing mentor ini akan otomatis dialihkan ke status "BUTUH MENTOR PENGGANTI" agar Kepala Sekolah dapat mengalokasikan mentor baru. Lanjutkan?`)) return;

    try {
      // Cari murid-murid yang dibimbing tutor ini
      const affectedSchedules = schedules.filter(
        s => s.claimed_by_tutor_name === tutor.full_name || s.substitute_tutor_name === tutor.full_name
      );

      // Update jadwal murid yang terdampak menjadi unassigned / open
      for (const sch of affectedSchedules) {
        await supabase
          .from('schedules')
          .update({
            claimed_by_tutor_name: null,
            substitute_tutor_name: null,
            status: 'open',
            is_substitute_needed: true,
            is_timer_active: false,
            session_started_at: null,
          })
          .eq('id', sch.id);

        // Beri tahu Kepala Sekolah melalui catatan log insiden
        await logActivity(
          'RELASI_TERPUTUS',
          `Mentor ${tutor.full_name} keluar/dihapus. Murid ${sch.student_name} kini berstatus butuh mentor baru.`,
          sch.student_name
        );
      }

      // Hapus akun tutor dari tabel aplikasi
      await supabase.from('tutor_applications').delete().eq('id', tutor.id);

      alert(`Akun mentor ${tutor.full_name} dihapus. ${affectedSchedules.length} murid yang terdampak berhasil dialihkan ke antrean alokasi mentor baru.`);
      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal menghapus mentor: ' + err.message);
    }
  };

  // 3. Otorisasi Alokasi Mentor Baru Secara Manual (Re-Assign Mentor)
  const handleExecuteReassignMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalTarget || !selectedNewMentor) {
      return alert('Pilih mentor pengganti terlebih dahulu!');
    }

    setSavingReassign(true);
    try {
      await supabase
        .from('schedules')
        .update({
          claimed_by_tutor_name: selectedNewMentor,
          substitute_tutor_name: null,
          status: 'claimed',
          is_substitute_needed: false,
        })
        .eq('id', reassignModalTarget.id);

      await logActivity(
        'MUTASI_MENTOR',
        `Kepala Sekolah menugaskan mentor baru "${selectedNewMentor}" untuk membimbing murid "${reassignModalTarget.student_name}"`,
        reassignModalTarget.student_name
      );

      confetti({ particleCount: 80, spread: 60 });
      alert(`Murid ${reassignModalTarget.student_name} berhasil dialokasikan ke mentor ${selectedNewMentor}!`);

      // Otomatis kirim pesan WA konfirmasi ke orang tua/murid
      if (reassignModalTarget.student_phone) {
        const phoneWA = formatWA(reassignModalTarget.student_phone);
        const textWA = encodeURIComponent(
          `Halo ${reassignModalTarget.student_name}! 🎓\n\n` +
          `Kami menginformasikan bahwa sesi les privat Anda kini telah resmi dialokasikan kepada mentor baru: *${selectedNewMentor}*.\n\n` +
          `Jadwal KBM Anda tetap berjalan normal: *${reassignModalTarget.day_of_week}* pukul *${reassignModalTarget.session_time?.substring(0, 5)} WIB*.\n\n` +
          `Terima kasih!\n- Kepala Akademik Cerdas Academy`
        );
        window.open(`https://wa.me/${phoneWA}?text=${textWA}`, '_blank');
      }

      setReassignModalTarget(null);
      setSelectedNewMentor('');
      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal mengalokasikan mentor: ' + err.message);
    } finally {
      setSavingReassign(false);
    }
  };

  // 4. Copot Mentor dari Siswa (Tanpa Menghapus Akun Mentor)
  const handleDetachMentorFromStudent = async (sch: any) => {
    const tutorName = sch.claimed_by_tutor_name;
    if (!window.confirm(`Lepaskan mentor "${tutorName}" dari murid "${sch.student_name}"? Murid akan masuk antrean pemilihan mentor baru.`)) return;

    try {
      await supabase
        .from('schedules')
        .update({
          claimed_by_tutor_name: null,
          substitute_tutor_name: null,
          status: 'open',
          is_substitute_needed: true,
          is_timer_active: false,
          session_started_at: null,
        })
        .eq('id', sch.id);

      await logActivity(
        'LEPAS_MENTOR',
        `Mencopot ikatan mentor ${tutorName} dari murid ${sch.student_name}. Murid kini butuh mentor baru.`,
        sch.student_name
      );

      alert(`Ikatan bimbingan dilepas. Murid ${sch.student_name} kini siap dipasangkan dengan mentor baru.`);
      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  // ================= END LOGIKA SINKRONISASI RELASI =================

  // Evaluasi Guru
  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutorForEval || !evalFeedback.trim()) return alert('Isi lengkap catatan evaluasi!');

    setSubmittingEval(true);
    try {
      const { error } = await supabase.from('tutor_evaluations').insert([
        {
          tutor_name: selectedTutorForEval,
          headmaster_name: 'Kepala Sekolah',
          score: evalScore,
          category: evalCategory,
          feedback_notes: evalFeedback.trim(),
        }
      ]);
      if (error) throw error;

      await logActivity(
        'EVALUASI_GURU',
        `Memberikan supervisi & skor ${evalScore} (${evalCategory}) untuk tutor ${selectedTutorForEval}`,
        selectedTutorForEval
      );

      confetti({ particleCount: 60, spread: 50 });
      alert(`Catatan evaluasi resmi telah diteruskan ke portal tutor ${selectedTutorForEval}!`);
      setEvalFeedback('');
      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal menyimpan evaluasi: ' + err.message);
    } finally {
      setSubmittingEval(false);
    }
  };

  // Verifikasi Murid Baru
  const handleVerifyStudent = async (student: any) => {
    setActionLoading(student.id);
    try {
      await supabase.from('registrations').update({ is_verified: true }).eq('id', student.id);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      await supabase.from('schedules').insert([
        {
          student_name: student.student_name,
          student_phone: student.phone_number,
          student_address: student.address,
          maps_url: student.maps_url,
          day_of_week: student.selected_days || 'Belum diatur',
          session_time: student.selected_time || '16:30',
          month_period: firstDayOfMonth,
          status: 'open',
          tutor_fee: 30000,
          completed_sessions: 0,
          target_sessions: 8,
          is_honor_paid: false,
        },
      ]);

      await supabase.from('student_gamification').upsert({
        student_name: student.student_name,
        student_phone: student.phone_number,
        xp_points: 50,
        level: 1,
        badges: ['Siswa Baru Cerdas'],
      }, { onConflict: 'student_name' });

      await logActivity('VERIFIKASI_MURID', `ACC pendaftaran murid ${student.student_name}`, student.student_name);

      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

      const phoneWA = formatWA(student.phone_number);
      const textWA = encodeURIComponent(`Halo ${student.student_name}! Pendaftaran les privat Anda di Cerdas Academy telah di-ACC. Buka portal murid: http://localhost:3000/murid`);
      window.open(`https://wa.me/${phoneWA}?text=${textWA}`, '_blank');

      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Verifikasi Guru
  const handleVerifyTutor = async (tutor: any) => {
    setActionLoading(tutor.id);
    try {
      await supabase.from('tutor_applications').update({ is_approved: true }).eq('id', tutor.id);
      await logActivity('VERIFIKASI_GURU', `ACC tutor ${tutor.full_name}`, tutor.full_name);

      confetti({ particleCount: 80, spread: 60 });
      const phoneWA = formatWA(tutor.phone_number);
      const textWA = encodeURIComponent(`Halo Kak ${tutor.full_name}! Akun pengajar Cerdas Academy Anda telah aktif. Buka: http://localhost:3000/guru`);
      window.open(`https://wa.me/${phoneWA}?text=${textWA}`, '_blank');

      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Reschedule
  const handleApproveReschedule = async (resItem: any) => {
    setActionLoading(resItem.id);
    try {
      await supabase.from('schedule_reschedules').update({ status: 'approved' }).eq('id', resItem.id);
      const parts = resItem.proposed_day_time.split(' pukul ');
      await supabase.from('schedules').update({
        day_of_week: parts[0]?.trim() || resItem.proposed_day_time,
        session_time: parts[1]?.trim() || '16:30',
      }).eq('id', resItem.schedule_id);

      await logActivity('RESCHEDULE_APPROVED', `ACC reschedule ${resItem.requester_name}`, resItem.requester_name);
      confetti({ particleCount: 70, spread: 50 });
      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectReschedule = async (resItem: any) => {
    await supabase.from('schedule_reschedules').update({ status: 'rejected' }).eq('id', resItem.id);
    await logActivity('RESCHEDULE_REJECTED', `Tolak reschedule ${resItem.requester_name}`, resItem.requester_name);
    fetchDashboardData();
  };

  // Cairkan Honor
  const handleDisburseHonor = async (sch: any) => {
    const totalHonor = (sch.completed_sessions || 0) * 30000;
    if (!window.confirm(`Cairkan honor Rp ${totalHonor.toLocaleString('id-ID')} untuk ${sch.claimed_by_tutor_name}?`)) return;

    setActionLoading(sch.id);
    try {
      await supabase.from('schedules').update({ is_honor_paid: true }).eq('id', sch.id);
      await logActivity('PENCAIRAN_HONOR', `Mencairkan honor Rp ${totalHonor.toLocaleString('id-ID')} ke tutor ${sch.claimed_by_tutor_name}`, sch.claimed_by_tutor_name);

      confetti({ particleCount: 100, spread: 70 });
      fetchDashboardData();
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Kendala SOS
  const handleResolveComplaint = async (complaint: any) => {
    await supabase.from('student_complaints').update({ status: 'resolved' }).eq('id', complaint.id);
    await logActivity('KENDALA_RESOLVED', `Selesaikan kendala ${complaint.student_name}`, complaint.student_name);
    fetchDashboardData();
  };

  // Reminder WA
  const handleSendReminder = (sch: any) => {
    if (!sch.student_phone) return alert('Nomor murid tidak tersedia.');
    const phoneWA = formatWA(sch.student_phone);
    const textWA = encodeURIComponent(
      `Halo ${sch.student_name}! ⏰\n\nPengingat sesi les privat bersama *${sch.claimed_by_tutor_name || 'Tutor Cerdas Academy'}*:\n` +
      `🗓️ Hari: *${sch.day_of_week}*\n` +
      `⏰ Jam: *${sch.session_time?.substring(0, 5)} WIB*\n\n` +
      `Siapkan meja belajar dan perlengkapan Anda!`
    );
    window.open(`https://wa.me/${phoneWA}?text=${textWA}`, '_blank');
  };

  // Edit Akun
  const openEditModal = (type: 'murid' | 'guru', item: any) => {
    setEditModalData({ isOpen: true, type, data: item });
    if (type === 'murid') {
      setEditName(item.student_name || '');
      setEditPhone(item.phone_number || '');
      setEditAddress(item.address || '');
    } else {
      setEditName(item.full_name || '');
      setEditPhone(item.phone_number || '');
      setEditCampus(item.campus || '');
      setEditMajor(item.major || '');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      if (editModalData.type === 'murid') {
        await supabase.from('registrations').update({
          student_name: editName,
          phone_number: editPhone,
          address: editAddress,
        }).eq('id', editModalData.data.id);
      } else {
        await supabase.from('tutor_applications').update({
          full_name: editName,
          phone_number: editPhone,
          campus: editCampus,
          major: editMajor,
        }).eq('id', editModalData.data.id);
      }
      setEditModalData({ isOpen: false, type: 'murid', data: null });
      fetchDashboardData();
    } finally {
      setSavingEdit(false);
    }
  };

  // Chat Monitor
  const openChatMonitor = async (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    const { data } = await supabase.from('session_chats').select('*').eq('schedule_id', scheduleId).order('created_at', { ascending: true });
    if (data) setChats(data);
  };

  // Ekspor Excel
  const exportFinancialReport = () => {
    const exportData = registrations.map((r) => ({
      'Nama Murid': r.student_name,
      'Kontak WA': r.phone_number,
      'Paket': r.selected_package || '-',
      'Status': r.is_verified ? 'Lunas' : 'Pending',
      'Pemasukan Lembaga (Rp)': r.is_verified ? 360000 : 0,
      'Honor Tutor (Rp)': r.is_verified ? 240000 : 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Keuangan');
    XLSX.writeFile(wb, `Laporan_CerdasAcademy_${Date.now()}.xlsx`);
  };

  // Kalkulasi & Status
  const verifiedStudents = registrations.filter((r) => r.is_verified);
  const pendingStudents = registrations.filter((r) => !r.is_verified);
  const approvedTutors = tutors.filter((t) => t.is_approved);
  const pendingTutors = tutors.filter((t) => !t.is_approved);
  const pendingReschedules = reschedules.filter((r) => r.status === 'pending');
  const pendingComplaints = complaints.filter((c) => c.status === 'pending');
  const pendingHomeworkHelps = homeworkHelpList.filter((h) => h.status === 'pending');

  // Relasi & Siswa Butuh Mentor Pengganti
  const unassignedStudents = schedules.filter((s) => !s.claimed_by_tutor_name || s.is_substitute_needed);
  const pairedSchedules = schedules.filter((s) => s.claimed_by_tutor_name && !s.is_substitute_needed);

  const totalGrossRevenue = verifiedStudents.length * 360000; 
  const totalTutorExpense = verifiedStudents.length * 240000; 
  const netOperatingProfit = totalGrossRevenue - totalTutorExpense; 

  // ================= TAMPILAN GERBANG LOGIN =================
  if (!isUnlocked) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] dark:bg-[#0f131c] dark:text-[#dfe2ef] flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-3xl p-7 sm:p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-600 dark:bg-[#4edea3] text-white dark:text-[#003824] rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Icon name="school" className="text-[32px]" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Executive Console</h2>
              <p className="text-xs text-slate-400 mt-1">Otoritas Manajemen Eksekutif Cerdas Academy</p>
            </div>

            <div className="flex bg-slate-100 dark:bg-[#1c1f29] p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-transparent">
              <button type="button" onClick={() => { setLoginMethod('credentials'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${loginMethod === 'credentials' ? 'bg-white dark:bg-[#262a34] text-emerald-700 dark:text-[#4edea3] shadow-xs' : 'text-slate-500'}`}>ID & Sandi</button>
              <button type="button" onClick={() => { setLoginMethod('pin'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${loginMethod === 'pin' ? 'bg-white dark:bg-[#262a34] text-emerald-700 dark:text-[#4edea3] shadow-xs' : 'text-slate-500'}`}>PIN Cepat</button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left text-xs">
              {loginMethod === 'credentials' ? (
                <>
                  <div>
                    <label className="font-semibold block mb-1">ID Kepala Sekolah</label>
                    <input type="text" required value={inputId} onChange={(e) => setInputId(e.target.value)} placeholder="Masukkan ID..." className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-semibold outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Kata Sandi</label>
                    <div className="relative flex items-center">
                      <input type={showPassword ? 'text' : 'password'} required value={inputPw} onChange={(e) => setInputPw(e.target.value)} placeholder="Masukkan Sandi..." className="w-full p-2.5 pr-10 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-semibold outline-none focus:border-emerald-600" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400">{showPassword ? <Icon name="visibility_off" className="text-[18px]" /> : <Icon name="visibility" className="text-[18px]" />}</button>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="font-semibold text-center block mb-1">Masukkan 6 Digit PIN Otoritas</label>
                  <input type="password" maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="••••••" autoFocus className="w-full tracking-[1em] text-center text-2xl font-black py-3 rounded-xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200 dark:border-[#31353f] focus:border-emerald-600 outline-none" />
                </div>
              )}

              {authError && <p className="text-xs font-bold text-rose-600 text-center py-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">{authError}</p>}
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#4edea3] dark:text-[#003824] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all">
                <Icon name="key" className="text-[18px]" />
                <span>Masuk ke Dasbor</span>
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD UTAMA =================
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="bg-[#faf8ff] text-[#131b2e] dark:bg-[#0f131c] dark:text-[#dfe2ef] font-['Plus_Jakarta_Sans',sans-serif] min-h-screen flex flex-col antialiased transition-colors duration-200">
        
        {/* 1. DESKTOP FIXED SIDEBAR */}
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-[#181b25] z-50 flex-col justify-between border-r border-slate-200/80 dark:border-[#31353f] shadow-sm overflow-y-auto">
          <div className="flex flex-col">
            <div className="p-6 bg-slate-50/50 dark:bg-[#0a0e17]/50 border-b border-slate-100 dark:border-[#31353f]/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-[#10b981] flex items-center justify-center text-white dark:text-[#003824] shadow-sm">
                  <Icon name="school" className="text-[24px]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Cerdas</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-[#ffb95f] text-[10px] uppercase font-bold tracking-wider">Executive</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-[#4edea3]">Kepala Sekolah Suite</span>
                </div>
              </div>
            </div>

            <nav className="flex flex-col gap-1 px-4 py-4 text-xs font-semibold">
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#86948a]">Sinkronisasi & Pemantauan Relasi</div>
              <button
                onClick={() => setActiveTab('monitoring_relasi')}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'monitoring_relasi'
                    ? 'bg-emerald-600 text-white dark:bg-[#10b981] dark:text-[#003824] font-bold shadow-sm'
                    : 'text-slate-600 dark:text-[#bbcabf] hover:bg-slate-100 dark:hover:bg-[#262a34]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon name="hub" className="text-[20px]" />
                  <span>Pemetaan Murid ↔ Mentor</span>
                </div>
                {unassignedStudents.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                    {unassignedStudents.length} Butuh Mentor
                  </span>
                )}
              </button>

              <div className="px-2 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#86948a]">Manajemen Inti</div>
              {[
                { id: 'analytics', label: 'Keuangan & Payroll', icon: 'account_balance_wallet' },
                { id: 'evaluasi', label: 'Supervisi & Mutu Guru', icon: 'verified_user' },
                { id: 'pr_help', label: 'Pantau Tanya PR Kilat', icon: 'quiz', badge: homeworkHelpList.filter(h => h.status === 'pending').length || undefined },
                { id: 'users', label: 'Manajemen Akun Terpadu', icon: 'groups' },
                { id: 'logs', label: 'Log Audit Mutasi', icon: 'history_edu' },
              ].map((m) => {
                const active = activeTab === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveTab(m.id as any)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white dark:bg-[#10b981] dark:text-[#003824] font-bold shadow-sm'
                        : 'text-slate-600 dark:text-[#bbcabf] hover:bg-slate-100 dark:hover:bg-[#262a34]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon name={m.icon} className="text-[20px]" />
                      <span>{m.label}</span>
                    </div>
                    {m.badge && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">{m.badge}</span>
                    )}
                  </button>
                );
              })}

              <div className="px-2 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#86948a]">Otoritas & Validasi</div>
              {[
                { id: 'murid', label: 'ACC Murid Baru', icon: 'person_add', badge: pendingStudents.length || undefined },
                { id: 'guru', label: 'ACC Calon Tutor', icon: 'how_to_reg', badge: pendingTutors.length || undefined },
                { id: 'reschedule', label: 'Izin Reschedule', icon: 'edit_calendar', badge: pendingReschedules.length || undefined },
                { id: 'honor', label: 'Pencairan Honor', icon: 'payments' },
                { id: 'complaints', label: 'Kendala Belajar SOS', icon: 'e911_emergency', badge: pendingComplaints.length ? `${pendingComplaints.length} SOS` : undefined, isError: true },
                { id: 'monitoring', label: 'Supervisi Chat & KBM', icon: 'schedule' },
              ].map((m) => {
                const active = activeTab === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveTab(m.id as any)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white dark:bg-[#10b981] dark:text-[#003824] font-bold shadow-sm'
                        : 'text-slate-600 dark:text-[#bbcabf] hover:bg-slate-100 dark:hover:bg-[#262a34]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon name={m.icon} className={`text-[20px] ${m.isError ? 'text-rose-500' : ''}`} />
                      <span>{m.label}</span>
                    </div>
                    {m.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.isError ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-white'}`}>{m.badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 flex flex-col gap-3 border-t border-slate-100 dark:border-[#31353f]/40 bg-slate-50/50 dark:bg-[#181b25]/50">
            <div className="flex items-center gap-3 p-2 bg-white dark:bg-[#1c1f29] rounded-xl border border-slate-200 dark:border-transparent shadow-xs">
              <div className="w-10 h-10 rounded-full bg-emerald-600 dark:bg-[#4edea3] text-white dark:text-[#003824] flex items-center justify-center font-bold">
                <Icon name="person" className="text-[20px]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 text-xs">
                <span className="font-bold truncate text-slate-900 dark:text-white">Drs. H. Suryanto, M.Pd</span>
                <span className="text-[10px] text-slate-400 truncate">Kepala Akademik & Direktur</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 2. TOP EXECUTIVE NAVBAR */}
        <header className="fixed top-0 left-0 md:left-80 right-0 h-16 bg-white/90 dark:bg-[#0a0e17]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#31353f] z-40 flex items-center justify-between px-4 sm:px-8 shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative w-full hidden sm:flex items-center">
              <Icon name="search" className="absolute left-3.5 text-slate-400 text-[20px]" />
              <input
                type="text"
                placeholder="Cari murid, mentor, relasi KBM, atau log mutasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-10 rounded-xl bg-slate-100/90 dark:bg-[#1c1f29] border border-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#181b25] focus:border-emerald-500 transition-all"
              />
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

            <button
              onClick={() => { setNewAdminId(adminIdDb); setNewAdminPw(adminPwDb); setNewMasterPin(masterPinDb); setShowSettingsModal(true); }}
              className="p-2 bg-slate-100 dark:bg-[#262a34] hover:bg-slate-200 text-slate-700 dark:text-white rounded-xl transition-all border border-slate-200 dark:border-[#31353f] cursor-pointer"
              title="Ganti Akses & PIN Otoritas"
            >
              <Icon name="settings" className="text-[18px]" />
            </button>

            <button
              onClick={exportFinancialReport}
              className="px-3.5 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-[#4edea3] border border-emerald-200 dark:border-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Icon name="download" className="text-[16px]" />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>

            <button
              onClick={handleLockConsole}
              className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl cursor-pointer"
              title="Kunci Sesi Konsol"
            >
              <Icon name="lock" className="text-[18px]" />
            </button>
          </div>
        </header>

        {/* 3. MAIN DASHBOARD CONTENT AREA */}
        <main className="relative pt-20 md:pl-80 min-h-screen w-full px-4 sm:px-8 py-6">
          <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto pb-20">

            {/* ALERT BOX: JIKA ADA MURID YANG KEHILANGAN MENTOR / BUTUH MENTOR PENGGANTI */}
            {unassignedStudents.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-sm">
                    <Icon name="person_search" className="text-[24px]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        Perhatian Otoritas Akademik
                      </span>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {unassignedStudents.length} Murid Membutuhkan Alokasi Mentor
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Mentor sebelumnya mengundurkan diri/dihapus, atau murid baru saja di-ACC dan belum terikat pengajar. Silakan alokasikan mentor pengganti agar KBM tidak terhambat.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('monitoring_relasi')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shrink-0 cursor-pointer shadow-sm transition-all"
                >
                  Buka Konsol Alokasi Relasi
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. TAB BARU: PEMETAAN & MONITORING RELASI MURID ↔ MENTOR (FITUR UTAMA) */}
            {/* ========================================================================= */}
            {activeTab === 'monitoring_relasi' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Konsol Pemantauan Relasi: Murid ↔ Mentor</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pantau siapa membimbing siapa secara real-time. Jika mentor keluar/dihapus, murid otomatis masuk antrean alokasi ulang.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#4edea3] text-xs font-bold border border-emerald-200/60 dark:border-emerald-900">
                    Total {schedules.length} Sesi Terjadwal
                  </span>
                </div>

                {/* Sub-Seksi A: Murid Butuh Mentor Baru / Terputus */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#181b25] border border-amber-500/30 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="person_alert" className="text-amber-500 text-[22px]" />
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        Antrean Murid Butuh Alokasi Mentor Baru ({unassignedStudents.length})
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                      Prioritas Tindakan Kepala Sekolah
                    </span>
                  </div>

                  {unassignedStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-[#1c1f29] rounded-2xl">
                      <Icon name="task_alt" className="text-emerald-500 text-[28px] mx-auto mb-1" />
                      Semua murid yang aktif telah memiliki mentor pengampu masing-masing.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {unassignedStudents.map((sch) => (
                        <div key={sch.id} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-black text-sm text-slate-900 dark:text-white">{sch.student_name}</h4>
                                <p className="text-slate-500">WA: {sch.student_phone}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                                Belum Ada Mentor
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">
                              <b>Jadwal:</b> {sch.day_of_week} • Pukul {sch.session_time?.substring(0, 5)} WIB
                            </p>
                            <p className="text-slate-500 truncate">
                              <b>Alamat:</b> {sch.student_address}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-amber-500/20 flex gap-2">
                            <button
                              onClick={() => {
                                setReassignModalTarget(sch);
                                setSelectedNewMentor(approvedTutors[0]?.full_name || '');
                              }}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Icon name="person_add" className="text-[16px]" />
                              <span>Pilihkan Mentor Baru</span>
                            </button>
                            <button
                              onClick={() => handleSendReminder(sch)}
                              className="p-2 bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] text-slate-700 dark:text-white rounded-xl hover:bg-slate-100 cursor-pointer"
                              title="Hubungi Murid via WA"
                            >
                              <Icon name="chat" className="text-[16px] text-emerald-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-Seksi B: Daftar Relasi Aktif (Siapa Belajar dengan Siapa) */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        Daftar Pasangan Aktif (Murid ↔ Mentor Terikat)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kepala Sekolah dapat melepaskan ikatan mentor atau mengalihkan mentor secara manual
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                      {pairedSchedules.length} Pasangan Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {pairedSchedules.map((sch) => (
                      <div key={sch.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200 dark:border-[#31353f] space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-[#31353f]">
                            <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Hubungan KBM Aktif</span>
                            <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                              {sch.completed_sessions || 0} Sesi Berjalan
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Icon name="school" className="text-emerald-600 text-[18px]" />
                              <div>
                                <p className="font-black text-slate-900 dark:text-white">{sch.student_name}</p>
                                <p className="text-[10px] text-slate-400">Murid (WA: {sch.student_phone})</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-center my-1 text-slate-300">
                              <Icon name="sync_alt" className="text-[16px] text-slate-400" />
                            </div>

                            <div className="flex items-center gap-2">
                              <Icon name="person" className="text-amber-500 text-[18px]" />
                              <div>
                                <p className="font-black text-emerald-700 dark:text-[#4edea3]">{sch.claimed_by_tutor_name}</p>
                                <p className="text-[10px] text-slate-400">Mentor Pengampu Utama</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-white dark:bg-[#0f131c] rounded-xl border border-slate-200 dark:border-transparent text-[11px] space-y-0.5">
                            <p className="text-slate-600 dark:text-slate-300">
                              <b>Waktu:</b> {sch.day_of_week} • Pukul {sch.session_time?.substring(0, 5)} WIB
                            </p>
                            <p className="text-slate-500 truncate">
                              <b>Lokasi:</b> {sch.student_address}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-[#31353f] flex gap-2">
                          <button
                            onClick={() => {
                              setReassignModalTarget(sch);
                              setSelectedNewMentor(approvedTutors.find(t => t.full_name !== sch.claimed_by_tutor_name)?.full_name || '');
                            }}
                            className="flex-1 py-1.5 bg-slate-200 dark:bg-[#262a34] hover:bg-slate-300 text-slate-800 dark:text-white font-bold rounded-lg transition-all"
                            title="Ganti ke mentor lain"
                          >
                            Ganti Mentor
                          </button>
                          <button
                            onClick={() => handleDetachMentorFromStudent(sch)}
                            className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-900 font-bold"
                            title="Copot ikatan mentor"
                          >
                            Copot
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. TAB: KEUANGAN & PAYROLL */}
            {/* ========================================================================= */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Keuangan & Payroll Eksekutif</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time split margin otomatis, rekonsiliasi kas, dan otorisasi pembayaran honor tutor</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#4edea3] text-xs font-bold border border-emerald-200/60 dark:border-emerald-900">
                    Auto-Reconciled 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Omset Bimbel</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      Rp {totalGrossRevenue.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                      <Icon name="trending_up" className="text-[15px]" /> +18.4% MoM (Tarif Rp 45k/sesi)
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Honor Guru (66.7%)</span>
                    <div className="text-2xl font-black text-amber-600 dark:text-[#ffb95f] mt-1">
                      Rp {totalTutorExpense.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2">Porsi pengajar @ Rp 30.000/sesi</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Laba Bersih Operasional</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-[#4edea3] mt-1">
                      Rp {netOperatingProfit.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-[#4edea3] mt-2">Margin 33.3% (@ Rp 15k/sesi)</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Kas Operasional Aktif</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      Rp 48.650.000
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2">BCA Corporate & Mandiri H2H</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                      <h3 className="font-bold text-sm">Arus Kas Pembayaran Siswa Baru ({verifiedStudents.length} Lunas)</h3>
                      <button onClick={exportFinancialReport} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">Unduh Laporan</button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-[#31353f] text-xs">
                      {registrations.slice(0, 5).map((r) => (
                        <div key={r.id} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">{r.student_name}</p>
                            <span className="text-slate-400">{r.selected_package || 'Paket Bintang'} • WA: {r.phone_number}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 block">Rp 360.000</span>
                            <span className={`text-[10px] font-bold ${r.is_verified ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {r.is_verified ? 'Lunas Reconciled' : 'Menunggu ACC'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                    <h3 className="font-bold text-sm">Alokasi Margin Cerdas</h3>
                    <div className="h-3 rounded-full bg-slate-100 dark:bg-[#262a34] overflow-hidden flex">
                      <div className="bg-amber-500 h-full" style={{ width: '66.7%' }} title="Honor Guru 66.7%"></div>
                      <div className="bg-slate-400 h-full" style={{ width: '20%' }} title="Operasional 20%"></div>
                      <div className="bg-emerald-600 h-full" style={{ width: '13.3%' }} title="Laba Ditahan 13.3%"></div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span>Honor Guru:</span><span className="font-bold text-amber-600">66.7%</span></div>
                      <div className="flex justify-between"><span>Operasional:</span><span className="font-bold text-slate-500">20.0%</span></div>
                      <div className="flex justify-between"><span>Laba Ditahan:</span><span className="font-bold text-emerald-600">13.3%</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. TAB: SUPERVISI & MUTU GURU */}
            {/* ========================================================================= */}
            {activeTab === 'evaluasi' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                  <div>
                    <h2 className="font-bold text-base">Konsol Audit Supervisi Guru</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Evaluasi berkala resmi dari Kepala Sekolah yang tampil di portal pengajar</p>
                  </div>

                  <form onSubmit={handleSubmitEvaluation} className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-bold block mb-1">Pilih Pengajar / Tutor</label>
                      <select
                        value={selectedTutorForEval}
                        onChange={(e) => setSelectedTutorForEval(e.target.value)}
                        className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-bold"
                      >
                        {tutors.map((t) => (
                          <option key={t.id} value={t.full_name}>{t.full_name} ({t.campus})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold block mb-1">Kategori Supervisi</label>
                      <select
                        value={evalCategory}
                        onChange={(e) => setEvalCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                      >
                        <option value="Metode Mengajar">Metode Mengajar & Pemahaman HOTS</option>
                        <option value="Ketepatan Waktu">Ketepatan Waktu Datang (Presensi GPS)</option>
                        <option value="Kedisiplinan & Kerapian">Kedisiplinan & Kerapian Modul KBM</option>
                        <option value="Komunikasi Siswa">Komunikasi Siswa & Wali Murid</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 font-semibold">
                        <span>Skor Evaluasi:</span>
                        <span className="font-bold text-emerald-600">{evalScore} / 100</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="100"
                        value={evalScore}
                        onChange={(e) => setEvalScore(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1">Catatan Resmi Kepala Sekolah</label>
                      <textarea
                        rows={3}
                        required
                        value={evalFeedback}
                        onChange={(e) => setEvalFeedback(e.target.value)}
                        placeholder="Tuliskan umpan balik evaluasi pengajar..."
                        className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingEval}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      {submittingEval ? 'Menyimpan...' : 'Simpan & Publikasikan ke Guru'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                  <h3 className="font-bold text-sm border-b border-slate-100 dark:border-[#31353f] pb-3">Riwayat Supervisi ({evaluations.length})</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 text-xs">
                    {evaluations.map((ev) => (
                      <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm">{ev.tutor_name}</h4>
                            <span className="text-[10px] text-emerald-600 font-bold">{ev.category}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 font-bold border border-emerald-200">
                            Skor: {ev.score}
                          </span>
                        </div>
                        <p className="italic text-slate-600 dark:text-slate-300">“{ev.feedback_notes}”</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. TAB: PANTAU PR KILAT */}
            {/* ========================================================================= */}
            {activeTab === 'pr_help' && (
              <div className="bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <div>
                    <h2 className="font-bold text-base">Pusat Pantauan Tanya PR Kilat Siswa</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Audit interaksi asinkron tanya PR dan kesesuaian petunjuk rumus guru</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/15 text-amber-700 dark:text-[#ffb95f] text-xs font-bold rounded-xl">
                    Total {homeworkHelpList.length} Pertanyaan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {homeworkHelpList.map((h) => (
                    <div key={h.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-amber-600 uppercase">Format {h.question_media_type || 'Foto'}</span>
                          <h4 className="font-bold text-sm mt-0.5">{h.question_title}</h4>
                          <p className="text-slate-400">Murid: <b>{h.student_name}</b> • Tutor: <b>{h.tutor_name}</b></p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${h.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                          {h.status === 'answered' ? 'Terjawab' : 'Menunggu'}
                        </span>
                      </div>

                      <button
                        onClick={() => setPreviewMediaModal({ url: h.question_photo_url, type: h.question_media_type || 'image', title: `Soal: ${h.question_title}` })}
                        className="w-full py-2 bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] font-bold text-emerald-600 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Icon name="visibility" className="text-[16px]" /> Buka Berkas Soal Murid
                      </button>

                      {h.status === 'answered' && (
                        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl text-emerald-950 dark:text-emerald-300">
                          <span className="font-bold block text-[10px] uppercase text-emerald-700">Petunjuk Balasan Guru:</span>
                          <p className="italic mt-0.5">“{h.tutor_answer}”</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. TAB: ACC MURID BARU */}
            {/* ========================================================================= */}
            {activeTab === 'murid' && (
              <div className="bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                <div>
                  <h2 className="font-bold text-base">Validasi Pembayaran & Aktivasi Murid Baru</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Konfirmasi mutasi pembayaran sebelum membuka slot mengajar ke bursa guru</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {registrations.map((item) => (
                    <div key={item.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm">{item.student_name}</h4>
                            <p className="text-slate-400">WA: {item.phone_number}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {item.is_verified ? 'Terverifikasi' : 'Menunggu ACC'}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300"><b>Paket:</b> {item.selected_package} ({item.selected_days})</p>
                        <p className="text-slate-500">Alamat: {item.address}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-[#31353f] flex justify-between items-center">
                        <a href={item.transfer_receipt_url} target="_blank" className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                          <Icon name="receipt" className="text-[16px]" /> Struk Transfer
                        </a>
                        {!item.is_verified && (
                          <button
                            onClick={() => handleVerifyStudent(item)}
                            disabled={actionLoading === item.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                          >
                            Setujui & Aktivasi
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 6. TAB: ACC GURU BARU */}
            {/* ========================================================================= */}
            {activeTab === 'guru' && (
              <div className="bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                <div>
                  <h2 className="font-bold text-base">Validasi Kredensial Calon Tutor</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Audit legalitas dan izinkan pengajar mengambil jadwal les murid</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {tutors.map((tutor) => (
                    <div key={tutor.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm">{tutor.full_name}</h4>
                          <span className="text-emerald-600 font-bold">{tutor.campus} • {tutor.major}</span>
                          <p className="text-slate-400 mt-0.5">WA: {tutor.phone_number}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tutor.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {tutor.is_approved ? 'Resmi Di-ACC' : 'Menunggu ACC'}
                        </span>
                      </div>
                      <p className="italic bg-white dark:bg-[#0a0e17] p-3 rounded-xl border border-slate-200 dark:border-[#31353f] text-slate-600 dark:text-slate-300">
                        “{tutor.achievements || 'Tanpa catatan khusus.'}”
                      </p>
                      {!tutor.is_approved && (
                        <button
                          onClick={() => handleVerifyTutor(tutor)}
                          disabled={actionLoading === tutor.id}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                        >
                          ACC & Terbitkan Akun Tutor
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 7. TAB: RESCHEDULE */}
            {/* ========================================================================= */}
            {activeTab === 'reschedule' && (
              <div className="bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                <div>
                  <h2 className="font-bold text-base">Validasi Izin Ganti Jadwal (Reschedule)</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Persetujuan perubahan waktu sesi KBM murid dan tutor</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {reschedules.map((item) => (
                    <div key={item.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Pemohon: {item.requester_role} ({item.requester_name})</span>
                          <h4 className="font-bold text-sm mt-0.5">Alasan: “{item.reason}”</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#0a0e17] rounded-xl space-y-1">
                        <p className="text-slate-400">Jadwal Asli: <b className="text-slate-800 dark:text-white">{item.original_day_time}</b></p>
                        <p className="text-emerald-600">Usulan Baru: <b>{item.proposed_day_time}</b></p>
                      </div>
                      {item.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveReschedule(item)} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">Setujui</button>
                          <button onClick={() => handleRejectReschedule(item)} className="flex-1 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl border border-rose-200 cursor-pointer">Tolak</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 8. TAB: PENCAIRAN HONOR */}
            {/* ========================================================================= */}
            {activeTab === 'honor' && (
              <div className="bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                <div>
                  <h2 className="font-bold text-base">Validasi & Pencairan Honor Tutor</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Periksa bukti foto KBM sebelum otorisasi transfer honorarium (@ Rp 30.000 / sesi)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {schedules.filter(s => s.status === 'claimed').map((sch) => {
                    const completed = sch.completed_sessions || 0;
                    const totalHonor = completed * 30000;
                    return (
                      <div key={sch.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Pengajar:</span>
                            <h4 className="font-bold text-sm">{sch.claimed_by_tutor_name}</h4>
                            <p className="text-emerald-600 font-semibold">Murid: {sch.student_name}</p>
                          </div>
                          <span className="text-base font-black text-emerald-600">Rp {totalHonor.toLocaleString('id-ID')}</span>
                        </div>

                        {sch.last_kbm_photo_url ? (
                          <button onClick={() => setPreviewPhotoUrl(sch.last_kbm_photo_url)} className="w-full py-2 bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] text-emerald-600 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer">
                            <Icon name="photo_camera" className="text-[16px]" /> Lihat Foto Bukti Sesi Terakhir
                          </button>
                        ) : (
                          <p className="text-slate-400 italic text-center py-1">Belum ada unggahan foto presensi KBM</p>
                        )}

                        <div className="pt-2 border-t border-slate-200/60 dark:border-[#31353f]">
                          {!sch.is_honor_paid ? (
                            <button
                              onClick={() => handleDisburseHonor(sch)}
                              disabled={actionLoading === sch.id || completed === 0}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                            >
                              Cairkan Honor (Rp {totalHonor.toLocaleString('id-ID')})
                            </button>
                          ) : (
                            <span className="block text-center py-2 bg-emerald-100 text-emerald-800 font-bold rounded-xl">
                              Honor Telah Selesai Dicairkan
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 9. TAB: KENDALA SOS */}
            {/* ========================================================================= */}
            {activeTab === 'complaints' && (
              <div className="bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                <div>
                  <h2 className="font-bold text-base">Pusat Laporan Kendala Belajar Siswa</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Pengaduan darurat mengenai keterlambatan atau kesesuaian guru privat</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {complaints.map((comp) => (
                    <div key={comp.id} className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">{comp.issue_type}</span>
                          <h4 className="font-bold text-sm mt-1">Siswa: {comp.student_name}</h4>
                          <p className="text-slate-400">Tutor: {comp.tutor_name}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${comp.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-600 text-white animate-pulse'}`}>
                          {comp.status === 'resolved' ? 'Selesai' : 'Perlu Tindakan'}
                        </span>
                      </div>
                      <p className="p-3 rounded-xl bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] italic text-slate-700 dark:text-slate-300">
                        “{comp.description}”
                      </p>
                      {comp.status === 'pending' && (
                        <button onClick={() => handleResolveComplaint(comp)} className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                          Tandai Selesai Ditangani
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 10. TAB: MONITORING CHAT & SESI */}
            {/* ========================================================================= */}
            {activeTab === 'monitoring' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-5 bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-3 text-xs">
                  <h3 className="font-bold text-sm">Sesi KBM & Stopwatch</h3>
                  <div className="space-y-2 max-h-[480px] overflow-y-auto">
                    {schedules.map((sch) => (
                      <div
                        key={sch.id}
                        onClick={() => openChatMonitor(sch.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedScheduleId === sch.id ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-[#31353f]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold">{sch.student_name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#262a34]">
                            {sch.day_of_week} • {sch.session_time?.substring(0, 5)}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">Tutor: {sch.claimed_by_tutor_name || 'Belum Terikat'}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSendReminder(sch); }}
                          className="mt-2 text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Icon name="chat" className="text-[14px]" /> Kirim Pengingat WA
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-7 bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs flex flex-col h-[520px] text-xs">
                  <h3 className="font-bold text-sm border-b border-slate-100 dark:border-[#31353f] pb-3">Log Percakapan Sesi</h3>
                  <div className="flex-1 overflow-y-auto py-3 space-y-2">
                    {chats.length === 0 ? (
                      <p className="text-center text-slate-400 py-16">Pilih salah satu sesi di sebelah kiri untuk melihat pesan percakapan.</p>
                    ) : (
                      chats.map((c) => (
                        <div key={c.id} className={`p-3 rounded-2xl max-w-[80%] ${c.sender_role === 'guru' ? 'bg-emerald-600 text-white ml-auto' : 'bg-slate-100 dark:bg-[#262a34] mr-auto'}`}>
                          <p className="text-[9px] font-bold uppercase opacity-75">{c.sender_name}</p>
                          <p>{c.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 11. TAB: MANAJEMEN AKUN (DENGAN LOGIKA CASCADE HAPUS AMAN) */}
            {/* ========================================================================= */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-6">
                <div>
                  <h2 className="font-bold text-base">Manajemen Akun Terpadu & Pembersihan Aman</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Menghapus akun murid akan membersihkan jadwalnya secara utuh. Menghapus akun guru akan mengalihkan murid ke status butuh mentor pengganti.
                  </p>
                </div>

                {/* Sub-Daftar Murid */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-emerald-600">Daftar Akun Murid ({registrations.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {registrations
                      .filter(r => r.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.phone_number?.includes(searchTerm))
                      .map((r) => (
                        <div key={r.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] flex justify-between items-center">
                          <div>
                            <h4 className="font-bold">{r.student_name}</h4>
                            <p className="text-slate-400">WA: {r.phone_number}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => openEditModal('murid', r)} className="p-2 rounded-xl bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] hover:bg-slate-100 cursor-pointer">
                              <Icon name="edit" className="text-[16px] text-indigo-500" />
                            </button>
                            <button onClick={() => handleDeleteStudentAccount(r)} className="p-2 rounded-xl bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] hover:bg-rose-50 text-rose-600 cursor-pointer" title="Hapus Murid & Bersihkan Jadwal">
                              <Icon name="delete" className="text-[16px]" />
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Sub-Daftar Guru */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-[#31353f]">
                  <h3 className="font-bold text-sm text-amber-600">Daftar Akun Guru / Mentor ({tutors.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {tutors
                      .filter(t => t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.phone_number?.includes(searchTerm))
                      .map((t) => (
                        <div key={t.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] flex justify-between items-center">
                          <div>
                            <h4 className="font-bold">{t.full_name}</h4>
                            <p className="text-slate-400">{t.campus} • WA: {t.phone_number}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => openEditModal('guru', t)} className="p-2 rounded-xl bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] hover:bg-slate-100 cursor-pointer">
                              <Icon name="edit" className="text-[16px] text-indigo-500" />
                            </button>
                            <button onClick={() => handleDeleteTutorAccount(t)} className="p-2 rounded-xl bg-white dark:bg-[#262a34] border border-slate-200 dark:border-[#31353f] hover:bg-rose-50 text-rose-600 cursor-pointer" title="Hapus Mentor & Buka Alokasi Pengganti">
                              <Icon name="delete" className="text-[16px]" />
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 12. TAB: LOG AUDIT MUTASI */}
            {/* ========================================================================= */}
            {activeTab === 'logs' && (
              <div className="bg-white dark:bg-[#181b25] p-6 rounded-3xl border border-slate-200 dark:border-[#31353f] shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <div>
                    <h2 className="font-bold text-base">Log Audit Keamanan & Riwayat Mutasi Relasi</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Rekam permanen seluruh mutasi mentor, pemutusan ikatan, dan aktivitas pimpinan</p>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[520px] overflow-y-auto text-xs">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1c1f29] border border-slate-200/80 dark:border-[#31353f] flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action_type.includes('RELASI') || log.action_type.includes('HAPUS') 
                              ? 'bg-rose-100 text-rose-800' 
                              : log.action_type.includes('MUTASI')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.action_type}
                          </span>
                          <span className="font-semibold">{log.description}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Oleh: {log.actor_name} • Target: {log.target_user}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>

        {/* 4. MOBILE BOTTOM NAVIGATION */}
        {isUnlocked && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-white/95 dark:bg-[#0a0e17]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#31353f] shadow-lg">
            <div className="flex justify-around items-center h-16 px-1">
              {[
                { id: 'monitoring_relasi', label: 'Relasi', icon: 'hub', hasBadge: unassignedStudents.length > 0 },
                { id: 'analytics', label: 'Keuangan', icon: 'account_balance_wallet' },
                { id: 'evaluasi', label: 'Supervisi', icon: 'fact_check' },
                { id: 'murid', label: 'ACC Murid', icon: 'how_to_reg' },
                { id: 'complaints', label: 'Audit SOS', icon: 'crisis_alert', hasBadge: pendingComplaints.length > 0 },
              ].map((bTab) => {
                const active = activeTab === bTab.id;
                return (
                  <button
                    key={bTab.id}
                    onClick={() => setActiveTab(bTab.id as any)}
                    className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all cursor-pointer ${
                      active
                        ? 'text-emerald-600 dark:text-[#4edea3] font-bold'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                    }`}
                  >
                    <span className="relative inline-flex items-center">
                      <Icon name={bTab.icon} className="text-[22px]" />
                      {bTab.hasBadge && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                      )}
                    </span>
                    <span className="text-[10px] mt-0.5 tracking-tight">{bTab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* MODAL ALOKASI MENTOR BARU (RE-ASSIGN MENTOR) */}
        <AnimatePresence>
          {reassignModalTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon name="person_add" className="text-emerald-600" /> Alokasikan Mentor untuk Siswa
                  </h3>
                  <button onClick={() => setReassignModalTarget(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#1c1f29] rounded-2xl space-y-1">
                  <p className="text-slate-500">Nama Siswa: <b className="text-slate-900 dark:text-white">{reassignModalTarget.student_name}</b></p>
                  <p className="text-slate-500">Jadwal: {reassignModalTarget.day_of_week} • Pukul {reassignModalTarget.session_time?.substring(0, 5)} WIB</p>
                  <p className="text-slate-500">Alamat: {reassignModalTarget.student_address}</p>
                </div>

                <form onSubmit={handleExecuteReassignMentor} className="space-y-4">
                  <div>
                    <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Pilih Mentor Pengganti dari Guru Terverifikasi ({approvedTutors.length} Siaga)
                    </label>
                    <select
                      value={selectedNewMentor}
                      onChange={(e) => setSelectedNewMentor(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600"
                    >
                      {approvedTutors.map((t) => (
                        <option key={t.id} value={t.full_name}>
                          {t.full_name} ({t.campus} • {t.major})
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    *Setelah mentor dialokasikan, sistem akan langsung membuka tautan WhatsApp konfirmasi resmi kepada orang tua siswa.
                  </p>

                  <button
                    type="submit"
                    disabled={savingReassign}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {savingReassign ? 'Menyimpan Relasi...' : 'Tugaskan & Kirim Konfirmasi WA'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL PREVIEW MEDIA UNIVERSAL (FOTO & VIDEO) */}
        <AnimatePresence>
          {previewMediaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-2">
                  <h4 className="font-bold truncate">{previewMediaModal.title}</h4>
                  <button onClick={() => setPreviewMediaModal(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[420px]">
                  {previewMediaModal.type === 'video' ? (
                    <video src={previewMediaModal.url} controls autoPlay className="w-full max-h-[400px]" />
                  ) : (
                    <img src={previewMediaModal.url} alt="Berkas" className="w-full h-auto object-contain max-h-[400px]" />
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL PREVIEW FOTO KBM */}
        <AnimatePresence>
          {previewPhotoUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 relative text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Bukti Foto Dokumentasi KBM</h3>
                  <button onClick={() => setPreviewPhotoUrl(null)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-black flex items-center justify-center max-h-[420px]">
                  <img src={previewPhotoUrl} alt="Bukti Kehadiran Belajar" className="w-full h-auto object-contain max-h-[400px]" />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL GANTI AKSES & PIN */}
        <AnimatePresence>
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Pengaturan Akses & PIN Kepala Sekolah</h3>
                  <button onClick={() => setShowSettingsModal(false)} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSaveSecuritySettings} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">ID Pengguna Baru</label>
                    <input type="text" required value={newAdminId} onChange={(e) => setNewAdminId(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]" />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Kata Sandi Baru</label>
                    <input type="text" required value={newAdminPw} onChange={(e) => setNewAdminPw(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]" />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">PIN Keamanan 6 Digit</label>
                    <input type="text" maxLength={6} required value={newMasterPin} onChange={(e) => setNewMasterPin(e.target.value.replace(/[^0-9]/g, ''))} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f] font-mono tracking-widest text-center text-sm" />
                  </div>
                  <button type="submit" disabled={savingSettings} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer">
                    {savingSettings ? 'Menyimpan...' : 'Simpan Kredensial Baru'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL EDIT AKUN */}
        <AnimatePresence>
          {editModalData.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-[#181b25] border border-slate-200 dark:border-[#31353f] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#31353f] pb-3">
                  <h3 className="font-bold text-sm">Edit Akun {editModalData.type === 'murid' ? 'Murid' : 'Guru'}</h3>
                  <button onClick={() => setEditModalData({ isOpen: false, type: 'murid', data: null })} className="cursor-pointer"><Icon name="close" /></button>
                </div>
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Nama Lengkap</label>
                    <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]" />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Nomor WhatsApp</label>
                    <input type="tel" required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]" />
                  </div>
                  {editModalData.type === 'murid' ? (
                    <div>
                      <label className="font-semibold block mb-1">Alamat Rumah</label>
                      <textarea rows={2} value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="font-semibold block mb-1">Asal Kampus</label>
                        <input type="text" value={editCampus} onChange={(e) => setEditCampus(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]" />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Jurusan</label>
                        <input type="text" value={editMajor} onChange={(e) => setEditMajor(e.target.value)} className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-[#1c1f29] border-slate-200 dark:border-[#31353f]" />
                      </div>
                    </>
                  )}
                  <button type="submit" disabled={savingEdit} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer">
                    {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
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