import { useState, useEffect } from "react";
import { config } from "../../../config";

interface PDFFile {
  id: string;
  original_name: string;
  size: number;
  created_at: string;
  pageCount?: number;
  mimetype?: string;
}

interface FileResponse {
  success: boolean;
  data: {
    files: PDFFile[];
  };
}

const fetchPageCount = async (fileId: string): Promise<number | undefined> => {
  try {
    const infoResponse = await fetch(`${config.api.baseUrl}/api/files/${fileId}/pdf-info`);
    const infoResult = await infoResponse.json();
    return infoResult.success ? infoResult.data.pageCount : undefined;
  } catch {
    return undefined;
  }
};

const enrichPdfWithPageCount = async (pdf: PDFFile): Promise<PDFFile> => {
  const pageCount = await fetchPageCount(pdf.id);
  return { ...pdf, pageCount };
};

const deduplicatePdfsByName = (pdfs: PDFFile[]): PDFFile[] => {
  return pdfs.reduce((acc: PDFFile[], current) => {
    const existing = acc.find(file => file.original_name === current.original_name);
    if (!existing) {
      acc.push(current);
    } else if (new Date(current.created_at) > new Date(existing.created_at)) {
      // Replace with newer version
      const index = acc.indexOf(existing);
      acc[index] = current;
    }
    return acc;
  }, []);
};

export const usePdfFiles = (): { pdfFiles: PDFFile[]; loading: boolean; fetchPdfFiles: () => Promise<void> } => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPdfFiles = async (): Promise<void> => {
    try {
      const response = await fetch(`${config.api.baseUrl}/api/files?limit=50`);
      const result = await response.json();
      
      if (result.success) {
        const allPdfs = (result as FileResponse).data.files.filter((file) => 
          file.mimetype === "application/pdf"
        );
        
        const uniquePdfs = deduplicatePdfsByName(allPdfs);
        const pdfsWithPageCount = await Promise.all(
          uniquePdfs.map(enrichPdfWithPageCount)
        );
        
        setPdfFiles(pdfsWithPageCount);
      }
    } catch (error) {
      console.error("Failed to fetch PDF files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfFiles();
  }, []);

  return { pdfFiles, loading, fetchPdfFiles };
};
