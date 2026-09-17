'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, CheckCircle2, Clock, Calendar, 
  User, BookOpen, BarChart2, Camera, Award,
  Sparkles, ExternalLink, Loader2, ArrowRight
} from 'lucide-react';

export default function ParentObservationPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (token) fetchParentData();
  }, [token]);

  const fetchParentData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data sesi berdasarkan token unik
      const { data: schData, error: schErr } = await supabase
        .from('schedules')
        .select('*')
        .eq('parent_access_token', token)
        .single();

      if (schErr || !schData) {
        setLoading(false);
        return;
      }
      setSchedule(schData);

      // 2. Ambil riwayat foto & kehadiran KBM
      const { data: logsData } = await supabase
        .from('session_attendance_logs')
        .select('*')
        .eq('schedule_id', schData.id)
        .order('session_number', { ascending: false });
      if (logsData) setAttendanceLogs(logsData);

      // 3. Ambil rapor evaluasi belajar murid
      const { data: repData } = await supabase
        .from('student_reports')
        .select('*')
        .eq('student_name', schData.student_name)
        .order('created_at', { ascending: false });
      if (repData) setReports(repData);

    } catch (err) {
      console.error('Error load pantauan:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-xs font-bold text-slate-500">Memuat Pantauan Belajar Ananda...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-sm w-full space-y-3">
          <ShieldCheck className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-black text-slate-900">Tautan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Tautan pantauan belajar ini tidak valid atau sudah kedaluwarsa. Silakan hubungi admin sekolah.</p>
        </div>
      </div>
    );
  }

  const completed = schedule.completed_sessions || 0;
  const target = schedule.target_sessions || 8;
  const progressPercent = Math.min(100, Math.round((completed / target) * 100));

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 font-sans pb-24 antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm">
              CA
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-teal-700 block leading-none">Parent Portal</span>
              <h1 className="font-black text-sm text-slate-900 leading-tight">Laporan Belajar Ananda</h1>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
            Resmi Terverifikasi
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5 space-y-4">
        {/* Kartu Profil Ananda */}
        <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-6 rounded-[2rem] text-white shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-200 bg-white/10 px-2.5 py-0.5 rounded-md">
                Siswa Aktif
              </span>
              <h2 className="text-2xl font-black">{schedule.student_name}</h2>
              <p className="text-xs text-teal-100 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Tutor Pendamping: <b>{schedule.claimed_by_tutor_name || 'Menunggu Penugasan'}</b>
              </p>
            </div>
          </div>

          {/* Kuota & Progres Belajar */}
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-teal-200 font-medium">Sesi Terlaksana:</span>
              <span className="font-black text-sm">{completed} dari {target} Pertemuan</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 p-0.5">
              <div 
                style={{ width: `${progressPercent}%` }} 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
              />
            </div>
            <div className="flex justify-between text-[10px] text-teal-200 font-semibold pt-0.5">
              <span>Sisa Sesi: {Math.max(0, target - completed)} Kali</span>
              <span>{progressPercent}% Tercapai</span>
            </div>
          </div>
        </div>

        {/* Jadwal Rutin Belajar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
          <h3 className="font-black text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-600" /> Jadwal Sesi Tatap Muka
          </h3>
          <div className="p-3 bg-slate-50 rounded-2xl flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">{schedule.day_of_week}</p>
              <p className="text-[11px] text-slate-500">Pukul {schedule.session_time?.substring(0, 5)} WIB (Durasi 90 Menit)</p>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              Di Rumah
            </span>
          </div>
        </div>

        {/* Galeri Foto Bukti KBM Tiap Sesi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="border-b pb-2 flex justify-between items-center">
            <h3 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-600" /> Bukti Kehadiran & Foto Belajar
            </h3>
            <span className="text-[10px] font-bold text-slate-400">{attendanceLogs.length} Foto</span>
          </div>

          {attendanceLogs.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">Belum ada unggahan foto sesi tatap muka.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {attendanceLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 space-y-1.5 p-2">
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-200">
                    <img src={log.photo_url} alt={`Sesi ${log.session_number}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-1 text-[11px]">
                    <p className="font-black text-slate-800">Pertemuan ke-{log.session_number}</p>
                    <p className="text-[9px] text-slate-400">{new Date(log.session_date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Catatan Rapor Belajar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-black text-xs text-slate-900 flex items-center gap-1.5 border-b pb-2">
            <BarChart2 className="w-4 h-4 text-amber-600" /> Rapor Nilai & Catatan Perkembangan
          </h3>

          {reports.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">Belum ada evaluasi berkala yang diinput tutor.</p>
          ) : (
            <div className="space-y-2.5">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800">{rep.subject_topic}</span>
                    <span className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Skor: {rep.score}/100
                    </span>
                  </div>
                  <p className="text-slate-600 italic text-[11px] leading-relaxed bg-white p-2 rounded-xl border border-slate-100">
                    “{rep.attitude_notes}”
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}