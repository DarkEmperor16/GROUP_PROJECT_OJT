import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import axios from "axios";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp?: string;
}

// Helper function to extract auth token safely from LocalStorage
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

const renderMessage = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={index} className="font-semibold text-primary">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

export default function StudentAiChatPage() {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const courseCode = location.state?.courseCode || subjectId;

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Fetch existing Q&A history on page load
    useEffect(() => {
        const fetchHistory = async () => {
            if (!subjectId) return;

            const token = getAuthToken();
            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {

                const response = await axios.get(
                    `/api/student/history?courseId=${subjectId}&limit=50`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const historyData = response?.data?.data || response?.data || [];

                // Reconstruct conversation timeline (oldest first)
                const historyMessages: Message[] = [];
                [...historyData].reverse().forEach((item: any) => {
                    if (item.question) {
                        historyMessages.push({
                            id: `${item._id}-q`,
                            sender: "user",
                            text: item.question,
                            timestamp: item.createdAt,
                        });
                    }
                    if (item.answer) {
                        historyMessages.push({
                            id: `${item._id}-a`,
                            sender: "ai",
                            text: item.answer,
                            timestamp: item.createdAt,
                        });
                    }
                });

                if (historyMessages.length === 0) {
                    setMessages([
                        {
                            id: "welcome",
                            sender: "ai",
                            text: `Hello! How can I help you with course details or questions regarding subject **${courseCode}**?`,
                        },
                    ]);
                } else {
                    setMessages(historyMessages);
                }
            } catch (err) {
                console.error("Failed to load Q&A history:", err);
                setMessages([
                    {
                        id: "welcome",
                        sender: "ai",
                        text: `Hello! How can I help you with course details or questions regarding subject **${courseCode}**?`,
                    },
                ]);
            } finally {
                setIsFetchingHistory(false);
            }
        };

        fetchHistory();
    }, [subjectId, courseCode, navigate]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading || !subjectId) return;

        const token = getAuthToken();
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        // Add user message to UI immediately
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: trimmedInput,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Explicit call to backend port 3000
            const response = await axios.post(
                "/api/student/ask-ai",
                {
                    courseId: subjectId,
                    question: trimmedInput,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;
            const aiReply =
                data?.answer ||
                data?.response ||
                data?.message ||
                data?.data?.answer;

            if (!aiReply || typeof aiReply !== "string") {
                throw new Error("Invalid response format");
            }

            const aiMsg: Message = {
                id: data.historyId || (Date.now() + 1).toString(),
                sender: "ai",
                text: aiReply,
                timestamp: data.createdAt || new Date().toISOString(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
            console.error("AI Error:", err);

            // Extract exact error message from backend if available
            const backendMsg =
                err?.response?.data?.message ||
                "Failed to process AI question. Please try again later.";

            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: `Error (${err?.response?.status || "Network"}): ${backendMsg}`,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto p-2 sm:p-4 space-y-4">
            {/* Header & Navigation */}
            <div className="flex items-center justify-between border-b pb-3">
                <button
                    onClick={() => navigate("/student/ask-ai")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Subjects
                </button>

                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold text-base">
                        AI Chat Assistant {courseCode ? `[${courseCode}]` : ""}
                    </span>
                </div>
            </div>

            {/* Chat Container */}
            <Card className="flex-1 flex flex-col min-h-0 border-border overflow-hidden">
                <CardContent
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {isFetchingHistory ? (
                        <div className="flex justify-center items-center h-full text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading chat history...
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-primary/10 text-primary"
                                        }`}
                                >
                                    {msg.sender === "user" ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        <Bot className="h-4 w-4" />
                                    )}
                                </div>

                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${msg.sender === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted text-foreground rounded-tl-none"
                                        }`}
                                >
                                    {renderMessage(msg.text)}
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2.5 rounded-2xl text-sm rounded-tl-none">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Thinking...
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Input Controls */}
                <form
                    onSubmit={handleSend}
                    className="p-3 border-t bg-background flex items-center gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask AI a question about course ${courseCode}...`}
                        disabled={isLoading || isFetchingHistory}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim() || isFetchingHistory}
                        size="icon"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
}