import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Clock, AlertCircle, Loader2, BookOpen } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";

interface Course {
    _id: string;
    code: string;
    title: string;
}

interface QuizSet {
    id: string;
    title: string;
    subject: string;
    courseId?: string;
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
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
    const [quizzes, setQuizzes] = useState<QuizSet[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStudentDataAndQuizzes = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const token = getAuthToken();
                if (!token) {
                    console.warn("No valid token found in ojt-kns-auth. Redirecting...");
                    navigate("/login", { replace: true });
                    return;
                }

                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                };

                // 1. Fetch Student Enrolled Courses (#6 in API Docs)
                const coursesRes = await fetch("http://localhost:3000/api/student/courses", { method: "GET", headers });

                let studentCourses: Course[] = [];
                if (coursesRes.ok) {
                    const coursesData = await coursesRes.json();
                    console.log("Enrolled Student Courses:", coursesData);
                    const rawCourses = Array.isArray(coursesData.data) ? coursesData.data : Array.isArray(coursesData) ? coursesData : [];
                    studentCourses = rawCourses.map((c: any) => ({
                        _id: c._id || c.id,
                        code: c.code || c.name || "SUBJ",
                        title: c.title || c.name || "Enrolled Subject",
                    }));
                    setCourses(studentCourses);
                }

                // 2. Build URL for Quizzes with courseId filter (#7 in API Docs)
                let quizApiUrl = "http://localhost:3000/api/student/quizzes";
                if (selectedCourseId !== "ALL") {
                    quizApiUrl += `?courseId=${selectedCourseId}`;
                }

                // 3. Fetch Quizzes
                const response = await fetch(quizApiUrl, { method: "GET", headers });

                if (response.status === 401 || response.status === 403) {
                    throw new Error("Unauthorized access. Please log in again.");
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch quizzes (${response.status})`);
                }

                const resData = await response.json();
                console.log("Quiz List API Response:", resData);

                const rawList = Array.isArray(resData.data) ? resData.data : Array.isArray(resData) ? resData : [];

                // 4. Map & Filter Quizzes to enrolled courses only
                const enrolledCourseIds = new Set(studentCourses.map((c) => c._id));

                const formattedQuizzes: QuizSet[] = rawList
                    .filter((item: any) => {
                        // If selected specific course, backend/frontend filters it
                        if (selectedCourseId !== "ALL") return true;

                        // If "ALL" selected, filter to ensure quiz belongs to student's enrolled courses
                        if (enrolledCourseIds.size === 0) return true; // Fallback if course endpoint returned empty

                        const itemCourseId = typeof item.courseId === "object" ? item.courseId?._id : item.courseId;
                        return !itemCourseId || enrolledCourseIds.has(itemCourseId);
                    })
                    .map((item: any) => {
                        let subjectName = "General";
                        if (item.courseId && typeof item.courseId === "object") {
                            subjectName = item.courseId.code || item.courseId.title || "General";
                        } else if (typeof item.courseId === "string") {
                            const matchCourse = studentCourses.find((c) => c._id === item.courseId);
                            subjectName = matchCourse ? matchCourse.code : item.courseId;
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
                            courseId: typeof item.courseId === "object" ? item.courseId?._id : item.courseId,
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

        loadStudentDataAndQuizzes();
    }, [navigate, selectedCourseId]);

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate("/student")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Practice Quizzes</h1>
                    <p className="text-muted-foreground">Select a quiz set assigned for your enrolled subjects.</p>
                </div>

                {/* Course Filter Dropdown */}
                {courses.length > 0 && (
                    <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background shadow-sm text-sm">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="bg-transparent border-none outline-none text-foreground font-medium cursor-pointer"
                        >
                            <option value="ALL">All Enrolled Subjects ({courses.length})</option>
                            {courses.map((course) => (
                                <option key={course._id} value={course._id}>
                                    {course.code} - {course.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
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
                    <p>No quizzes available for this subject at the moment.</p>
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