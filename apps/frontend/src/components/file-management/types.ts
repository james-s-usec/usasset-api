export interface Folder {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  file_count: number;
}

export interface TreeFolder {
  id: string;
  name: string;
  path: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

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