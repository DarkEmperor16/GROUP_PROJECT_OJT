import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, RefreshCw, Users, GraduationCap, Eye } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from "@/shared/components/common/StatusStates";
import { teacherService } from "@/features/teacher/services";
import { toast } from "sonner";

const PAGE_SIZE = 8;

const statusOptions = [
	{ label: "Tất cả", value: "ALL" },
	{ label: "Đang hoạt động", value: "ACTIVE" },
	{ label: "Tạm ngưng", value: "INACTIVE" },
];

const sortOptions = [
	{ value: "name-asc", label: "Tên môn (A-Z)" },
	{ value: "name-desc", label: "Tên môn (Z-A)" },
	{ value: "students-desc", label: "Người học AI (cao đến thấp)" },
	{ value: "students-asc", label: "Người học AI (thấp đến cao)" },
];

function getStatusClass(status) {
	if (status === "ACTIVE") {
		return "bg-emerald-100 text-emerald-700";
	}

	return "bg-slate-100 text-slate-700";
}

function getStatusLabel(status) {
	return status === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng";
}

function formatFileSize(bytes) {
	if (!bytes) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}

	return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function TeacherSubjectManagementPage() {
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [sortBy, setSortBy] = useState("name-asc");
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [courses, setCourses] = useState([]);
	const [courseStats, setCourseStats] = useState({});
	const [courseActionId, setCourseActionId] = useState("");
	const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
	const [creatingCourse, setCreatingCourse] = useState(false);
	const [createCourseForm, setCreateCourseForm] = useState({
		name: "",
		code: "",
		description: "",
	});
	const [isCourseDetailOpen, setIsCourseDetailOpen] = useState(false);
	const [loadingCourseDetail, setLoadingCourseDetail] = useState(false);
	const [courseDetailError, setCourseDetailError] = useState("");
	const [courseDetail, setCourseDetail] = useState(null);
	const [courseDetailId, setCourseDetailId] = useState("");
	const [gradingSessionId, setGradingSessionId] = useState("");
	const [scoreDrafts, setScoreDrafts] = useState({});
	const [isDeleteCourseOpen, setIsDeleteCourseOpen] = useState(false);
	const [pendingDeleteCourse, setPendingDeleteCourse] = useState(null);
	const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
	const [editingCourseId, setEditingCourseId] = useState("");
	const [updatingCourse, setUpdatingCourse] = useState(false);
	const [editCourseForm, setEditCourseForm] = useState({
		name: "",
		code: "",
		description: "",
	});

	const loadCourses = useCallback(async () => {
		setLoading(true);
		setError("");

		try {
			const { courses: courseRows } = await teacherService.listCourses(
				statusFilter === "ALL" ? {} : { status: statusFilter },
			);

			const statsEntries = await Promise.all(
				courseRows.map(async (course) => {
					const [documentsResult, overviewResult] = await Promise.allSettled([
						teacherService.listCourseDocuments(course.id),
						teacherService.getDashboardOverview({ courseId: course.id }),
					]);

					return [
						course.id,
						{
							documents:
								documentsResult.status === "fulfilled"
									? documentsResult.value.documents.length
									: 0,
							students:
								overviewResult.status === "fulfilled"
									? overviewResult.value.overview.totalStudents
									: 0,
						},
					];
				}),
			);

			setCourses(courseRows);
			setCourseStats(Object.fromEntries(statsEntries));
		} catch (loadError) {
			setError(loadError?.response?.data?.message || loadError?.message || "Không tải được danh sách môn học.");
		} finally {
			setLoading(false);
		}
	}, [statusFilter]);

	useEffect(() => {
		loadCourses();
	}, [loadCourses]);

	const enrichedCourses = useMemo(
		() =>
			courses.map((course) => ({
				...course,
				students: courseStats[course.id]?.students ?? 0,
				documents: courseStats[course.id]?.documents ?? 0,
			})),
		[courses, courseStats],
	);

	const totalSubjects = enrichedCourses.length;
	const totalStudents = enrichedCourses.reduce((sum, item) => sum + item.students, 0);
	const totalTeachingSubjects = enrichedCourses.filter((item) => item.status === "ACTIVE").length;

	const filteredAndSortedSubjects = useMemo(() => {
		const sorted = [...enrichedCourses].sort((a, b) => {
			if (sortBy === "name-asc") {
				return a.name.localeCompare(b.name);
			}

			if (sortBy === "name-desc") {
				return b.name.localeCompare(a.name);
			}

			if (sortBy === "students-desc") {
				return b.students - a.students;
			}

			return a.students - b.students;
		});

		return sorted;
	}, [enrichedCourses, sortBy]);

	const totalPages = Math.max(1, Math.ceil(filteredAndSortedSubjects.length / PAGE_SIZE));

	const pageData = useMemo(() => {
		const start = (page - 1) * PAGE_SIZE;
		return filteredAndSortedSubjects.slice(start, start + PAGE_SIZE);
	}, [filteredAndSortedSubjects, page]);

	const handleStatusFilterChange = (event) => {
		setStatusFilter(event.target.value);
		setPage(1);
	};

	const handleSortChange = (event) => {
		setSortBy(event.target.value);
		setPage(1);
	};

	const startItem = filteredAndSortedSubjects.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const endItem = Math.min(page * PAGE_SIZE, filteredAndSortedSubjects.length);

	const resetCreateCourseForm = () => {
		setCreateCourseForm({
			name: "",
			code: "",
			description: "",
		});
	};

	const handleCreateCourse = async () => {
		if (!createCourseForm.name.trim() || !createCourseForm.code.trim()) {
			toast.error("Tên môn học và mã môn học là bắt buộc");
			return;
		}

		setCreatingCourse(true);

		try {
			const response = await teacherService.createCourse({
				name: createCourseForm.name.trim(),
				code: createCourseForm.code.trim(),
				description: createCourseForm.description.trim(),
			});
			toast.success(response.message || "Tạo môn học thành công");
			setIsCreateCourseOpen(false);
			resetCreateCourseForm();
			await loadCourses();
		} catch (error) {
			toast.error(error?.response?.data?.message || error?.message || "Tạo môn học thất bại");
		} finally {
			setCreatingCourse(false);
		}
	};

	const handleEditCourse = (course) => {
		setEditingCourseId(course.id);
		setEditCourseForm({
			name: course.name || "",
			code: course.code || "",
			description: course.description || "",
		});
		setIsEditCourseOpen(true);
	};

	const handleUpdateCourse = async () => {
		if (!editingCourseId) {
			return;
		}

		if (!editCourseForm.name.trim() || !editCourseForm.code.trim()) {
			toast.error("Tên môn và mã môn không được để trống");
			return;
		}

		setUpdatingCourse(true);
		setCourseActionId(editingCourseId);

		try {
			const response = await teacherService.updateCourse(editingCourseId, {
				name: editCourseForm.name.trim(),
				code: editCourseForm.code.trim(),
				description: editCourseForm.description.trim(),
			});
			toast.success(response.message || "Cập nhật môn học thành công");
			setIsEditCourseOpen(false);
			setEditingCourseId("");
			setEditCourseForm({ name: "", code: "", description: "" });
			await loadCourses();
		} catch (error) {
			toast.error(error?.response?.data?.message || error?.message || "Cập nhật môn học thất bại");
		} finally {
			setUpdatingCourse(false);
			setCourseActionId("");
		}
	};

	const handleToggleCourseStatus = async (course) => {
		const nextStatus = course.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
		setCourseActionId(course.id);

		try {
			const response = await teacherService.updateCourse(course.id, { status: nextStatus });
			toast.success(response.message || "Cập nhật trạng thái thành công");
			await loadCourses();
		} catch (error) {
			toast.error(error?.response?.data?.message || error?.message || "Cập nhật trạng thái thất bại");
		} finally {
			setCourseActionId("");
		}
	};

	const requestDeleteCourse = (course) => {
		setPendingDeleteCourse(course);
		setIsDeleteCourseOpen(true);
	};

	const handleDeleteCourse = async () => {
		if (!pendingDeleteCourse?.id) {
			return;
		}

		setCourseActionId(pendingDeleteCourse.id);

		try {
			const response = await teacherService.deleteCourse(pendingDeleteCourse.id);
			toast.success(response.message || "Xóa môn học thành công");
			setIsDeleteCourseOpen(false);
			setPendingDeleteCourse(null);
			await loadCourses();
		} catch (error) {
			toast.error(error?.response?.data?.message || error?.message || "Xóa môn học thất bại");
		} finally {
			setCourseActionId("");
		}
	};

	const handleViewCourseDetail = async (courseId) => {
		setLoadingCourseDetail(true);
		setCourseDetailError("");
		setCourseDetail(null);
		setCourseDetailId(courseId);
		setIsCourseDetailOpen(true);

		try {
			const response = await teacherService.getCourseInsights(courseId);
			setCourseDetail(response);
			setScoreDrafts(
				Object.fromEntries(
					(response.quizSessions || []).map((session) => [
						session.id,
						session.score === null || session.score === undefined ? "" : String(session.score),
					]),
				),
			);
		} catch (detailError) {
			setCourseDetailError(
				detailError?.response?.data?.message || detailError?.message || "Không tải được chi tiết môn học.",
			);
		} finally {
			setLoadingCourseDetail(false);
		}
	};

	const handleUpdateSessionScore = async (session) => {
		if (!courseDetail?.course?.id) {
			toast.error("Không xác định được course để chấm điểm");
			return;
		}

		const rawValue = scoreDrafts[session.id];
		const parsedScore = Number(rawValue);

		if (!Number.isFinite(parsedScore) || parsedScore < 0) {
			toast.error("Điểm phải là số không âm");
			return;
		}

		setGradingSessionId(session.id);

		try {
			const response = await teacherService.updateQuizSessionScore(courseDetail.course.id, session.id, parsedScore);
			toast.success(response.message || "Cập nhật điểm thành công");
			await handleViewCourseDetail(courseDetail.course.id);
		} catch (gradeError) {
			toast.error(gradeError?.response?.data?.message || gradeError?.message || "Cập nhật điểm thất bại");
		} finally {
			setGradingSessionId("");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
						Giảng viên
					</p>
					<h1 className="mt-2 text-3xl font-bold">Quản lý môn học</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Dữ liệu đang lấy trực tiếp từ teacher API của backend.
					</p>
				</div>
				<div>
					<Button onClick={() => setIsCreateCourseOpen(true)}>Tạo môn học</Button>
				</div>
			</div>

			{isCreateCourseOpen ? (
				<Card>
					<CardHeader>
						<CardTitle>Tạo môn học mới</CardTitle>
						<CardDescription>Nhập tên môn học và mã môn học để tạo mới</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 lg:grid-cols-2">
							<div>
								<label className="mb-2 block text-sm font-medium">Tên môn học</label>
								<input
									type="text"
									className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
									value={createCourseForm.name}
									onChange={(event) =>
										setCreateCourseForm((current) => ({ ...current, name: event.target.value }))
									}
									placeholder="Ví dụ: Kỹ thuật hàng không cơ bản"
								/>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium">Mã môn học</label>
								<input
									type="text"
									className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm uppercase"
									value={createCourseForm.code}
									onChange={(event) =>
										setCreateCourseForm((current) => ({ ...current, code: event.target.value }))
									}
									placeholder="Ví dụ: AVN101"
								/>
							</div>
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium">Mô tả</label>
							<textarea
								rows="3"
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={createCourseForm.description}
								onChange={(event) =>
									setCreateCourseForm((current) => ({ ...current, description: event.target.value }))
								}
								placeholder="Mô tả ngắn cho môn học"
							/>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => {
									setIsCreateCourseOpen(false);
									resetCreateCourseForm();
								}}
							>
								Hủy
							</Button>
							<Button className="flex-1" isLoading={creatingCourse} onClick={handleCreateCourse}>
								Tạo môn học
							</Button>
						</div>
					</CardContent>
				</Card>
			) : null}

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Tổng số môn học</CardTitle>
						<BookOpen className="h-5 w-5 text-primary" aria-hidden />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{totalSubjects}</div>
						<CardDescription>Tổng số môn học đang quản lý</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Tổng số sinh viên</CardTitle>
						<Users className="h-5 w-5 text-primary" aria-hidden />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{totalStudents}</div>
						<CardDescription>Tổng số học viên đang ghi danh</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Đang giảng dạy</CardTitle>
						<GraduationCap className="h-5 w-5 text-primary" aria-hidden />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{totalTeachingSubjects}</div>
						<CardDescription>Số môn học đang được giảng dạy</CardDescription>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="space-y-2">
								<span className="text-sm font-medium text-muted-foreground">Trạng thái</span>
								<select
									className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
									value={statusFilter}
									onChange={handleStatusFilterChange}
								>
									{statusOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</label>

							<label className="space-y-2">
								<span className="text-sm font-medium text-muted-foreground">Sắp xếp</span>
								<select
									className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
									value={sortBy}
									onChange={handleSortChange}
								>
									{sortOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</label>
						</div>

						<Button variant="outline" onClick={loadCourses} disabled={loading}>
							<RefreshCw className="h-4 w-4" aria-hidden />
							Làm mới
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="overflow-x-auto pt-6">
					{loading ? (
						<LoadingState />
					) : error ? (
						<ErrorState message={error} onRetry={loadCourses} />
					) : filteredAndSortedSubjects.length === 0 ? (
						<EmptyState
							title="Chưa có môn học nào được gán cho giảng viên này"
							description="Khi backend trả course dữ liệu, danh sách sẽ hiện ở đây."
						/>
					) : (
					<>
					<table className="min-w-full text-left text-sm">
						<thead>
							<tr className="border-b text-muted-foreground">
								<th className="px-3 py-3 font-semibold">Mã môn</th>
								<th className="px-3 py-3 font-semibold">Tên môn học</th>
								<th className="px-3 py-3 font-semibold">Số học viên</th>
								<th className="px-3 py-3 font-semibold">Số tài liệu</th>
								<th className="px-3 py-3 font-semibold">Trạng thái</th>
								<th className="px-3 py-3 font-semibold">Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{pageData.map((item) => (
								<tr key={item.id} className="border-b last:border-none">
									<td className="px-3 py-3 font-semibold">{item.code}</td>
									<td className="px-3 py-3">{item.name}</td>
									<td className="px-3 py-3">{item.students}</td>
									<td className="px-3 py-3">{item.documents}</td>
									<td className="px-3 py-3">
										<span
											className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(item.status)}`}
										>
											{getStatusLabel(item.status)}
										</span>
									</td>
									<td className="px-3 py-3">
										<div className="flex flex-wrap gap-2">
											<Button
												variant="outline"
												size="sm"
												disabled={courseActionId === item.id}
												onClick={() => handleViewCourseDetail(item.id)}
											>
												<Eye className="h-4 w-4" aria-hidden />
												Chi tiết
											</Button>
											<Button
												variant="outline"
												size="sm"
												disabled={courseActionId === item.id}
												onClick={() => handleEditCourse(item)}
											>
												Sửa
											</Button>
											<Button
												size="sm"
												variant="secondary"
												disabled={courseActionId === item.id}
												onClick={() => handleToggleCourseStatus(item)}
											>
												{item.status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt"}
											</Button>
											<Button
												variant="destructive"
												size="sm"
												disabled={courseActionId === item.id}
												onClick={() => requestDeleteCourse(item)}
											>
												Xóa
											</Button>
										</div>
									</td>
								</tr>
							))}

							{pageData.length === 0 && (
								<tr>
									<td className="px-3 py-8 text-center text-muted-foreground" colSpan={6}>
										Không có môn học phù hợp với bộ lọc.
									</td>
								</tr>
							)}
						</tbody>
					</table>

					<div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-muted-foreground">
							Hiển thị {startItem}-{endItem} / {filteredAndSortedSubjects.length} môn học
						</p>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page === 1}
								onClick={() => setPage((prev) => Math.max(1, prev - 1))}
							>
								Trước
							</Button>

							<span className="text-sm font-medium">
								Trang {page}/{totalPages}
							</span>

							<Button
								variant="outline"
								size="sm"
								disabled={page === totalPages}
								onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
							>
								Sau
							</Button>
						</div>
					</div>
					</>
					)}
				</CardContent>
			</Card>

			{isDeleteCourseOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card className="w-full max-w-md">
						<CardHeader>
							<CardTitle>Xác nhận xóa môn học</CardTitle>
							<CardDescription>
								Bạn có chắc muốn xóa môn học {pendingDeleteCourse ? `${pendingDeleteCourse.code} - ${pendingDeleteCourse.name}` : "này"}?
							</CardDescription>
						</CardHeader>
						<CardContent className="flex gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => {
									setIsDeleteCourseOpen(false);
									setPendingDeleteCourse(null);
								}}
							>
								Hủy
							</Button>
							<Button
								variant="destructive"
								className="flex-1"
								disabled={!pendingDeleteCourse || courseActionId === pendingDeleteCourse?.id}
								onClick={handleDeleteCourse}
							>
								Xác nhận xóa
							</Button>
						</CardContent>
					</Card>
				</div>
			) : null}

			{isEditCourseOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card className="w-full max-w-xl">
						<CardHeader>
							<CardTitle>Sửa môn học</CardTitle>
							<CardDescription>Cập nhật thông tin môn học</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 lg:grid-cols-2">
								<div>
									<label className="mb-2 block text-sm font-medium">Tên môn học</label>
									<input
										type="text"
										className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
										value={editCourseForm.name}
										onChange={(event) =>
											setEditCourseForm((current) => ({ ...current, name: event.target.value }))
										}
										placeholder="Ví dụ: Kỹ thuật hàng không cơ bản"
									/>
								</div>
								<div>
									<label className="mb-2 block text-sm font-medium">Mã môn học</label>
									<input
										type="text"
										className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm uppercase"
										value={editCourseForm.code}
										onChange={(event) =>
											setEditCourseForm((current) => ({ ...current, code: event.target.value }))
										}
										placeholder="Ví dụ: AVN101"
									/>
								</div>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium">Mô tả</label>
								<textarea
									rows="3"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									value={editCourseForm.description}
									onChange={(event) =>
										setEditCourseForm((current) => ({ ...current, description: event.target.value }))
									}
									placeholder="Mô tả ngắn cho môn học"
								/>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => {
										setIsEditCourseOpen(false);
										setEditingCourseId("");
										setEditCourseForm({ name: "", code: "", description: "" });
									}}
								>
									Hủy
								</Button>
								<Button className="flex-1" isLoading={updatingCourse} onClick={handleUpdateCourse}>
									Lưu thay đổi
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			) : null}

			{isCourseDetailOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card className="max-h-[90vh] w-full max-w-6xl overflow-y-auto">
						<CardHeader>
							<CardTitle>Chi tiết môn học</CardTitle>
							<CardDescription>
								{courseDetail?.course
									? `${courseDetail.course.code} - ${courseDetail.course.name}`
									: "Thông tin course, sinh viên, quiz và tài liệu"}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-5">
							{loadingCourseDetail ? <LoadingState /> : null}
							{!loadingCourseDetail && courseDetailError ? (
								<ErrorState message={courseDetailError} onRetry={() => courseDetailId && handleViewCourseDetail(courseDetailId)} />
							) : null}
							{!loadingCourseDetail && !courseDetailError && courseDetail ? (
								<>
									<div className="grid gap-3 md:grid-cols-3">
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">Sinh viên</p>
												<p className="text-2xl font-bold">{courseDetail.summary.studentCount}</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">Quiz</p>
												<p className="text-2xl font-bold">{courseDetail.summary.quizCount}</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">Tài liệu</p>
												<p className="text-2xl font-bold">{courseDetail.summary.documentCount}</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">Bài làm quiz</p>
												<p className="text-2xl font-bold">{courseDetail.summary.quizSessionCount}</p>
											</CardContent>
										</Card>
									</div>

									<div className="rounded-lg border p-4">
										<h3 className="font-semibold">Thông tin môn học</h3>
										<p className="mt-2 text-sm"><strong>Mã môn:</strong> {courseDetail.course.code}</p>
										<p className="text-sm"><strong>Tên môn:</strong> {courseDetail.course.name}</p>
										<p className="text-sm"><strong>Trạng thái:</strong> {getStatusLabel(courseDetail.course.status)}</p>
										<p className="text-sm"><strong>Mô tả:</strong> {courseDetail.course.description || "Chưa có mô tả"}</p>
									</div>

									<div className="grid gap-4 lg:grid-cols-2">
										<div className="rounded-lg border p-4">
											<h3 className="font-semibold">Sinh viên ({courseDetail.students.length})</h3>
											{courseDetail.students.length === 0 ? (
												<p className="mt-2 text-sm text-muted-foreground">Chưa có sinh viên ghi danh.</p>
											) : (
												<div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
													{courseDetail.students.map((student) => (
														<div key={student.id} className="rounded-md border p-2 text-sm">
															<p className="font-medium">{student.fullName}</p>
															<p className="text-muted-foreground">{student.email}</p>
														</div>
													))}
												</div>
											)}
										</div>

										<div className="rounded-lg border p-4">
											<h3 className="font-semibold">Quiz ({courseDetail.quizzes.length})</h3>
											{courseDetail.quizzes.length === 0 ? (
												<p className="mt-2 text-sm text-muted-foreground">Chưa có quiz.</p>
											) : (
												<div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
													{courseDetail.quizzes.map((quiz) => (
														<div key={quiz.id} className="rounded-md border p-2 text-sm">
															<p className="font-medium">{quiz.title}</p>
															<p className="text-muted-foreground">
																{quiz.status} • {quiz.questionCount} câu hỏi • {quiz.timeLimit} phút
															</p>
														</div>
													))}
												</div>
											)}
										</div>
									</div>

									<div className="rounded-lg border p-4">
										<h3 className="font-semibold">Chấm điểm bài làm quiz ({courseDetail.quizSessions.length})</h3>
										{courseDetail.quizSessions.length === 0 ? (
											<p className="mt-2 text-sm text-muted-foreground">Chưa có bài làm quiz từ sinh viên.</p>
										) : (
											<div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
												{courseDetail.quizSessions.map((session) => (
													<div key={session.id} className="rounded-md border p-3 text-sm">
														<p className="font-medium">{session.studentName} - {session.quizTitle || "Quiz chưa xác định"}</p>
														<p className="text-muted-foreground">
															{session.status} • Điểm hiện tại: {session.score ?? "Chưa chấm"}
															{session.totalQuestions ? ` / ${session.totalQuestions}` : ""}
															{session.percentage !== null && session.percentage !== undefined ? ` (${session.percentage}%)` : ""}
														</p>
														<div className="mt-2 flex flex-wrap items-center gap-2">
															<input
																type="number"
																min="0"
																className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
																value={scoreDrafts[session.id] ?? ""}
																onChange={(event) =>
																	setScoreDrafts((current) => ({ ...current, [session.id]: event.target.value }))
																}
															/>
															<Button
																variant="outline"
																size="sm"
																disabled={gradingSessionId === session.id}
																onClick={() => handleUpdateSessionScore(session)}
															>
																Lưu điểm
															</Button>
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									<div className="rounded-lg border p-4">
										<h3 className="font-semibold">Tài liệu ({courseDetail.documents.length})</h3>
										{courseDetail.documents.length === 0 ? (
											<p className="mt-2 text-sm text-muted-foreground">Chưa có tài liệu.</p>
										) : (
											<div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
												{courseDetail.documents.map((document) => (
													<div key={document.id} className="rounded-md border p-2 text-sm">
														<p className="font-medium">{document.title} ({document.version})</p>
														<p className="text-muted-foreground">
															{document.fileName} • {formatFileSize(document.size)} • {document.status}
														</p>
														{document.aiErrorMessage ? (
															<p className="text-rose-600">{document.aiErrorMessage}</p>
														) : null}
													</div>
												))}
											</div>
										)}
									</div>
								</>
							) : null}

							<div className="flex justify-end">
								<Button
									variant="outline"
									onClick={() => {
										setIsCourseDetailOpen(false);
										setCourseDetailError("");
										setCourseDetail(null);
										setCourseDetailId("");
									}}
								>
									Đóng
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}
