import { useMemo } from "react";
import type { FileData } from "../types";

interface Folder {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  file_count: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface GroupData {
  type: "project" | "folder" | "unorganized";
  data: Project | Folder | null;
  files: FileData[];
}

export const useGroupedFiles = (
  files: FileData[],
  folders: Folder[],
  projects: Project[]
): Array<[string, GroupData]> => {
  return useMemo(() => {
    const groups = new Map<string, GroupData>();
    
    projects.forEach(project => {
      groups.set(`project-${project.id}`, {
        type: "project",
        data: project,
        files: []
      });
    });
    
    folders.forEach(folder => {
      groups.set(`folder-${folder.id}`, {
        type: "folder", 
        data: folder,
        files: []
      });
    });
    
    groups.set("unorganized", {
      type: "unorganized",
      data: null,
      files: []
    });
    
    files.forEach(file => {
      if (file.project) {
        const key = `project-${file.project.id}`;
        const group = groups.get(key);
        if (group) {
          group.files.push(file);
        }
      } else if (file.folder) {
        const key = `folder-${file.folder.id}`;
        const group = groups.get(key);
        if (group) {
          group.files.push(file);
        }
      } else {
        groups.get("unorganized")?.files.push(file);
      }
    });
    
    return Array.from(groups.entries())
      .filter(([_, group]) => group.files.length > 0)
      .sort(([, a], [, b]) => b.files.length - a.files.length);
  }, [files, folders, projects]);
};
