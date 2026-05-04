/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  User, 
  School, 
  Compass, 
  Palette, 
  Settings, 
  Truck, 
  Anchor,
  Info,
  Download,
  Loader2
} from 'lucide-react';
import { Major, UserData, TestResult, Question } from './types';
import { QUESTIONS, INTEREST_QUESTIONS, COLOR_TESTS } from './data/questions';

// --- Components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${(current / total) * 100}%` }}
      className="h-full bg-blue-600"
    />
  </div>
);

export default function App() {
  const [step, setStep] = useState<'intro' | 'biodata' | 'aptitude' | 'interest' | 'color' | 'result'>('intro');
  const [userData, setUserData] = useState<UserData>({ 
    name: '', 
    previousSchool: '',
    gender: 'Laki-laki',
    registrationDate: new Date().toLocaleDateString('id-ID'),
    registrationNumber: `TP1-${Date.now().toString().slice(-6)}`,
    address: '',
    birthDate: ''
  });
  const [answers, setAnswers] = useState<Record<string, number>>({}); // question index -> option index
  const [colorAnswers, setColorAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const [result, setResult] = useState<TestResult | null>(null);
  const shuffledColorTests = useMemo(() => {
    return [...COLOR_TESTS].sort(() => Math.random() - 0.5);
  }, []);

  const allQuestions = useMemo(() => [...QUESTIONS, ...INTEREST_QUESTIONS], []);

  const handleFinish = () => {
    const res = calculateResults();
    setResult(res);
    setStep('result');
  };

  const handleNext = () => {
    if (step === 'intro') setStep('biodata');
    else if (step === 'biodata') setStep('aptitude');
    else if (step === 'aptitude') {
      if (currentIdx < QUESTIONS.length - 1) setCurrentIdx(currentIdx + 1);
      else {
        setCurrentIdx(0);
        setStep('interest');
      }
    } else if (step === 'interest') {
       if (currentIdx < INTEREST_QUESTIONS.length - 1) setCurrentIdx(currentIdx + 1);
       else {
         setCurrentIdx(0);
         setStep('color');
       }
    } else if (step === 'color') {
        if (currentIdx < shuffledColorTests.length - 1) setCurrentIdx(currentIdx + 1);
        else handleFinish();
    }
  };

  const handleBack = () => {
     if (step === 'biodata') setStep('intro');
     else if (step === 'aptitude') {
        if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
        else setStep('biodata');
     }
     else if (step === 'interest') {
        if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
        else {
          setCurrentIdx(QUESTIONS.length - 1);
          setStep('aptitude');
        }
     }
     else if (step === 'color') {
        if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
        else {
          setCurrentIdx(INTEREST_QUESTIONS.length - 1);
          setStep('interest');
        }
     }
  };

  const calculateResults = (): TestResult => {
    const scores: Record<Major, number> = {
      [Major.PEMESINAN_KAPAL]: 0,
      [Major.TKR]: 0,
      [Major.DKV]: 0,
      [Major.LOGISTIK]: 0
    };

    const aptitudeScores: Record<Major, number> = { ...scores };
    const interestScores: Record<Major, number> = { ...scores };

    // Calculate from questions (Aptitude)
    QUESTIONS.forEach((q) => {
      const selectedOptIdx = answers[q.id];
      if (selectedOptIdx !== undefined) {
        const option = q.options[selectedOptIdx];
        Object.entries(option.weight).forEach(([major, weight]) => {
          const val = weight as number;
          scores[major as Major] += val || 0;
          aptitudeScores[major as Major] += val || 0;
        });
      }
    });

    // Calculate from interest questions
    INTEREST_QUESTIONS.forEach((q) => {
      const selectedOptIdx = answers[q.id];
      if (selectedOptIdx !== undefined) {
        const option = q.options[selectedOptIdx];
        Object.entries(option.weight).forEach(([major, weight]) => {
          const val = weight as number;
          scores[major as Major] += val || 0;
          interestScores[major as Major] += val || 0;
        });
      }
    });

    // Check color blindness and visual clarity
    let correctColorCount = 0;
    let cannotSeeCount = 0;
    
    shuffledColorTests.forEach(test => {
      const selected = colorAnswers[test.id];
      if (selected === test.answer) correctColorCount++;
      else if (selected === 'X') cannotSeeCount++;
    });

    const isColorBlind = correctColorCount < 3 && cannotSeeCount < 2;
    const isLowVision = cannotSeeCount >= 2;

    let eyeHealthStatus: TestResult['eyeHealthStatus'] = 'Normal';
    if (isLowVision) eyeHealthStatus = 'Terindikasi Gangguan Penglihatan (Mata Minus/Silinder/Low Vision)';
    else if (isColorBlind) eyeHealthStatus = 'Terindikasi Buta Warna';

    // Determine recommended
    let recommended = Major.LOGISTIK;
    let maxScore = -1;

    Object.entries(scores).forEach(([major, score]) => {
      if (score > maxScore) {
        // If color blind, DKV is not recommended
        if ((isColorBlind || isLowVision) && major === Major.DKV) return;
        maxScore = score;
        recommended = major as Major;
      }
    });

    const res = { 
      scores, 
      aptitudeScores, 
      interestScores, 
      isColorBlind, 
      eyeHealthStatus, 
      recommendedMajor: recommended, 
      userData 
    };
    
    return res;
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-2xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img 
            src="https://lh3.googleusercontent.com/d/1hFPbiJeK9XgVBaXLFnAFmvPHccNWbEv4" 
            alt="Logo SMK Tanjung Priok 1"
            className="w-12 h-12 object-contain filter drop-shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-lg font-bold leading-none">SMK Tanjung Priok 1</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Test Bakat & Minat</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-blue-500/5 p-6 md:p-10 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div 
              key="intro"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-200/50 border-4 border-blue-50 relative">
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-blue-100 opacity-20"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <img 
                  src="https://lh3.googleusercontent.com/d/1hFPbiJeK9XgVBaXLFnAFmvPHccNWbEv4" 
                  alt="SMK Tanjung Priok 1 Logo"
                  className="w-24 h-24 object-contain relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Halo, Calon Siswa Hebat!</h2>
              <p className="text-gray-600 leading-relaxed">
                Bingung memilih jurusan yang tepat? Mari cari tahu bakat dan minatmu melalui tes sederhana ini. 
                Hasil tes akan membantumu memilih 1 dari 4 jurusan unggulan di SMK Tanjung Priok 1.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2">
                   <Anchor className="text-blue-600" />
                   <span className="text-xs font-bold">Mesin Kapal</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2">
                   <Settings className="text-orange-600" />
                   <span className="text-xs font-bold">TKR</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2">
                   <Palette className="text-purple-600" />
                   <span className="text-xs font-bold">DKV</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2">
                   <Truck className="text-green-600" />
                   <span className="text-xs font-bold">Logistik</span>
                </div>
              </div>
              <button 
                id="start-btn"
                onClick={handleNext}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                Mulai Tes Sekarang <ChevronRight />
              </button>
            </motion.div>
          )}

          {step === 'biodata' && (
            <motion.div 
              key="biodata"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <User className="w-5 h-5" />
                <h2 className="text-xl font-bold">Lengkapi Biodata</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama lengkapmu..."
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition text-sm"
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Kelamin</label>
                  <div className="flex gap-2">
                    {['Laki-laki', 'Perempuan'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setUserData({...userData, gender: g as any})}
                        className={`flex-1 p-3 rounded-xl border-2 font-bold text-sm transition ${
                          userData.gender === g 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-gray-50 border-gray-100 text-gray-500'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition text-sm"
                    value={userData.birthDate}
                    onChange={(e) => setUserData({...userData, birthDate: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Asal Sekolah (SMP)</label>
                  <input 
                    type="text" 
                    placeholder="Nama sekolah asal..."
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition text-sm"
                    value={userData.previousSchool}
                    onChange={(e) => setUserData({...userData, previousSchool: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Alamat Tinggal</label>
                  <textarea 
                    rows={2}
                    placeholder="Masukkan alamat lengkap..."
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition text-sm resize-none"
                    value={userData.address}
                    onChange={(e) => setUserData({...userData, address: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  className="w-1/3 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold flex items-center justify-center text-sm"
                >
                  Kembali
                </button>
                <button 
                  disabled={!userData.name || !userData.previousSchool || !userData.address || !userData.birthDate}
                  onClick={handleNext}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50 text-sm shadow-lg shadow-blue-100"
                >
                  Lanjutkan Tes
                </button>
              </div>
            </motion.div>
          )}

          {(step === 'aptitude' || step === 'interest') && (
            <motion.div 
              key={`${step}-${currentIdx}`}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <ProgressBar 
                current={(step === 'aptitude' ? currentIdx : QUESTIONS.length + currentIdx) + 1} 
                total={QUESTIONS.length + INTEREST_QUESTIONS.length} 
              />
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Info className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">{step === 'aptitude' ? 'Tes Bakat' : 'Tes Minat'}</span>
              </div>
              <h3 className="text-2xl font-bold leading-tight">
                {(step === 'aptitude' ? QUESTIONS : INTEREST_QUESTIONS)[currentIdx].text}
              </h3>
              <div className="space-y-3">
                {(step === 'aptitude' ? QUESTIONS : INTEREST_QUESTIONS)[currentIdx].options.map((opt, idx) => {
                  const qId = (step === 'aptitude' ? QUESTIONS : INTEREST_QUESTIONS)[currentIdx].id;
                  const isSelected = answers[qId] === idx;
                  return (
                    <button 
                      key={idx}
                      onClick={() => {
                        setAnswers({ ...answers, [qId]: idx });
                        setTimeout(handleNext, 300);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-600 text-blue-700' 
                          : 'bg-gray-50 border-gray-100 hover:border-blue-200'
                      }`}
                    >
                      <span className="font-medium">{opt.text}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4">
                <button onClick={handleBack} className="w-1/4 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold flex items-center justify-center">
                  <ChevronLeft />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'color' && (
            <motion.div 
              key={`color-${currentIdx}`}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <ProgressBar current={currentIdx + 1} total={shuffledColorTests.length} />
              <div className="flex items-center gap-2 text-blue-600 mb-2 font-bold uppercase text-sm">
                <Palette className="w-5 h-5" />
                Tes Buta Warna
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="w-48 h-48 rounded-full border-8 border-gray-200 bg-white flex items-center justify-center relative overflow-hidden shadow-2xl shadow-blue-100">
                   <div className="absolute inset-0 flex flex-wrap gap-1 p-1 justify-center items-center opacity-60">
                      {Array.from({length: 200}).map((_, i) => {
                        const randomSize = Math.random() * 6 + 4;
                        const bgColors = ['#8cb07d', '#7d9e6c', '#a69066', '#c4a675', '#6b8256', '#94ad82', '#b5a172'];
                        return (
                          <div 
                            key={i} 
                            style={{ 
                              width: `${randomSize}px`, 
                              height: `${randomSize}px`,
                              backgroundColor: bgColors[Math.floor(Math.random() * bgColors.length)],
                              opacity: 0.8
                            }}
                            className="rounded-full shrink-0" 
                          />
                        );
                      })}
                   </div>
                   <motion.span 
                      key={currentIdx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-8xl font-black text-orange-600/50 z-10 select-none mix-blend-darken tracking-tighter drop-shadow-[0_0_1px_rgba(0,0,0,0.1)]"
                    >
                     {shuffledColorTests[currentIdx].answer}
                   </motion.span>
                </div>
                <div className="max-w-xs text-center">
                  <p className="text-gray-500 text-xs italic mb-2">Angka di atas dibuat samar untuk menguji ketajaman mata dan persepsi warna Kamu.</p>
                  <p className="text-sm font-bold text-gray-700">Angka berapa yang kamu lihat?</p>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {['12', '8', '6', '29', '74', 'X'].map((val) => (
                    <button 
                      key={val}
                      onClick={() => {
                        setColorAnswers({ ...colorAnswers, [shuffledColorTests[currentIdx].id]: val });
                        setTimeout(handleNext, 300);
                      }}
                      className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${
                        colorAnswers[shuffledColorTests[currentIdx].id] === val 
                          ? 'bg-blue-600 border-blue-600 text-white transform scale-105' 
                          : 'bg-white border-gray-200 hover:border-blue-400 text-gray-700'
                      }`}
                    >
                      {val === 'X' ? 'TIDAK TERLIHAT' : val}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <ResultSection data={result} onRestart={() => window.location.reload()} />
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-8 text-center text-gray-400 text-xs">
        &copy; 2026 SMK Tanjung Priok 1 | Developed for Better Education
      </footer>
    </div>
  );
}

function ResultSection({ data, onRestart }: { data: TestResult; onRestart: () => void }) {
  const resultRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const submittedRef = useRef(false);

  React.useEffect(() => {
    // Only submit once. Using a local flag to handle StrictMode double-mounting
    if (submittedRef.current) return;
    submittedRef.current = true;

    const controller = new AbortController();

    const submitData = async () => {
      try {
        await fetch('/api/submit-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            ...data.userData,
            recommendedMajor: data.recommendedMajor,
            eyeHealthStatus: data.eyeHealthStatus,
            scores: data.scores
          })
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to auto-submit:', err);
        }
      }
    };

    submitData();
    return () => controller.abort();
  }, [data]);

  const downloadPDF = async () => {
    if (!resultRef.current) return;
    setIsDownloading(true);

    try {
      const element = resultRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Hasil_Tes_${data.userData.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Hidden layout for PDF export to ensure exact branding */}
      <div className="fixed -left-[9999px] top-0" style={{ color: '#000000' }}>
        <div 
          ref={resultRef}
          style={{ backgroundColor: '#ffffff', color: '#000000' }}
          className="w-[600px] p-10"
        >
          <div className="flex flex-col items-center pb-8 mb-8" style={{ borderBottom: '2px solid #f3f4f6' }}>
            <img 
              src="https://lh3.googleusercontent.com/d/1hFPbiJeK9XgVBaXLFnAFmvPHccNWbEv4" 
              className="w-24 h-24 mb-4"
              alt="Logo"
              crossOrigin="anonymous"
            />
            <h1 className="text-2xl font-black uppercase" style={{ color: '#1e3a8a' }}>SMK Tanjung Priok 1</h1>
            <p className="font-bold uppercase tracking-widest text-xs" style={{ color: '#6b7280' }}>Laporan Hasil Penjajakan Bakat & Minat</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', fontSize: '10px' }}>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '8px' }}>
              <p className="font-bold uppercase" style={{ color: '#9ca3af', margin: 0 }}>No. Pendaftaran</p>
              <p className="font-bold" style={{ color: '#1e3a8a', margin: 0 }}>{data.userData.registrationNumber}</p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '8px', textAlign: 'right' }}>
              <p className="font-bold uppercase" style={{ color: '#9ca3af', margin: 0 }}>Tgl Daftar</p>
              <p className="font-bold" style={{ color: '#1e3a8a', margin: 0 }}>{data.userData.registrationDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', fontSize: '14px' }}>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
              <p className="font-bold uppercase" style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '10px', margin: 0 }}>Nama Lengkap</p>
              <p style={{ color: '#111827', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>{data.userData.name}</p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
              <p className="font-bold uppercase" style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '10px', margin: 0 }}>Jenis Kelamin</p>
              <p style={{ color: '#111827', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>{data.userData.gender}</p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
              <p className="font-bold uppercase" style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '10px', margin: 0 }}>Tanggal Lahir</p>
              <p style={{ color: '#111827', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{new Date(data.userData.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
              <p className="font-bold uppercase" style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '10px', margin: 0 }}>Asal Sekolah</p>
              <p style={{ color: '#111827', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>{data.userData.previousSchool}</p>
            </div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', gridColumn: 'span 2 / span 2' }}>
              <p className="font-bold uppercase" style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '10px', margin: 0 }}>Alamat</p>
              <p style={{ color: '#111827', fontWeight: '500', fontSize: '12px', margin: 0 }}>{data.userData.address}</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
            <p style={{ textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '-0.05em', fontSize: '14px', marginBottom: '8px', opacity: 0.8 }}>Rekomendasi Jurusan Utama</p>
            <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 16px 0' }}>{data.recommendedMajor}</h2>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', height: '4px', width: '100%', marginBottom: '16px' }}></div>
            <p style={{ color: '#eff6ff', fontSize: '14px', lineHeight: '1.625', margin: 0 }}>
              {data.recommendedMajor === Major.PEMESINAN_KAPAL && "Siswa menunjukkan potensi besar dalam bidang mekanika logam dan sistem perkapalan. Kepemimpinan teknis yang baik di lingkungan industri berat."}
              {data.recommendedMajor === Major.TKR && "Siswa memiliki naluri tajam dalam diagnostik kendaraan dan sistem otomotif. Cocok untuk spesialisasi servis otomotif modern."}
              {data.recommendedMajor === Major.DKV && "Siswa memiliki kepekaan visual dan daya kreatif tinggi. Potensi besar dalam industri kreatif digital dan multimedia."}
              {data.recommendedMajor === Major.LOGISTIK && "Siswa sangat cakap dalam manajemen inventori dan alur distribusi. Sangat dibutuhkan di hub-hub pelabuhan internasional."}
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '12px', color: '#374151', margin: '0 0 16px 0' }}>Rincian Skor & Analisis Kompetensi</h3>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>JURUSAN</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>BAKAT</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>MINAT</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>SKOR TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.scores).map(([major, score]) => (
                    <tr key={major} style={{ backgroundColor: major === data.recommendedMajor ? '#eff6ff' : '#ffffff' }}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>{major}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: '#2563eb' }}>{data.aptitudeScores[major as Major]}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', color: '#10b981' }}>{data.interestScores[major as Major]}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '900', color: major === data.recommendedMajor ? '#1d4ed8' : '#9ca3af' }}>{score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '8px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>*Skor dihitung berdasarkan kombinasi tes potensi akademik (bakat) dan kuesioner ketertarikan (minat).</p>
          </div>

          <div style={{ backgroundColor: '#f9fafb', border: '2px solid #f3f4f6', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: 0 }}>Status Kesehatan Mata</p>
                <p style={{ fontSize: '14px', fontWeight: '900', color: data.eyeHealthStatus === 'Normal' ? '#16a34a' : '#ea580c', margin: 0 }}>
                  {data.eyeHealthStatus.toUpperCase()}
                </p>
                {data.eyeHealthStatus !== 'Normal' && (
                  <p style={{ color: '#6b7280', fontSize: '8px', marginTop: '4px', maxWidth: '200px', margin: '4px 0 0 0' }}>
                    *Saran: Segera konsultasi ke Dokter Mata/Optik terdekat untuk pemeriksaan ketajaman visual dan persepsi warna lebih mendalam.
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af', margin: 0 }}>Tanggal Tes</p>
                <p style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6" style={{ borderTop: '1px dashed #e5e7eb', marginTop: '40px', paddingTop: '24px', textAlign: 'center' }}>
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#9ca3af', fontWeight: 'bold' }}>Dokumen Digital Resmi SMK Tanjung Priok 1</p>
          </div>
        </div>
      </div>

      <motion.div 
        variants={{
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 }
        }}
        initial="initial"
        animate="animate"
        className="flex flex-col items-center text-center space-y-6 w-full"
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-green-50 mb-4 relative">
          <img 
            src="https://lh3.googleusercontent.com/d/1hFPbiJeK9XgVBaXLFnAFmvPHccNWbEv4" 
            alt="SMK Tanjung Priok 1 Logo"
            className="w-20 h-20 object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-4 border-white shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight px-4">Selamat! Ini Rekomendasi Untukmu</h2>
          <p className="text-gray-500 mt-1">Halo {data.userData.name}, berikut hasilnya:</p>
        </div>

        <div className="w-full bg-blue-600 text-white p-8 rounded-3xl space-y-4 shadow-xl shadow-blue-200">
          <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Jurusan Paling Cocok</span>
          <h1 className="text-3xl font-black">{data.recommendedMajor}</h1>
          <p className="text-sm text-blue-100 italic leading-relaxed">
            {data.recommendedMajor === Major.PEMESINAN_KAPAL && "Kamu memiliki ketertarikan kuat pada konstruksi logam dan mesin berat. Sangat cocok untuk menjadi ahli permesinan kapal."}
            {data.recommendedMajor === Major.TKR && "Kamu unggul dalam pemecahan masalah teknis kendaraan dan otomotif. Bengkel dan inovasi mesin adalah duniamu."}
            {data.recommendedMajor === Major.DKV && "Kreativitas dan jiwa senimu sangat tinggi. Dunia konten digital dan desain menunggumu."}
            {data.recommendedMajor === Major.LOGISTIK && "Kamu sangat terorganisir dan memiliki kemampuan analisis alur kerja yang baik. Ahli logistik masa depan!"}
          </p>
        </div>

        {/* Visual Representations of Results */}
        <div className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full" />
            <h3 className="font-bold text-gray-800">Analisis Profil Bakat & Minat</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Aptitude vs Interest Chart */}
            <div className="flex-1 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase text-center">Perbandingan Bakat & Minat</p>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={Object.entries(Major).map(([_, value]) => ({
                    subject: value.split(' ').map((s, i) => i === 0 ? s : s[0]).join(' '),
                    A: data.aptitudeScores[value as Major],
                    I: data.interestScores[value as Major],
                    fullSubject: value
                  }))}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 20]} hide />
                    <Radar
                      name="Bakat"
                      dataKey="A"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Minat"
                      dataKey="I"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.4}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-xl text-[10px]">
                              <p className="font-bold text-gray-900 mb-1">{payload[0].payload.fullSubject}</p>
                              <p className="text-blue-600 font-bold">Bakat: {payload[0].value}</p>
                              <p className="text-emerald-600 font-bold">Minat: {payload[1].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600" /> Bakat</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Minat</div>
              </div>
            </div>
            
            {/* Cumulative Competency Bar */}
            <div className="flex-1 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase text-center">Skor Kumulatif</p>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={Object.entries(data.scores).map(([name, value]) => ({ 
                      name: name.split(' ').map((s, i) => i === 0 ? s : s[0]).join(' '), 
                      value,
                      fullName: name
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }}
                    />
                    <ChartTooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-xl">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{payload[0].payload.fullName}</p>
                              <p className="text-lg font-black text-blue-600">{payload[0].value} Poin</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 8, 8, 0]} 
                      barSize={20}
                    >
                      {Object.entries(data.scores).map(([name], index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={name === data.recommendedMajor ? '#2563eb' : '#d1d5db'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data.scores).map(([major, score]) => {
              const aptitudePercentage = (data.aptitudeScores[major as Major] / 15) * 100;
              const interestPercentage = (data.interestScores[major as Major] / 10) * 100;
              const isLead = major === data.recommendedMajor;
              return (
                <div key={major} className={`p-4 rounded-2xl border transition-all ${isLead ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-[9px] font-bold uppercase ${isLead ? 'text-blue-600' : 'text-gray-400'}`}>{major}</p>
                    <span className={`text-xs font-black ${isLead ? 'text-blue-700' : 'text-gray-600'}`}>{score}</span>
                  </div>
                  
                  {/* Detailed Analysis */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                      <span>Bakat</span>
                      <span>{Math.round(aptitudePercentage)}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.max(5, aptitudePercentage)}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold pt-1">
                      <span>Minat</span>
                      <span>{Math.round(interestPercentage)}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.max(5, interestPercentage)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full text-left bg-gray-50 p-6 rounded-2xl space-y-4 shadow-sm" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
               <p className="uppercase font-bold text-[8px]" style={{ color: '#9ca3af' }}>No. Pendaftaran</p>
               <p className="font-bold" style={{ color: '#111827' }}>{data.userData.registrationNumber}</p>
            </div>
            <div className="p-3 rounded-xl text-right shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
               <p className="uppercase font-bold text-[8px]" style={{ color: '#9ca3af' }}>Tgl Daftar</p>
               <p className="font-bold" style={{ color: '#111827' }}>{data.userData.registrationDate}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <h4 className="font-bold flex items-center gap-2" style={{ color: '#374151' }}>
                <Palette className="w-4 h-4" style={{ color: '#2563eb' }} /> Hasil Tes Mata
              </h4>
              <span className="px-3 py-1 rounded-full text-[9px] font-bold text-center leading-tight max-w-[150px]" style={{ backgroundColor: data.eyeHealthStatus === 'Normal' ? '#dcfce7' : '#ffedd5', color: data.eyeHealthStatus === 'Normal' ? '#15803d' : '#9a3412' }}>
                {data.eyeHealthStatus}
              </span>
            </div>
            {data.eyeHealthStatus !== 'Normal' && (
              <p className="text-[10px] p-3 rounded-xl font-medium" style={{ color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                Penting: Hasil menunjukkan Kamu mungkin memerlukan bantuan alat optik (kacamata) atau memiliki kondisi buta warna. <strong>Sangat disarankan</strong> untuk melakukan konsultasi mata ke ahlinya.
              </p>
            )}
          </div>
          <p className="text-[10px] p-3 rounded-lg italic" style={{ color: '#6b7280', backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
            *Hasil ini bersifat awal. Disarankan melakukan validasi dengan tim medis sekolah saat pendaftaran fisik.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={downloadPDF}
            disabled={isDownloading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {isDownloading ? (
                <motion.span 
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </motion.span>
              ) : (
                <motion.span 
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Simpan Hasil (PDF)
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          
          <button 
            onClick={onRestart}
            className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition"
          >
            Ulangi Tes
          </button>
        </div>

        <div className="flex gap-3 text-[10px] text-gray-300 uppercase font-bold tracking-widest pt-4">
          <span>SMK Tanjung Priok 1</span>
          <span>•</span>
          <span>BISA! HEBAT!</span>
        </div>
      </motion.div>
    </>
  );
}
