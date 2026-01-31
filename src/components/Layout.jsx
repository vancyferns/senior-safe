import { useState } from 'react';
import { Home, History, ShieldAlert, Award, Menu, LogOut, X, User, Settings, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PropTypes from 'prop-types';

const NavItem = ({ to, icon: Icon, label, active }) => (
    <Link to={to} className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-300 ${active ? 'text-blue-800 bg-blue-100 shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        <span className={`text-[10px] font-semibold mt-0.5 ${active ? 'text-blue-800' : ''}`}>{label}</span>
    </Link>
);

NavItem.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    active: PropTypes.bool,
};

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        logout();
        setShowMenu(false);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-xl overflow-hidden border-x border-slate-200">
            {/* --- Top Bar --- */}
            <header className="bg-white px-3 py-2 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden shadow-md">
                        <img
                            src="https://res.cloudinary.com/dkiu8wrxc/image/upload/v1769780007/logo-senior-safe_stgvry.png"
                            alt="SeniorSafe Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-blue-800">SeniorSafe</h1>
                        {user?.givenName && (
                            <p className="text-xs text-slate-600">Hi, {user.givenName}! 👋</p>
                        )}
                    </div>
                </Link>
                <button
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-all duration-300"
                    aria-label="Menu"
                    onClick={() => setShowMenu(!showMenu)}
                >
                    {showMenu ? <X size={20} className="text-slate-700" /> : <Menu size={20} className="text-slate-700" />}
                </button>
            </header>

            {/* --- Dropdown Menu --- */}
            {showMenu && (
                <div className="absolute top-14 right-3 bg-white rounded-2xl shadow-xl border border-slate-200 z-20 min-w-48 overflow-hidden">
                    {user && (
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                    )}
                    <Link
                        to="/profile"
                        onClick={() => setShowMenu(false)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <Settings size={20} />
                        <span className="font-medium">Profile & Settings</span>
                    </Link>
                    <Link
                        to="/developers"
                        onClick={() => setShowMenu(false)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-slate-700 hover:bg-slate-100 transition-colors border-t border-slate-100"
                    >
                        <Users size={20} />
                        <span className="font-medium">Meet the Developers</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-4 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors border-t border-slate-200"
                    >
                        <LogOut size={20} />
                        <span className="font-semibold">Sign Out</span>
                    </button>
                </div>
            )}

            {/* --- Click outside to close menu --- */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                />
            )}

            {/* --- Main Content Area --- */}
            <main className="flex-1 overflow-y-auto p-3 pb-20">
                {children}
            </main>

            {/* --- Bottom Navigation --- */}
            <nav className="bg-white border-t border-slate-200 px-2 py-1.5 fixed bottom-0 w-full max-w-md flex justify-around items-center z-10 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <NavItem to="/" icon={Home} label={t('home')} active={location.pathname === '/'} />
                <NavItem to="/history" icon={History} label={t('history')} active={location.pathname === '/history'} />
                <NavItem to="/scam-lab" icon={ShieldAlert} label={t('scamLab')} active={location.pathname === '/scam-lab'} />
                <NavItem to="/achievements" icon={Award} label={t('rewards')} active={location.pathname === '/achievements'} />
            </nav>
        </div>
    );
};

Layout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Layout;
