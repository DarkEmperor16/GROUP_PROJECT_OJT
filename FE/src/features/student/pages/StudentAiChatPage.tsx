import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
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

const renderMessage = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
    });
};

export default function StudentAiChatPage() {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();
    const courseCode = location.state?.courseCode || subjectId;
    
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            sender: "ai",
            text: `Hello! How can I help you with course details or questions regarding subject ${courseCode}?`,
        },
    ]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        // Add User Message immediately
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: trimmedInput,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const token = getAuthToken();

            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            // Endpoint #12 from API specs: POST /api/student/ask-ai
            const response = await fetch("http://localhost:3000/api/student/ask-ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    courseId: subjectId, // maps URL param to courseId
                    question: trimmedInput,
                }),
            });

            if (!response.ok) {
                throw new Error("Invalid API response status");
            }

            const data = await response.json();

            // Handle potential variations in how backend returns the AI message string
            const aiReply =
                data?.answer ||
                data?.response ||
                data?.message ||
                data?.data?.answer ||
                data?.data?.message;

            if (!aiReply || typeof aiReply !== "string") {
                throw new Error("Invalid or empty response payload");
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: aiReply,
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch {
            // Fallback message on invalid response or fetch error
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: "AI API failed to load,please try again later",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
            {/* Header & Navigation */}
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <button
                        onClick={() => navigate("/student/ask-ai")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-1"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Subjects
                    </button>
                    <h1 className="text-2xl font-bold uppercase">
                        AI Chat For Subject : {courseCode}
                    </h1>
                </div>
            </div>

            {/* Chat History Box */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-xl bg-background">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                            }`}
                    >
                        <div
                            className={`p-2 rounded-full ${msg.sender === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {msg.sender === "user" ? (
                                <User className="h-4 w-4" />
                            ) : (
                                <Bot className="h-4 w-4" />
                            )}
                        </div>

                        <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed ${msg.sender === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted text-foreground rounded-tl-none"
                                }`}
                        >
                            {renderMessage(msg.text)}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted text-muted-foreground">
                            <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-2xl text-sm text-muted-foreground rounded-tl-none">
                            <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                        </div>
                    </div>
                )}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask AI a question about course ${courseCode}...`}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    <Send className="h-4 w-4" />
                </button>
            </form>
        </div>
    );
}