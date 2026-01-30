import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { WalletProvider } from './context/WalletContext';
import { AchievementProvider } from './context/AchievementContext';
import { AuthProvider } from './context/AuthContext';
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
import Profile from './pages/Profile';
import MeetDevelopers from './pages/MeetDevelopers';

// Google OAuth Client ID - Replace with your own from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

// Full-screen pages that don't use the Layout
const fullScreenPages = ['/send', '/scan', '/receive', '/voucher', '/scam-lab', '/loan-center', '/bills', '/login', '/landing', '/profile'];

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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <WalletProvider>
          <AchievementProvider>
            <Router>
              <AppContent />
            </Router>
          </AchievementProvider>
        </WalletProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
