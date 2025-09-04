import { useEffect, useState } from 'react';
import { pipelineApi } from '../../../services/pipelineApi';
import type { JobStatus } from '../types';

export const usePipelineStatus = (jobId: string | null): {
  jobStatus: JobStatus | null;
  isProcessing: boolean;
} => {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJobStatus(null);
      return;
    }

    const fetchStatus = async (): Promise<void> => {
      try {
        const status = await pipelineApi.getJobStatus(jobId);
        setJobStatus(status);
        
        if (status.status === 'PENDING' || status.status === 'RUNNING') {
          setIsProcessing(true);
          setTimeout(fetchStatus, 2000);
        } else {
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Failed to fetch job status:', err);
        setIsProcessing(false);
      }
    };

    fetchStatus();
  }, [jobId]);

  return { jobStatus, isProcessing };
};