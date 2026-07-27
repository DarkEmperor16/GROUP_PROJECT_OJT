import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { documentQueryKeys, documentService } from "../services";
import type { DocumentListParams, UploadDocumentPayload } from "../types";

export function useDocumentsQuery(params: DocumentListParams) {
  return useQuery({
    queryKey: documentQueryKeys.list(params),
    queryFn: () => documentService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, email }: { payload: UploadDocumentPayload; email?: string }) =>
      documentService.upload(payload, email),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      toast.success("Document uploaded", {
        description: `"${doc.fileName}" has been successfully added to RAG knowledge base.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Upload failed", {
        description: error.message || "Could not upload document.",
      });
    },
  });
}

export function useToggleDocumentActiveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentService.toggleActive(id),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      toast.success(
        doc.isActive ? "Knowledge base updated" : "Knowledge base updated",
        {
          description: doc.isActive
            ? `"${doc.fileName}" is now ACTIVE. AI will reference this file.`
            : `"${doc.fileName}" is now INACTIVE. AI will ignore this file.`,
        }
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update status", {
        description: error.message || "Please try again.",
      });
    },
  });
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      toast.success("Document removed", {
        description: "The course manual has been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete document", {
        description: error.message || "Please try again.",
      });
    },
  });
}
