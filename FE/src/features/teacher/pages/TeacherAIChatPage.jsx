import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Lightbulb, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { teacherService } from "@/features/teacher/services";
import { toast } from "sonner";

const renderMessage = (content) => {
	if (!content) return null;
	const parts = content.split(/(\*\*.*?\*\*)/g);
	return parts.map((part, index) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return <strong key={index} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
		}
		return <span key={index}>{part}</span>;
	});
};

const suggestedPrompts = [
	{
		icon: Lightbulb,
		title: "Tạo bài kiểm tra",
		description: "Tạo bài tập trắc nghiệm từ tài liệu",
	},
	{
		icon: BookOpen,
		title: "Giải thích khái niệm",
		description: "Giải thích các khái niệm phức tạp",
	},
	{
		icon: AlertCircle,
		title: "Xác định khó khăn",
		description: "Phân tích câu hỏi học viên gặp khó khăn",
	},
	{
		icon: MessageCircle,
		title: "Đề xuất nội dung",
		description: "Đề xuất thêm chủ đề cần dạy",
	},
];

export default function TeacherAIChatPage() {
	const [messages, setMessages] = useState([]);
	const [inputValue, setInputValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	
	const [courses, setCourses] = useState([]);
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [isLoadingCourses, setIsLoadingCourses] = useState(true);

	const messagesEndRef = useRef(null);

	// Tự động cuộn xuống tin nhắn mới nhất
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, isLoading]);

	// Load danh sách khóa học để làm context cho AI
	useEffect(() => {
		const loadCourses = async () => {
			try {
				const data = await teacherService.listCourses();
				// data trả về có thể là array hoặc object có property courses/data
				const courseList = Array.isArray(data) ? data : data.courses || data.data || [];
				setCourses(courseList);
				
				if (courseList.length > 0) {
					setSelectedCourseId(courseList[0].id || courseList[0]._id);
				}
			} catch (error) {
				toast.error("Không thể tải danh sách khóa học");
				console.error(error);
			} finally {
				setIsLoadingCourses(false);
			}
		};
		loadCourses();
	}, []);

	const handleSendMessage = async () => {
		if (!inputValue.trim()) return;

		const userText = inputValue;
		
		const userMessage = {
			id: Date.now(),
			role: "teacher",
			content: userText,
			timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
		};
		
		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");
		setIsLoading(true);

		try {
			// Gọi API thực tế
			const payload = { question: userText };
			if (selectedCourseId) {
				payload.courseId = selectedCourseId;
			}
			
			const response = await teacherService.askAiChat(payload);
			
			const aiMessage = {
				id: Date.now() + 1,
				role: "ai",
				content: response.answer || "Không có câu trả lời từ AI.",
				timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
			};
			setMessages((prev) => [...prev, aiMessage]);
		} catch (error) {
			toast.error(error?.response?.data?.message || error.message || "Lỗi khi kết nối tới AI");
			const errorMessage = {
				id: Date.now() + 1,
				role: "ai",
				content: "Xin lỗi, đã xảy ra lỗi trong quá trình xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
				timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSuggestedPrompt = (prompt) => {
		setInputValue(prompt);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold">Trợ lý AI</h1>
					<p className="text-muted-foreground mt-1">
						Hỏi AI để tạo bài kiểm tra, giải thích nội dung, và nhận gợi ý giảng dạy
					</p>
				</div>
				
				{/* Context Selector */}
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium whitespace-nowrap">Khóa học:</span>
					{isLoadingCourses ? (
						<div className="h-10 w-48 bg-muted rounded-md animate-pulse"></div>
					) : (
						<select
							className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring"
							value={selectedCourseId}
							onChange={(e) => setSelectedCourseId(e.target.value)}
						>
							<option value="">-- Chọn khóa học --</option>
							{courses.map((course) => (
								<option key={course.id || course._id} value={course.id || course._id}>
									{course.code} - {course.name}
								</option>
							))}
						</select>
					)}
				</div>
			</div>

			{/* Chat Container */}
			<Card className="flex flex-col h-[600px]">
				{/* Messages */}
				<CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
					{messages.length === 0 ? (
						<div className="flex items-center justify-center h-full">
							<div className="text-center max-w-md">
								<MessageCircle
									size={48}
									className="mx-auto mb-4 text-muted-foreground/50"
								/>
								<p className="text-muted-foreground mb-2">
									Bắt đầu trò chuyện với AI
								</p>
								<p className="text-xs text-muted-foreground/70">
									AI sẽ trả lời dựa trên các tài liệu đã được tải lên cho khóa học bạn chọn ở phía trên.
								</p>
							</div>
						</div>
					) : (
						messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex ${
									msg.role === "teacher"
										? "justify-end"
										: "justify-start"
								}`}
							>
								<div
									className={`max-w-[75%] px-4 py-3 rounded-lg ${
										msg.role === "teacher"
											? "bg-blue-500 text-white rounded-br-none shadow-sm"
											: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none shadow-sm border"
									}`}
								>
									<div className="text-sm break-words whitespace-pre-wrap leading-relaxed">
										{renderMessage(msg.content)}
									</div>
									<p
										className={`text-[10px] mt-2 text-right ${
											msg.role === "teacher"
												? "text-blue-100"
												: "text-gray-500"
										}`}
									>
										{msg.timestamp}
									</p>
								</div>
							</div>
						))
					)}
					{isLoading && (
						<div className="flex justify-start">
							<div className="bg-gray-100 dark:bg-gray-800 border px-4 py-3 rounded-lg rounded-bl-none shadow-sm flex items-center gap-2">
								<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
								<span className="text-sm text-muted-foreground">AI đang suy nghĩ...</span>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</CardContent>

				{/* Input */}
				<div className="border-t p-4 space-y-3 bg-muted/30">
					<div className="flex gap-2">
						<Input
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyPress={(e) => {
								if (e.key === "Enter") handleSendMessage();
							}}
							placeholder="Hỏi AI về bài giảng, tài liệu..."
							className="flex-1 shadow-sm"
							disabled={isLoading}
						/>
						<Button
							onClick={handleSendMessage}
							disabled={isLoading || !inputValue.trim()}
							className="shadow-sm px-6"
						>
							<Send size={18} className="mr-2" />
							Gửi
						</Button>
					</div>
				</div>
			</Card>

			{/* Suggested Prompts */}
			<div>
				<h3 className="font-semibold mb-3">Gợi ý</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
					{suggestedPrompts.map((prompt, idx) => {
						const Icon = prompt.icon;
						return (
							<Card
								key={idx}
								className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all active:scale-[0.98]"
								onClick={() => handleSuggestedPrompt(prompt.title)}
							>
								<CardContent className="p-4">
									<Icon className="w-5 h-5 mb-2 text-blue-500" />
									<h4 className="font-medium text-sm">
										{prompt.title}
									</h4>
									<p className="text-xs text-muted-foreground mt-1">
										{prompt.description}
									</p>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</div>
	);
}
