import React from 'react';

declare const Swal: any;

interface HeaderProps {
    schoolName: string;
    onSchoolNameChange: (newName: string) => void;
    currentTime: Date;
    isAdmin: boolean;
    onAdminLogin: (password: string) => boolean;
    onAdminLogout: () => void;
}

const Clock: React.FC<{ currentTime: Date }> = ({ currentTime }) => {
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\./g, ':');
    };
    
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return (
        <div className="text-right flex-shrink-0">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-800 tracking-wider">
                {formatTime(currentTime)}
            </div>
            <div className="text-sm text-slate-500 mt-1">
                {formatDate(currentTime)}
            </div>
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ schoolName, onSchoolNameChange, currentTime, isAdmin, onAdminLogin, onAdminLogout }) => {
    
    const showLoginModal = async () => {
        await Swal.fire({
            title: 'Akses Pengaturan Admin',
            html: `
                <input id="swal-input-password" type="password" class="swal2-input" placeholder="Password" value="admin123">
            `,
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
                    <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => onSchoolNameChange(e.target.value)}
                        className={`text-xl sm:text-2xl font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full truncate placeholder:text-slate-400 ${!isAdmin && 'cursor-default'}`}
                        aria-label="School Name"
                        placeholder="Nama Sekolah Anda"
                        readOnly={!isAdmin}
                    />
                </div>
                <div className="flex items-center space-x-4 sm:space-x-6">
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