import apiClient from "@/lib/axios";
import { API_ENDPOINTS, QUERY_KEYS } from "@/shared/constants";

export interface ChatMessage {
  id: string;
  sender: "student" | "ai";
  text: string;
  timestamp: string;
}

export interface SendMessagePayload {
  courseId: string;
  text: string;
}

interface BackendHistoryResult {
  data?: ChatMessage[];
  messages?: ChatMessage[];
  result?: {
    data?: ChatMessage[];
    messages?: ChatMessage[];
  };
}

interface BackendSendResult {
  data?: ChatMessage;
  message?: ChatMessage | string;
  reply?: string;
  text?: string;
  result?: {
    data?: ChatMessage;
    message?: ChatMessage | string;
    reply?: string;
    text?: string;
  };
}

function normalizeHistoryResponse(payload: BackendHistoryResult): ChatMessage[] {
  const body = payload.result ?? payload;
  const data = body.data ?? body.messages ?? payload.messages ?? payload.data ?? [];
  return data;
}

function normalizeSendResponse(payload: BackendSendResult): ChatMessage {
  const body = payload.result ?? payload;
  
  // Handle case where BE returns a full ChatMessage object
  if (body.data && typeof body.data === "object" && "text" in body.data) {
    return body.data as ChatMessage;
  }
  if (payload.data && typeof payload.data === "object" && "text" in payload.data) {
    return payload.data as ChatMessage;
  }

  // Handle case where BE returns a string reply or simple object
  const text = 
    body.reply ?? 
    body.text ?? 
    (typeof body.message === "object" ? body.message?.text : body.message) ?? 
    "No response from assistant.";

  return {
    id: String(Date.now()),
    sender: "ai",
    text,
    timestamp: new Date().toISOString(),
  };
}

export const studentChatService = {
  async getHistory(courseId: string): Promise<ChatMessage[]> {
    const data = (await apiClient.get(
      API_ENDPOINTS.CHAT.HISTORY(courseId)
    )) as BackendHistoryResult;

    return normalizeHistoryResponse(data);
  },

  async sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
    const data = (await apiClient.post(
      API_ENDPOINTS.CHAT.SEND,
      payload
    )) as BackendSendResult;

    return normalizeSendResponse(data);
  },
};

export const studentChatQueryKeys = {
  all: QUERY_KEYS.CHAT,
  history: (courseId: string) => [...QUERY_KEYS.CHAT, "history", courseId] as const,
};
