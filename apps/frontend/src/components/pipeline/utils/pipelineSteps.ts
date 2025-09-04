import { JobStatus } from '../types';

export const PIPELINE_STEPS = [
  { label: 'Extract', description: 'Select source file' },
  { label: 'Transform', description: 'Validate & stage data' },
  { label: 'Load', description: 'Import to database' },
];

export const getActiveStep = (jobStatus: JobStatus | null, hasFile: boolean): number => {
  if (!hasFile) return 0;
  if (!jobStatus) return 1;
  
  const statusMap: Record<string, number> = {
    PENDING: 1,
    RUNNING: 1,
    STAGED: 2,
    APPROVED: 3,
    COMPLETED: 3,
  };
  
  return statusMap[jobStatus.status] || 0;
};