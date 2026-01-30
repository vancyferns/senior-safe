import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Landing = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, handleGoogleSuccess } = useAuth();
    const [showGetStarted, setShowGetStarted] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);
    const [isAppLoading, setIsAppLoading] = useState(true);

    // Simulate initial app loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAppLoading(false);
            setTimeout(() => setShowGetStarted(true), 300);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleGetStarted = () => {
        setShowSignIn(true);
    };

    const onGoogleSuccess = (credentialResponse) => {
        const user = handleGoogleSuccess(credentialResponse);
        if (user) {
            navigate('/', { replace: true });
        }
    };

    const onGoogleError = () => {
        console.error('Google Sign-In failed');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: '#1e3a5f' }}
        >
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
            
            {/* Decorative circles */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-32 right-10 w-48 h-48 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute top-1/3 right-20 w-24 h-24 bg-blue-400/10 rounded-full blur-lg"></div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center px-6 text-center">
                
                {/* Logo */}
                <div className={`mb-8 transition-all duration-700 ${isAppLoading ? 'scale-90 opacity-80' : 'scale-100 opacity-100'}`}>
                    <div className="w-36 h-36 rounded-3xl overflow-hidden shadow-2xl shadow-black/30 border-4 border-white/20 mx-auto">
                        <img 
                            src="https://res.cloudinary.com/dkiu8wrxc/image/upload/v1769780007/logo-senior-safe_stgvry.png"
                            alt="SeniorSafe Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* App Name */}
                <h1 className={`text-5xl font-bold text-white mb-3 tracking-tight transition-all duration-500 ${isAppLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                    style={{ textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                >
                    SeniorSafe
                </h1>
                
                <p className={`text-blue-200 text-lg mb-8 transition-all duration-500 delay-100 ${isAppLoading ? 'opacity-0' : 'opacity-100'}`}>
                    Learn Digital Payments Safely
                </p>

                {/* Loading Dots */}
                {isAppLoading && (
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                )}

                {/* Get Started Button */}
                {showGetStarted && !showSignIn && (
                    <button
                        onClick={handleGetStarted}
                        className="bg-white text-blue-900 font-bold text-xl px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-fade-in"
                        style={{
                            animation: 'fadeInUp 0.5s ease-out'
                        }}
                    >
                        Get Started
                    </button>
                )}

                {/* Google Sign In */}
                {showSignIn && (
                    <div className="animate-fade-in bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                        <p className="text-white text-lg mb-6 font-medium">Sign in to continue</p>
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={onGoogleSuccess}
                                onError={onGoogleError}
                                theme="filled_blue"
                                size="large"
                                shape="pill"
                                text="continue_with"
                            />
                        </div>
                        <button
                            onClick={() => setShowSignIn(false)}
                            className="mt-6 text-white/70 text-sm hover:text-white transition-colors"
                        >
                            ← Go back
                        </button>
                    </div>
                )}

                {/* Loading indicator when auth is processing */}
                {isLoading && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <p className="text-white/80">Signing you in...</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`absolute bottom-8 text-center transition-all duration-700 ${isAppLoading ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-white/50 text-sm">
                    Made with ❤️ for Seniors in India
                </p>
            </div>

            {/* Animation Keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fadeInUp 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Landing;
