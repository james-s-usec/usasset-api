import { useState, useCallback } from "react";
import type { ColumnCategory } from "../columnConfig";
import { columnCategories as defaultColumnCategories } from "../columnConfig";

export const useColumnCategories = (): { columnCategories: ColumnCategory[]; handleCategoryToggle: (categoryId: string) => void } => {
  const [columnCategories, setColumnCategories] = useState<ColumnCategory[]>(
    defaultColumnCategories
  );

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setColumnCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  }, []);

  return { columnCategories, handleCategoryToggle };
};
