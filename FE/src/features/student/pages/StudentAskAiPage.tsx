import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";
import apiClient from "@/lib/axios";

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
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await apiClient.get('/student/courses?limit=100');
                // Backend trả về phân trang: { data: [...], meta: ... }
                const coursesData = response?.data?.data || response?.data || [];
                
                const mappedSubjects = coursesData.map((course: any, index: number) => {
                    const colors = [
                        "text-blue-500 bg-blue-50 dark:bg-blue-950/50",
                        "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
                        "text-purple-500 bg-purple-50 dark:bg-purple-950/50",
                        "text-amber-500 bg-amber-50 dark:bg-amber-950/50"
                    ];
                    
                    return {
                        id: course.id || course._id,
                        name: course.courseName || course.name || course.title,
                        code: course.courseCode || course.code,
                        description: course.description || "Tương tác và hỏi đáp AI về tài liệu của khóa học này.",
                        icon: <BookOpen className="h-6 w-6" />,
                        color: colors[index % colors.length]
                    };
                });
                
                setSubjects(mappedSubjects);
            } catch (err) {
                console.error("Lỗi khi fetch courses:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const handleSubjectSelect = (subject: Subject) => {
        navigate(`/student/ask-ai/${subject.id}`, { state: { courseCode: subject.code } });
    };

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate("/student")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Về trang chủ
            </button>

            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Trợ lý AI Học tập</h1>
                <p className="text-muted-foreground">
                    Chọn một khóa học bên dưới để bắt đầu phiên hỏi đáp với AI dựa trên tài liệu bài giảng.
                </p>
            </div>

            <hr className="border-border" />

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : subjects.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    Chưa có khóa học nào khả dụng.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                        <Card
                            key={subject.id}
                            className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
                            onClick={() => handleSubjectSelect(subject)}
                        >
                            <CardHeader className="space-y-4">
                                <div className={`p-2.5 rounded-lg w-fit ${subject.color}`}>
                                    {subject.icon}
                                </div>
                                <div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">
                                        {subject.name}
                                    </CardTitle>
                                    <CardDescription className="font-mono mt-1 text-xs">
                                        Mã khóa học: {subject.code}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {subject.description}
                                </p>
                                <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    Bắt đầu Chat &rarr;
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}