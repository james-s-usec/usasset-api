import { useCallback } from 'react';

export const usePipelineActions = (jobId: string | null): {
  handleApprove: () => Promise<void>;
  handleReject: () => Promise<void>;
} => {
  const handleApprove = useCallback(async () => {
    if (!jobId) return;
    // TODO: Implement approve endpoint
    console.log('Approve import for job:', jobId);
    alert('Approve functionality coming soon - will move staging data to assets table');
  }, [jobId]);

  const handleReject = useCallback(async () => {
    if (!jobId) return;
    // TODO: Implement reject endpoint
    console.log('Reject import for job:', jobId);
    alert('Reject functionality coming soon - will clear staging data');
  }, [jobId]);

  return { handleApprove, handleReject };
};