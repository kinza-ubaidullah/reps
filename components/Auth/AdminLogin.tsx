import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
    onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Fixed admin credentials
    const ADMIN_USERNAME = 'admin@anyreps';
    const ADMIN_PASSWORD = 'AnyReps@Admin2024!';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_login_time', Date.now().toString());
            onLogin();
        } else {
            setError('Invalid username or password');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-3xl border border-red-500/20 mb-6 shadow-lg shadow-red-500/10">
                        <Shield size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                    <p className="text-[#666] text-sm font-bold uppercase tracking-wider">
                        AnyReps Control Center
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="bg-[#111] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl animate-scale-in">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-400 text-sm font-bold">{error}</p>
                                <p className="text-red-400/60 text-xs mt-1">Please check your credentials and try again</p>
                            </div>
                        </div>
                    )}

                    {/* Username Field */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#666] uppercase tracking-wider">
                            Admin Username
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-[#666] group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:bg-[#0F0F0F] outline-none transition-all"
                                placeholder="admin@anyreps"
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#666] uppercase tracking-wider">
                            Admin Password
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-[#666] group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:bg-[#0F0F0F] outline-none transition-all"
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-primary to-primaryHover hover:from-primaryHover hover:to-primary text-black font-bold rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <Shield size={20} />
                                Login to Admin Panel
                            </>
                        )}
                    </button>

                    {/* Security Notice */}
                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-start gap-2 text-xs text-[#666]">
                            <Shield size={14} className="flex-shrink-0 mt-0.5" />
                            <p>
                                <span className="font-bold text-[#888]">Authorized personnel only.</span>
                                <br />
                                All access attempts are logged and monitored.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-[#444]">
                        AnyReps Admin Panel v1.0 • Secure Access
                    </p>
                </div>
            </div>
        </div>
    );
};
