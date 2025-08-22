import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/admin/dashboard");
        } catch (err) {
            setError("Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Floating orbs */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full animate-pulse"></div>
                <div className="absolute top-32 right-20 w-16 h-16 bg-amber-300/20 rounded-full animate-bounce animation-delay-300"></div>
                <div className="absolute bottom-20 left-32 w-24 h-24 bg-yellow-500/10 rounded-full animate-pulse animation-delay-700"></div>
                <div className="absolute bottom-40 right-16 w-12 h-12 bg-amber-400/30 rounded-full animate-bounce animation-delay-1000"></div>

                {/* Islamic geometric pattern overlay */}
                <div className="absolute inset-0 opacity-5">
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='30 0 60 30 30 60 0 30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundSize: '60px 60px'
                        }}
                    />
                </div>
            </div>

            {/* Main login container */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                    {/* Header with Islamic decoration */}
                    <div className="text-center mb-8">
                        {/* Decorative Islamic star */}
                        <div className="mx-auto mb-4 w-16 h-16 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full animate-spin"
                                style={{ animationDuration: '8s' }}></div>
                            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full relative">
                                    <div className="absolute inset-1 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-2">
                            Admin Login
                        </h2>

                        <p className="text-emerald-600 text-lg font-semibold">
                            Meeelad Program Dashboard
                        </p>

                        {/* Decorative line */}
                        <div className="mt-4 flex justify-center">
                            <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email field */}
                        <div className="relative group">
                            <input
                                type="email"
                                placeholder="Admin Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-700 placeholder-gray-500 hover:shadow-md focus:shadow-lg outline-none"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

                        {/* Password field */}
                        <div className="relative group">
                            <input
                                type="password"
                                placeholder="Admin Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-700 placeholder-gray-500 hover:shadow-md focus:shadow-lg outline-none"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Signing In...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="relative z-10">Login to Dashboard</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                                </>
                            )}
                        </button>

                        {/* Error message */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-shake">
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        )}
                    </form>

                    {/* Footer decoration */}
                    <div className="mt-8 text-center">
                        <div className="flex justify-center space-x-2 mb-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <p className="text-gray-600 text-sm">
                            May this blessed occasion bring peace and joy
                        </p>
                    </div>
                </div>

                {/* Additional floating decorations */}
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full opacity-70"
                    style={{
                        animation: 'float 6s ease-in-out infinite',
                        '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                            '50%': { transform: 'translateY(-10px) rotate(180deg)' }
                        }
                    }}></div>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-60"
                    style={{
                        animation: 'floatDelayed 8s ease-in-out infinite',
                        '@keyframes floatDelayed': {
                            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                            '50%': { transform: 'translateY(-15px) rotate(-180deg)' }
                        }
                    }}></div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                .animation-delay-300 {
                    animation-delay: 300ms;
                }
                .animation-delay-700 {
                    animation-delay: 700ms;
                }
                .animation-delay-1000 {
                    animation-delay: 1000ms;
                }
            `}</style>
        </div>
    );
};

export default AdminLogin;