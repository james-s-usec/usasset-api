import { useState, useEffect } from 'react';
import type { PipelineRule } from '../types';
import config from '../../../../config';

interface TransformRule {
  id: string;
  name: string;
  type: string;
  target: string;
  is_active: boolean;
}

interface UseTransformRulesReturn {
  rules: TransformRule[];
  loading: boolean;
}

export const useTransformRules = (): UseTransformRulesReturn => {
  const [rules, setRules] = useState<TransformRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransformRules = async (): Promise<void> => {
      try {
        const response = await fetch(`${config.api.baseUrl}/api/pipeline/rules`);
        const data = await response.json();
        
        if (data.success) {
          const transformRules = data.data.rules.filter((rule: PipelineRule) => 
            rule.phase === 'TRANSFORM'
          );
          setRules(transformRules);
        }
      } catch (error) {
        console.error('Failed to fetch transform rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransformRules();
  }, []);

  return { rules, loading };
};