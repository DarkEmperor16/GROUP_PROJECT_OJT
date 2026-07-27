export interface CourseDocument {
  id: string;
  fileName: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  version: string;
  description: string;
  uploadedBy: string; // email of the uploader
  uploadedAt: string; // ISO string
  isActive: boolean; // active/inactive status in RAG knowledge base
  fileType: "pdf" | "docx" | "pptx" | "txt";
  fileSize: number; // in bytes
}

export interface DocumentListParams {
  search?: string; // matches fileName or uploader email
  courseId?: string;
  fileType?: string;
  version?: string;
  uploadedBy?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDocuments {
  data: CourseDocument[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadDocumentPayload {
  fileName: string;
  courseId: string;
  version: string;
  description: string;
  fileType: "pdf" | "docx" | "pptx" | "txt";
  fileSize: number;
}
