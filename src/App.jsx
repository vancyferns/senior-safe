import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { AchievementProvider } from './context/AchievementContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import ScanQR from './pages/ScanQR';
import ReceiveMoney from './pages/ReceiveMoney';
import TransactionHistory from './pages/TransactionHistory';
import SendVoucher from './pages/SendVoucher';
import ScamLab from './pages/ScamLab';
import LoanCenter from './pages/LoanCenter';
import EMIPayment from './pages/EMIPayment';
import Achievements from './pages/Achievements';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Profile from './pages/Profile';
import MeetDevelopers from './pages/MeetDevelopers';

// Full-screen pages that don't use the Layout
const fullScreenPages = ['/send', '/scan', '/receive', '/voucher', '/scam-lab', '/loan-center', '/bills', '/login', '/landing', '/profile', '/auth', '/account'];

function AppContent() {
  const location = useLocation();
  const isFullScreen = fullScreenPages.includes(location.pathname);

  // Landing page doesn't need protection
  if (location.pathname === '/landing') {
    return (
      <Routes>
        <Route path="/landing" element={<Landing />} />
      </Routes>
    );
  }

  // Neon auth home page doesn't need protection
  if (location.pathname === '/home') {
    return (
      <Routes>
        <Route path="/home" element={<Home />} />
      </Routes>
    );
  }

  if (location.pathname.startsWith('/auth')) {
    return (
      <Routes>
        <Route path="/auth/:path?" element={<Auth />} />
      </Routes>
    );
  }

  if (location.pathname.startsWith('/account')) {
    return (
      <Routes>
        <Route path="/account/:path?" element={<Account />} />
      </Routes>
    );
  }

  // Login page doesn't need protection
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  if (isFullScreen) {
    return (
      <ProtectedRoute>
        <Routes>
          <Route path="/send" element={<SendMoney />} />
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/receive" element={<ReceiveMoney />} />
          <Route path="/voucher" element={<SendVoucher />} />
          <Route path="/scam-lab" element={<ScamLab />} />
          <Route path="/loan-center" element={<LoanCenter />} />
          <Route path="/bills" element={<EMIPayment />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<TransactionHistory />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/developers" element={<MeetDevelopers />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <WalletProvider>
          <AchievementProvider>
            <Router>
              <AppContent />
            </Router>
          </AchievementProvider>
        </WalletProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
