import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function AdminDashboard() {
    const [answers, setAnswers] = useState([]);
    const [filteredAnswers, setFilteredAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState("");
    const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user || user.email !== "usthad@gmail.com") {
                navigate("/admin/login");
            } else {
                setLoading(false);
            }
        });

        let unsubscribeFirestore;
        if (!loading) {
            const q = query(collection(db, "answers"), orderBy("createdAt", "desc"));
            unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() // Convert Firestore timestamp to Date
                }));
                setAnswers(data);
            });
        }

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
        };
    }, [navigate, loading]);

    // Filter and sort answers
    useEffect(() => {
        let filtered = [...answers];

        // Filter by date
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(answer => {
                if (!answer.createdAt) return false;
                const answerDate = new Date(answer.createdAt);
                return answerDate.toDateString() === filterDate.toDateString();
            });
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(answer =>
                answer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                answer.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                answer.phoneNumber?.includes(searchTerm) ||
                answer.address?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort answers
        filtered.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return sortOrder === "newest"
                ? new Date(b.createdAt) - new Date(a.createdAt)
                : new Date(a.createdAt) - new Date(b.createdAt);
        });

        setFilteredAnswers(filtered);
    }, [answers, dateFilter, sortOrder, searchTerm]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/admin/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const formatDate = (date) => {
        if (!date) return "No date";
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const exportToCSV = () => {
        const csvContent = [
            ["Name", "Phone", "Address", "Answer", "Date"],
            ...filteredAnswers.map(ans => [
                ans.name || "",
                ans.phoneNumber || "",
                ans.address || "",
                ans.answer || "",
                formatDate(ans.createdAt)
            ])
        ].map(row => row.map(field => `"${field}"`).join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeelad_submissions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full animate-spin"
                            style={{ animationDuration: '2s' }}></div>
                        <div className="absolute inset-2 bg-white rounded-full"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-700">Checking authentication...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 p-4">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/10 rounded-full animate-pulse"></div>
                <div className="absolute top-32 right-20 w-16 h-16 bg-amber-300/10 rounded-full animate-bounce animation-delay-300"></div>
                <div className="absolute bottom-20 left-32 w-24 h-24 bg-yellow-500/5 rounded-full animate-pulse animation-delay-700"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center mb-4 lg:mb-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mr-4">
                                <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                                    Meeelad Admin Dashboard
                                </h1>
                                <p className="text-emerald-600 font-medium">Manage program submissions</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Search */}
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search by name, answer, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-700 placeholder-gray-500 outline-none"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

                        {/* Date Filter */}
                        <div className="relative group">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-700 outline-none"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

                        {/* Sort Order */}
                        <div className="relative group">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-700 outline-none"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded-2xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            Export CSV
                        </button>
                    </div>

                    {/* Clear Filters */}
                    {(dateFilter || searchTerm) && (
                        <div className="flex items-center justify-between">
                            <span className="text-emerald-700 font-medium">
                                Showing {filteredAnswers.length} of {answers.length} submissions
                            </span>
                            <button
                                onClick={() => {
                                    setDateFilter("");
                                    setSearchTerm("");
                                }}
                                className="text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Submissions List */}
                <div className="space-y-4">
                    {filteredAnswers.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-full"></div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-600 mb-2">No submissions found</h3>
                            <p className="text-gray-500">
                                {answers.length === 0
                                    ? "No submissions have been received yet."
                                    : "Try adjusting your filters to see more results."}
                            </p>
                        </div>
                    ) : (
                        filteredAnswers.map((submission, index) => (
                            <div
                                key={submission.id}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                                    <div className="flex items-center mb-3 lg:mb-0">
                                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                            {(submission.name || "U").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {submission.name || "Unknown User"}
                                            </h3>
                                            <p className="text-emerald-600 font-medium">
                                                {formatDate(submission.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                            #{index + 1}
                                        </span>
                                        {submission.createdAt && new Date(submission.createdAt).toDateString() === new Date().toDateString() && (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium animate-pulse">
                                                New Today
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                                    <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <label className="text-sm font-semibold text-gray-600 mb-1 block">Phone Number:</label>
                                            <p className="text-gray-800">{submission.phoneNumber || "Not provided"}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <label className="text-sm font-semibold text-gray-600 mb-1 block">Address:</label>
                                            <p className="text-gray-800">{submission.address || "Not provided"}</p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                                        <label className="text-sm font-semibold text-emerald-700 mb-2 block">Response/Answer:</label>
                                        <p className="text-gray-800 leading-relaxed">
                                            {submission.answer || "No answer provided"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <span className="text-white/80 font-medium ml-4">
                            Total Submissions: {answers.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
                .animation-delay-300 {
                    animation-delay: 300ms;
                }
                .animation-delay-700 {
                    animation-delay: 700ms;
                }
            `}</style>
        </div>
    );
}