import { useState, useEffect } from 'react';
import type { PipelineRule } from '../types';
import config from '../../../../config';

interface ExtractRule {
  id: string;
  name: string;
  type: string;
  target: string;
  is_active: boolean;
}

interface UseExtractRulesReturn {
  rules: ExtractRule[];
  loading: boolean;
}

export const useExtractRules = (): UseExtractRulesReturn => {
  const [rules, setRules] = useState<ExtractRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExtractRules = async (): Promise<void> => {
      try {
        const response = await fetch(`${config.api.baseUrl}/api/pipeline/rules`);
        const data = await response.json();
        
        if (data.success) {
          const extractRules = data.data.rules.filter((rule: PipelineRule) => 
            rule.phase === 'EXTRACT'
          );
          setRules(extractRules);
        }
      } catch (error) {
        console.error('Failed to fetch extract rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExtractRules();
  }, []);

  return { rules, loading };
};