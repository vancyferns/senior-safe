import React, { useState, useEffect } from 'react';
import { Github, Linkedin, Mail, MapPin, Building, Calendar, Star, GitFork, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';

const developers = [
    {
        name: 'Vancy Fernandes',
        image: 'https://res.cloudinary.com/dkiu8wrxc/image/upload/v1769782518/vancy-im_yrrdpb.jpg',
        github: 'vancyferns',
        githubUrl: 'https://github.com/vancyferns',
        linkedin: 'https://www.linkedin.com/in/vancy-agnes-fernandes-3b6215278/',
        role: 'Full Stack Developer'
    },
    {
        name: 'Manesh Sharma',
        image: 'https://res.cloudinary.com/dkiu8wrxc/image/upload/v1769782502/manesh-im_baqgrl.jpg',
        github: 'manesh-sharma',
        githubUrl: 'https://github.com/manesh-sharma',
        linkedin: 'https://www.linkedin.com/in/maneshsharma/',
        role: 'Full Stack Developer'
    }
];

const DeveloperCard = ({ developer }) => {
    const [githubData, setGithubData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGithubData = async () => {
            try {
                const response = await fetch(`https://api.github.com/users/${developer.github}`);
                if (response.ok) {
                    const data = await response.json();
                    setGithubData(data);
                }
            } catch (error) {
                console.error('Error fetching GitHub data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGithubData();
    }, [developer.github]);

    return (
        <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Profile Image */}
                <div className="relative mb-4">
                    <img 
                        src={developer.image} 
                        alt={developer.name}
                        className="w-32 h-32 rounded-full object-cover shadow-xl border-4 border-blue-800"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Developer
                    </div>
                </div>

                {/* Name & Role */}
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{developer.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{developer.role}</p>

                {/* GitHub Stats */}
                {!loading && githubData && (
                    <div className="flex gap-4 mb-4">
                        <div className="text-center">
                            <p className="text-xl font-bold text-blue-800">{githubData.public_repos || 0}</p>
                            <p className="text-xs text-slate-600">Repos</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-blue-800">{githubData.followers || 0}</p>
                            <p className="text-xs text-slate-600">Followers</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-blue-800">{githubData.following || 0}</p>
                            <p className="text-xs text-slate-600">Following</p>
                        </div>
                    </div>
                )}

                {/* Bio */}
                {!loading && githubData?.bio && (
                    <p className="text-sm text-slate-700 mb-4 italic">"{githubData.bio}"</p>
                )}

                {/* Location & Company */}
                <div className="flex flex-col gap-2 mb-4 w-full">
                    {githubData?.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 justify-center">
                            <MapPin size={16} />
                            <span>{githubData.location}</span>
                        </div>
                    )}
                    {githubData?.company && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 justify-center">
                            <Building size={16} />
                            <span>{githubData.company}</span>
                        </div>
                    )}
                </div>

                {/* Social Links */}
                <div className="flex gap-3 w-full">
                    <a
                        href={developer.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                        <Github size={20} />
                        <span className="font-semibold">GitHub</span>
                    </a>
                    <a
                        href={developer.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                        <Linkedin size={20} />
                        <span className="font-semibold">LinkedIn</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

const MeetDevelopers = () => {
    return (
        <div className="space-y-6">
            {/* Header with glassmorphism */}
            <div className="relative overflow-hidden rounded-2xl p-8 text-center backdrop-blur-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-white/30 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-blue-900 mb-2">Meet the Developers</h1>
                    <p className="text-slate-700 font-medium">The team behind SeniorSafe</p>
                </div>
            </div>

            {/* About Project with glassmorphism */}
            <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/40 border border-white/60 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-900">
                        <span>💡</span> About SeniorSafe
                    </h2>
                    <p className="text-slate-700 leading-relaxed font-medium">
                        SeniorSafe is a digital payment learning platform designed specifically for senior citizens in India. 
                        We make learning UPI payments safe, fun, and accessible through gamification, scam awareness training, 
                        and a secure practice environment.
                    </p>
                </div>
            </div>

            {/* Developers */}
            <div className="space-y-6">
                {developers.map((dev, index) => (
                    <DeveloperCard key={index} developer={dev} />
                ))}
            </div>

            {/* Contact Section with glassmorphism */}
            <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Mail size={24} className="text-emerald-600" />
                        Get in Touch
                    </h2>
                    <p className="text-slate-700 font-medium">
                        Have questions, feedback, or suggestions? We'd love to hear from you! Connect with us through our social profiles above.
                    </p>
                </div>
            </div>

            {/* Footer with glassmorphism */}
            <div className="relative overflow-hidden rounded-2xl p-4 backdrop-blur-xl bg-white/30 border border-white/50 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5"></div>
                <div className="relative z-10 text-sm text-slate-700">
                    <p className="font-semibold">Built with ❤️ for senior citizens</p>
                    <p className="mt-1 text-slate-600">React • Vite • Tailwind CSS • Supabase • Gemini AI</p>
                </div>
            </div>
        </div>
    );
};

export default MeetDevelopers;
