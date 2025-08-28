import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Save, ChevronLeft, ChevronRight, Clock, Star, BookOpen, AlertTriangle } from "lucide-react";

export default function QuizFlow() {
    const [step, setStep] = useState("start"); // start | quiz | complete
    const [userDetails, setUserDetails] = useState({
        name: "",
        email: "",
        number: "",
        place: ""
    });
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes
    const [unsavedQuestions, setUnsavedQuestions] = useState([]);
    const [selectedButUnsaved, setSelectedButUnsaved] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Load saved state on mount
    useEffect(() => {
        const savedState = localStorage.getItem('quizState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            setStep(parsed.step || "start");
            setUserDetails(parsed.userDetails || { name: "", email: "", number: "", place: "" });
            setCurrentQIndex(parsed.currentQIndex || 0);
            setAnswers(parsed.answers || {});
            setTimeLeft(parsed.timeLeft || 1500);
            setUnsavedQuestions(parsed.unsavedQuestions || []);
            setSelectedButUnsaved(new Set(parsed.selectedButUnsaved || []));
            if (parsed.questions && parsed.questions.length > 0) {
                setQuestions(parsed.questions);
            }
        }
        setIsLoading(false);
    }, []);

    // Save state whenever it changes
    useEffect(() => {
        if (!isLoading) {
            const stateToSave = {
                step,
                userDetails,
                currentQIndex,
                answers,
                timeLeft,
                unsavedQuestions,
                selectedButUnsaved: Array.from(selectedButUnsaved),
                questions
            };
            localStorage.setItem('quizState', JSON.stringify(stateToSave));
        }
    }, [step, userDetails, currentQIndex, answers, timeLeft, unsavedQuestions, selectedButUnsaved, questions, isLoading]);

    // Save button with auto-next
    const handleSave = () => {
        const qId = questions[currentQIndex].id;
        if (answers[qId]) {
            // Mark as saved
            setUnsavedQuestions((prev) => prev.filter((id) => id !== qId));
            setSelectedButUnsaved((prev) => {
                const newSet = new Set(prev);
                newSet.delete(qId);
                return newSet;
            });

            // Auto move to next question after saving
            setTimeout(() => {
                if (currentQIndex < questions.length - 1) {
                    setCurrentQIndex((prev) => prev + 1);
                }
            }, 300);
        } else {
            alert("Please select an option before saving.");
        }
    };

    // Prev button
    const handlePrev = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex((prev) => prev - 1);
        }
    };

    // Fetch questions
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const snapshot = await getDocs(collection(db, "questions"));
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Shuffle questions randomly
                const shuffledQuestions = data.sort(() => Math.random() - 0.5);
                setQuestions(shuffledQuestions);
            } catch (err) {
                console.error("Error fetching questions:", err);
            }
        };

        // Only fetch if we don't have questions and we're not loading saved state
        if (!isLoading && questions.length === 0) {
            fetchQuestions();
        }
    }, [isLoading, questions.length]);

    // Timer effect
    useEffect(() => {
        if (step !== "quiz") return;
        if (timeLeft <= 0) {
            handleComplete();
            return;
        }
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, step]);

    const handleStart = () => {
        const { name, email, number, place } = userDetails;
        if (!name || !email || !number || !place) {
            alert("Please fill all details");
            return;
        }
        setStep("quiz");
    };

    const handleAnswer = (option) => {
        const qId = questions[currentQIndex].id;
        setAnswers({
            ...answers,
            [qId]: option,
        });

        // Mark as selected but unsaved (user forgot to click save)
        setSelectedButUnsaved((prev) => new Set(prev).add(qId));
    };

    const handleNext = () => {
        const qId = questions[currentQIndex].id;
        if (!answers[qId]) {
            // Track completely unsaved (skipped)
            if (!unsavedQuestions.includes(qId)) {
                setUnsavedQuestions((prev) => [...prev, qId]);
            }
        }
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex((prev) => prev + 1);
        }
    };

    const handleSkip = () => {
        handleNext();
    };

    const handleComplete = async () => {
        setStep("complete");

        try {
            // Only include questions that have saved answers
            const savedAnswers = questions
                .filter(q => answers[q.id] && !unsavedQuestions.includes(q.id))
                .map((q) => ({
                    questionId: q.id,
                    questionText: q.questionText,
                    selected: answers[q.id],
                    correctAnswer: q.correctAnswer || null,
                    isCorrect: answers[q.id] === q.correctAnswer
                }));

            await addDoc(collection(db, "submissions"), {
                ...userDetails,
                submittedAt: serverTimestamp(),
                answers: savedAnswers,
                totalQuestions: questions.length,
                answeredQuestions: savedAnswers.length,
                timeSpent: 1500 - timeLeft
            });

            // Clear saved state after completion
            localStorage.removeItem('quizState');
        } catch (err) {
            console.error("Error saving answers:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            {/* Islamic Pattern Overlay */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm0 0l-15 15h30l-15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                }}></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {isLoading && (
                    <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl max-w-xl mx-auto">
                        <BookOpen className="w-12 h-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
                        <p className="text-emerald-700 text-lg">Loading your quiz...</p>
                    </div>
                )}

                {!isLoading && step === "start" && (
                    <div className="max-w-xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex justify-center items-center gap-3 mb-4">
                                <Star className="w-8 h-8 text-amber-500 fill-current" />
                                <BookOpen className="w-8 h-8 text-emerald-600" />
                                <Star className="w-8 h-8 text-amber-500 fill-current" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-800 mb-2">
                                Meelad Quiz
                            </h1>
                            <p className="text-emerald-600 text-sm sm:text-base">
                                Light Of Madeena
                            </p>
                        </div>

                        <div className="space-y-6 bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-100">
                            <h2 className="text-2xl font-bold text-emerald-800 text-center">
                                Enter Your Details
                            </h2>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={userDetails.name}
                                    onChange={(e) =>
                                        setUserDetails({ ...userDetails, name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white/70"
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={userDetails.email}
                                    onChange={(e) =>
                                        setUserDetails({ ...userDetails, email: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white/70"
                                />
                                <input
                                    type="text"
                                    placeholder="Phone Number"
                                    value={userDetails.number}
                                    onChange={(e) =>
                                        setUserDetails({ ...userDetails, number: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white/70"
                                />
                                <input
                                    type="text"
                                    placeholder="City/Place"
                                    value={userDetails.place}
                                    onChange={(e) =>
                                        setUserDetails({ ...userDetails, place: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white/70"
                                />
                            </div>

                            <button
                                onClick={handleStart}
                                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                            >
                                Start Quiz
                            </button>

                            <div className="text-center text-sm text-emerald-600 opacity-80">
                                بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && step === "quiz" && questions.length > 0 && (
                    <div className="max-w-3xl mx-auto">
                        {/* Header with Timer */}
                        <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg mb-6 border border-emerald-100">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-6 h-6 text-emerald-600" />
                                    <h1 className="text-xl sm:text-2xl font-bold text-emerald-800">
                                        Meelad Quiz
                                    </h1>
                                </div>
                                <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl">
                                    <Clock className="w-5 h-5 text-emerald-600" />
                                    <span className="font-semibold text-emerald-800">
                                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {questions[currentQIndex] ? (
                            <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 border border-emerald-100">
                                {/* Progress */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm text-emerald-600 mb-2">
                                        <span>Question {currentQIndex + 1} of {questions.length}</span>
                                        <span>{Math.round(((currentQIndex + 1) / questions.length) * 100)}% Complete</span>
                                    </div>
                                    <div className="w-full bg-emerald-100 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="mb-6">
                                    <h2 className="text-xl sm:text-2xl font-bold text-emerald-800 leading-relaxed">
                                        {questions[currentQIndex].questionText}
                                    </h2>
                                </div>

                                {/* Options */}
                                <div className="grid gap-3 mb-6">
                                    {(questions[currentQIndex].options || []).map((opt, i) => (
                                        <button
                                            key={i}
                                            className={`px-4 sm:px-6 py-4 rounded-xl border-2 text-left transition-all duration-200 ${answers[questions[currentQIndex].id] === opt
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500 shadow-lg transform scale-105"
                                                : "bg-white/70 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300 text-emerald-800"
                                                }`}
                                            onClick={() => handleAnswer(opt)}
                                        >
                                            <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
                                        </button>
                                    ))}
                                </div>

                                {/* Warning Messages */}
                                {selectedButUnsaved.has(questions[currentQIndex].id) && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                        <div className="flex items-center gap-2 text-amber-800">
                                            <AlertTriangle className="w-5 h-5" />
                                            <span className="font-medium">Answer selected but not saved!</span>
                                        </div>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Click the Save button to confirm your answer.
                                        </p>
                                    </div>
                                )}

                                {unsavedQuestions.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                        <div className="flex items-center gap-2 text-red-800">
                                            <AlertTriangle className="w-5 h-5" />
                                            <span className="font-medium">
                                                {unsavedQuestions.length} question(s) skipped
                                            </span>
                                        </div>
                                        <p className="text-sm text-red-700 mt-1">
                                            You can go back to answer them before completing the quiz.
                                        </p>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-emerald-100">
                                    {/* Skip Button */}
                                    <button
                                        onClick={handleSkip}
                                        className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium order-2 sm:order-1"
                                    >
                                        Skip Question
                                    </button>

                                    {/* Navigation Buttons */}
                                    <div className="flex items-center gap-3 order-1 sm:order-2">
                                        {/* Previous */}
                                        <button
                                            onClick={handlePrev}
                                            disabled={currentQIndex === 0}
                                            className="flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            title="Previous Question"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                            <span className="hidden sm:inline">Previous</span>
                                        </button>

                                        {/* Save */}
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg font-medium"
                                            title="Save Answer"
                                        >
                                            <Save className="w-5 h-5" />
                                            <span>Save</span>
                                        </button>

                                        {/* Next */}
                                        <button
                                            onClick={handleNext}
                                            disabled={currentQIndex === questions.length - 1}
                                            className="flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            title="Next Question"
                                        >
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Complete Quiz Button */}
                                {currentQIndex === questions.length - 1 && (
                                    <div className="text-center pt-4">
                                        <button
                                            onClick={handleComplete}
                                            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg transform hover:scale-105"
                                        >
                                            Complete Quiz
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl">
                                <BookOpen className="w-12 h-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
                                <p className="text-emerald-700 text-lg">Loading questions...</p>
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && step === "complete" && (
                    <div className="max-w-xl mx-auto text-center">
                        <div className="bg-white/90 backdrop-blur-sm p-8 sm:p-12 rounded-3xl shadow-xl border border-emerald-100">
                            <div className="flex justify-center items-center gap-2 mb-6">
                                <Star className="w-8 h-8 text-amber-500 fill-current" />
                                <Star className="w-10 h-10 text-amber-500 fill-current" />
                                <Star className="w-8 h-8 text-amber-500 fill-current" />
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-bold text-emerald-800 mb-4">
                                Quiz Complete!
                            </h2>

                            <div className="text-emerald-600 mb-6">
                                الْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِيْنَ
                            </div>

                            <p className="text-lg text-emerald-700 mb-2">
                                Thank you, <span className="font-bold text-emerald-800">{userDetails.name}</span>!
                            </p>

                            <p className="text-emerald-600">
                                You answered <span className="font-semibold">{Object.keys(answers).length}</span> out of{" "}
                                <span className="font-semibold">{questions.length}</span> questions.
                            </p>

                            <div className="mt-8 p-4 bg-emerald-50 rounded-xl">
                                <p className="text-sm text-emerald-700">
                                    May Allah increase you in knowledge and righteousness.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}