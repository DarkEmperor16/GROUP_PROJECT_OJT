
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function StudentAiChatPage() {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            <button
                onClick={() => navigate("/student/ask-ai")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Subjects
            </button>


            <h1 className="text-2xl font-bold uppercase"> AI Chat For Subject : {subjectId}</h1>

            <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                [ Waiting for {subjectId} AI model ]
            </div>
        </div>
    );
}