import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { AchievementProvider } from './context/AchievementContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import ScanQR from './pages/ScanQR';
import TransactionHistory from './pages/TransactionHistory';
import SendVoucher from './pages/SendVoucher';
import ScamLab from './pages/ScamLab';
import LoanCenter from './pages/LoanCenter';
import EMIPayment from './pages/EMIPayment';
import Achievements from './pages/Achievements';

// Full-screen pages that don't use the Layout
const fullScreenPages = ['/send', '/scan', '/voucher', '/scam-lab', '/loan-center', '/bills'];

function AppContent() {
  const location = useLocation();
  const isFullScreen = fullScreenPages.includes(location.pathname);

  if (isFullScreen) {
    return (
      <Routes>
        <Route path="/send" element={<SendMoney />} />
        <Route path="/scan" element={<ScanQR />} />
        <Route path="/voucher" element={<SendVoucher />} />
        <Route path="/scam-lab" element={<ScamLab />} />
        <Route path="/loan-center" element={<LoanCenter />} />
        <Route path="/bills" element={<EMIPayment />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/achievements" element={<Achievements />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <WalletProvider>
      <AchievementProvider>
        <Router>
          <AppContent />
        </Router>
      </AchievementProvider>
    </WalletProvider>
  );
}

export default App;
