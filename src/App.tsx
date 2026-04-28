/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Info
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
  const [userData, setUserData] = useState<UserData>({ name: '', previousSchool: '' });
  const [answers, setAnswers] = useState<Record<string, number>>({}); // question index -> option index
  const [colorAnswers, setColorAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const allQuestions = useMemo(() => [...QUESTIONS, ...INTEREST_QUESTIONS], []);

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
        if (currentIdx < COLOR_TESTS.length - 1) setCurrentIdx(currentIdx + 1);
        else setStep('result');
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

    // Calculate from questions
    allQuestions.forEach((q, qIdx) => {
      const selectedOptIdx = answers[q.id];
      if (selectedOptIdx !== undefined) {
        const option = q.options[selectedOptIdx];
        Object.entries(option.weight).forEach(([major, weight]) => {
          const val = weight as number;
          scores[major as Major] += val || 0;
        });
      }
    });

    // Check color blindness (simple threshold)
    let correctColor = 0;
    COLOR_TESTS.forEach(test => {
      if (colorAnswers[test.id] === test.answer) correctColor++;
    });
    const isColorBlind = correctColor < 3;

    // Determine recommended
    let recommended = Major.LOGISTIK;
    let maxScore = -1;

    Object.entries(scores).forEach(([major, score]) => {
      if (score > maxScore) {
        // If color blind, DKV is not recommended if there are other picks
        if (isColorBlind && major === Major.DKV) return;
        maxScore = score;
        recommended = major as Major;
      }
    });

    return { scores, isColorBlind, recommendedMajor: recommended, userData };
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
            src="https://drive.google.com/uc?export=view&id=1dZKyaOqI_CJnmFMq1Zut3dHuVXM7Fqqr" 
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
                  src="https://drive.google.com/uc?export=view&id=1dZKyaOqI_CJnmFMq1Zut3dHuVXM7Fqqr" 
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama lengkapmu..."
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition"
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Asal Sekolah (SMP)</label>
                  <input 
                    type="text" 
                    placeholder="Nama sekolah asal..."
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition"
                    value={userData.previousSchool}
                    onChange={(e) => setUserData({...userData, previousSchool: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  className="w-1/3 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold flex items-center justify-center"
                >
                  Kembali
                </button>
                <button 
                  disabled={!userData.name || !userData.previousSchool}
                  onClick={handleNext}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Lanjutkan
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
              <ProgressBar current={currentIdx + 1} total={COLOR_TESTS.length} />
              <div className="flex items-center gap-2 text-blue-600 mb-2 font-bold uppercase text-sm">
                <Palette className="w-5 h-5" />
                Tes Buta Warna
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="w-48 h-48 rounded-full border-8 border-gray-100 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                   {/* Simplified Ishihara Simulation */}
                   <div className="absolute inset-0 flex flex-wrap gap-1 p-2 opacity-80">
                      {Array.from({length: 100}).map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i % 3 === 0 ? 'bg-green-500' : 'bg-red-500'} opacity-50`} />
                      ))}
                   </div>
                   <span className="text-6xl font-bold text-gray-700 z-10">{COLOR_TESTS[currentIdx].answer}</span>
                </div>
                <p className="text-gray-500 text-center italic">Angka berapa yang kamu lihat di lingkaran tersebut?</p>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {['12', '8', '6', '29', '74', 'X'].map((val) => (
                    <button 
                      key={val}
                      onClick={() => {
                        setColorAnswers({ ...colorAnswers, [COLOR_TESTS[currentIdx].id]: val });
                        setTimeout(handleNext, 300);
                      }}
                      className={`p-4 rounded-xl border-2 font-bold text-lg ${
                        colorAnswers[COLOR_TESTS[currentIdx].id] === val 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <ResultSection data={calculateResults()} onRestart={() => window.location.reload()} />
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
  return (
    <motion.div 
      variants={{
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 }
      }}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center text-center space-y-6"
    >
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-green-50 mb-4 relative">
        <img 
          src="https://drive.google.com/uc?export=view&id=1dZKyaOqI_CJnmFMq1Zut3dHuVXM7Fqqr" 
          alt="SMK Tanjung Priok 1 Logo"
          className="w-20 h-20 object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-4 border-white shadow-md">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Hasil Rekomendasi</h2>
        <p className="text-gray-500">Halo {data.userData.name}, berdasarkan tesmu:</p>
      </div>

      <div className="w-full bg-blue-600 text-white p-8 rounded-3xl space-y-4 shadow-xl shadow-blue-200">
        <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">Jurusan Paling Cocok</span>
        <h1 className="text-4xl font-black">{data.recommendedMajor}</h1>
        <p className="text-sm text-blue-100">
          {data.recommendedMajor === Major.PEMESINAN_KAPAL && "Kamu memiliki ketertarikan kuat pada konstruksi logam dan mesin berat. Sangat cocok untuk menjadi ahli permesinan kapal."}
          {data.recommendedMajor === Major.TKR && "Kamu unggul dalam pemecahan masalah teknis kendaraan dan otomotif. Bengkel dan inovasi mesin adalah duniamu."}
          {data.recommendedMajor === Major.DKV && "Kreativitas dan jiwa senimu sangat tinggi. Dunia konten digital dan desain menunggumu."}
          {data.recommendedMajor === Major.LOGISTIK && "Kamu sangat terorganisir dan memiliki kemampuan analisis alur kerja yang baik. Ahli logistik masa depan!"}
        </p>
      </div>

      <div className="w-full text-left bg-gray-50 p-6 rounded-2xl space-y-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2">
          <Palette className="w-4 h-4" /> Status Mata
        </h4>
        <div className={`p-3 rounded-xl font-bold text-center ${data.isColorBlind ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
          {data.isColorBlind ? 'Terindikasi Buta Warna' : 'Tidak Buta Warna (Normal)'}
        </div>
        <p className="text-xs text-gray-500">
          *Hasil ini bersifat awal. Disarankan melakukan validasi dengan tim psikolog sekolah saat pendaftaran fisik.
        </p>
      </div>

      <button 
        onClick={onRestart}
        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition"
      >
        Ulangi Tes
      </button>

      <div className="flex gap-3 text-[10px] text-gray-400 uppercase font-bold tracking-widest">
        <span>SMK Tanjung Priok 1</span>
        <span>•</span>
        <span>BISA! HEBAT!</span>
      </div>
    </motion.div>
  );
}
