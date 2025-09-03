export interface FileData {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  created_at: string;
  folder?: {
    id: string;
    name: string;
    color: string | null;
  };
  project?: {
    id: string;
    name: string;
  };
}