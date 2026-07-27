import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studentChatService, studentChatQueryKeys, type SendMessagePayload, type ChatMessage } from "../services";

export function useStudentChatHistoryQuery(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: studentChatQueryKeys.history(courseId || ""),
    queryFn: () => studentChatService.getHistory(courseId || ""),
    enabled: enabled && !!courseId,
    staleTime: 5000,
  });
}

export function useSendStudentMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => studentChatService.sendMessage(payload),
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: studentChatQueryKeys.history(newMessage.courseId),
      });

      // Snapshot the previous value
      const previousHistory = queryClient.getQueryData<ChatMessage[]>(
        studentChatQueryKeys.history(newMessage.courseId)
      );

      // Optimistically add the student's message
      const studentMsg: ChatMessage = {
        id: `temp-student-${Date.now()}`,
        sender: "student",
        text: newMessage.text,
        timestamp: new Date().toISOString(),
      };

      // Optimistically add a temporary "thinking" AI message
      const aiThinkingMsg: ChatMessage = {
        id: "temp-ai-thinking",
        sender: "ai",
        text: "...",
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(
        studentChatQueryKeys.history(newMessage.courseId),
        (old) => [...(old ?? []), studentMsg, aiThinkingMsg]
      );

      return { previousHistory };
    },
    onSuccess: (aiReply, variables) => {
      // Replace the temporary thinking message with the real AI reply
      queryClient.setQueryData<ChatMessage[]>(
        studentChatQueryKeys.history(variables.courseId),
        (old) => {
          if (!old) return [aiReply];
          const filtered = old.filter((m) => m.id !== "temp-ai-thinking");
          return [...filtered, aiReply];
        }
      );
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous state on error
      if (context?.previousHistory) {
        queryClient.setQueryData(
          studentChatQueryKeys.history(variables.courseId),
          context.previousHistory
        );
      }
      const message =
        error.response?.data?.message ||
        error.message ||
        "Could not send message. Please try again.";
      toast.error("Error", {
        description: message,
      });
    },
    onSettled: (_data, _error, variables) => {
      // Sync with server
      queryClient.invalidateQueries({
        queryKey: studentChatQueryKeys.history(variables.courseId),
      });
    },
  });
}
