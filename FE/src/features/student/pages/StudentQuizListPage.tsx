import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";

interface QuizSet {
    id: string;
    title: string;
    subject: string;
    questionCount: number;
    timeLimit: string;
    description: string;
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

export default function StudentQuizListPage() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<QuizSet[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                setIsLoading(true);
                setError(null);


                const token = getAuthToken();

                if (!token) {
                    console.warn("No valid token found in ojt-kns-auth. Redirecting...");
                    navigate("/login", { replace: true });
                    return;
                }


                const response = await fetch("/api/student/quizzes", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 401 || response.status === 403) {
                    throw new Error("Unauthorized access. Please log in again.");
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch quizzes (${response.status})`);
                }

                const resData = await response.json();
                console.log("API Response Data:", resData);


                const rawList = Array.isArray(resData.data) ? resData.data : Array.isArray(resData) ? resData : [];


                const formattedQuizzes: QuizSet[] = rawList.map((item: any) => {

                    let subjectName = "General";
                    if (item.courseId && typeof item.courseId === "object") {
                        subjectName = item.courseId.code || item.courseId.name || item.courseId.title || "General";
                    } else if (typeof item.courseId === "string") {
                        subjectName = item.courseId;
                    } else if (item.subject) {
                        subjectName = item.subject;
                    }


                    let formattedTime = "15 mins";
                    if (typeof item.timeLimit === "number") {
                        formattedTime = `${item.timeLimit} mins`;
                    } else if (typeof item.timeLimit === "string") {
                        formattedTime = item.timeLimit;
                    }

                    return {
                        id: item._id || item.quizId || item.id,
                        title: item.title || "Untitled Quiz",
                        subject: subjectName,
                        questionCount: item.questionCount ?? (Array.isArray(item.questions) ? item.questions.length : 0),
                        timeLimit: formattedTime,
                        description: item.description || "No description provided.",
                    };
                });

                setQuizzes(formattedQuizzes);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, [navigate]);

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate("/student")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Practice Quizzes</h1>
                <p className="text-muted-foreground">Select a quiz set assigned by your teachers to test your skills.</p>
            </div>

            <hr className="border-border" />

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm">Loading available quizzes...</p>
                </div>
            )}

            {!isLoading && error && (
                <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {!isLoading && !error && quizzes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg p-8">
                    <p>No quizzes available at the moment.</p>
                </div>
            )}

            {!isLoading && !error && quizzes.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {quizzes.map((quiz) => (
                        <Card
                            key={quiz.id}
                            className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
                            onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                        >
                            <CardHeader>
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded">
                                        {quiz.subject}
                                    </span>
                                </div>
                                <CardTitle className="text-xl mt-2 group-hover:text-primary transition-colors">
                                    {quiz.title}
                                </CardTitle>
                                <CardDescription className="mt-1">{quiz.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center gap-4 text-xs text-muted-foreground pt-0">
                                <div className="flex items-center gap-1">
                                    <HelpCircle className="h-4 w-4" /> {quiz.questionCount} Questions
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" /> {quiz.timeLimit}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}