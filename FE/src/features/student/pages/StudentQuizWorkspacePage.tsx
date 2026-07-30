import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/shared/components/ui/card";

interface Question {
    _id: string;
    questionText: string;
    options: string[];
}

interface QuizDetails {
    _id: string;
    title: string;
    description?: string;
    timeLimit?: number;
    questions: Question[];
}

const getAuthToken = (): string | null => {
    const rawAuth = localStorage.getItem("ojt-kns-auth");
    if (!rawAuth) return null;

    try {
        const parsed = JSON.parse(rawAuth);
        return parsed?.state?.accessToken || null;
    } catch {
        return null;
    }
};

export default function StudentQuizWorkspacePage() {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<QuizDetails | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    useEffect(() => {
        const fetchQuizDetails = async () => {
            if (!quizId) return;

            try {
                setIsLoading(true);
                setError(null);

                const token = getAuthToken();
                if (!token) {
                    navigate("/login", { replace: true });
                    return;
                }

                // GET /api/student/quizzes/:quizId
                const response = await fetch(`/api/student/quizzes/${quizId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to load quiz (${response.status})`);
                }

                const resData = await response.json();
                console.log("Single Quiz API Response:", resData);

                const rawQuiz = resData.data || resData.quiz || resData;

                // Extract questions safely using q.text from backend
                const rawQuestions = Array.isArray(rawQuiz.questions) ? rawQuiz.questions : [];
                const formattedQuestions: Question[] = rawQuestions.map((q: any, idx: number) => ({
                    _id: q._id || q.id || idx.toString(),
                    questionText: q.text || q.questionText || q.question || q.prompt || `Question ${idx + 1}`,
                    options: Array.isArray(q.options) ? q.options : [],
                }));

                setQuiz({
                    _id: rawQuiz._id || rawQuiz.id || quizId,
                    title: rawQuiz.title || "Practice Quiz",
                    description: rawQuiz.description,
                    timeLimit: rawQuiz.timeLimit,
                    questions: formattedQuestions,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred while loading the quiz.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizDetails();
    }, [quizId, navigate]);

    const handleOptionSelect = (questionId: string, optionIndex: number) => {
        if (isSubmitted) return;
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex,
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!quiz || isSubmitting) return;

        try {
            setIsSubmitting(true);
            const token = getAuthToken();

            // Format answers as array of chosen option indices matching question order: [0, 2, 1]
            const answersArray = quiz.questions.map((q) => {
                const selectedIdx = selectedAnswers[q._id];
                return selectedIdx !== undefined ? selectedIdx : null;
            });

            const payload = {
                answers: answersArray,
            };

            console.log("Submitting Quiz Payload:", payload);

            // POST /api/student/quizzes/:quizId/submit
            const response = await fetch(`/api/student/quizzes/${quiz._id || quizId}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const submitResData = await response.json().catch(() => ({}));
            console.log("Submit Quiz API Response:", submitResData);

            if (!response.ok) {
                throw new Error(submitResData.message || `Submission failed with status ${response.status}`);
            }

            setIsSubmitted(true);
        } catch (err) {
            console.error("Quiz Submit Error:", err);
            alert(err instanceof Error ? err.message : "Submission error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Loading quiz session...</p>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => navigate("/student/quiz")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Quizzes
                </button>
                <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error || "Quiz not found or failed to load."}</span>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => navigate("/student/quiz")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Quizzes
                </button>
                <div className="border rounded-xl p-12 text-center bg-muted/10 space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold tracking-tight">Quiz Submitted Successfully!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                        Your answers have been saved and evaluated. You can return to the dashboard or select another quiz.
                    </p>
                    <button
                        onClick={() => navigate("/student/quiz")}
                        className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions?.[currentQuestionIndex];
    const totalQuestions = quiz.questions?.length || 0;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header & Navigation */}
            <div className="flex items-center justify-between border-b pb-4">
                <button
                    onClick={() => navigate("/student/quiz")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Exit Quiz
                </button>
                <span className="text-xs font-semibold uppercase px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    {quiz.title}
                </span>
            </div>

            {/* Questions Container */}
            {totalQuestions === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                    <p>No questions found in this quiz session.</p>
                </div>
            ) : (
                <Card>
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                            <span>
                                Question {currentQuestionIndex + 1} of {totalQuestions}
                            </span>
                            <span>
                                {Object.keys(selectedAnswers).length} of {totalQuestions} Answered
                            </span>
                        </div>
                        <CardTitle className="text-lg font-medium mt-2">
                            {currentQuestion?.questionText}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-3">
                        {currentQuestion?.options.map((optionText, idx) => {
                            const isSelected = selectedAnswers[currentQuestion._id] === idx;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleOptionSelect(currentQuestion._id, idx)}
                                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between ${isSelected
                                            ? "border-primary bg-primary/5 text-primary font-medium shadow-sm"
                                            : "border-border hover:bg-muted/50 text-foreground"
                                        }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <span
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${isSelected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-muted-foreground/30 text-muted-foreground"
                                                }`}
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        {optionText}
                                    </span>
                                </button>
                            );
                        })}
                    </CardContent>

                    <CardFooter className="flex justify-between items-center border-t pt-4 bg-muted/10">
                        <button
                            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-opacity"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>

                        {currentQuestionIndex < totalQuestions - 1 ? (
                            <button
                                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                                className="flex items-center gap-1 text-sm bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg transition-colors"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitQuiz}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" /> Submit Quiz
                                    </>
                                )}
                            </button>
                        )}
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}