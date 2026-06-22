import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Code2, Binary, Calculator } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";

interface Subject {
    id: string;
    name: string;
    code: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export default function StudentAskAiPage() {
    const navigate = useNavigate();

    const subjects: Subject[] = [
        {
            id: "prf-192",
            name: "Software Engineering Principles",
            code: "PRF192",
            description: "Ask questions regarding agile methodologies, design patterns, and architecture.",
            icon: <Code2 className="h-6 w-6" />,
            color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50",
        },
        {
            id: "dbi-201",
            name: "Database Management Systems",
            code: "DBI201",
            description: "Stuck on SQL queries, normalization, or indexing? The DB assistant can help.",
            icon: <Binary className="h-6 w-6" />,
            color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
        },
        {
            id: "mae-101",
            name: "Discrete Mathematics",
            code: "MAE101",
            description: "Get explanations on set theory, graph logic, and combinatorics.",
            icon: <Calculator className="h-6 w-6" />,
            color: "text-purple-500 bg-purple-50 dark:bg-purple-950/50",
        },
    ];


    const handleSubjectSelect = (subjectId: string) => {

        navigate(`/student/ask-ai/${subjectId}`);
    };

    return (
        <div className="space-y-6">

            <button
                onClick={() => navigate("/student")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">AI Study Assistant</h1>
                <p className="text-muted-foreground">
                    Select one of your enrolled courses below to start a dedicated AI questioning session.
                </p>
            </div>

            <hr className="border-border" />


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                    <Card
                        key={subject.id}
                        className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
                        onClick={() => handleSubjectSelect(subject.id)}
                    >
                        <CardHeader className="space-y-4">

                            <div className={`p-2.5 rounded-lg w-fit ${subject.color}`}>
                                {subject.icon}
                            </div>
                            <div>
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                    {subject.name}
                                </CardTitle>
                                <CardDescription className="font-mono mt-1 text-xs">
                                    Course Code: {subject.code}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {subject.description}
                            </p>
                            <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                Start Chatting &rarr;
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}