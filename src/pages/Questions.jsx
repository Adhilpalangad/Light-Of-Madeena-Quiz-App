import React, { useState, useEffect } from "react";

const QuizApp = () => {
    // Personal details
    const [details, setDetails] = useState({ name: "", email: "" });
    const [detailsSaved, setDetailsSaved] = useState(false);

    // Quiz state
    const [questions, setQuestions] = useState([
        { id: 1, text: "What is 2 + 2?", options: ["3", "4", "5"] },
        { id: 2, text: "Capital of France?", options: ["London", "Berlin", "Paris"] },
        { id: 3, text: "Which is JS framework?", options: ["React", "Laravel", "Django"] },
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(60); // 1 min timer
    const [isCompleted, setIsCompleted] = useState(false);

    // Timer effect
    useEffect(() => {
        if (!detailsSaved || isCompleted) return;
        if (timeLeft <= 0) {
            setIsCompleted(true);
            return;
        }
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [detailsSaved, timeLeft, isCompleted]);

    // Handle detail save
    const handleSaveDetails = (e) => {
        e.preventDefault();
        if (details.name && details.email) {
            setDetailsSaved(true);
        } else {
            alert("Please enter all details!");
        }
    };

    // Handle answer save
    const handleSaveAnswer = () => {
        if (answers[currentIndex]) {
            alert("Answer already saved for this question.");
        } else {
            alert("Answer saved!");
        }
    };

    // Handle next
    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsCompleted(true);
        }
    };

    // Handle skip
    const handleSkip = () => {
        setAnswers({ ...answers, [currentIndex]: "Skipped" });
        handleNext();
    };

    // Handle select option
    const handleOptionChange = (option) => {
        setAnswers({ ...answers, [currentIndex]: option });
    };

    return (
        <div className="quiz-app" style={{ maxWidth: "500px", margin: "auto" }}>
            {!detailsSaved ? (
                // Step 1: Personal details form
                <form onSubmit={handleSaveDetails}>
                    <h2>Enter Your Details</h2>
                    <input
                        type="text"
                        placeholder="Name"
                        value={details.name}
                        onChange={(e) => setDetails({ ...details, name: e.target.value })}
                        required
                    />
                    <br />
                    <input
                        type="email"
                        placeholder="Email"
                        value={details.email}
                        onChange={(e) => setDetails({ ...details, email: e.target.value })}
                        required
                    />
                    <br />
                    <button type="submit">Save & Start Quiz</button>
                </form>
            ) : !isCompleted ? (
                // Step 2: Quiz Screen
                <div>
                    <h3>Time Left: {timeLeft}s</h3>
                    <h2>
                        Question {currentIndex + 1}: {questions[currentIndex].text}
                    </h2>
                    <div>
                        {questions[currentIndex].options.map((opt, i) => (
                            <label key={i} style={{ display: "block" }}>
                                <input
                                    type="radio"
                                    name="option"
                                    checked={answers[currentIndex] === opt}
                                    onChange={() => handleOptionChange(opt)}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                    <br />
                    <button onClick={handleSaveAnswer}>Save</button>
                    <button onClick={handleNext}>Next</button>
                    <button onClick={handleSkip}>Skip</button>
                </div>
            ) : (
                // Step 3: Completion screen
                <div>
                    <h2>Quiz Completed!</h2>
                    <p>Thank you, {details.name} ({details.email})</p>
                    <h3>Your Answers:</h3>
                    <ul>
                        {questions.map((q, i) => (
                            <li key={q.id}>
                                {q.text} → {answers[i] || "Not Answered"}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default QuizApp;
