
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Clock } from "lucide-react";
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

export default function StudentQuizListPage() {
    const navigate = useNavigate();

    const mockQuizzes: QuizSet[] = [
        {
            id: "quiz-agile-01",
            title: "Agile Scrum Methodology Basics",
            subject: "Software Engineering Principles",
            questionCount: 10,
            timeLimit: "15 mins",
            description: "Test your knowledge on Sprint cycles, roles (PO, SM, Dev), and core Scrum ceremonies.",
        },
        {
            id: "quiz-sql-normal",
            title: "Database Normalization (1NF to 3NF)",
            subject: "Database Management Systems",
            questionCount: 15,
            timeLimit: "20 mins",
            description: "Practice identifying partial and transitive dependencies to clean up relational schemas.",
        },
        {
            id: "quiz-logic-prop",
            title: "Propositional Logic & Truth Tables",
            subject: "Discrete Mathematics",
            questionCount: 8,
            timeLimit: "12 mins",
            description: "Evaluate conditional and biconditional statements using truth tables.",
        }
    ];

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

            <div className="grid gap-4 md:grid-cols-2">
                {mockQuizzes.map((quiz) => (
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
        </div>
    );
}