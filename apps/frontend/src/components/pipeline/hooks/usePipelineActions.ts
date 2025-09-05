import { useCallback, useState } from 'react';
import { pipelineApi } from '../../../services/pipelineApi';

interface ActionResult {
  success: boolean;
  message: string;
}

interface PipelineActionsReturn {
  handleApprove: () => Promise<void>;
  handleReject: () => Promise<void>;
  handleStartNewImport: () => void;
  isProcessing: boolean;
  actionResult: ActionResult | null;
}

export const usePipelineActions = (
  jobId: string | null, 
  onReset?: () => void
): PipelineActionsReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const handleApprove = useCallback(async (): Promise<void> => {
    if (!jobId) return;
    await performApproveAction(jobId, setIsProcessing, setActionResult);
  }, [jobId]);

  const handleReject = useCallback(async (): Promise<void> => {
    if (!jobId) return;
    await performRejectAction(jobId, setIsProcessing, setActionResult);
  }, [jobId]);

  const handleStartNewImport = useCallback((): void => {
    setActionResult(null);
    onReset?.();
  }, [onReset]);

  return { 
    handleApprove, 
    handleReject, 
    handleStartNewImport,
    isProcessing, 
    actionResult 
  };
};

// Helper function for approve action
const performApproveAction = async (
  jobId: string,
  setIsProcessing: (processing: boolean) => void,
  setActionResult: (result: ActionResult) => void
): Promise<void> => {
  setIsProcessing(true);
  setActionResult({ success: true, message: '' });
  
  try {
    const result = await pipelineApi.approveImport(jobId);
    setActionResult({ 
      success: true, 
      message: `${result.message} (${result.importedCount} assets imported)`
    });
  } catch (error) {
    console.error('Failed to approve import:', error);
    setActionResult(createErrorResult(error, 'Failed to approve import'));
  } finally {
    setIsProcessing(false);
  }
};

// Helper function for reject action
const performRejectAction = async (
  jobId: string,
  setIsProcessing: (processing: boolean) => void,
  setActionResult: (result: ActionResult) => void
): Promise<void> => {
  setIsProcessing(true);
  setActionResult({ success: true, message: '' });
  
  try {
    const result = await pipelineApi.rejectImport(jobId);
    setActionResult({ 
      success: true, 
      message: `${result.message} (${result.clearedCount} records cleared)`
    });
  } catch (error) {
    console.error('Failed to reject import:', error);
    setActionResult(createErrorResult(error, 'Failed to reject import'));
  } finally {
    setIsProcessing(false);
  }
};

// Helper function to create error result
const createErrorResult = (error: unknown, fallbackMessage: string): ActionResult => ({
  success: false,
  message: error instanceof Error ? error.message : fallbackMessage
});