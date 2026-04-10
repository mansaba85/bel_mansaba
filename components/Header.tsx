import React from 'react';

declare const Swal: any;

interface HeaderProps {
    schoolName: string;
    onSchoolNameChange: (newName: string) => void;
    currentTime: Date;
    isAdmin: boolean;
    onAdminLogin: (password: string) => boolean;
    onAdminLogout: () => void;
    isConnected: boolean;
    onSync: () => void;
    view: 'dashboard' | 'settings';
    onViewChange: (view: 'dashboard' | 'settings') => void;
}

const Clock: React.FC<{ currentTime: Date }> = ({ currentTime }) => {
    const formatTime = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };
    
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    return (
        <div className="text-right flex-shrink-0">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-800">
                {formatTime(currentTime)}
            </div>
            <div className="text-sm text-slate-500 mt-1">
                {formatDate(currentTime)}
            </div>
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ schoolName, onSchoolNameChange, currentTime, isAdmin, onAdminLogin, onAdminLogout, isConnected, onSync, view, onViewChange }) => {
    
    const showLoginModal = async () => {
        await Swal.fire({
            title: 'Akses Pengaturan Admin',
            html: `
                <div style="position: relative; width: 100%; max-width: 260px; margin: 0 auto;">
                    <input id="swal-input-password" type="password" class="swal2-input" placeholder="Password" style="width: 100%; margin: 0; padding-right: 40px;">
                    <button type="button" id="toggle-password" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #64748b; padding: 5px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-eye" id="eye-icon"></i>
                    </button>
                </div>
            `,
            didOpen: () => {
                const toggleBtn = document.getElementById('toggle-password');
                const passwordInput = document.getElementById('swal-input-password') as HTMLInputElement;
                const eyeIcon = document.getElementById('eye-icon');
                
                if (toggleBtn && passwordInput && eyeIcon) {
                    toggleBtn.addEventListener('click', () => {
                        const isPassword = passwordInput.type === 'password';
                        passwordInput.type = isPassword ? 'text' : 'password';
                        eyeIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
                    });
                }
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Buka Akses',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
            allowOutsideClick: () => !Swal.isLoading(),
            preConfirm: () => {
                const passwordInput = document.getElementById('swal-input-password') as HTMLInputElement;
                const password = passwordInput.value;
                if (!password) {
                    Swal.showValidationMessage(`Password tidak boleh kosong`);
                    return false;
                }
                // onAdminLogin will show its own validation message on failure
                if (!onAdminLogin(password)) {
                    return false; // Prevent modal from closing on failure
                }
            }
        });
    };

    return (
        <header className="bg-white shadow-md border-b border-slate-200 sticky top-0 z-20 border-t-4 border-red-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
                <div className="flex items-center space-x-4 flex-grow min-w-0">
                    <i className="fa-solid fa-bell text-3xl text-red-600 flex-shrink-0"></i>
                    <div className="flex flex-col min-w-0">
                        <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => onSchoolNameChange(e.target.value)}
                            className={`text-xl sm:text-2xl font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full truncate placeholder:text-slate-400 ${!isAdmin && 'cursor-default'}`}
                            aria-label="School Name"
                            placeholder="Nama Sekolah Anda"
                            readOnly={!isAdmin}
                        />
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'}`}></div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                {isConnected ? 'Terhubung ke Database' : 'Mode Offline (Gagal Terhubung)'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-4 sm:space-x-6">
                    {isAdmin && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onViewChange(view === 'dashboard' ? 'settings' : 'dashboard')}
                                className={`flex items-center space-x-2 px-3 py-2 font-semibold rounded-lg transition-colors text-sm ${view === 'settings' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                aria-label={view === 'settings' ? 'Dashboard' : 'Pengaturan'}
                            >
                                <i className={`fa-solid ${view === 'settings' ? 'fa-chart-line' : 'fa-gears'} h-5 w-5`}></i>
                                <span className="hidden lg:inline">{view === 'settings' ? 'Dashboard' : 'Pengaturan'}</span>
                            </button>
                            <button
                                onClick={onSync}
                                className="flex items-center space-x-2 px-3 py-2 bg-amber-50 text-amber-600 font-semibold rounded-lg hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors text-sm"
                                aria-label="Sync Data"
                                title="Bersihkan Cache & Sinkronisasi"
                            >
                                <i className="fa-solid fa-sync h-5 w-5"></i>
                                <span className="hidden lg:inline">Sync Data</span>
                            </button>
                        </div>
                    )}
                    {isAdmin ? (
                        <button
                            onClick={onAdminLogout}
                            className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-sm"
                            aria-label="Logout"
                        >
                            <i className="fa-solid fa-right-from-bracket h-5 w-5"></i>
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    ) : (
                        <button
                            onClick={showLoginModal}
                            className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-sm"
                            aria-label="Pengaturan Admin"
                        >
                            <i className="fa-solid fa-cog h-5 w-5"></i>
                            <span className="hidden sm:inline">Pengaturan</span>
                        </button>
                    )}
                    <div className="hidden sm:block border-l border-slate-200 h-10"></div>
                    <Clock currentTime={currentTime} />
                </div>
            </div>
        </header>
    );
};