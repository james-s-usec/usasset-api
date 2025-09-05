import { useState } from 'react';
import type { PipelineRule, ImportJob, RulesTestResult } from '../types';

export interface RulesStateReturn {
  rules: PipelineRule[];
  jobs: ImportJob[];
  loading: boolean;
  error: string | null;
  testResult: RulesTestResult | null;
  setRules: (rules: PipelineRule[]) => void;
  setJobs: (jobs: ImportJob[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTestResult: (result: RulesTestResult | null) => void;
}

export const useRulesState = (): RulesStateReturn => {
  const [rules, setRules] = useState<PipelineRule[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<RulesTestResult | null>(null);
  
  return { 
    rules, 
    jobs, 
    loading, 
    error, 
    testResult, 
    setRules, 
    setJobs, 
    setLoading, 
    setError, 
    setTestResult 
  };
};