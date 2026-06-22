
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function StudentQuizWorkspacePage() {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate("/student/quiz")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Exit Quiz
            </button>

            <div className="border border-dashed rounded-xl p-12 text-center bg-muted/10 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-2xl font-bold uppercase tracking-tight">Quiz Session Initialized</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Loaded Active Configuration: <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{quizId}</code>
                </p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Once the backend question database is deployed, your dynamic question parser will load the quiz layout here.
                </p>
            </div>
        </div>
    );
}