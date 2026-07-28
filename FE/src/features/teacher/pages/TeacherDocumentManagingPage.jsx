import { useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw, Search, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
	EmptyState,
	ErrorState,
	LoadingState,
} from "@/shared/components/common/StatusStates";
import { teacherService } from "@/features/teacher/services";
import { toast } from "sonner";

const statusLabels = {
	uploaded: "Đã tải lên",
	processing: "Đang xử lý",
	active: "Đang hoạt động",
	failed: "Lỗi xử lý",
	inactive: "Tạm ngưng",
};

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

export default function TeacherDocumentManagingPage() {
	const [courses, setCourses] = useState([]);
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [documents, setDocuments] = useState([]);
	const [courseLoading, setCourseLoading] = useState(true);
	const [documentsLoading, setDocumentsLoading] = useState(false);
	const [error, setError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadCourseId, setUploadCourseId] = useState("");
	const [actionDocumentId, setActionDocumentId] = useState("");
	const [isDeleteDocumentOpen, setIsDeleteDocumentOpen] = useState(false);
	const [pendingDeleteDocument, setPendingDeleteDocument] = useState(null);
	const [uploadForm, setUploadForm] = useState({
		title: "",
		version: "v1.0",
		description: "",
		file: null,
	});

	const loadCourses = async () => {
		setCourseLoading(true);
		setError("");

		try {
			const response = await teacherService.listCourses();
			setCourses(response.courses);
			setSelectedCourseId((current) => current || response.courses[0]?.id || "");
		} catch (loadError) {
			setError(loadError?.response?.data?.message || loadError?.message || "Không tải được danh sách môn học.");
		} finally {
			setCourseLoading(false);
		}
	};

	const loadDocuments = async (courseId) => {
		if (!courseId) {
			setDocuments([]);
			return;
		}

		setDocumentsLoading(true);
		setError("");

		try {
			const response = await teacherService.listCourseDocuments(
				courseId,
				statusFilter === "ALL" ? {} : { status: statusFilter },
			);
			setDocuments(response.documents);
		} catch (loadError) {
			setError(loadError?.response?.data?.message || loadError?.message || "Không tải được tài liệu.");
		} finally {
			setDocumentsLoading(false);
		}
	};

	useEffect(() => {
		loadCourses();
	}, []);

	useEffect(() => {
		if (!courseLoading) {
			loadDocuments(selectedCourseId);
		}
	}, [selectedCourseId, statusFilter, courseLoading]);

	const filteredDocuments = useMemo(() => {
		const keyword = searchQuery.trim().toLowerCase();
		if (!keyword) {
			return documents;
		}

		return documents.filter((doc) => {
			const haystack = `${doc.title} ${doc.fileName} ${doc.description}`.toLowerCase();
			return haystack.includes(keyword);
		});
	}, [documents, searchQuery]);

	const stats = useMemo(
		() => [
			{ label: "Tổng tài liệu", value: documents.length },
			{
				label: "Đang hoạt động",
				value: documents.filter((item) => item.status === "active").length,
			},
			{
				label: "Đang xử lý",
				value: documents.filter((item) => item.status === "processing").length,
			},
			{
				label: "Tạm ngưng",
				value: documents.filter((item) => item.status === "inactive").length,
			},
		],
		[documents],
	);

	const resetUploadForm = () => {
		setUploadForm({
			title: "",
			version: "v1.0",
			description: "",
			file: null,
		});
		setUploadCourseId("");
	};

	const handleUpload = async () => {
		if (!uploadCourseId) {
			toast.error("Chưa có course để upload tài liệu");
			return;
		}

		if (!uploadForm.title || !uploadForm.version || !uploadForm.file) {
			toast.error("Vui lòng chọn file, title và version");
			return;
		}

		const formData = new FormData();
		formData.append("file", uploadForm.file);
		formData.append("title", uploadForm.title);
		formData.append("version", uploadForm.version);
		formData.append("description", uploadForm.description);

		setUploading(true);

		try {
			const response = await teacherService.uploadDocument(uploadCourseId, formData);
			toast.success(response.message || "Upload tài liệu thành công");
			setIsUploadOpen(false);
			resetUploadForm();
			if (selectedCourseId !== uploadCourseId) {
				setSelectedCourseId(uploadCourseId);
			}
			await loadDocuments(uploadCourseId);
		} catch (uploadError) {
			toast.error(uploadError?.response?.data?.message || uploadError?.message || "Upload thất bại");
		} finally {
			setUploading(false);
		}
	};

	const handleReindex = async (documentId) => {
		setActionDocumentId(documentId);
		try {
			const response = await teacherService.reindexDocument(documentId);
			toast.success(response.message || "Đã gửi yêu cầu reindex");
			await loadDocuments(selectedCourseId);
		} catch (actionError) {
			toast.error(actionError?.response?.data?.message || actionError?.message || "Reindex thất bại");
		} finally {
			setActionDocumentId("");
		}
	};

	const handleToggleStatus = async (document) => {
		const nextStatus = document.status === "active" ? "inactive" : "active";
		setActionDocumentId(document.id);

		try {
			const response = await teacherService.updateDocumentStatus(document.id, nextStatus);
			toast.success(response.message || "Cập nhật trạng thái thành công");
			await loadDocuments(selectedCourseId);
		} catch (actionError) {
			toast.error(actionError?.response?.data?.message || actionError?.message || "Cập nhật trạng thái thất bại");
		} finally {
			setActionDocumentId("");
		}
	};

	const handleEditDocument = async (document) => {
		const nextTitle = window.prompt("Sửa tiêu đề tài liệu:", document.title || "");
		if (nextTitle === null) return;

		const nextVersion = window.prompt("Sửa version:", document.version || "");
		if (nextVersion === null) return;

		const nextDescription = window.prompt("Sửa mô tả:", document.description || "") || "";

		if (!nextTitle.trim() || !nextVersion.trim()) {
			toast.error("Title và version không được để trống");
			return;
		}

		setActionDocumentId(document.id);
		try {
			const response = await teacherService.updateDocumentMetadata(document.id, {
				title: nextTitle.trim(),
				version: nextVersion.trim(),
				description: nextDescription.trim(),
			});
			toast.success(response.message || "Cập nhật tài liệu thành công");
			await loadDocuments(selectedCourseId);
		} catch (actionError) {
			toast.error(actionError?.response?.data?.message || actionError?.message || "Cập nhật tài liệu thất bại");
		} finally {
			setActionDocumentId("");
		}
	};

	const requestDeleteDocument = (document) => {
		setPendingDeleteDocument(document);
		setIsDeleteDocumentOpen(true);
	};

	const handleDeleteDocument = async () => {
		if (!pendingDeleteDocument?.id) {
			return;
		}

		setActionDocumentId(pendingDeleteDocument.id);
		try {
			const response = await teacherService.deleteDocument(pendingDeleteDocument.id);
			toast.success(response.message || "Xóa tài liệu thành công");
			setIsDeleteDocumentOpen(false);
			setPendingDeleteDocument(null);
			await loadDocuments(selectedCourseId);
		} catch (actionError) {
			toast.error(actionError?.response?.data?.message || actionError?.message || "Xóa tài liệu thất bại");
		} finally {
			setActionDocumentId("");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h1 className="text-3xl font-bold">Quản lí tài liệu</h1>
					<p className="mt-1 text-muted-foreground">
						Danh sách tài liệu đang lấy trực tiếp từ teacher document APIs.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" className="gap-2" onClick={() => loadDocuments(selectedCourseId)}>
						<RefreshCw size={18} />
						Làm mới
					</Button>
					<Button
						className="gap-2"
						size="lg"
						onClick={() => {
							setUploadCourseId(selectedCourseId || "");
							setIsUploadOpen(true);
						}}
					>
						<Upload size={20} />
						Tải lên tài liệu
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Card key={stat.label}>
						<CardContent className="pt-6">
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Chọn course và lọc tài liệu</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="mb-2 block text-sm font-medium">Course</label>
						<div className="flex flex-wrap gap-2">
							{courses.map((course) => (
								<Button
									key={course.id}
									variant={selectedCourseId === course.id ? "default" : "outline"}
									size="sm"
									onClick={() => setSelectedCourseId(course.id)}
								>
									{course.code} - {course.name}
								</Button>
							))}
						</div>
					</div>

					<div className="grid gap-4 lg:grid-cols-2">
						<div>
							<label className="mb-2 block text-sm font-medium">Tìm kiếm</label>
							<div className="relative">
								<Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
								<Input
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									placeholder="Tìm theo title, file name, mô tả"
									className="pl-10"
								/>
							</div>
						</div>

						<div>
							<label className="mb-2 block text-sm font-medium">Trạng thái</label>
							<select
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value)}
								className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
							>
								<option value="ALL">Tất cả</option>
								<option value="uploaded">Đã tải lên</option>
								<option value="processing">Đang xử lý</option>
								<option value="active">Đang hoạt động</option>
								<option value="failed">Lỗi xử lý</option>
								<option value="inactive">Tạm ngưng</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Danh sách tài liệu ({filteredDocuments.length})</CardTitle>
				</CardHeader>
				<CardContent>
					{courseLoading ? (
						<LoadingState />
					) : error ? (
						<ErrorState message={error} onRetry={() => (selectedCourseId ? loadDocuments(selectedCourseId) : loadCourses())} />
					) : documentsLoading ? (
						<LoadingState />
					) : filteredDocuments.length > 0 ? (
						<div className="space-y-3">
							{filteredDocuments.map((doc) => (
								<div
									key={doc.id}
									className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-accent lg:flex-row lg:items-center lg:justify-between"
								>
									<div className="flex flex-1 items-start gap-4">
										<FileText size={24} className="mt-1 flex-shrink-0 text-blue-500" />
										<div className="min-w-0 flex-1">
											<h4 className="font-medium">{doc.title}</h4>
											<p className="mt-1 text-sm text-muted-foreground">{doc.fileName}</p>
											<div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
												<span>{formatFileSize(doc.size)}</span>
												<span>•</span>
												<span>{new Date(doc.createdAt).toLocaleDateString("vi-VN")}</span>
												<span>•</span>
												<span
													className={`rounded px-2 py-1 ${
														doc.status === "active"
															? "bg-green-100 text-green-800"
															: doc.status === "processing"
															? "bg-blue-100 text-blue-800"
															: doc.status === "failed"
															? "bg-rose-100 text-rose-800"
															: "bg-slate-100 text-slate-800"
													}`}
												>
													{statusLabels[doc.status]}
												</span>
											</div>
											{doc.description ? (
												<p className="mt-2 text-sm text-muted-foreground">{doc.description}</p>
											) : null}
											{doc.aiErrorMessage ? (
												<p className="mt-2 text-sm text-rose-600">{doc.aiErrorMessage}</p>
											) : null}
										</div>
									</div>
									<div className="flex flex-wrap gap-2 lg:justify-end">
										<Button
											variant="outline"
											size="sm"
											disabled={actionDocumentId === doc.id || doc.status === "processing"}
											onClick={() => handleReindex(doc.id)}
										>
											Reindex
										</Button>
										<Button
											variant="outline"
											size="sm"
											disabled={actionDocumentId === doc.id}
											onClick={() => handleEditDocument(doc)}
										>
											Sửa
										</Button>
										<Button
											variant="secondary"
											size="sm"
											disabled={actionDocumentId === doc.id || !["active", "inactive"].includes(doc.status)}
											onClick={() => handleToggleStatus(doc)}
										>
											{doc.status === "active" ? "Tạm ngưng" : "Kích hoạt"}
										</Button>
										<Button
											variant="destructive"
											size="sm"
											disabled={actionDocumentId === doc.id}
											onClick={() => requestDeleteDocument(doc)}
										>
											Xóa
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<EmptyState
							title="Không tìm thấy tài liệu nào"
							description="Hãy đổi bộ lọc hoặc tải lên tài liệu mới cho course đang chọn."
						/>
					)}
				</CardContent>
			</Card>

			{isDeleteDocumentOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card className="w-full max-w-md">
						<CardHeader>
							<CardTitle>Xác nhận xóa tài liệu</CardTitle>
							<p className="text-sm text-muted-foreground">
								Bạn có chắc muốn xóa tài liệu {pendingDeleteDocument?.title || "này"}?
							</p>
						</CardHeader>
						<CardContent className="flex gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => {
									setIsDeleteDocumentOpen(false);
									setPendingDeleteDocument(null);
								}}
							>
								Hủy
							</Button>
							<Button
								variant="destructive"
								className="flex-1"
								disabled={!pendingDeleteDocument || actionDocumentId === pendingDeleteDocument?.id}
								onClick={handleDeleteDocument}
							>
								Xác nhận xóa
							</Button>
						</CardContent>
					</Card>
				</div>
			) : null}

			{isUploadOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card className="w-full max-w-lg">
						<CardHeader>
							<CardTitle>Tải lên tài liệu cho course</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="mb-2 block text-sm font-medium">Môn học</label>
								<select
									value={uploadCourseId}
									onChange={(event) => setUploadCourseId(event.target.value)}
									className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								>
									<option value="">None</option>
									{courses.map((course) => (
										<option key={course.id} value={course.id}>
											{course.code} - {course.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium">Title</label>
								<Input
									value={uploadForm.title}
									onChange={(event) =>
										setUploadForm((current) => ({ ...current, title: event.target.value }))
									}
									placeholder="Ví dụ: Aircraft Safety Manual"
								/>
							</div>
							<div className="grid gap-4 lg:grid-cols-2">
								<div>
									<label className="mb-2 block text-sm font-medium">Version</label>
									<Input
										value={uploadForm.version}
										onChange={(event) =>
											setUploadForm((current) => ({ ...current, version: event.target.value }))
										}
									/>
								</div>
								<div>
									<label className="mb-2 block text-sm font-medium">File</label>
									<Input
										type="file"
										accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
										onChange={(event) =>
											setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))
										}
									/>
								</div>
							</div>
							<div>
								<label className="mb-2 block text-sm font-medium">Description</label>
								<textarea
									value={uploadForm.description}
									onChange={(event) =>
										setUploadForm((current) => ({ ...current, description: event.target.value }))
									}
									rows="4"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									placeholder="Mô tả nội dung tài liệu"
								/>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => {
										setIsUploadOpen(false);
										resetUploadForm();
									}}
								>
									Hủy
								</Button>
								<Button className="flex-1" isLoading={uploading} onClick={handleUpload}>
									Tải lên
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}