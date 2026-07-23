import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, SchedulesData, Schedule } from './types';
import { DAYS_OF_WEEK, DEFAULT_SCHEDULES_DATA, API_URL } from './constants';
import { Header } from './components/Header';
import { ScheduleEditor } from './components/ScheduleEditor';
import * as XLSX from 'xlsx';

declare const Swal: any;

// Helper to get data from localStorage
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
};

// App Component
const App: React.FC = () => {
    const [schoolName, setSchoolName] = useState<string>('MA NU 01 Banyuputih');
    const [schedules, setSchedules] = useState<SchedulesData>(DEFAULT_SCHEDULES_DATA);
    const [activeScheduleCategory, setActiveScheduleCategory] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    
    const scheduleCategories = useMemo(() => Object.keys(schedules), [schedules]);

    const unlockAudio = useCallback(() => {
        // Play a silent sound to unlock the audio context
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
        audio.play().then(() => {
            setIsAudioUnlocked(true);
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            Toast.fire({ icon: 'success', title: 'Suara bel aktif' });
        }).catch(e => {
            console.error("Gagal mengaktifkan suara:", e);
        });
    }, []);

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const response = await fetch(`${API_URL}/data`, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    setSchoolName(data.schoolName);
                    setSchedules(data.schedules);
                    setIsConnected(true);
                    
                    const categories = Object.keys(data.schedules);
                    if (categories.length > 0) {
                        if (data.activeScheduleCategory && categories.includes(data.activeScheduleCategory)) {
                            setActiveScheduleCategory(data.activeScheduleCategory);
                        } else {
                            setActiveScheduleCategory(categories[0]);
                        }
                    }
                } else {
                    throw new Error(`Server merespon dengan status: ${response.status}`);
                }
            } catch (error) {
                console.error('Failed to fetch from backend:', error);
                setIsConnected(false);
                
                // Show error to user
                Swal.fire({
                    title: 'Koneksi Gagal',
                    text: 'Gagal terhubung ke server backend. Aplikasi berjalan dalam mode offline.',
                    icon: 'warning',
                    confirmButtonColor: '#dc2626'
                });

                // Fallback to localStorage if backend fails
                const savedSchool = getFromLocalStorage('schoolName', 'MA NU 01 Banyuputih');
                const savedSchedules = getFromLocalStorage('schedules', DEFAULT_SCHEDULES_DATA);
                setSchoolName(savedSchool);
                setSchedules(savedSchedules);
                
                const categories = Object.keys(savedSchedules);
                const savedCategory = getFromLocalStorage('activeScheduleCategory', categories[0]);
                setActiveScheduleCategory(categories.includes(savedCategory) ? savedCategory : categories[0]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastPlayedTime, setLastPlayedTime] = useState<string>('');
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    // Save to backend whenever state changes (with a small delay to avoid too many requests)
    useEffect(() => {
        if (isLoading) return;

        const saveData = async () => {
            try {
                await fetch(`${API_URL}/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ schoolName, activeScheduleCategory, schedules }),
                });
                // Also save to localStorage as backup
                window.localStorage.setItem('schoolName', JSON.stringify(schoolName));
                window.localStorage.setItem('schedules', JSON.stringify(schedules));
                window.localStorage.setItem('activeScheduleCategory', JSON.stringify(activeScheduleCategory));
            } catch (error) {
                console.error('Failed to save to backend:', error);
            }
        };

        const timeoutId = setTimeout(saveData, 1000);
        return () => clearTimeout(timeoutId);
    }, [schoolName, activeScheduleCategory, schedules, isLoading]);

    // Clock and Bell Ringing Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const now = currentTime;
        const dayIndex = (now.getDay() + 6) % 7; // Monday is 0
        const currentDayName = DAYS_OF_WEEK[dayIndex];
        const currentTimeString = now.toTimeString().substring(0, 5); // HH:mm

        if (!activeScheduleCategory || !schedules[activeScheduleCategory]) return;

        const todaySchedule = schedules[activeScheduleCategory]?.[currentDayName] || [];
        
        const bellToRing = todaySchedule.find(bell => bell.time === currentTimeString);

        if (bellToRing && currentTimeString !== lastPlayedTime) {
            setLastPlayedTime(currentTimeString); // Prevent re-triggering

            // Play the sound fully, detached from the notification
            if (bellToRing.sound) {
                console.log(`Ringing bell: ${bellToRing.name} at ${bellToRing.time}`);
                // If it's a relative path, prepend the backend domain (without /api)
                const soundUrl = bellToRing.sound.startsWith('data:') 
                    ? bellToRing.sound 
                    : `https://bel.manubanyuputih.id${bellToRing.sound}`;
                
                const audio = new Audio(soundUrl);
                audio.play().catch(e => console.error("Error playing sound:", e));
            }

            // Show a non-intrusive toast notification
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                didOpen: (toast: HTMLElement) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });

            Toast.fire({
                iconHtml: `<i class="fa-solid fa-bell fa-2x text-red-600"></i>`,
                title: `<span class="font-semibold text-lg">${`Saatnya ${bellToRing.name}`}</span>`,
                text: `Pukul ${bellToRing.time}`,
            });
        }
        
    }, [currentTime, activeScheduleCategory, schedules, lastPlayedTime]);


    const handleUpdateBell = (category: string, day: string, updatedBell: Bell) => {
        setSchedules(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [day]: (prev[category]?.[day] || []).map(b => b.id === updatedBell.id ? updatedBell : b),
            },
        }));
    };
    
    const handleAddBell = (category: string, day: string, newBell: Omit<Bell, 'id'>) => {
        const bellWithId = { ...newBell, id: Date.now().toString() };
        setSchedules(prev => {
            const daySchedule = prev[category]?.[day] || [];
            const updatedSchedule = [...daySchedule, bellWithId].sort((a, b) => a.time.localeCompare(b.time));
            return {
                ...prev,
                [category]: {
                    ...prev[category],
                    [day]: updatedSchedule,
                },
            };
        });
    };

    const handleDeleteBell = (category: string, day: string, bellId: string) => {
        setSchedules(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [day]: (prev[category]?.[day] || []).filter(b => b.id !== bellId),
            },
        }));
    };

    const handleDeleteMultipleBells = (category: string, day: string, bellIds: string[]) => {
        setSchedules(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [day]: (prev[category]?.[day] || []).filter(b => !bellIds.includes(b.id)),
            },
        }));
    };

    const handleCopySchedule = (fromDay: string, toDays: string[], category: string) => {
        const sourceSchedule = schedules[category]?.[fromDay] || [];
        setSchedules(prev => {
            const newSchedule = { ...prev[category] };
            toDays.forEach(day => {
                newSchedule[day] = [...sourceSchedule];
            });
            return { ...prev, [category]: newSchedule };
        });
    };

    const handleAddCategory = (newCategoryName: string) => {
        if (!newCategoryName.trim() || schedules[newCategoryName]) {
            Swal.fire({ title:'Gagal', text:'Nama kategori tidak valid atau sudah ada.', icon: 'error', confirmButtonColor: '#dc2626' });
            return;
        }
        const newEmptySchedule: Schedule = {};
        DAYS_OF_WEEK.forEach(day => { newEmptySchedule[day] = []; });
        
        setSchedules(prev => ({...prev, [newCategoryName]: newEmptySchedule }));
        
        Swal.fire({ title: 'Sukses', text: `Kategori "${newCategoryName}" berhasil ditambahkan.`, icon: 'success', confirmButtonColor: '#dc2626'});
    };

    const handleDeleteCategory = (categoryName: string) => {
        const categories = Object.keys(schedules);
        if (categories.length <= 1) {
            Swal.fire({ title: 'Gagal', text: 'Minimal harus ada satu kategori.', icon: 'error', confirmButtonColor: '#dc2626' });
            return;
        }
        
        setSchedules(prev => {
            const newSchedules = { ...prev };
            delete newSchedules[categoryName];
            return newSchedules;
        });
        
        if (activeScheduleCategory === categoryName) {
            const remainingCategories = categories.filter(c => c !== categoryName);
            setActiveScheduleCategory(remainingCategories[0]);
        }
        
        Swal.fire({ title: 'Sukses', text: `Kategori "${categoryName}" berhasil dihapus.`, icon: 'success', confirmButtonColor: '#dc2626' });
    };

    const handleAdminLogin = (password: string) => {
        // Mock authentication
        if (password === 'admin123') {
            setIsAdmin(true);
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            Toast.fire({ icon: 'success', title: 'Login berhasil!' });
            return true;
        }
        Swal.showValidationMessage('Password salah.');
        return false;
    };

    const handleAdminLogout = () => {
        setIsAdmin(false);
        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        Toast.fire({ icon: 'info', title: 'Anda telah logout.' });
    };

    const handleSync = () => {
        Swal.fire({
            title: 'Sinkronisasi Ulang?',
            text: 'Ini akan menghapus cache browser dan mengambil data terbaru dari database MySQL Anda.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Ya, Sinkronkan!',
            cancelButtonText: 'Batal'
        }).then((result: { isConfirmed: boolean }) => {
            if (result.isConfirmed) {
                // Clear local storage
                window.localStorage.removeItem('schedules');
                window.localStorage.removeItem('schoolName');
                window.localStorage.removeItem('activeScheduleCategory');
                
                // Reload page to force fresh fetch
                window.location.reload();
            }
        });
    };

    const handleBackup = () => {
        const data = { schoolName, schedules, activeScheduleCategory };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-bel-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.schoolName) setSchoolName(data.schoolName);
                if (data.schedules) setSchedules(data.schedules);
                if (data.activeScheduleCategory) setActiveScheduleCategory(data.activeScheduleCategory);
                
                Swal.fire({ title: 'Sukses', text: 'Data berhasil dipulihkan.', icon: 'success' });
            } catch (error) {
                Swal.fire({ title: 'Gagal', text: 'Format file tidak valid.', icon: 'error' });
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            { Kategori: 'Jadwal Normal', Hari: 'Senin', Nama: 'Upacara Bendera', Waktu: '07:00' },
            { Kategori: 'Jadwal Normal', Hari: 'Senin', Nama: 'Jam Pelajaran 1', Waktu: '07:30' },
            { Kategori: 'Jadwal Normal', Hari: 'Selasa', Nama: 'Masuk', Waktu: '07:00' },
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Jadwal");
        XLSX.writeFile(wb, "template-jadwal-bel.xlsx");
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                const newSchedules: SchedulesData = { ...schedules };

                jsonData.forEach((row: any) => {
                    const category = row.Kategori || 'Jadwal Baru';
                    const day = row.Hari || 'Senin';
                    const name = row.Nama || 'Tanpa Nama';
                    const time = row.Waktu || '00:00';

                    if (!newSchedules[category]) {
                        newSchedules[category] = {
                            "Senin": [], "Selasa": [], "Rabu": [], "Kamis": [], "Jumat": [], "Sabtu": [], "Minggu": []
                        };
                    }

                    if (!newSchedules[category][day]) {
                        newSchedules[category][day] = [];
                    }

                    newSchedules[category][day].push({
                        id: `imp-${Math.random().toString(36).substr(2, 9)}`,
                        name,
                        time,
                        sound: '',
                        soundName: 'Tidak ada suara'
                    });
                });

                setSchedules(newSchedules);
                Swal.fire({ 
                    title: 'Sukses', 
                    text: `${jsonData.length} jadwal berhasil diimpor. Jangan lupa klik Simpan di Dashboard untuk menyimpan ke database.`, 
                    icon: 'success' 
                });
            } catch (error) {
                console.error(error);
                Swal.fire({ title: 'Gagal', text: 'Gagal membaca file Excel.', icon: 'error' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
                    <p className="text-slate-600 font-medium">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-800">
            <Header
                schoolName={schoolName}
                onSchoolNameChange={setSchoolName}
                currentTime={currentTime}
                isAdmin={isAdmin}
                onAdminLogin={handleAdminLogin}
                onAdminLogout={handleAdminLogout}
                isConnected={isConnected}
                onSync={handleSync}
                view={view}
                onViewChange={setView}
                isAudioUnlocked={isAudioUnlocked}
                onUnlockAudio={unlockAudio}
            />
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {view === 'dashboard' ? (
                    <ScheduleEditor
                        schedules={schedules}
                        activeScheduleCategory={activeScheduleCategory}
                        setActiveScheduleCategory={setActiveScheduleCategory}
                        scheduleCategories={scheduleCategories}
                        onUpdateBell={handleUpdateBell}
                        onAddBell={handleAddBell}
                        onDeleteBell={handleDeleteBell}
                        onDeleteMultipleBells={handleDeleteMultipleBells}
                        onCopySchedule={handleCopySchedule}
                        onAddCategory={handleAddCategory}
                        onDeleteCategory={handleDeleteCategory}
                        currentTime={currentTime}
                        isAdmin={isAdmin}
                    />
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 animate-fade-in">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                                <i className="fa-solid fa-gears text-xl"></i>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
                                <p className="text-slate-500 text-sm">Kelola identitas sekolah dan cadangan data.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Identitas Sekolah</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label>
                                            <input 
                                                type="text" 
                                                value={schoolName} 
                                                onChange={(e) => setSchoolName(e.target.value)}
                                                className="form-input"
                                                placeholder="Masukkan nama sekolah..."
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Koneksi Database</h3>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {isConnected ? 'Terhubung ke MySQL' : 'Terputus dari MySQL'}
                                            </span>
                                        </div>
                                        <button onClick={handleSync} className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider">
                                            Sinkronkan Ulang
                                        </button>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Excel Import</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button 
                                            onClick={handleDownloadTemplate}
                                            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                                    <i className="fa-solid fa-file-excel"></i>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-slate-800">Unduh Template Excel</div>
                                                    <div className="text-xs text-slate-500">Gunakan format ini untuk import data</div>
                                                </div>
                                            </div>
                                            <i className="fa-solid fa-download text-slate-300"></i>
                                        </button>

                                        <label className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                    <i className="fa-solid fa-file-import"></i>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-slate-800">Import dari Excel</div>
                                                    <div className="text-xs text-slate-500">Unggah file Excel yang sudah diisi</div>
                                                </div>
                                            </div>
                                            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="sr-only" />
                                            <i className="fa-solid fa-chevron-right text-slate-300"></i>
                                        </label>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Backup & Restore</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button 
                                            onClick={handleBackup}
                                            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                    <i className="fa-solid fa-download"></i>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-slate-800">Backup Data (JSON)</div>
                                                    <div className="text-xs text-slate-500">Unduh semua jadwal ke file JSON</div>
                                                </div>
                                            </div>
                                            <i className="fa-solid fa-chevron-right text-slate-300"></i>
                                        </button>

                                        <label className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                                    <i className="fa-solid fa-upload"></i>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-slate-800">Restore Data (JSON)</div>
                                                    <div className="text-xs text-slate-500">Pulihkan data dari file backup</div>
                                                </div>
                                            </div>
                                            <input type="file" accept=".json" onChange={handleRestore} className="sr-only" />
                                            <i className="fa-solid fa-chevron-right text-slate-300"></i>
                                        </label>
                                    </div>
                                </section>

                                <section className="p-6 bg-red-50 rounded-2xl border border-red-100">
                                    <h3 className="text-sm font-bold text-red-800 mb-2">Pusat Bantuan</h3>
                                    <p className="text-xs text-red-600 leading-relaxed mb-4">
                                        Jika Anda mengalami kendala sinkronisasi atau data tidak muncul, pastikan backend Anda di aaPanel sudah berjalan dan CORS sudah diatur.
                                    </p>
                                    <button 
                                        onClick={() => setView('dashboard')}
                                        className="w-full py-2 bg-white text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                                    >
                                        Kembali ke Dashboard
                                    </button>
                                </section>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {!isAudioUnlocked && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/20">
                        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <i className="fa-solid fa-volume-high text-4xl animate-pulse"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sistem Bel Siap</h2>
                        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                            Browser memerlukan interaksi pengguna untuk mengaktifkan suara otomatis. Klik tombol di bawah untuk memulai.
                        </p>
                        <button 
                            onClick={unlockAudio}
                            className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3"
                        >
                            <i className="fa-solid fa-play"></i>
                            Aktifkan Sistem Bel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;