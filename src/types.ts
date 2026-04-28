
export enum Major {
  PEMESINAN_KAPAL = 'Pemesinan Kapal',
  TKR = 'Teknik Kendaraan Ringan',
  DKV = 'Desain Komunikasi Visual',
  LOGISTIK = 'Teknik Logistik'
}

export interface Question {
  id: string;
  text: string;
  options: {
    text: string;
    weight: Partial<Record<Major, number>>;
  }[];
}

export interface ColorTest {
  id: string;
  image: string; // Base64 or placeholder representing the pattern
  answer: string;
}

export interface UserData {
  name: string;
  previousSchool: string;
  gender: 'Laki-laki' | 'Perempuan';
  registrationDate: string;
  registrationNumber: string;
  address: string;
  birthDate: string;
}

export interface TestResult {
  scores: Record<Major, number>;
  isColorBlind: boolean;
  eyeHealthStatus: 'Normal' | 'Terindikasi Buta Warna' | 'Terindikasi Gangguan Penglihatan (Mata Minus/Silinder/Low Vision)';
  recommendedMajor: Major;
  userData: UserData;
}
