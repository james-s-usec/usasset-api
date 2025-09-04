// Pipeline type definitions for consistency across components

export interface JobStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'STAGED' | 'APPROVED' | 'COMPLETED' | 'FAILED';
  progress?: {
    total: number;
    processed: number;
  };
  errors?: string[];
}

export interface PipelineState {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  jobStatus: JobStatus | null;
  isProcessing: boolean;
}

export interface PipelineActions {
  onSelectFile: () => void;
  onStartImport: () => void;
  onApprove: () => void;
  onReject: () => void;
}