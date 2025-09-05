import { useState, useEffect } from 'react';
import type { PipelineRule } from '../types';
import config from '../../../../config';

interface CleanRule {
  id: string;
  name: string;
  type: string;
  target: string;
  is_active: boolean;
}

interface UseCleanRulesReturn {
  rules: CleanRule[];
  loading: boolean;
}

export const useCleanRules = (): UseCleanRulesReturn => {
  const [rules, setRules] = useState<CleanRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCleanRules = async (): Promise<void> => {
      try {
        const response = await fetch(`${config.api.baseUrl}/api/pipeline/rules`);
        const data = await response.json();
        
        if (data.success) {
          const cleanRules = data.data.rules.filter((rule: PipelineRule) => 
            rule.phase === 'CLEAN'
          );
          setRules(cleanRules);
        }
      } catch (error) {
        console.error('Failed to fetch clean rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCleanRules();
  }, []);

  return { rules, loading };
};