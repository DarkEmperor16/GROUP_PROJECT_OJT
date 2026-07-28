import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from "@/shared/components/common/StatusStates";
import { teacherService } from "@/features/teacher/services";
import { toast } from "sonner";

const reviewStatusOptions = ["NEEDS_REVIEW", "IN_PROGRESS", "RESOLVED"];
const quizReviewOptions = ["GOOD", "NEEDS_REVIEW"];

export default function TeacherReviewPage() {
	const [courses, setCourses] = useState([]);
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [keyword, setKeyword] = useState("");
	const [reviewNote, setReviewNote] = useState({});
	const [answerItems, setAnswerItems] = useState([]);
	const [quizItems, setQuizItems] = useState([]);
	const [historyItems, setHistoryItems] = useState([]);
	const [actionId, setActionId] = useState("");

	const selectedCourse = useMemo(
		() => courses.find((course) => course.id === selectedCourseId) || null,
		[courses, selectedCourseId],
	);

	const loadCourses = useCallback(async () => {
		const response = await teacherService.listCourses({ status: "ACTIVE" });
		setCourses(response.courses);
		setSelectedCourseId((current) => current || response.courses[0]?.id || "");
		return response.courses;
	}, []);

	const loadReviewData = useCallback(async (courseId) => {
		if (!courseId) {
			setAnswerItems([]);
			setQuizItems([]);
			setHistoryItems([]);
			return;
		}

		setLoading(true);
		setError("");

		try {
			const [answersRes, quizRes, historyRes] = await Promise.all([
				teacherService.getLowRatedAnswers(courseId, { page: 1, limit: 10 }),
				teacherService.listQuizQuestions({ courseId, page: 1, limit: 10 }),
				teacherService.getHistoryList({ courseId, page: 1, limit: 10, keyword }),
			]);

			setAnswerItems(answersRes.items);
			setQuizItems(quizRes.items);
			setHistoryItems(historyRes.items);
		} catch (loadError) {
			setError(loadError?.response?.data?.message || loadError?.message || "Không tải được dữ liệu review teacher.");
		} finally {
			setLoading(false);
		}
	}, [keyword]);

	useEffect(() => {
		let active = true;

		(async () => {
			setLoading(true);
			setError("");
			try {
				const loadedCourses = await loadCourses();
				const nextCourseId = selectedCourseId || loadedCourses[0]?.id || "";
				if (active) {
					await loadReviewData(nextCourseId);
				}
			} catch (loadError) {
				if (active) {
					setError(loadError?.response?.data?.message || loadError?.message || "Không tải được teacher courses.");
					setLoading(false);
				}
			}
		})();

		return () => {
			active = false;
		};
	}, [loadCourses, loadReviewData, selectedCourseId]);

	const handleAnswerStatusUpdate = async (answerId, reviewStatus) => {
		setActionId(answerId);
		try {
			await teacherService.updateAnswerReviewStatus(answerId, {
				reviewStatus,
				teacherReviewNote: reviewNote[answerId] || "",
			});
			toast.success("Đã cập nhật review status cho answer");
			await loadReviewData(selectedCourseId);
		} catch (actionError) {
			toast.error(actionError?.response?.data?.message || actionError?.message || "Cập nhật answer review thất bại");
		} finally {
			setActionId("");
		}
	};

	const handleQuizReview = async (questionId, reviewStatus) => {
		setActionId(questionId);
		try {
			await teacherService.reviewQuizQuestion(questionId, {
				reviewStatus,
				teacherReviewNote: reviewNote[questionId] || "",
			});
			toast.success("Đã cập nhật review cho quiz question");
			await loadReviewData(selectedCourseId);
		} catch (actionError) {
			toast.error(actionError?.response?.data?.message || actionError?.message || "Cập nhật quiz review thất bại");
		} finally {
			setActionId("");
		}
	};

	const setNote = (id, value) => {
		setReviewNote((current) => ({
			...current,
			[id]: value,
		}));
	};

	return (
		<div className="space-y-8">
			<div className="rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-8 backdrop-blur-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
							Review Center
						</p>
						<h1 className="mt-2 text-4xl font-bold">Teacher review APIs</h1>
						<p className="mt-3 text-sm text-muted-foreground">
							Màn này dùng teacher feedback, quiz review và history APIs thay cho mock data.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{courses.map((course) => (
							<Button
								key={course.id}
								variant={selectedCourseId === course.id ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedCourseId(course.id)}
							>
								{course.code}
							</Button>
						))}
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Tìm trong history</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 lg:flex-row">
					<Input
						value={keyword}
						onChange={(event) => setKeyword(event.target.value)}
						placeholder="Lọc theo câu hỏi / câu trả lời"
					/>
					<Button onClick={() => loadReviewData(selectedCourseId)}>Tải lại dữ liệu review</Button>
				</CardContent>
			</Card>

			{loading ? <LoadingState /> : null}
			{!loading && error ? <ErrorState message={error} onRetry={() => loadReviewData(selectedCourseId)} /> : null}
			{!loading && !error && !selectedCourse ? (
				<EmptyState title="Chưa có course teacher" description="Teacher cần được gán course để review dữ liệu." />
			) : null}

			{!loading && !error && selectedCourse ? (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Low-rated answers</CardTitle>
						</CardHeader>
						<CardContent>
							{answerItems.length === 0 ? (
								<EmptyState title="Không có answer low-rated" />
							) : (
								<div className="space-y-4">
									{answerItems.map((item) => (
										<div key={item.answerId} className="rounded-xl border p-4">
											<p className="font-semibold">{item.question}</p>
											<p className="mt-1 text-sm text-muted-foreground">Helpful rate: {item.helpfulRate}% • Feedback: {item.totalFeedback}</p>
											<p className="mt-1 text-sm text-muted-foreground">Review status: {item.reviewStatus}</p>
											<Input
												value={reviewNote[item.answerId] || item.teacherReviewNote || ""}
												onChange={(event) => setNote(item.answerId, event.target.value)}
												placeholder="Ghi chú review"
												className="mt-3"
											/>
											<div className="mt-3 flex flex-wrap gap-2">
												{reviewStatusOptions.map((status) => (
													<Button
														key={status}
														variant={item.reviewStatus === status ? "default" : "outline"}
														size="sm"
														disabled={actionId === item.answerId}
														onClick={() => handleAnswerStatusUpdate(item.answerId, status)}
													>
														{status}
													</Button>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Quiz question review</CardTitle>
						</CardHeader>
						<CardContent>
							{quizItems.length === 0 ? (
								<EmptyState title="Không có quiz question để review" />
							) : (
								<div className="space-y-4">
									{quizItems.map((item) => (
										<div key={item.id} className="rounded-xl border p-4">
											<p className="font-semibold">{item.questionPreview}</p>
											<p className="mt-1 text-sm text-muted-foreground">Type: {item.questionType} • Review status: {item.reviewStatus}</p>
											<p className="mt-1 text-sm text-muted-foreground">Helpful rate: {item.feedbackSummary.helpfulRate}%</p>
											<Input
												value={reviewNote[item.id] || item.teacherReviewNote || ""}
												onChange={(event) => setNote(item.id, event.target.value)}
												placeholder="Ghi chú review quiz"
												className="mt-3"
											/>
											<div className="mt-3 flex flex-wrap gap-2">
												{quizReviewOptions.map((status) => (
													<Button
														key={status}
														variant={item.reviewStatus === status ? "default" : "outline"}
														size="sm"
														disabled={actionId === item.id}
														onClick={() => handleQuizReview(item.id, status)}
													>
														{status}
													</Button>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Recent Q&A history</CardTitle>
						</CardHeader>
						<CardContent>
							{historyItems.length === 0 ? (
								<EmptyState title="Không có history" />
							) : (
								<div className="space-y-4">
									{historyItems.map((item) => (
										<div key={item.id} className="rounded-xl border p-4">
											<p className="font-semibold">{item.question}</p>
											<p className="mt-1 text-sm text-muted-foreground">{item.answerPreview}</p>
											<p className="mt-2 text-xs text-muted-foreground">
												AI: {item.aiStatus} • Confidence: {item.confidenceStatus} • Review: {item.reviewStatus}
											</p>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</>
			) : null}
		</div>
	);
}