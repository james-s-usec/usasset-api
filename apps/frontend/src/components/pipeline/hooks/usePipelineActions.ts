import { useCallback, useState } from 'react';
import { pipelineApi } from '../../../services/pipelineApi';

interface ActionResult {
  success: boolean;
  message: string;
}

export const usePipelineActions = (jobId: string | null, onReset?: () => void) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const handleApprove = useCallback(async () => {
    if (!jobId) return;
    
    setIsProcessing(true);
    setActionResult(null);
    
    try {
      const result = await pipelineApi.approveImport(jobId);
      setActionResult({ 
        success: true, 
        message: `${result.message} (${result.importedCount} assets imported)`
      });
      // Don't reload - let user see the result and start new import
    } catch (error) {
      console.error('Failed to approve import:', error);
      setActionResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to approve import' 
      });
    } finally {
      setIsProcessing(false);
    }
  }, [jobId]);

  const handleReject = useCallback(async () => {
    if (!jobId) return;
    
    setIsProcessing(true);
    setActionResult(null);
    
    try {
      const result = await pipelineApi.rejectImport(jobId);
      setActionResult({ 
        success: true, 
        message: `${result.message} (${result.clearedCount} records cleared)`
      });
      // Don't reload - let user see the result and start new import
    } catch (error) {
      console.error('Failed to reject import:', error);
      setActionResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to reject import' 
      });
    } finally {
      setIsProcessing(false);
    }
  }, [jobId]);

  const handleStartNewImport = useCallback(() => {
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