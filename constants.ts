import { Bell } from './types';

export const API_URL = '/api';
export const BASE_URL = '';

export const getAudioUrl = (sound: string | undefined): string | null => {
    if (!sound) return null;
    if (sound.startsWith('http')) return sound;
    if (sound.startsWith('/uploads')) return `${BASE_URL}${sound}`;
    return sound; // fallback for base64
};

export const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const TUE_WED_THU_SCHEDULE: Bell[] = [
    { id: "t1", name: "Masuk", time: "07:00", sound: "", soundName: "Tidak ada suara" },
    { id: "t2", name: "Pembacaan Al Quran", time: "07:05", sound: "", soundName: "Tidak ada suara" },
    { id: "t3", name: "Jam 1", time: "07:30", sound: "", soundName: "Tidak ada suara" },
    { id: "t4", name: "Jam 2", time: "08:15", sound: "", soundName: "Tidak ada suara" },
    { id: "t5", name: "Jam 3", time: "09:00", sound: "", soundName: "Tidak ada suara" },
    { id: "t6", name: "Istirahat", time: "09:45", sound: "", soundName: "Tidak ada suara" },
    { id: "t7", name: "Istirahat kurang 5 menit", time: "10:10", sound: "", soundName: "Tidak ada suara" },
    { id: "t8", name: "Jam 4", time: "10:15", sound: "", soundName: "Tidak ada suara" },
    { id: "t9", name: "Jam 5", time: "11:00", sound: "", soundName: "Tidak ada suara" },
    { id: "t10", name: "Jam 6", time: "11:45", sound: "", soundName: "Tidak ada suara" },
    { id: "t11", name: "Jam 7", time: "12:30", sound: "", soundName: "Tidak ada suara" },
    { id: "t12", name: "Istirahat", time: "13:15", sound: "", soundName: "Tidak ada suara" },
    { id: "t13", name: "Istirahat kurang 5 menit", time: "13:40", sound: "", soundName: "Tidak ada suara" },
    { id: "t14", name: "Jam 8", time: "13:45", sound: "", soundName: "Tidak ada suara" },
    { id: "t15", name: "Jam 9", time: "14:30", sound: "", soundName: "Tidak ada suara" },
    { id: "t16", name: "Attention", time: "15:10", sound: "", soundName: "Tidak ada suara" },
    { id: "t17", name: "Pulang", time: "15:15", sound: "", soundName: "Tidak ada suara" },
];


export const DEFAULT_SCHEDULES_DATA = {
  "Jadwal Normal": {
    "Senin": [
        { id: "s1", name: "Upacara Bendera", time: "07:00", sound: "", soundName: "Tidak ada suara" },
        { id: "s2", name: "Jam Pelajaran 1", time: "07:30", sound: "", soundName: "Tidak ada suara" },
        { id: "s3", name: "Istirahat Pertama", time: "09:30", sound: "", soundName: "Tidak ada suara" },
        { id: "s4", name: "Jam Pelajaran 3", time: "10:00", sound: "", soundName: "Tidak ada suara" },
        { id: "s5", name: "Pulang Sekolah", time: "13:00", sound: "", soundName: "Tidak ada suara" },
    ],
    "Selasa": TUE_WED_THU_SCHEDULE, 
    "Rabu": TUE_WED_THU_SCHEDULE, 
    "Kamis": TUE_WED_THU_SCHEDULE, 
    "Jumat": [], 
    "Sabtu": [], 
    "Minggu": [],
  },
  "Jadwal Puasa": {
    "Senin": [
        { id: "p1", name: "Masuk Sekolah", time: "08:00", sound: "", soundName: "Tidak ada suara" },
        { id: "p2", name: "Istirahat", time: "10:00", sound: "", soundName: "Tidak ada suara" },
        { id: "p3", name: "Pulang Sekolah", time: "12:00", sound: "", soundName: "Tidak ada suara" },
    ],
    "Selasa": [], "Rabu": [], "Kamis": [], "Jumat": [], "Sabtu": [], "Minggu": [],
  }
};
