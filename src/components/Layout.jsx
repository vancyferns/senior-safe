import React from 'react';
import { Home, History, ShieldAlert, Award, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, label, active }) => (
    <Link to={to} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${active ? 'text-brand-blue bg-blue-50' : 'text-slate-500'}`}>
        <Icon size={28} strokeWidth={2} />
        <span className="text-xs font-semibold mt-1">{label}</span>
    </Link>
);

const Layout = ({ children }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-slate-200">
            {/* --- Top Bar --- */}
            <header className="bg-white p-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold text-xl cursor-default">
                        S
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">SeniorSafe</h1>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-full" aria-label="Menu">
                    <Menu size={24} className="text-slate-700" />
                </button>
            </header>

            {/* --- Main Content Area --- */}
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                {children}
            </main>

            {/* --- Bottom Navigation --- */}
            <nav className="bg-white border-t border-slate-200 p-2 fixed bottom-0 w-full max-w-md flex justify-around items-center z-10 pb-4">
                <NavItem to="/" icon={Home} label="Home" active={location.pathname === '/'} />
                <NavItem to="/history" icon={History} label="History" active={location.pathname === '/history'} />
                <NavItem to="/scam-lab" icon={ShieldAlert} label="Scam Lab" active={location.pathname === '/scam-lab'} />
                <NavItem to="/achievements" icon={Award} label="Rewards" active={location.pathname === '/achievements'} />
            </nav>
        </div>
    );
};

export default Layout;
