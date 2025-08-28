import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs, updateDoc, where } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Eye, Plus, Trophy, Download, Search, Calendar, LogOut, X, Save } from "lucide-react";

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = (path) => {
        // Simple navigation replacement - you can implement routing logic here
        window.location.href = path;
    };
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [newQuestion, setNewQuestion] = useState("");
    const [user, setUser] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [newOptions, setNewOptions] = useState(["", "", "", ""]);
    const [correctAnswer, setCorrectAnswer] = useState("");

    // Authentication check
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && currentUser.email === "usthad@gmail.com") {
                setUser(currentUser);
                setLoading(false);
            } else {
                navigate("/admin/login");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    // Fetch submissions
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                submittedAt: doc.data().submittedAt?.toDate(),
            }));
            setSubmissions(data);
        });

        return () => unsubscribe();
    }, [user]);

    // Filter and sort submissions
    useEffect(() => {
        let filtered = [...submissions];

        // Date filter
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(submission => {
                if (!submission.submittedAt) return false;
                const submissionDate = new Date(submission.submittedAt);
                return submissionDate.toDateString() === filterDate.toDateString();
            });
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(submission =>
                submission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                submission.number?.includes(searchTerm) ||
                submission.place?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            if (!a.submittedAt || !b.submittedAt) return 0;
            return sortOrder === "newest"
                ? new Date(b.submittedAt) - new Date(a.submittedAt)
                : new Date(a.submittedAt) - new Date(b.submittedAt);
        });

        setFilteredSubmissions(filtered);
    }, [submissions, dateFilter, sortOrder, searchTerm]);

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

    const handleAddQuestion = async () => {
        if (!newQuestion.trim() || newOptions.some(opt => !opt.trim()) || !correctAnswer) {
            alert("Please fill all fields and select the correct answer.");
            return;
        }

        try {
            await addDoc(collection(db, "questions"), {
                questionText: newQuestion,
                options: newOptions.filter(opt => opt.trim()),
                correctAnswer,
                createdAt: serverTimestamp(),
                isActive: true,
            });

            // Reset form
            setNewQuestion("");
            setNewOptions(["", "", "", ""]);
            setCorrectAnswer("");
            setShowAddModal(false);
            alert("Question added successfully!");
        } catch (err) {
            console.error("Error adding question:", err);
            alert("Failed to add question.");
        }
    };

    const exportToCSV = () => {
        const csvContent = [
            ["Name", "Email", "Phone", "Place", "Questions Answered", "Total Questions", "Score", "Date"],
            ...filteredSubmissions.map(sub => [
                sub.name || "",
                sub.email || "",
                sub.number || "",
                sub.place || "",
                sub.answeredQuestions || sub.answers?.length || 0,
                sub.totalQuestions || 0,
                `${sub.answers?.filter(a => a.isCorrect).length || 0}/${sub.answers?.length || 0}`,
                formatDate(sub.submittedAt)
            ])
        ].map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `islamic_quiz_submissions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const calculateScore = (answers) => {
        if (!answers || !Array.isArray(answers)) return { correct: 0, total: 0 };
        const correct = answers.filter(a => a.isCorrect).length;
        return { correct, total: answers.length };
    };

    const viewDetails = (submission) => {
        setSelectedSubmission(submission);
        setShowDetailModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                                Islamic Quiz Admin
                            </h1>
                            <p className="text-emerald-600 font-medium">Manage quiz submissions and questions</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300"
                            >
                                <Plus className="w-4 h-4" />
                                Add Question
                            </button>

                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-colors"
                            />
                        </div>

                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-colors"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>

                    {(dateFilter || searchTerm) && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <span className="text-emerald-700 font-medium">
                                Showing {filteredSubmissions.length} of {submissions.length} submissions
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

                {/* Submissions Grid */}
                <div className="grid gap-4">
                    {filteredSubmissions.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                                <Search className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-600 mb-2">No submissions found</h3>
                            <p className="text-gray-500">
                                {submissions.length === 0
                                    ? "No submissions have been received yet."
                                    : "Try adjusting your filters to see more results."}
                            </p>
                        </div>
                    ) : (
                        filteredSubmissions.map((submission, index) => {
                            const score = calculateScore(submission.answers);
                            const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

                            return (
                                <div
                                    key={submission.id}
                                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {(submission.name || "U").charAt(0).toUpperCase()}
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {submission.name || "Unknown User"}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-1">
                                                    <span>{submission.email}</span>
                                                    <span>{submission.number}</span>
                                                    <span>{submission.place}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Score Badge */}
                                            <div className="text-center">
                                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${percentage >= 80 ? 'bg-green-100 text-green-800' :
                                                        percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {score.correct}/{score.total} ({percentage}%)
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {formatDate(submission.submittedAt)}
                                                </div>
                                            </div>

                                            {/* View Details Button */}
                                            <button
                                                onClick={() => viewDetails(submission)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Stats Footer */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">{submissions.length}</div>
                        <div className="text-white/80">Total Submissions</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">{filteredSubmissions.length}</div>
                        <div className="text-white/80">Filtered Results</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">
                            {submissions.filter(s => s.submittedAt && new Date(s.submittedAt).toDateString() === new Date().toDateString()).length}
                        </div>
                        <div className="text-white/80">Today's Submissions</div>
                    </div>
                </div>
            </div>

            {/* Add Question Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-emerald-800">Add New Question</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                                <textarea
                                    placeholder="Enter your question..."
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
                                {[0, 1, 2, 3].map((i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        placeholder={`Option ${i + 1}`}
                                        value={newOptions[i] || ""}
                                        onChange={(e) => {
                                            const opts = [...newOptions];
                                            opts[i] = e.target.value;
                                            setNewOptions(opts);
                                        }}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-colors mb-2"
                                    />
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                                <select
                                    value={correctAnswer}
                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-colors"
                                >
                                    <option value="">Select Correct Answer</option>
                                    {newOptions.filter(opt => opt.trim()).map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddQuestion}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300"
                                >
                                    <Save className="w-4 h-4" />
                                    Add Question
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showDetailModal && selectedSubmission && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-emerald-800">
                                    {selectedSubmission.name}'s Results
                                </h2>
                                <p className="text-gray-600">{formatDate(selectedSubmission.submittedAt)}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* User Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                            <div><strong>Name:</strong> {selectedSubmission.name}</div>
                            <div><strong>Email:</strong> {selectedSubmission.email}</div>
                            <div><strong>Phone:</strong> {selectedSubmission.number}</div>
                            <div><strong>Place:</strong> {selectedSubmission.place}</div>
                        </div>

                        {/* Score Summary */}
                        <div className="mb-6 p-4 bg-emerald-50 rounded-xl">
                            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Quiz Summary</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {calculateScore(selectedSubmission.answers).correct}
                                    </div>
                                    <div className="text-sm text-gray-600">Correct Answers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {calculateScore(selectedSubmission.answers).total}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Answered</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {Math.round((calculateScore(selectedSubmission.answers).correct / calculateScore(selectedSubmission.answers).total) * 100) || 0}%
                                    </div>
                                    <div className="text-sm text-gray-600">Score</div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Answers */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Question by Question Results</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {selectedSubmission.answers?.length > 0 ? (
                                    selectedSubmission.answers.map((ans, i) => (
                                        <div
                                            key={i}
                                            className={`p-4 rounded-xl border-2 ${ans.isCorrect
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-red-50 border-red-200'
                                                }`}
                                        >
                                            <p className="font-medium text-gray-800 mb-2">
                                                Q{i + 1}: {ans.questionText}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <strong className={ans.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                                        User Answer:
                                                    </strong>
                                                    <span className="ml-1">{ans.selected || "Not answered"}</span>
                                                </div>
                                                <div>
                                                    <strong className="text-green-700">Correct Answer: </strong>
                                                    <span className="ml-1">{ans.correctAnswer}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No answers submitted</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}