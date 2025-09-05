import type { NewRuleData, PipelineRule, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const performSaveRule = async (
  ruleData: NewRuleData, 
  editingRule: PipelineRule | null
): Promise<{ success: boolean; error: string }> => {
  const url = editingRule 
    ? `${API_BASE_URL}/api/pipeline/rules/${editingRule.id}`
    : `${API_BASE_URL}/api/pipeline/rules`;
  
  const method = editingRule ? 'PATCH' : 'POST';
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: ruleData.name.trim(),
      phase: ruleData.phase,
      type: ruleData.type,
      target: ruleData.target.trim(),
      config: JSON.parse(ruleData.config),
      priority: ruleData.priority,
      is_active: ruleData.is_active
    })
  });
  
  const data = await response.json() as ApiResponse<unknown>;
  
  if (data.success) {
    return { success: true, error: '' };
  } else {
    const action = editingRule ? 'update' : 'create';
    return { success: false, error: data.error?.message || `Failed to ${action} rule` };
  }
};