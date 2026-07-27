import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Inbox, Loader2, MessageSquare, Calendar, BookOpen } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";

interface HistoryItem {
    id: string;
    courseId?: string;
    courseName?: string;
    question: string;
    answer?: string;
    createdAt?: string;
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

export default function StudentHistoryPage() {
    const navigate = useNavigate();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                setIsError(false);

                const token = getAuthToken();

                if (!token) {
                    navigate("/login", { replace: true });
                    return;
                }


                const response = await fetch("http://localhost:3000/api/student/history", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to load history");
                }

                const resData = await response.json();


                console.log("History API Response:", resData);


                const rawList = Array.isArray(resData.data)
                    ? resData.data
                    : Array.isArray(resData.history)
                        ? resData.history
                        : Array.isArray(resData)
                            ? resData
                            : [];


                const formattedHistory: HistoryItem[] = rawList.map((item: any, index: number) => ({
                    id: item.id || item._id || index.toString(),
                    courseId: item.courseId || item.course || "General",
                    courseName: item.courseName || item.subject || item.courseId || "General",
                    question: item.question || item.prompt || "No question text",
                    answer: item.answer || item.response || item.aiResponse || "",
                    createdAt: item.createdAt || item.date || item.timestamp,
                }));

                setHistory(formattedHistory);
            } catch {
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    const showEmptyOrError = isError || history.length === 0;

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate("/student")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Q&A History</h1>
                <p className="text-muted-foreground">Review your past conversations with the AI assistant.</p>
            </div>

            <hr className="border-border" />

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm">Loading your Q&A history...</p>
                </div>
            )}

            {/* Empty or Error Fallback State */}
            {!isLoading && showEmptyOrError && (
                <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-16 text-center bg-muted/10">
                    <div className="p-4 bg-muted rounded-full w-fit text-muted-foreground mb-4">
                        <Inbox className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">
                        history failed to load,or you have no chat history
                    </h3>
                </div>
            )}

            {/* History Items List */}
            {!isLoading && !showEmptyOrError && (
                <div className="space-y-4">
                    {history.map((item) => (
                        <Card key={item.id} className="transition-all hover:shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span className="flex items-center gap-1 font-medium bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                                        <BookOpen className="h-3 w-3" /> {item.courseName}
                                    </span>
                                    {item.createdAt && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="text-base font-semibold flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-1" />
                                    <span>{item.question}</span>
                                </CardTitle>
                            </CardHeader>
                            {item.answer && (
                                <CardContent className="pt-0 text-sm text-muted-foreground">
                                    <div className="p-3 bg-muted/50 rounded-lg border text-foreground/90 mt-2">
                                        {item.answer}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}