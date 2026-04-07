import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, SchedulesData } from '../types';
import { DAYS_OF_WEEK, API_URL, BASE_URL, getAudioUrl } from '../constants';

declare const Swal: any;

interface ScheduleEditorProps {
    schedules: SchedulesData;
    activeScheduleCategory: string;
    setActiveScheduleCategory: React.Dispatch<React.SetStateAction<string>>;
    scheduleCategories: string[];
    onUpdateBell: (category: string, day: string, bell: Bell) => void;
    onAddBell: (category: string, day: string, bell: Omit<Bell, 'id'>) => void;
    onDeleteBell: (category: string, day: string, bellId: string) => void;
    onCopySchedule: (fromDay: string, toDays: string[], category: string) => void;
    onAddCategory: (newCategoryName: string) => void;
    currentTime: Date;
    isAdmin: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const uploadAudio = async (file: File): Promise<{ url: string, filename: string }> => {
    const formData = new FormData();
    formData.append('audio', file);
    
    const response = await fetch(`${API_URL}/upload-audio`, {
        method: 'POST',
        body: formData,
    });
    
    if (!response.ok) {
        throw new Error('Gagal mengunggah file audio');
    }
    
    return response.json();
};

const EditBellModal: React.FC<{
    bell: Bell;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedBell: Bell) => void;
}> = ({ bell, isOpen, onClose, onSave }) => {
    const [editState, setEditState] = useState<Bell>(bell);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setEditState(bell);
        }
    }, [isOpen, bell]);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire({ title: 'Gagal', text: 'Ukuran file tidak boleh melebihi 10MB.', icon: 'error', confirmButtonColor: '#dc2626' });
                return;
            }
            try {
                Swal.fire({
                    title: 'Mengunggah...',
                    text: 'Mohon tunggu sebentar',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                const result = await uploadAudio(file);
                setEditState({ ...editState, sound: result.url, soundName: result.filename });
                Swal.close();
            } catch (error) {
                Swal.fire({ title: 'Gagal', text: 'Gagal mengunggah file audio.', icon: 'error', confirmButtonColor: '#dc2626' });
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scale-up">
                <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <i className="fa-solid fa-pencil text-sm"></i>
                        Edit Bel
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Bel</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <i className="fa-solid fa-bell text-slate-400"></i>
                            </div>
                            <input 
                                type="text" 
                                value={editState.name} 
                                onChange={e => setEditState({...editState, name: e.target.value})} 
                                className="form-input pl-10 h-11" 
                                placeholder="Nama Bel"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Waktu (Jam:Menit)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <i className="fa-solid fa-clock text-slate-400"></i>
                            </div>
                            <input 
                                type="time" 
                                value={editState.time} 
                                onChange={e => setEditState({...editState, time: e.target.value})} 
                                className="form-input pl-10 h-11" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">File Audio</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="flex-grow text-left px-4 h-11 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors truncate flex items-center gap-2 shadow-sm"
                            >
                                <i className="fa-solid fa-file-audio text-slate-400"></i>
                                <span className="truncate">{editState.soundName || 'Pilih Audio'}</span>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".mp3,.wav,.ogg" className="sr-only" />
                            {editState.sound && (
                                <button 
                                    onClick={() => setEditState({ ...editState, sound: '', soundName: 'Tidak ada suara' })}
                                    className="px-3 h-11 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Hapus suara"
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={() => onSave(editState)} 
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-200"
                    >
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};

const BellRow: React.FC<{
    bell: Bell;
    onEdit: () => void;
    onDelete: (bellId: string) => void;
    isAdmin: boolean;
}> = ({ bell, onEdit, onDelete, isAdmin }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleStopSound = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsPlaying(false);
    };

    const handlePlaySound = () => {
        const audioUrl = getAudioUrl(bell.sound);
        if (!audioUrl) return;
        if (audioRef.current) handleStopSound();

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        setIsPlaying(true);
        audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
        audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
        audio.play().catch(() => { setIsPlaying(false); audioRef.current = null; });
    };

    const confirmDelete = () => {
        Swal.fire({
            title: 'Anda yakin?',
            text: `Hapus bel "${bell.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result: { isConfirmed: boolean }) => {
            if (result.isConfirmed) onDelete(bell.id);
        });
    };

    return (
        <div className={`grid ${isAdmin ? 'grid-cols-[2fr_0.8fr_1.5fr_0.5fr_1fr]' : 'grid-cols-[2fr_0.8fr_1.5fr_0.5fr]'} gap-4 items-center px-3 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80 rounded-lg transition-colors`}>
            <span className="font-semibold text-slate-800 truncate">{bell.name}</span>
            <span className="font-mono text-slate-600 text-sm bg-slate-100 px-2 py-0.5 rounded flex justify-center">{bell.time}</span>
            <span className="text-slate-500 text-xs truncate italic">{bell.soundName || 'Hening'}</span>
            <div className="flex justify-center">
                {bell.sound && (
                     <button 
                        onClick={isPlaying ? handleStopSound : handlePlaySound}
                        className={`p-2 w-8 h-8 flex items-center justify-center rounded-full transition shadow-sm
                            ${isPlaying ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600'}`}
                    >
                        <i className={`fa-solid ${isPlaying ? 'fa-stop' : 'fa-play'} text-[10px]`}></i>
                    </button>
                )}
            </div>
            {isAdmin && (
                <div className="flex items-center space-x-1 justify-end">
                    <button onClick={onEdit} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        <i className="fa-solid fa-pencil text-sm"></i>
                    </button>
                    <button onClick={confirmDelete} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                        <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

const BellTable: React.FC<{
    bells: Bell[];
    onEditBell: (bell: Bell) => void;
    onDelete: (bellId: string) => void;
    isAdmin: boolean;
}> = ({ bells, onEditBell, onDelete, isAdmin }) => (
    <div className="space-y-1">
        <div className={`grid ${isAdmin ? 'grid-cols-[2fr_0.8fr_1.5fr_0.5fr_1fr]' : 'grid-cols-[2fr_0.8fr_1.5fr_0.5fr]'} gap-4 px-3 py-2 bg-slate-100/50 rounded-t-lg border-b border-slate-200`}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Bel</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Waktu</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suara</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Cek</span>
            {isAdmin && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</span>}
        </div>
        {bells.map(bell => (
            <BellRow
                key={bell.id}
                bell={bell}
                onEdit={() => onEditBell(bell)}
                onDelete={onDelete}
                isAdmin={isAdmin}
            />
        ))}
    </div>
);

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
    schedules,
    activeScheduleCategory,
    setActiveScheduleCategory,
    scheduleCategories,
    onUpdateBell,
    onAddBell,
    onDeleteBell,
    onCopySchedule,
    onAddCategory,
    currentTime,
    isAdmin,
}) => {
    const todayIndex = (currentTime.getDay() + 6) % 7;
    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[todayIndex]);
    const [bellToEdit, setBellToEdit] = useState<Bell | null>(null);
    
    // Logic for "Apply" button
    const [pendingCategory, setPendingCategory] = useState(activeScheduleCategory);
    const isCategoryChanged = pendingCategory !== activeScheduleCategory;

    useEffect(() => {
        setPendingCategory(activeScheduleCategory);
    }, [activeScheduleCategory]);

    const handleApplySchedule = () => {
        setActiveScheduleCategory(pendingCategory);
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'success',
            title: `Jadwal "${pendingCategory}" telah diterapkan.`
        });
    };

    const [newBellName, setNewBellName] = useState('');
    const [newBellTime, setNewBellTime] = useState('07:00');
    const [newBellSound, setNewBellSound] = useState('');
    const [newBellSoundName, setNewBellSoundName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeSchedule = (schedules[activeScheduleCategory]?.[selectedDay] || []).sort((a, b) => a.time.localeCompare(b.time));

    useEffect(() => {
        setSelectedDay(DAYS_OF_WEEK[todayIndex]);
    }, [activeScheduleCategory, todayIndex]);

    const handleNewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             if (file.size > 10 * 1024 * 1024) {
                Swal.fire({title: 'Gagal', text: 'Ukuran file tidak boleh melebihi 10MB.', icon: 'error', confirmButtonColor: '#dc2626'});
                return;
            }
            try {
                Swal.fire({
                    title: 'Mengunggah...',
                    text: 'Mohon tunggu sebentar',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                const result = await uploadAudio(file);
                setNewBellSound(result.url);
                setNewBellSoundName(result.filename);
                Swal.close();
            } catch (error) {
                Swal.fire({title: 'Gagal', text: 'Gagal mengunggah file audio.', icon: 'error', confirmButtonColor: '#dc2626'});
            }
        }
    };

    const handleAddBellSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBellName.trim() || !newBellTime) return;
        onAddBell(activeScheduleCategory, selectedDay, {
            name: newBellName,
            time: newBellTime,
            sound: newBellSound,
            soundName: newBellSoundName || 'Tidak ada suara',
        });
        setNewBellName(''); setNewBellTime('07:00'); setNewBellSound(''); setNewBellSoundName('');
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const showAddCategoryModal = () => {
        Swal.fire({
            title: 'Kategori Baru',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Tambah',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
            inputValidator: (value: string) => {
                if (!value?.trim()) return 'Nama tidak boleh kosong!';
                if (scheduleCategories.includes(value.trim())) return 'Nama sudah digunakan!';
            }
        }).then((result: {value: string}) => {
            if (result.value) onAddCategory(result.value.trim());
        });
    };

    const showCopyModal = () => {
        const daysToCopyTo = DAYS_OF_WEEK.filter(d => d !== selectedDay);
        let selectedCheckboxes: string[] = [];
        Swal.fire({
            title: `Salin Jadwal ${selectedDay}`,
            html: `<div id="swal-checkbox-container" class="grid grid-cols-2 gap-2 text-left p-2">
                ${daysToCopyTo.map(day => `<label class="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer">
                    <input type="checkbox" value="${day}" class="h-4 w-4 text-red-600">
                    <span class="text-sm">${day}</span>
                </label>`).join('')}
            </div>`,
            showCancelButton: true,
            confirmButtonText: 'Salin',
            confirmButtonColor: '#dc2626',
            didOpen: () => {
                document.getElementById('swal-checkbox-container')?.addEventListener('change', (e) => {
                    const target = e.target as HTMLInputElement;
                    if(target.checked) selectedCheckboxes.push(target.value);
                    else selectedCheckboxes = selectedCheckboxes.filter(v => v !== target.value);
                });
            },
            preConfirm: () => selectedCheckboxes.length > 0 ? selectedCheckboxes : Swal.showValidationMessage('Pilih hari tujuan!')
        }).then((result: {value: string[]}) => {
            if (result.value) onCopySchedule(selectedDay, result.value, activeScheduleCategory);
        });
    };

    const midpoint = Math.ceil(activeSchedule.length / 2);
    const leftColumnBells = activeSchedule.slice(0, midpoint);
    const rightColumnBells = activeSchedule.slice(midpoint);

    return (
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-slate-200">
            <EditBellModal 
                isOpen={!!bellToEdit} 
                bell={bellToEdit || ({} as Bell)} 
                onClose={() => setBellToEdit(null)}
                onSave={(updatedBell) => {
                    onUpdateBell(activeScheduleCategory, selectedDay, updatedBell);
                    setBellToEdit(null);
                }}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fa-solid fa-calendar-check text-red-600"></i>
                        Pilih Jadwal Aktif
                    </h1>
                    <p className="text-slate-500 mt-1 text-xs">Pilih kategori jadwal yang akan dijalankan oleh sistem bel hari ini.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <select
                            value={pendingCategory}
                            onChange={e => setPendingCategory(e.target.value)}
                            className={`form-input w-full sm:min-w-[200px] font-bold transition-all ${isCategoryChanged ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-300'}`}
                        >
                            {scheduleCategories.length > 0 ? (
                                scheduleCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                            ) : (
                                <option value="">Tidak ada kategori</option>
                            )}
                        </select>
                        {!isCategoryChanged && (
                            <div className="absolute -right-2 -top-2 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-100 transition-transform">
                                <i className="fa-solid fa-check text-[10px]"></i>
                            </div>
                        )}
                    </div>

                    {isCategoryChanged && (
                         <button 
                            onClick={handleApplySchedule}
                            className="flex-shrink-0 flex items-center justify-center px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-all shadow-md shadow-amber-200 animate-pulse active:scale-95"
                        >
                            <i className="fa-solid fa-play mr-2 text-xs"></i>
                            Terapkan
                        </button>
                    )}

                    {isAdmin && (
                         <button onClick={showAddCategoryModal} className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-white border border-slate-300 shadow-sm text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors" title="Tambah Kategori">
                            <i className="fa-solid fa-plus"></i>
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <div className="border-b border-slate-200 mb-4 overflow-x-auto no-scrollbar">
                    <nav className="-mb-px flex space-x-2 sm:space-x-6 min-w-max">
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`whitespace-nowrap py-3 px-3 border-b-2 font-bold text-sm transition-all
                                    ${selectedDay === day 
                                        ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-lg' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }
                                    ${DAYS_OF_WEEK[todayIndex] === day ? 'relative after:content-[""] after:absolute after:top-1 after:right-1 after:w-2 after:h-2 after:bg-red-500 after:rounded-full' : ''}
                                `}
                            >
                                {day}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="bg-slate-50/30 rounded-xl border border-slate-100 p-2 sm:p-4">
                    {isAdmin && activeSchedule.length > 0 && (
                        <div className="flex justify-end mb-2">
                            <button onClick={showCopyModal} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-xs shadow-sm">
                                <i className="fa-solid fa-copy text-red-500"></i>
                                Salin Jadwal {selectedDay}
                            </button>
                        </div>
                    )}
                    
                    {activeSchedule.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
                            <div>
                                <BellTable bells={leftColumnBells} onEditBell={setBellToEdit} onDelete={(id) => onDeleteBell(activeScheduleCategory, selectedDay, id)} isAdmin={isAdmin}/>
                            </div>
                            <div>
                                {rightColumnBells.length > 0 && <BellTable bells={rightColumnBells} onEditBell={setBellToEdit} onDelete={(id) => onDeleteBell(activeScheduleCategory, selectedDay, id)} isAdmin={isAdmin} />}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-calendar-day text-4xl text-slate-200 mb-3"></i>
                            <h3 className="font-semibold text-slate-500">Belum ada jadwal untuk hari {selectedDay}</h3>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="mt-8 border-t border-slate-100 pt-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                                    <i className="fa-solid fa-plus text-xs"></i>
                                </span>
                                Tambah Bel Baru
                            </h2>
                            <form onSubmit={handleAddBellSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Aktivitas</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <i className="fa-solid fa-bell text-slate-300"></i>
                                        </div>
                                        <input type="text" value={newBellName} onChange={e => setNewBellName(e.target.value)} placeholder="Misal: Bel Masuk" required className="form-input pl-10" />
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Waktu</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <i className="fa-solid fa-clock text-slate-300"></i>
                                        </div>
                                        <input type="time" value={newBellTime} onChange={e => setNewBellTime(e.target.value)} required className="form-input pl-10"/>
                                    </div>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Audio (Opsional)</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-grow text-left px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors truncate flex items-center gap-2 shadow-sm h-10">
                                            <i className="fa-solid fa-file-audio text-slate-300"></i>
                                            <span className="truncate">{newBellSoundName || 'Pilih File'}</span>
                                        </button>
                                        <button type="submit" className="flex-shrink-0 w-12 h-10 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95">
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleNewFileChange} accept=".mp3,.wav,.ogg" className="sr-only"/>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
      </div>
    );
};