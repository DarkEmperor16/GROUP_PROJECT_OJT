
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Inbox } from "lucide-react";

export default function StudentHistoryPage() {
    const navigate = useNavigate();

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


            <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-16 text-center bg-muted/10">
                <div className="p-4 bg-muted rounded-full w-fit text-muted-foreground mb-4">
                    <Inbox className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">History is currently empty</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    Once the AI integration is live, your completed questioning sessions will automatically appear here.
                </p>
            </div>
        </div>
    );
}