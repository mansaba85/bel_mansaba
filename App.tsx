import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, SchedulesData, Schedule } from './types';
import { DAYS_OF_WEEK, DEFAULT_SCHEDULES_DATA } from './constants';
import { Header } from './components/Header';
import { ScheduleEditor } from './components/ScheduleEditor';

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

const App: React.FC = () => {
    const [schoolName, setSchoolName] = useState<string>(() => getFromLocalStorage('schoolName', 'MA NU 01 Banyuputih'));
    const [schedules, setSchedules] = useState<SchedulesData>(() => getFromLocalStorage('schedules', DEFAULT_SCHEDULES_DATA));
    
    const scheduleCategories = useMemo(() => Object.keys(schedules), [schedules]);

    const [activeScheduleCategory, setActiveScheduleCategory] = useState<string>(() => {
        const savedCategory = getFromLocalStorage('activeScheduleCategory', scheduleCategories[0]);
        // Ensure the saved category still exists in the available categories
        return scheduleCategories.includes(savedCategory) ? savedCategory : scheduleCategories[0];
    });
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastPlayedTime, setLastPlayedTime] = useState<string>('');
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    // Save to localStorage whenever state changes
    useEffect(() => {
        window.localStorage.setItem('schoolName', JSON.stringify(schoolName));
    }, [schoolName]);

    useEffect(() => {
        window.localStorage.setItem('schedules', JSON.stringify(schedules));
    }, [schedules]);

    useEffect(() => {
        window.localStorage.setItem('activeScheduleCategory', JSON.stringify(activeScheduleCategory));
    }, [activeScheduleCategory]);

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
                const audio = new Audio(bellToRing.sound);
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

    return (
        <div className="min-h-screen text-slate-800">
            <Header
                schoolName={schoolName}
                onSchoolNameChange={setSchoolName}
                currentTime={currentTime}
                isAdmin={isAdmin}
                onAdminLogin={handleAdminLogin}
                onAdminLogout={handleAdminLogout}
            />
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <ScheduleEditor
                    schedules={schedules}
                    activeScheduleCategory={activeScheduleCategory}
                    setActiveScheduleCategory={setActiveScheduleCategory}
                    scheduleCategories={scheduleCategories}
                    onUpdateBell={handleUpdateBell}
                    onAddBell={handleAddBell}
                    onDeleteBell={handleDeleteBell}
                    onCopySchedule={handleCopySchedule}
                    onAddCategory={handleAddCategory}
                    currentTime={currentTime}
                    isAdmin={isAdmin}
                />
            </main>
        </div>
    );
};

export default App;