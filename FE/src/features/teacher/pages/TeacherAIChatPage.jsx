import { useState } from "react";
import { Send, MessageCircle, Lightbulb, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";

// Mock conversation history
const mockConversationHistory = [
	{
		id: 1,
		role: "teacher",
		content: "Tôi muốn tạo bài kiểm tra về nguyên tắc an toàn hàng không cơ bản.",
		timestamp: "2 giờ trước",
	},
	{
		id: 2,
		role: "ai",
		content:
			"Tôi có thể giúp bạn tạo bài kiểm tra. Dựa trên tài liệu của bạn, tôi đề xuất các câu hỏi về: 1) Quy trình sơ tán khẩn cấp, 2) Hệ thống báo cháy, 3) Kiểm tra an toàn tiền bay. Bạn muốn tập trung vào lĩnh vực nào?",
		timestamp: "2 giờ trước",
	},
	{
		id: 3,
		role: "teacher",
		content: "Tập trung vào kiểm tra an toàn tiền bay",
		timestamp: "1 giờ 45 phút trước",
	},
	{
		id: 4,
		role: "ai",
		content:
			"Xuất sắc. Tôi sẽ tạo 15 câu hỏi trắc nghiệm dựa trên các thủ tục kiểm tra tiền bay. Các câu hỏi sẽ bao gồm:\n- Danh sách kiểm tra chuẩn (10 câu)\n- Tình huống thực tế (5 câu)\n\nBạn có muốn tôi bắt đầu tạo bây giờ?",
		timestamp: "1 giờ 45 phút trước",
	},
];

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
	const [messages, setMessages] = useState(mockConversationHistory);
	const [inputValue, setInputValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSendMessage = () => {
		if (!inputValue.trim()) return;

		const userMessage = {
			id: messages.length + 1,
			role: "teacher",
			content: inputValue,
			timestamp: "Vừa xong",
		};
		setMessages([...messages, userMessage]);
		setInputValue("");

		setIsLoading(true);
		setTimeout(() => {
			const aiMessage = {
				id: messages.length + 2,
				role: "ai",
				content:
					"Tôi sẽ giúp bạn với yêu cầu này. Hãy cung cấp thêm chi tiết hoặc chọn một trong những tùy chọn dưới đây.",
				timestamp: "Vừa xong",
			};
			setMessages((prev) => [...prev, aiMessage]);
			setIsLoading(false);
		}, 1500);
	};

	const handleSuggestedPrompt = (prompt) => {
		setInputValue(prompt);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold">Trợ lý AI</h1>
				<p className="text-muted-foreground mt-1">
					Hỏi AI để tạo bài kiểm tra, giải thích nội dung, và nhận gợi ý giảng dạy
				</p>
			</div>

			{/* Chat Container */}
			<Card className="flex flex-col h-[600px]">
				{/* Messages */}
				<CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
					{messages.length === 0 ? (
						<div className="flex items-center justify-center h-full">
							<div className="text-center">
								<MessageCircle
									size={48}
									className="mx-auto mb-4 text-muted-foreground/50"
								/>
								<p className="text-muted-foreground">
									Bắt đầu trò chuyện với AI
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
									className={`max-w-xs px-4 py-2 rounded-lg ${
										msg.role === "teacher"
											? "bg-blue-500 text-white rounded-br-none"
											: "bg-gray-200 text-gray-900 rounded-bl-none"
									}`}
								>
									<p className="text-sm break-words whitespace-pre-wrap">
										{msg.content}
									</p>
									<p
										className={`text-xs mt-1 ${
											msg.role === "teacher"
												? "text-blue-100"
												: "text-gray-600"
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
							<div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
								<div className="flex gap-2">
									<div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
									<div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
									<div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
								</div>
							</div>
						</div>
					)}
				</CardContent>

				{/* Input */}
				<div className="border-t p-4 space-y-3">
					<div className="flex gap-2">
						<Input
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyPress={(e) => {
								if (e.key === "Enter") handleSendMessage();
							}}
							placeholder="Hỏi AI..."
							className="flex-1"
							disabled={isLoading}
						/>
						<Button
							onClick={handleSendMessage}
							disabled={isLoading || !inputValue.trim()}
							size="icon"
						>
							<Send size={20} />
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
								className="cursor-pointer hover:shadow-md transition-shadow"
								onClick={() => handleSuggestedPrompt(prompt.title)}
							>
								<CardContent className="p-4">
									<Icon className="w-5 h-5 mb-2 text-blue-500" />
									<h4 className="font-medium text-sm">
										{prompt.title}
									</h4>
									<p className="text-xs text-muted-foreground">
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
