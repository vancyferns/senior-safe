import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Shield, Smartphone, Users, Star } from 'lucide-react';

function Login() {
  const { handleGoogleSuccess, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onSuccess = (credentialResponse) => {
    const user = handleGoogleSuccess(credentialResponse);
    if (user) {
      navigate('/', { replace: true });
    }
  };

  const onError = () => {
    console.error('Google Sign-In failed');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-blue-800 text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-800 rounded-3xl mb-4 shadow-xl">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-blue-800 mb-2">SeniorSafe</h1>
        <p className="text-lg text-slate-600">Learn Digital Payments Safely</p>
      </div>

      {/* Features */}
      <div className="px-6 mb-8">
        <div className="bg-slate-100 rounded-3xl shadow-lg p-6 space-y-4 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 text-center mb-4">
            Why SeniorSafe?
          </h2>
          
          <div className="flex items-start gap-4 hover:bg-white p-3 rounded-2xl transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Smartphone className="w-6 h-6 text-blue-800" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Practice Safely</h3>
              <p className="text-slate-600 text-sm">
                Learn UPI payments with demo money - no real transactions
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 hover:bg-white p-3 rounded-2xl transition-all">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Spot Scams</h3>
              <p className="text-slate-600 text-sm">
                Train yourself to identify fraud with our Scam Lab
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 hover:bg-white p-3 rounded-2xl transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Star className="w-6 h-6 text-blue-800" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Earn Rewards</h3>
              <p className="text-slate-600 text-sm">
                Gain XP and unlock achievements as you learn
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 hover:bg-white p-3 rounded-2xl transition-all">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Senior Friendly</h3>
              <p className="text-slate-600 text-sm">
                Large text, simple navigation, and voice assistance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign In Section */}
      <div className="px-6 pb-8">
        <div className="bg-slate-100 rounded-3xl shadow-lg p-8 text-center border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Get Started
          </h2>
          <p className="text-slate-600 mb-6">
            Sign in with your Google account to begin your learning journey
          </p>

          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={onSuccess}
              onError={onError}
              size="large"
              shape="pill"
              text="continue_with"
              locale="en"
              useOneTap
            />
          </div>

          <p className="text-xs text-slate-600">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-sm text-slate-600">
          🔒 Your data is secure and never shared
        </p>
      </div>
    </div>
  );
}

export default Login;
