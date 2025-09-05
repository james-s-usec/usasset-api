import { useCallback } from 'react';
import type { PipelineRule, NewRuleData } from '../types';
import { performSaveRule } from '../utils/ruleOperations';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RulesState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRulesEditor = (
  state: RulesState, 
  loadRules: () => Promise<void>
): { 
  saveRule: (ruleData: NewRuleData, editingRule: PipelineRule | null) => Promise<boolean>; 
  deleteRule: (ruleId: string) => Promise<boolean>;
  toggleRuleActive: (ruleId: string, isActive: boolean) => Promise<boolean>;
} => {
  const saveRule = useCallback(async (
    ruleData: NewRuleData, 
    editingRule: PipelineRule | null
  ): Promise<boolean> => {
    return await handleSaveRule(ruleData, editingRule, state, loadRules);
  }, [state, loadRules]);

  const deleteRule = useCallback(async (ruleId: string): Promise<boolean> => {
    return await handleDeleteRule(ruleId, state, loadRules);
  }, [state, loadRules]);

  const toggleRuleActive = useCallback(async (ruleId: string, isActive: boolean): Promise<boolean> => {
    return await handleToggleRuleActive(ruleId, isActive, state, loadRules);
  }, [state, loadRules]);

  return { saveRule, deleteRule, toggleRuleActive };
};

const handleSaveRule = async (
  ruleData: NewRuleData,
  editingRule: PipelineRule | null,
  state: RulesState,
  loadRules: () => Promise<void>
): Promise<boolean> => {
  state.setLoading(true);
  state.setError(null);
  try {
    const result = await performSaveRule(ruleData, editingRule);
    if (result.success) {
      await loadRules();
      return true;
    } else {
      state.setError(result.error);
      return false;
    }
  } catch (err) {
    state.setError('Failed to save rule');
    console.error('Error saving rule:', err);
    return false;
  } finally {
    state.setLoading(false);
  }
};

const handleDeleteRule = async (
  ruleId: string,
  state: RulesState,
  loadRules: () => Promise<void>
): Promise<boolean> => {
  if (!confirmDeleteRule()) return false;
  
  state.setLoading(true);
  state.setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/api/pipeline/rules/${ruleId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      await loadRules();
      return true;
    } else {
      state.setError(data.error?.message || 'Failed to delete rule');
      return false;
    }
  } catch (err) {
    state.setError('Failed to delete rule');
    console.error('Error deleting rule:', err);
    return false;
  } finally {
    state.setLoading(false);
  }
};

const confirmDeleteRule = (): boolean => {
  return confirm('Are you sure you want to delete this rule?');
};

const updateRuleStatus = async (ruleId: string, isActive: boolean): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/pipeline/rules/${ruleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive })
  });
};

const handleToggleRuleActive = async (
  ruleId: string,
  isActive: boolean,
  state: RulesState,
  loadRules: () => Promise<void>
): Promise<boolean> => {
  state.setLoading(true);
  state.setError(null);
  try {
    const response = await updateRuleStatus(ruleId, isActive);
    const data = await response.json();
    
    if (data.success) {
      await loadRules();
      return true;
    } else {
      state.setError(data.error?.message || 'Failed to toggle rule');
      return false;
    }
  } catch (err) {
    state.setError('Failed to toggle rule');
    console.error('Error toggling rule:', err);
    return false;
  } finally {
    state.setLoading(false);
  }
};