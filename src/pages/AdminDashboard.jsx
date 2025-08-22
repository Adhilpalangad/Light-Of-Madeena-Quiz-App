import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs, updateDoc, where } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function AdminDashboard() {
    const [answers, setAnswers] = useState([]);
    const [filteredAnswers, setFilteredAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState("");
    const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [recentQuestions, setRecentQuestions] = useState([]);
    const [user, setUser] = useState(null); // Better state management for user
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    // Effect for handling authentication state
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

    // Effect for fetching data once the user is authenticated
    useEffect(() => {
        if (!user) return; // Don't run if user is not logged in

        // FIX 1: The query now orders by 'submittedAt'
        const q = query(collection(db, "answers"), orderBy("submittedAt", "desc"));

        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                // FIX 2: Convert the 'submittedAt' field to a Date object
                submittedAt: doc.data().submittedAt?.toDate()
            }));
            setAnswers(data);
        });

        return () => unsubscribeFirestore();
    }, [user]); // This effect depends on the user state

    const fetchRecentQuestions = async () => {
        try {
            const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const questions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentQuestions(questions);
        } catch (err) {
            console.error("Error fetching recent questions:", err);
        }
    };

    useEffect(() => {
        fetchRecentQuestions();
    }, []);

    // Filter and sort answers
    useEffect(() => {
        let filtered = [...answers];

        // Determine the date to filter: either the selected date or today
        const filterDate = dateFilter ? new Date(dateFilter) : new Date();

        filtered = filtered.filter(answer => {
            if (!answer.submittedAt) return false;
            const answerDate = new Date(answer.submittedAt);
            return answerDate.toDateString() === filterDate.toDateString();
        });

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(answer =>
                answer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                answer.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                answer.phoneNumber?.includes(searchTerm) ||
                answer.address?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            if (!a.submittedAt || !b.submittedAt) return 0;
            return sortOrder === "newest"
                ? new Date(b.submittedAt) - new Date(a.submittedAt)
                : new Date(a.submittedAt) - new Date(b.submittedAt);
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

    const markAnswerCorrectAndAssignPoints = async (answerId, questionId) => {
        if (!questionId) {
            alert("Error: questionId is missing for this answer.");
            return;
        }

        try {
            await updateDoc(doc(db, "answers", answerId), { isCorrect: true });

            // This query is slightly different as it needs to find the *first* submissions.
            // Using the submission timestamp is crucial here.
            const q = query(
                collection(db, "answers"),
                where("questionId", "==", questionId),
                where("isCorrect", "==", true),
                orderBy("submittedAt", "asc") // FIX 5: Sort by submission time to find winners
            );

            const snapshot = await getDocs(q);
            const correctAnswers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const updates = correctAnswers.map((ans, index) => {
                let points = 5;
                if (index === 0) points = 10;
                else if (index === 1) points = 9;
                else if (index === 2) points = 8;
                return updateDoc(doc(db, "answers", ans.id), { points });
            });

            await Promise.all(updates);
            alert("Answer marked correct & points assigned!");
        } catch (err) {
            console.error("Error marking correct or assigning points:", err);
            alert("Error marking correct / assigning points.");
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
        if (!newQuestion.trim()) return;
        try {
            await addDoc(collection(db, "questions"), {
                questionText: newQuestion,
                createdAt: serverTimestamp(),
                isActive: true,
            });
            setNewQuestion("");
            setShowModal(false);
            fetchRecentQuestions(); // Refresh the list after adding
            alert("Question added successfully!");
        } catch (err) {
            console.error("Error adding question:", err);
        }
    };

    const exportToCSV = () => {
        const csvContent = [
            ["Name", "Phone", "Address", "Answer", "Date"],
            ...filteredAnswers.map(ans => [
                ans.name || "",
                ans.phoneNumber || "",
                ans.address || "",
                ans.answer || "",
                // FIX 6: Use 'submittedAt' for the export
                formatDate(ans.submittedAt)
            ])
        ].map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeelad_submissions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    const generateLeaderboard = () => {
        const userPoints = {};

        answers.forEach(answer => {
            if (!answer.phoneNumber) return;
            if (!userPoints[answer.phoneNumber]) {
                userPoints[answer.phoneNumber] = {
                    name: answer.name || "Unknown",
                    phoneNumber: answer.phoneNumber,
                    totalPoints: 0
                };
            }
            userPoints[answer.phoneNumber].totalPoints += answer.points || 0;
        });

        const leaderboardArray = Object.values(userPoints).sort((a, b) => b.totalPoints - a.totalPoints);

        setLeaderboard(leaderboardArray);
        setShowLeaderboard(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center">
                {/* ... loading spinner ... */}
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
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-4 sm:p-6 mb-6">
                    <div className="flex flex-col space-y-4">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center mb-4 sm:mb-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                                        Meeelad Admin Dashboard
                                    </h1>
                                    <p className="text-sm sm:text-base text-emerald-600 font-medium">Manage program submissions</p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons Section */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 order-1"
                            >
                                Add Question
                            </button>

                            <button
                                onClick={() => generateLeaderboard()}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm sm:text-base rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all duration-300 order-2"
                            >
                                Show Leaderboard
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium text-sm sm:text-base rounded-xl transition-all duration-300 transform hover:-translate-y-1 order-3 sm:ml-auto"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
                {/* Add Question Section */}
                

                {/* Modal */}
                {showLeaderboard && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-lg relative shadow-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>

                            {leaderboard.length === 0 ? (
                                <p className="text-gray-500">No submissions yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map((user, index) => (
                                        <div key={user.phoneNumber} className="p-3 bg-gray-100 rounded-xl flex justify-between items-center">
                                            <span>
                                                #{index + 1} {user.name} ({user.phoneNumber})
                                            </span>
                                            <span className="font-semibold text-emerald-700">{user.totalPoints} pts</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => setShowLeaderboard(false)}
                                    className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400 transition-all duration-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-lg relative shadow-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4">Add Today's Question</h2>

                            {/* New Question Input */}
                            <textarea
                                placeholder="Enter question text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                rows="4"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-none mb-4"
                            />

                            <div className="flex justify-end space-x-4 mb-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400 transition-all duration-300"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleAddQuestion}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-300"
                                >
                                    Add
                                </button>
                            </div>

                            {/* Recently Added Questions */}
                            <h3 className="text-xl font-semibold mb-2">Recent Questions</h3>
                            <div className="space-y-2">
                                {recentQuestions.length === 0 && <p className="text-gray-500">No questions yet.</p>}
                                {recentQuestions.map(q => (
                                    <div key={q.id} className="p-3 bg-gray-100 rounded-xl flex justify-between items-center">
                                        <span>{q.questionText}</span>
                                        <span className="text-gray-400 text-sm">
                                            {q.createdAt?.toDate ? q.createdAt.toDate().toLocaleString() : "Just now"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


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
                                                {formatDate(submission.submittedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                            #{index + 1}
                                        </span>
                                        {submission.submittedAt && new Date(submission.submittedAt).toDateString() === new Date().toDateString() && (
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

                                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl relative">
                                        <label className="text-sm font-semibold text-emerald-700 mb-2 block">Response/Answer:</label>
                                        <p className="text-gray-800 leading-relaxed">
                                            {submission.answer || "No answer provided"}
                                        </p>

                                        <button
                                            onClick={() => markAnswerCorrectAndAssignPoints(submission.id, submission.questionId)}
                                            className={`absolute top-3 right-3 px-3 py-1 rounded-xl text-white text-sm font-semibold transition-all duration-300 ${submission.isCorrect ? "bg-green-500 cursor-not-allowed" : "bg-gray-400 hover:bg-gray-500"}`}
                                            disabled={submission.isCorrect}
                                        >
                                            {submission.isCorrect ? "Correct ✅" : "Mark Correct"}
                                        </button>
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