import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Trophy, Medal, Award, Search, Clock, CheckCircle, XCircle, Star, Crown, Sparkles } from "lucide-react";

export default function Leaderboard() {
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState([]);
    const [searchNumber, setSearchNumber] = useState("");
    const [searchResult, setSearchResult] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const submissionsRef = collection(db, "submissions");
                const snapshot = await getDocs(submissionsRef);

                const data = snapshot.docs.map(doc => {
                    const user = doc.data();
                    const correctCount = user.answers?.filter(a => a.isCorrect)?.length || 0;
                    return {
                        id: doc.id,
                        name: user.name,
                        number: user.number,
                        correctCount,
                        timeSpent: user.timeSpent || 0,
                        answers: user.answers || [],
                    };
                });

                // Sort by correctCount descending, then by timeSpent ascending
                data.sort((a, b) => {
                    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
                    return a.timeSpent - b.timeSpent;
                });

                setLeaderboard(data);
            } catch (err) {
                console.error("Error fetching leaderboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const handleSearch = async () => {
        if (!searchNumber) return;

        const submissionsRef = collection(db, "submissions");
        const q = query(submissionsRef, where("number", "==", searchNumber));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const user = snapshot.docs[0].data();
            const correctCount = user.answers?.filter(a => a.isCorrect)?.length || 0;
            setSearchResult({ ...user, correctCount });
        } else {
            alert("No submission found with this number");
            setSearchResult(null);
        }
    };

    const getWinnerIcon = (position) => {
        switch (position) {
            case 0: return <Crown className="w-8 h-8 text-yellow-400" />;
            case 1: return <Medal className="w-8 h-8 text-slate-400" />;
            case 2: return <Award className="w-8 h-8 text-orange-500" />;
            default: return null;
        }
    };

    const getWinnerColors = (position) => {
        switch (position) {
            case 0: return "from-yellow-300 via-yellow-400 to-yellow-500";
            case 1: return "from-slate-300 via-slate-400 to-slate-500";
            case 2: return "from-orange-400 via-orange-500 to-orange-600";
            default: return "from-emerald-400 to-teal-500";
        }
    };

    const getPodiumColors = (position) => {
        switch (position) {
            case 0: return "from-yellow-400 to-yellow-600";
            case 1: return "from-slate-400 to-slate-600";
            case 2: return "from-orange-500 to-orange-700";
            default: return "from-emerald-400 to-teal-500";
        }
    };

    const getPodiumHeight = (position) => {
        switch (position) {
            case 0: return "h-32";
            case 1: return "h-24";
            case 2: return "h-20";
            default: return "h-16";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-200 rounded-full mx-auto animate-pulse"></div>
                    </div>
                    <p className="text-emerald-700 text-lg font-medium">Loading leaderboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 animate-bounce">
                    <Star className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="absolute top-20 right-20 animate-pulse">
                    <Sparkles className="w-8 h-8 text-teal-600" />
                </div>
                <div className="absolute bottom-20 left-1/4 animate-bounce" style={{animationDelay: '1s'}}>
                    <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="absolute bottom-32 right-1/3 animate-pulse" style={{animationDelay: '2s'}}>
                    <Medal className="w-6 h-6 text-slate-600" />
                </div>
            </div>

            {/* Islamic Pattern Overlay */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm0 0l-15 15h30l-15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-6 sm:p-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <div className="animate-bounce">
                            <Trophy className="w-10 h-10 text-yellow-500" />
                        </div>
                        <h2 className="text-5xl font-bold text-emerald-800 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Leaderboard
                        </h2>
                        <div className="animate-bounce" style={{animationDelay: '0.5s'}}>
                            <Trophy className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                    <div className="relative">
                        <p className="text-xl text-emerald-600 font-medium">Light Of Madeena - Quiz Champions</p>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Top 3 Winners - Enhanced Podium */}
                {leaderboard.length >= 3 && (
                    <div className="mb-16">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl font-bold text-emerald-800 mb-4">🏆 Champions Podium 🏆</h3>
                            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
                        </div>

                        {/* Desktop Podium Layout */}
                        <div className="hidden md:flex items-end justify-center gap-8 mb-8">
                            {/* Second Place */}
                            <div className="flex flex-col items-center animate-slide-up" style={{animationDelay: '0.3s'}}>
                                {/* Winner Card */}
                                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-4 border-slate-300 mb-6 transform hover:scale-105 hover:rotate-1 transition-all duration-500 group">
                                    {/* Floating Crown */}
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 animate-bounce" style={{animationDelay: '1s'}}>
                                        <div className="w-16 h-16 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl group-hover:animate-pulse">
                                            <Medal className="w-10 h-10 text-white" />
                                        </div>
                                    </div>
                                    
                                    {/* Sparkle Effects */}
                                    <div className="absolute -top-2 -right-2 animate-ping">
                                        <Star className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="absolute -bottom-2 -left-2 animate-pulse">
                                        <Sparkles className="w-4 h-4 text-slate-400" />
                                    </div>

                                    <div className="text-center pt-6">
                                        {/* Avatar with gradient border */}
                                        <div className="relative mb-4">
                                            <div className="w-20 h-20 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full p-1">
                                                <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                                    {leaderboard[1].name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            {/* Animated ring */}
                                            <div className="absolute inset-0 w-20 h-20 border-4 border-slate-400 rounded-full animate-ping opacity-20"></div>
                                        </div>
                                        
                                        <h4 className="font-bold text-xl text-gray-800 mb-2">{leaderboard[1].name}</h4>
                                        <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-3 mb-3">
                                            <p className="text-slate-700 font-bold text-lg">{leaderboard[1].correctCount} Correct</p>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{Math.floor(leaderboard[1].timeSpent / 60)}m {leaderboard[1].timeSpent % 60}s</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Podium Base */}
                                <div className={`w-32 ${getPodiumHeight(1)} bg-gradient-to-t ${getPodiumColors(1)} rounded-t-2xl border-4 border-slate-600 flex flex-col items-center justify-center shadow-xl transform hover:scale-105 transition-all duration-300`}>
                                    <span className="text-white font-bold text-3xl mb-1">2</span>
                                    <Medal className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* First Place */}
                            <div className="flex flex-col items-center animate-slide-up" style={{animationDelay: '0.1s'}}>
                                {/* Winner Card */}
                                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border-4 border-yellow-400 mb-6 transform hover:scale-105 hover:-rotate-1 transition-all duration-500 group">
                                    {/* Floating Crown */}
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                                        <div className="w-20 h-20 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl group-hover:animate-pulse">
                                            <Crown className="w-12 h-12 text-white" />
                                        </div>
                                    </div>
                                    
                                    {/* Multiple Sparkle Effects */}
                                    <div className="absolute -top-3 -right-3 animate-ping">
                                        <Star className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <div className="absolute -bottom-3 -left-3 animate-pulse" style={{animationDelay: '0.5s'}}>
                                        <Sparkles className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <div className="absolute top-2 right-2 animate-bounce" style={{animationDelay: '1s'}}>
                                        <Star className="w-4 h-4 text-yellow-400" />
                                    </div>

                                    <div className="text-center pt-8">
                                        {/* Avatar with multiple animated rings */}
                                        <div className="relative mb-6">
                                            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-1">
                                                <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                                                    {leaderboard[0].name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            {/* Multiple animated rings */}
                                            <div className="absolute inset-0 w-24 h-24 border-4 border-yellow-400 rounded-full animate-ping opacity-20"></div>
                                            <div className="absolute inset-0 w-24 h-24 border-4 border-yellow-500 rounded-full animate-pulse opacity-30" style={{animationDelay: '0.5s'}}></div>
                                        </div>
                                        
                                        <h4 className="font-bold text-2xl text-gray-800 mb-3">{leaderboard[0].name}</h4>
                                        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl p-4 mb-4">
                                            <p className="text-yellow-800 font-bold text-xl">{leaderboard[0].correctCount} Correct</p>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                            <Clock className="w-5 h-5" />
                                            <span className="font-medium">{Math.floor(leaderboard[0].timeSpent / 60)}m {leaderboard[0].timeSpent % 60}s</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Podium Base */}
                                <div className={`w-36 ${getPodiumHeight(0)} bg-gradient-to-t ${getPodiumColors(0)} rounded-t-2xl border-4 border-yellow-600 flex flex-col items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300`}>
                                    <span className="text-white font-bold text-4xl mb-2">1</span>
                                    <Crown className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            {/* Third Place */}
                            <div className="flex flex-col items-center animate-slide-up" style={{animationDelay: '0.5s'}}>
                                {/* Winner Card */}
                                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-4 border-orange-400 mb-6 transform hover:scale-105 hover:rotate-1 transition-all duration-500 group">
                                    {/* Floating Crown */}
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 animate-bounce" style={{animationDelay: '1.5s'}}>
                                        <div className="w-16 h-16 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl group-hover:animate-pulse">
                                            <Award className="w-10 h-10 text-white" />
                                        </div>
                                    </div>
                                    
                                    {/* Sparkle Effects */}
                                    <div className="absolute -top-2 -right-2 animate-ping">
                                        <Star className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div className="absolute -bottom-2 -left-2 animate-pulse">
                                        <Sparkles className="w-4 h-4 text-orange-500" />
                                    </div>

                                    <div className="text-center pt-6">
                                        {/* Avatar with gradient border */}
                                        <div className="relative mb-4">
                                            <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full p-1">
                                                <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                                    {leaderboard[2].name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            {/* Animated ring */}
                                            <div className="absolute inset-0 w-20 h-20 border-4 border-orange-400 rounded-full animate-ping opacity-20"></div>
                                        </div>
                                        
                                        <h4 className="font-bold text-xl text-gray-800 mb-2">{leaderboard[2].name}</h4>
                                        <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl p-3 mb-3">
                                            <p className="text-orange-700 font-bold text-lg">{leaderboard[2].correctCount} Correct</p>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{Math.floor(leaderboard[2].timeSpent / 60)}m {leaderboard[2].timeSpent % 60}s</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Podium Base */}
                                <div className={`w-28 ${getPodiumHeight(2)} bg-gradient-to-t ${getPodiumColors(2)} rounded-t-2xl border-4 border-orange-700 flex flex-col items-center justify-center shadow-xl transform hover:scale-105 transition-all duration-300`}>
                                    <span className="text-white font-bold text-2xl mb-1">3</span>
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Winners Layout */}
                        <div className="md:hidden space-y-6 mb-8">
                            {leaderboard.slice(0, 3).map((user, index) => (
                                <div key={user.id} className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border-4 border-opacity-50 transform hover:scale-105 transition-all duration-500 animate-slide-up group"
                                     style={{
                                         animationDelay: `${index * 0.2}s`,
                                         borderColor: index === 0 ? '#facc15' : index === 1 ? '#94a3b8' : '#f97316'
                                     }}>
                                    {/* Position Badge */}
                                    <div className="absolute -top-4 left-6">
                                        <div className={`w-14 h-14 bg-gradient-to-r ${getWinnerColors(index)} rounded-full flex items-center justify-center border-4 border-white shadow-xl group-hover:animate-pulse`}>
                                            {getWinnerIcon(index)}
                                        </div>
                                    </div>
                                    
                                    {/* Sparkle Effects */}
                                    <div className="absolute -top-2 -right-2 animate-ping">
                                        <Star className="w-5 h-5" style={{color: index === 0 ? '#facc15' : index === 1 ? '#94a3b8' : '#f97316'}} />
                                    </div>

                                    <div className="flex items-center gap-6 pt-6">
                                        {/* Avatar */}
                                        <div className="relative">
                                            <div className={`w-20 h-20 bg-gradient-to-r ${getWinnerColors(index)} rounded-full p-1`}>
                                                <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className={`absolute inset-0 w-20 h-20 border-4 rounded-full animate-ping opacity-20`}
                                                 style={{borderColor: index === 0 ? '#facc15' : index === 1 ? '#94a3b8' : '#f97316'}}></div>
                                        </div>
                                        
                                        {/* User Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-10 h-10 bg-gradient-to-r ${getPodiumColors(index)} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                                    {index + 1}
                                                </div>
                                                <h4 className="font-bold text-xl text-gray-800">{user.name}</h4>
                                            </div>
                                            <div className={`bg-gradient-to-r rounded-xl p-3 mb-2`}
                                                 style={{
                                                     background: index === 0 ? 'linear-gradient(to right, #fef3c7, #fde68a)' : 
                                                                index === 1 ? 'linear-gradient(to right, #f1f5f9, #e2e8f0)' : 
                                                                'linear-gradient(to right, #fed7aa, #fdba74)'
                                                 }}>
                                                <p className={`font-bold text-lg ${index === 0 ? 'text-yellow-800' : index === 1 ? 'text-slate-700' : 'text-orange-700'}`}>
                                                    {user.correctCount} Correct Answers
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                                                <Clock className="w-4 h-4" />
                                                <span className="font-medium">{Math.floor(user.timeSpent / 60)}m {user.timeSpent % 60}s</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-emerald-200 transform hover:scale-105 transition-all duration-300">
                    <h3 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
                        <Search className="w-7 h-7" />
                        Find Your Result
                        <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                    </h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter your phone number"
                            value={searchNumber}
                            onChange={(e) => setSearchNumber(e.target.value)}
                            className="flex-1 px-6 py-4 border-2 border-emerald-300 rounded-2xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all bg-white/80 text-lg"
                        />
                        <button
                            onClick={handleSearch}
                            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 hover:scale-105 transition-all shadow-xl font-bold text-lg flex items-center gap-3"
                        >
                            <Search className="w-5 h-5" />
                            Search
                        </button>
                    </div>
                </div>

                {/* Search Result */}
                {searchResult && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-emerald-200 animate-slide-up">
                        <h3 className="text-3xl font-bold text-emerald-800 mb-8 text-center flex items-center justify-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Your Quiz Result
                            <Medal className="w-8 h-8 text-slate-500" />
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* User Info */}
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="relative mb-6">
                                        <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto border-4 border-white shadow-2xl">
                                            {searchResult.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute inset-0 w-24 h-24 border-4 border-emerald-400 rounded-full animate-ping opacity-20 mx-auto"></div>
                                    </div>
                                    <h4 className="text-2xl font-bold text-gray-800 mb-2">{searchResult.name}</h4>
                                    <p className="text-gray-600 text-lg">{searchResult.number}</p>
                                </div>

                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-emerald-600 mb-2 flex items-center justify-center gap-2">
                                            <CheckCircle className="w-8 h-8" />
                                            {searchResult.correctCount}
                                        </div>
                                        <div className="text-emerald-700 font-semibold text-lg">Correct Answers</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3 text-gray-600 bg-gray-50 rounded-2xl p-4">
                                    <Clock className="w-6 h-6" />
                                    <span className="text-lg font-medium">
                                        Time: {Math.floor(searchResult.timeSpent / 60)}m {searchResult.timeSpent % 60}s
                                    </span>
                                </div>
                            </div>

                            {/* Answers Details */}
                            <div>
                                <h4 className="font-bold text-emerald-800 mb-6 flex items-center gap-3 text-xl">
                                    <CheckCircle className="w-6 h-6" />
                                    Answer Details
                                </h4>
                                <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                                    {searchResult.answers.map((answer, idx) => (
                                        <div key={idx} className={`p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                                            answer.isCorrect 
                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:shadow-lg' 
                                                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 hover:shadow-lg'
                                        }`}>
                                            <div className="flex items-start gap-3">
                                                {answer.isCorrect ? (
                                                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                                        <CheckCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                                                        <XCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-2 mb-3">
                                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-sm font-medium">
                                                            Q{idx + 1}
                                                        </span>
                                                        <p className="font-medium text-gray-800 text-sm leading-relaxed">
                                                            {answer.questionText}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2 ml-2">
                                                        <div className={`p-2 rounded-lg text-sm ${
                                                            answer.isCorrect 
                                                                ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
                                                                : 'bg-red-100 text-red-800 border-l-4 border-red-500'
                                                        }`}>
                                                            <span className="font-semibold">Your answer:</span> {answer.selected}
                                                        </div>
                                                        {!answer.isCorrect && (
                                                            <div className="p-2 rounded-lg text-sm bg-green-100 text-green-800 border-l-4 border-green-500">
                                                                <span className="font-semibold">Correct answer:</span> {answer.correctAnswer}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Leaderboard Table - Rest of participants */}
                {/* {leaderboard.length > 3 && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-emerald-200 mt-8">
                        <h3 className="text-2xl font-bold text-emerald-800 mb-6 text-center flex items-center justify-center gap-3">
                            <Trophy className="w-6 h-6 text-emerald-600" />
                            Complete Rankings
                        </h3>
                        <div className="space-y-3">
                            {leaderboard.slice(3).map((user, index) => (
                                <div key={user.id} className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                            {index + 4}
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-lg text-gray-800">{user.name}</h4>
                                            <p className="text-emerald-600 font-semibold">{user.correctCount} Correct</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{Math.floor(user.timeSpent / 60)}m {user.timeSpent % 60}s</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )} */}
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.6s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
}