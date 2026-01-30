import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, dbUser } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  // Check if phone number is set (profile complete)
  // Allow access to profile page so user can complete it
  const isProfilePage = location.pathname === '/profile';
  const hasPhone = !!dbUser?.phone;

  if (!hasPhone && !isProfilePage) {
    // Redirect to profile to complete registration
    return <Navigate to="/profile" state={{ requirePhone: true }} replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
