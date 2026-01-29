import { useState } from 'react';
import { Home, History, ShieldAlert, Award, Menu, LogOut, X, User, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const NavItem = ({ to, icon: Icon, label, active }) => (
    <Link to={to} className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 ${active ? 'text-blue-800 bg-blue-100 shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
        <Icon size={28} strokeWidth={active ? 2.5 : 2} />
        <span className={`text-xs font-semibold mt-1 ${active ? 'text-blue-800' : ''}`}>{label}</span>
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
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        logout();
        setShowMenu(false);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-xl overflow-hidden border-x border-slate-200">
            {/* --- Top Bar --- */}
            <header className="bg-white p-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
                <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center text-white font-bold text-xl cursor-pointer overflow-hidden shadow-lg">
                        {user?.picture ? (
                            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            'S'
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-blue-800">SeniorSafe</h1>
                        {user?.givenName && (
                            <p className="text-sm text-slate-600">Hi, {user.givenName}! 👋</p>
                        )}
                    </div>
                </Link>
                <button 
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-300" 
                    aria-label="Menu"
                    onClick={() => setShowMenu(!showMenu)}
                >
                    {showMenu ? <X size={24} className="text-slate-700" /> : <Menu size={24} className="text-slate-700" />}
                </button>
            </header>

            {/* --- Dropdown Menu --- */}
            {showMenu && (
                <div className="absolute top-20 right-4 bg-white rounded-2xl shadow-xl border border-slate-200 z-20 min-w-52 overflow-hidden">
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
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                {children}
            </main>

            {/* --- Bottom Navigation --- */}
            <nav className="bg-white border-t-2 border-slate-200 p-2 fixed bottom-0 w-full max-w-md flex justify-around items-center z-10 pb-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <NavItem to="/" icon={Home} label="Home" active={location.pathname === '/'} />
                <NavItem to="/history" icon={History} label="History" active={location.pathname === '/history'} />
                <NavItem to="/scam-lab" icon={ShieldAlert} label="Scam Lab" active={location.pathname === '/scam-lab'} />
                <NavItem to="/achievements" icon={Award} label="Rewards" active={location.pathname === '/achievements'} />
            </nav>
        </div>
    );
};

Layout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Layout;
