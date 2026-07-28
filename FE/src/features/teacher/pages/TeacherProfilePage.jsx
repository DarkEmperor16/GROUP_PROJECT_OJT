import { useEffect, useState } from "react";
import {
	Camera,
	GraduationCap,
	Mail,
	Shield,
	Sparkles,
	User,
	UserSquare2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import { teacherService } from "@/features/teacher/services";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const mockProfile = {
	fullName: "PGS.TS. Nguyễn Văn A",
	title: "Giảng viên cao cấp",
	email: "nguyenvana@hkh.edu.vn",
	major: "Kỹ thuật hàng không",
	teacherId: "GV-2024-0892",
	photoUrl: "https://i.pravatar.cc/160?img=13",
	mfaEnabled: false,
};

const mockAiStatus = {
	accuracy: 98.5,
	lectureCount: 12,
	monthlySupportCount: 245,
};

function normalizeMajorText(value) {
	if (!value) {
		return value;
	}

	return value.trim().toLowerCase() === "ky thuat hang khong"
		? "Kỹ thuật hàng không"
		: value;
}

export default function TeacherProfilePage() {
	const authUser = useAuthStore((state) => state.user);
	const [profile, setProfile] = useState(mockProfile);
	const [aiStatus, setAiStatus] = useState(mockAiStatus);
	const [loading, setLoading] = useState(true);
	const [isMockData, setIsMockData] = useState(true);

	const [personalForm, setPersonalForm] = useState({
		fullName: mockProfile.fullName,
		email: mockProfile.email,
		major: normalizeMajorText(mockProfile.major),
		title: mockProfile.title,
	});

	const [notifySystem, setNotifySystem] = useState(true);
	const [weeklyEmail, setWeeklyEmail] = useState(false);

	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		let mounted = true;

		async function loadData() {
			setLoading(true);

			try {
				const [profileRes, aiStatusRes] = await Promise.allSettled([
					teacherService.getProfile(),
					teacherService.getAiStatus(),
				]);

				if (!mounted) {
					return;
				}

				if (profileRes.status === "fulfilled" || aiStatusRes.status === "fulfilled") {
					const profileData = profileRes.status === "fulfilled" ? profileRes.value : {};
					const aiData = aiStatusRes.status === "fulfilled" ? aiStatusRes.value : {};

					const mergedProfile = {
						...mockProfile,
						...profileData,
						fullName: profileData.fullName || authUser?.fullName || mockProfile.fullName,
						email: profileData.email || authUser?.email || mockProfile.email,
						major: normalizeMajorText(profileData.major || mockProfile.major),
					};

					const mergedAi = {
						...mockAiStatus,
						...aiData,
					};

					setProfile(mergedProfile);
					setAiStatus(mergedAi);
					setPersonalForm({
						fullName: mergedProfile.fullName,
						email: mergedProfile.email,
						major: mergedProfile.major,
						title: mergedProfile.title,
					});
					setIsMockData(false);
				} else {
					setProfile((prev) => ({
						...prev,
						fullName: authUser?.fullName || prev.fullName,
						email: authUser?.email || prev.email,
					}));
					setPersonalForm((prev) => ({
						...prev,
						fullName: authUser?.fullName || prev.fullName,
						email: authUser?.email || prev.email,
					}));
					setIsMockData(true);
				}
			} catch {
				if (mounted) {
					setIsMockData(true);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		}

		loadData();

		return () => {
			mounted = false;
		};
	}, [authUser?.email, authUser?.fullName]);

	const handlePersonalFormChange = (field, value) => {
		setPersonalForm((prev) => ({
			...prev,
			[field]: field === "major" ? normalizeMajorText(value) : value,
		}));
	};

	const handleSavePersonalInfo = async () => {
		try {
			await teacherService.updateProfile(personalForm);
			setProfile((prev) => ({ ...prev, ...personalForm }));
			setIsMockData(false);
			toast.success("Đã lưu thông tin cá nhân");
		} catch {
			toast.error("Không lưu được thông tin cá nhân");
		}
	};

	const handleToggleMfa = async () => {
		const nextValue = !profile.mfaEnabled;

		try {
			await teacherService.updateMfa(nextValue);
			setProfile((prev) => ({ ...prev, mfaEnabled: nextValue }));
			setIsMockData(false);
			toast.success(nextValue ? "Đã kích hoạt MFA" : "Đã tắt MFA");
		} catch {
			toast.error("Không cập nhật được MFA");
		}
	};

	const handlePasswordFormChange = (field, value) => {
		setPasswordForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleChangePassword = async () => {
		if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
			toast.error("Vui lòng nhập đầy đủ thông tin mật khẩu");
			return;
		}

		if (passwordForm.newPassword.length < 6) {
			toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error("Xác nhận mật khẩu không khớp");
			return;
		}

		try {
			await teacherService.changePassword({
				oldPassword: passwordForm.oldPassword,
				newPassword: passwordForm.newPassword,
			});
			setIsMockData(false);
			toast.success("Đổi mật khẩu thành công");
		} catch {
			toast.error("Đổi mật khẩu thất bại");
		} finally {
			setPasswordForm({
				oldPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			setIsPasswordModalOpen(false);
		}
	};

	return (
		<div className="space-y-5">
			<div>
				<h1 className="text-2xl font-bold">Hồ sơ giảng viên</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản.
				</p>
				<span
					className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
						isMockData ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
					}`}
				>
					Nguồn dữ liệu: {isMockData ? "Mock" : "API"}
				</span>
			</div>

			<div className="grid gap-4 xl:grid-cols-[300px_1fr]">
				<div className="space-y-4">
					<Card>
						<CardContent className="pt-6">
							<div className="relative mx-auto w-fit">
								<img
									src={profile.photoUrl}
									alt="Teacher profile"
									className="h-28 w-28 rounded-2xl border object-cover"
								/>
								<button
									type="button"
									className="absolute -bottom-2 -right-2 rounded-lg bg-primary p-2 text-primary-foreground"
								>
									<Camera className="h-4 w-4" aria-hidden />
								</button>
							</div>

							<div className="mt-4 text-center">
								<p className="text-lg font-semibold">{profile.fullName}</p>
								<span className="mt-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
									{profile.title}
								</span>
							</div>

							<Separator className="my-4" />

							<div className="space-y-3 text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<Mail className="h-4 w-4" aria-hidden />
									<span>{profile.email}</span>
								</div>
								<div className="flex items-center gap-2">
									<GraduationCap className="h-4 w-4" aria-hidden />
									<span>{profile.major}</span>
								</div>
								<div className="flex items-center gap-2">
									<UserSquare2 className="h-4 w-4" aria-hidden />
									<span>ID: {profile.teacherId}</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Cài đặt nhanh</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 pt-0">
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="text-sm font-medium">Thông báo hệ thống</p>
								</div>
								<button
									type="button"
									onClick={() => setNotifySystem((prev) => !prev)}
									className={`relative h-7 w-12 rounded-full transition ${
										notifySystem ? "bg-primary" : "bg-muted"
									}`}
								>
									<span
										className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
											notifySystem ? "left-6" : "left-1"
										}`}
									/>
								</button>
							</div>

							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="text-sm font-medium">Email báo cáo tuần</p>
								</div>
								<button
									type="button"
									onClick={() => setWeeklyEmail((prev) => !prev)}
									className={`relative h-7 w-12 rounded-full transition ${
										weeklyEmail ? "bg-primary" : "bg-muted"
									}`}
								>
									<span
										className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
											weeklyEmail ? "left-6" : "left-1"
										}`}
									/>
								</button>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<User className="h-4 w-4 text-primary" aria-hidden />
								Thông tin cá nhân
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4 pt-0 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Họ và tên</Label>
								<Input
									value={personalForm.fullName}
									onChange={(event) => handlePersonalFormChange("fullName", event.target.value)}
									disabled={loading}
								/>
							</div>

							<div className="space-y-2">
								<Label>Email</Label>
								<Input
									type="email"
									value={personalForm.email}
									onChange={(event) => handlePersonalFormChange("email", event.target.value)}
									disabled={loading}
								/>
							</div>

							<div className="space-y-2">
								<Label>Chuyên ngành</Label>
								<Input
									value={personalForm.major}
									onChange={(event) => handlePersonalFormChange("major", event.target.value)}
									disabled={loading}
								/>
							</div>

							<div className="space-y-2">
								<Label>Chức vụ</Label>
								<select
									className="h-12 w-full rounded-xl border border-input/80 bg-muted/40 px-4 py-2 text-sm"
									value={personalForm.title}
									onChange={(event) => handlePersonalFormChange("title", event.target.value)}
									disabled={loading}
								>
										<option value="Giảng viên">Giảng viên</option>
										<option value="Giảng viên chính">Giảng viên chính</option>
										<option value="Giảng viên cao cấp">Giảng viên cao cấp</option>
								</select>
							</div>

							<div className="md:col-span-2 md:text-right">
								<Button onClick={handleSavePersonalInfo} disabled={loading}>
									Lưu thay đổi
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<Shield className="h-4 w-4 text-primary" aria-hidden />
								Bảo mật tài khoản
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5 pt-0">
							<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
								<div>
									<p className="font-medium">Đổi mật khẩu</p>
									<p className="text-sm text-muted-foreground">
										Cập nhật mật khẩu định kỳ để bảo vệ tài khoản.
									</p>
								</div>
								<Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
									Thay đổi mật khẩu
								</Button>
							</div>

							<Separator />

							<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
								<div>
									<p className="font-medium">Xác thực 2 lớp (MFA)</p>
									<p className="text-sm text-muted-foreground">
										Thêm lớp bảo mật khi đăng nhập tài khoản giảng viên.
									</p>
								</div>
								<Button onClick={handleToggleMfa}>
									{profile.mfaEnabled ? "Tắt MFA" : "Kích hoạt MFA"}
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="border-primary/20 bg-gradient-to-r from-primary to-sky-700 text-white">
						<CardHeader>
							<CardTitle className="flex items-center justify-between text-base text-white">
								Trạng thái hoạt động AI
								<Sparkles className="h-5 w-5" aria-hidden />
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<p className="text-sm text-white/90">
								Hệ thống trợ lý AI đã hỗ trợ trả lời {aiStatus.monthlySupportCount} câu hỏi từ sinh viên trong học kỳ này.
							</p>

							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								<div>
									<p className="text-3xl font-bold">{aiStatus.accuracy}%</p>
									<p className="text-xs uppercase tracking-[0.15em] text-white/80">Độ chính xác AI</p>
								</div>
								<div>
									<p className="text-3xl font-bold">{aiStatus.lectureCount}</p>
									<p className="text-xs uppercase tracking-[0.15em] text-white/80">Bài giảng số</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{isPasswordModalOpen && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
					<div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
						<h2 className="text-xl font-semibold">Thay đổi mật khẩu</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Nhập đầy đủ thông tin để cập nhật mật khẩu mới.
						</p>

						<div className="mt-5 space-y-4">
							<div className="space-y-2">
								<Label>Mật khẩu cũ</Label>
								<Input
									type="password"
									value={passwordForm.oldPassword}
									onChange={(event) => handlePasswordFormChange("oldPassword", event.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>Mật khẩu mới</Label>
								<Input
									type="password"
									value={passwordForm.newPassword}
									onChange={(event) => handlePasswordFormChange("newPassword", event.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>Xác nhận mật khẩu</Label>
								<Input
									type="password"
									value={passwordForm.confirmPassword}
									onChange={(event) => handlePasswordFormChange("confirmPassword", event.target.value)}
								/>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
								Hủy bỏ
							</Button>
							<Button onClick={handleChangePassword}>Cập nhật mật khẩu</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
