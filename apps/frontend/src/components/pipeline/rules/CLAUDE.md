<!--
  Rules Management System Documentation
  
  Purpose: Frontend components for managing ETL pipeline rules with testing and validation
  Audience: Frontend developers working on rules engine interface
  Last Updated: 2025-09-05
  Version: 1.0
-->

# Rules Management System

## Overview
Comprehensive rules management interface for the ETL pipeline system, providing visual rule creation, testing, validation, and management capabilities with real-time feedback and integration.

## Component Architecture

### Rules Management Hierarchy
```
RulesManagement (Main container)
├── RuleFilters (Filter and search controls)
├── RulesList (Rule listing with actions)
├── RuleEditor (Create/edit rule form)
├── TestResults (Rule testing interface)
├── JobsList (Pipeline jobs integration)
├── ExtractRules (Extract phase specific rules)
├── TransformRules (Transform phase specific rules)
└── LoadRules (Load phase specific rules)
```

## Project Structure
```
src/components/pipeline/rules/
├── RulesManagement.tsx          # Main rules management container
├── RulesList.tsx                # Sortable, filterable rules list
├── RuleEditor.tsx               # Rule creation and editing form
├── RuleFilters.tsx              # Search and filter controls
├── TestResults.tsx              # Rule testing and preview
├── JobsList.tsx                 # Pipeline jobs management
├── ExtractRules.tsx             # Extract phase rules
├── TransformRules.tsx           # Transform phase rules
├── LoadRules.tsx               # Load phase rules
├── hooks/                      # Rules-specific custom hooks
│   ├── useRulesEditor.ts       # Rule form management
│   ├── useRulesLoader.ts       # Rules data fetching
│   ├── useRulesState.ts        # Rules state management
│   └── useRulesTester.ts       # Rule testing functionality
├── utils/                      # Utility functions
│   ├── ruleOperations.ts       # Rule CRUD operations
│   └── testResultExtractor.ts  # Test result processing
├── types.ts                    # Rules type definitions
├── validation.ts               # Form validation rules
└── useRulesManagement.ts       # Main rules management hook
```

## Core Features

### ✅ Visual Rule Editor
- **Form-based interface** with field-specific controls
- **Real-time validation** with error display
- **Rule type selection** with dynamic configuration options
- **Phase targeting** for specific pipeline phases
- **Priority management** with drag-and-drop reordering

### ✅ Rule Testing and Preview
- **Test rule execution** against sample data
- **Before/after comparison** for rule effects
- **Batch testing** for multiple rules
- **Performance metrics** for rule execution times
- **Error simulation** and edge case testing

### ✅ Advanced Filtering and Search
- **Text search** across rule names and descriptions
- **Phase-based filtering** (Extract, Clean, Transform, etc.)
- **Rule type filtering** (trim, regex, format, etc.)
- **Status filtering** (active, inactive)
- **Priority range filtering**

### ✅ Rules Import/Export
- **JSON export** for rule sharing and backup
- **CSV import/export** for bulk rule management
- **Rule templates** for common operations
- **Version control** integration (planned)

## Rule Types and Configuration

### Available Rule Types

#### Basic Text Operations
```typescript
// TRIM - Remove whitespace
interface TrimRule {
  type: 'trim';
  configuration: {
    sides: 'left' | 'right' | 'both';
  };
}

// CASE_TRANSFORM - Change text case
interface CaseTransformRule {
  type: 'case_transform';
  configuration: {
    case: 'upper' | 'lower' | 'title' | 'sentence';
  };
}
```

#### Pattern Matching
```typescript
// REGEX_REPLACE - Pattern replacement
interface RegexReplaceRule {
  type: 'regex_replace';
  configuration: {
    pattern: string;
    replacement: string;
    flags?: string; // 'g', 'i', 'm', etc.
  };
}

// EXACT_MATCH - Exact string replacement
interface ExactMatchRule {
  type: 'exact_match';
  configuration: {
    search: string;
    replace: string;
    caseSensitive?: boolean;
  };
}
```

#### Data Formatting
```typescript
// DATE_FORMAT - Date standardization
interface DateFormatRule {
  type: 'date_format';
  configuration: {
    inputFormat: string;
    outputFormat: string;
    timezone?: string;
  };
}

// NUMBER_FORMAT - Number formatting
interface NumberFormatRule {
  type: 'number_format';
  configuration: {
    decimals: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
    currency?: string;
  };
}
```

#### Advanced Operations
```typescript
// FUZZY_MATCH - Approximate string matching
interface FuzzyMatchRule {
  type: 'fuzzy_match';
  configuration: {
    candidates: string[];
    threshold: number; // 0-1 similarity score
    algorithm: 'levenshtein' | 'jaro_winkler';
  };
}

// CUSTOM - Custom JavaScript logic
interface CustomRule {
  type: 'custom';
  configuration: {
    code: string; // JavaScript function
    parameters?: Record<string, any>;
  };
}
```

## Component Details

### RulesManagement
**Main container orchestrating all rules functionality**

```typescript
interface RulesManagementProps {
  phase?: PipelinePhase; // Filter to specific phase
  readonly?: boolean;    // Read-only mode
  onRuleApplied?: (ruleId: string) => void;
}

const RulesManagement: React.FC<RulesManagementProps> = ({
  phase,
  readonly,
  onRuleApplied
}) => {
  // Implementation
};
```

Features:
- Tab-based interface for different rule categories
- Integrated search and filtering
- Create/edit/delete rule operations
- Bulk operations and batch processing
- Rule testing and validation

### RuleEditor
**Comprehensive rule creation and editing interface**

```typescript
interface RuleEditorProps {
  rule?: Rule;              // Existing rule for editing
  phase?: PipelinePhase;    // Pre-selected phase
  onSave: (rule: Rule) => Promise<void>;
  onCancel: () => void;
  onDelete?: (ruleId: string) => Promise<void>;
}
```

Key features:
- **Dynamic form fields** based on rule type selection
- **Real-time validation** with field-specific error messages
- **Configuration preview** showing rule effects
- **Test integration** for immediate rule testing
- **Save/cancel/delete** operations with confirmation

#### Form Validation
```typescript
const validationRules = {
  name: [required(), minLength(3), maxLength(100)],
  type: [required()],
  phase: [required()],
  priority: [required(), range(0, 1000)],
  target_field: [conditionalRequired('when field-specific')],
  configuration: {
    pattern: [conditionalRequired('for regex rules'), validRegex()],
    replacement: [conditionalRequired('for replacement rules')],
    // ... field-specific validations
  }
};
```

### RulesList
**Interactive, sortable list of existing rules**

Features:
- **Sortable columns**: Name, Type, Phase, Priority, Status, Created
- **Inline actions**: Edit, Delete, Duplicate, Test, Enable/Disable
- **Bulk selection**: Select multiple rules for batch operations
- **Drag-and-drop reordering** for priority management
- **Status indicators**: Active, Inactive, Error, Testing

```typescript
interface RulesListProps {
  rules: Rule[];
  loading?: boolean;
  selectedRules: string[];
  onSelectRule: (ruleId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (rule: Rule) => void;
  onDelete: (ruleIds: string[]) => Promise<void>;
  onToggleStatus: (ruleIds: string[]) => Promise<void>;
  onReorder: (newOrder: Rule[]) => Promise<void>;
}
```

### TestResults
**Rule testing and validation interface**

```typescript
interface TestResultsProps {
  rule: Rule;
  testData?: Record<string, any>;
  onTest: (data: Record<string, any>) => Promise<TestResult>;
  onBatchTest: (rules: Rule[], data: Record<string, any>[]) => Promise<BatchTestResult>;
}

interface TestResult {
  success: boolean;
  input: Record<string, any>;
  output: Record<string, any>;
  executionTime: number;
  errors: string[];
  warnings: string[];
}
```

Features:
- **Interactive test data input** with JSON editor
- **Before/after comparison** with diff highlighting
- **Batch testing** for multiple rules or datasets
- **Performance metrics** and execution statistics
- **Error reporting** with detailed diagnostics

## Custom Hooks

### useRulesEditor
**Form state management and validation for rule editing**

```typescript
interface UseRulesEditorReturn {
  formData: Rule;
  errors: Record<string, string>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  
  handleChange: (field: string, value: any) => void;
  handleSubmit: () => Promise<void>;
  handleReset: () => void;
  validateField: (field: string) => string | null;
  setFieldError: (field: string, error: string) => void;
  clearErrors: () => void;
}

const useRulesEditor = (initialRule?: Rule): UseRulesEditorReturn => {
  // Implementation with form validation, dirty tracking, etc.
};
```

### useRulesLoader
**Data fetching and caching for rules management**

```typescript
interface UseRulesLoaderReturn {
  rules: Rule[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  
  loadRules: (filters?: RuleFilters) => Promise<void>;
  refreshRules: () => Promise<void>;
  createRule: (rule: Omit<Rule, 'id'>) => Promise<Rule>;
  updateRule: (id: string, updates: Partial<Rule>) => Promise<Rule>;
  deleteRules: (ids: string[]) => Promise<void>;
  
  // Optimistic updates
  optimisticUpdate: (id: string, updates: Partial<Rule>) => void;
  rollbackOptimistic: (id: string) => void;
}
```

### useRulesTester
**Rule testing and validation functionality**

```typescript
interface UseRulesTesterReturn {
  testResult: TestResult | null;
  testing: boolean;
  testError: string | null;
  
  testRule: (rule: Rule, testData: Record<string, any>) => Promise<TestResult>;
  testRules: (rules: Rule[], testData: Record<string, any>) => Promise<TestResult[]>;
  clearTestResult: () => void;
  
  // Sample data management
  sampleData: Record<string, any>[];
  addSampleData: (data: Record<string, any>) => void;
  removeSampleData: (index: number) => void;
  loadSampleFromFile: (file: File) => Promise<void>;
}
```

## State Management

### Rules State Structure
```typescript
interface RulesState {
  // Rules data
  rules: Rule[];
  filteredRules: Rule[];
  selectedRules: string[];
  
  // UI state
  loading: boolean;
  error: string | null;
  editingRule: Rule | null;
  testingRule: Rule | null;
  
  // Filters and search
  filters: RuleFilters;
  searchQuery: string;
  sortBy: RuleSortField;
  sortOrder: 'asc' | 'desc';
  
  // Testing state
  testResults: Record<string, TestResult>;
  sampleData: Record<string, any>[];
}

interface RuleFilters {
  phases: PipelinePhase[];
  types: RuleType[];
  status: 'all' | 'active' | 'inactive';
  priority: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
}
```

### Actions and Reducers
```typescript
type RulesAction = 
  | { type: 'LOAD_RULES'; payload: Rule[] }
  | { type: 'ADD_RULE'; payload: Rule }
  | { type: 'UPDATE_RULE'; payload: { id: string; updates: Partial<Rule> } }
  | { type: 'DELETE_RULES'; payload: string[] }
  | { type: 'SELECT_RULES'; payload: string[] }
  | { type: 'SET_FILTERS'; payload: Partial<RuleFilters> }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SORT'; payload: { field: RuleSortField; order: 'asc' | 'desc' } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean };

const rulesReducer = (state: RulesState, action: RulesAction): RulesState => {
  // Reducer implementation
};
```

## API Integration

### Rules Management Endpoints
```typescript
// Rules CRUD operations
GET    /api/pipeline/rules              // List rules with filtering
POST   /api/pipeline/rules              // Create new rule
GET    /api/pipeline/rules/:id          // Get rule details
PUT    /api/pipeline/rules/:id          // Update rule
DELETE /api/pipeline/rules/:id          // Delete rule
POST   /api/pipeline/rules/batch        // Batch operations

// Rule testing
POST   /api/pipeline/rules/test         // Test single rule
POST   /api/pipeline/rules/batch-test   // Test multiple rules

// Rule templates and import/export
GET    /api/pipeline/rules/templates    // Get rule templates
POST   /api/pipeline/rules/import       // Import rules from file
POST   /api/pipeline/rules/export       // Export rules to file
```

### API Service Implementation
```typescript
class RulesApiService {
  async getRules(filters?: RuleFilters): Promise<Rule[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, JSON.stringify(value));
        }
      });
    }
    
    const response = await fetch(`/api/pipeline/rules?${params}`);
    return response.json();
  }
  
  async createRule(rule: Omit<Rule, 'id'>): Promise<Rule> {
    const response = await fetch('/api/pipeline/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    return response.json();
  }
  
  async testRule(rule: Rule, testData: Record<string, any>): Promise<TestResult> {
    const response = await fetch('/api/pipeline/rules/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule, testData })
    });
    return response.json();
  }
  
  // ... other methods
}
```

## User Experience Features

### Intelligent Rule Suggestions
- **Pattern detection** in sample data
- **Common rule templates** for typical operations
- **Rule composition** suggestions
- **Performance optimization** recommendations

### Visual Rule Building
- **Drag-and-drop interface** for complex rules
- **Visual regex builder** with pattern testing
- **Field mapping interface** with data preview
- **Rule chaining** for sequential operations

### Collaborative Features
- **Rule sharing** between users/projects
- **Version control** for rule changes
- **Comments and documentation** on rules
- **Approval workflow** for critical rules

## Performance Optimizations

### Client-Side Optimizations
```typescript
// Virtualized rule list for large datasets
const VirtualizedRulesList = React.memo(({ rules, ...props }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={rules.length}
      itemSize={60}
      itemData={rules}
    >
      {RuleListItem}
    </FixedSizeList>
  );
});

// Debounced search to reduce API calls
const useDebounceSearch = (searchQuery: string, delay: number = 300) => {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [searchQuery, delay]);
  
  return debouncedQuery;
};
```

### Caching Strategy
- **Client-side caching** for frequently accessed rules
- **Optimistic updates** for better perceived performance
- **Background refresh** for data consistency
- **Selective invalidation** for targeted updates

## Testing Strategy

### Component Testing
```typescript
describe('RuleEditor', () => {
  it('validates required fields', async () => {
    render(<RuleEditor onSave={jest.fn()} onCancel={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Type is required')).toBeInTheDocument();
    });
  });
  
  it('submits valid rule data', async () => {
    const mockOnSave = jest.fn();
    render(<RuleEditor onSave={mockOnSave} onCancel={jest.fn()} />);
    
    fireEvent.change(screen.getByLabelText('Name'), { 
      target: { value: 'Test Rule' } 
    });
    fireEvent.change(screen.getByLabelText('Type'), { 
      target: { value: 'trim' } 
    });
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Rule',
          type: 'trim'
        })
      );
    });
  });
});
```

### Hook Testing
```typescript
describe('useRulesEditor', () => {
  it('tracks form dirty state correctly', () => {
    const { result } = renderHook(() => useRulesEditor());
    
    expect(result.current.isDirty).toBe(false);
    
    act(() => {
      result.current.handleChange('name', 'New Rule');
    });
    
    expect(result.current.isDirty).toBe(true);
  });
});
```

## Accessibility Features

### ARIA Implementation
```typescript
// Rule list with proper ARIA labels
<div
  role="grid"
  aria-label="Rules list"
  aria-rowcount={rules.length}
>
  {rules.map((rule, index) => (
    <div
      key={rule.id}
      role="row"
      aria-rowindex={index + 1}
      aria-selected={selectedRules.includes(rule.id)}
    >
      <div role="gridcell" aria-describedby={`rule-${rule.id}-name`}>
        {rule.name}
      </div>
      {/* ... other cells */}
    </div>
  ))}
</div>
```

### Keyboard Navigation
- **Tab order** management for forms
- **Arrow key navigation** in lists
- **Escape key** for modal/dialog dismissal
- **Enter/Space** for button activation
- **Delete key** for item deletion

### Screen Reader Support
- **Semantic HTML** structure
- **ARIA labels** for dynamic content
- **Live regions** for status updates
- **Focus management** for single-page app navigation

## Error Handling and Validation

### Client-Side Validation
```typescript
const validateRule = (rule: Partial<Rule>): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  if (!rule.name?.trim()) {
    errors.name = 'Rule name is required';
  } else if (rule.name.length < 3) {
    errors.name = 'Rule name must be at least 3 characters';
  }
  
  if (!rule.type) {
    errors.type = 'Rule type is required';
  }
  
  if (rule.priority !== undefined && (rule.priority < 0 || rule.priority > 1000)) {
    errors.priority = 'Priority must be between 0 and 1000';
  }
  
  // Rule-specific validation
  if (rule.type === 'regex_replace') {
    if (!rule.configuration?.pattern) {
      errors['configuration.pattern'] = 'Pattern is required for regex rules';
    } else {
      try {
        new RegExp(rule.configuration.pattern);
      } catch {
        errors['configuration.pattern'] = 'Invalid regular expression pattern';
      }
    }
  }
  
  return errors;
};
```

### Error Recovery
```typescript
const ErrorBoundary: React.FC<{ fallback: React.ComponentType }> = ({ 
  children, 
  fallback: Fallback 
}) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (error: Error) => {
      console.error('Rules component error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return <Fallback />;
  }
  
  return <>{children}</>;
};
```

## 🚫 LOGGING AND DEBUGGING - CONSOLE.LOG ELIMINATED

### Status: ✅ ZERO console.log statements (as of 2025-09-06)
All console.log debugging has been **completely eliminated** from rules management components and replaced with structured logging.

### Files Updated
- `useRulesEditor.ts`: 3 console.error → DebugLogger.logError with context
- `useRulesLoader.ts`: 2 console.error → DebugLogger.logError with context

### Implementation Pattern Used
```typescript
} catch (err) {
  state.setError('Failed to load rules');
  const { DebugLogger } = await import('../../../../services/debug-logger');
  DebugLogger.logError('Pipeline API: Load rules failed', err, {
    endpoint: '/api/pipeline/rules',
    method: 'GET',
    context: 'useRulesLoader.createRulesLoader'
  });
}
```

### Benefits for Rules Management
- ✅ **Complete visibility** into rules API operations in backend logs
- ✅ **Correlation ID tracking** connects UI actions to API calls
- ✅ **Structured error context** with endpoint, method, and component info
- ✅ **No console.log spam** - clean DevTools experience
- ✅ **Searchable debugging** via `/logs?level=ERROR` endpoint

### Debugging Rules Issues
```bash
# Find rules-related errors
curl "http://localhost:3000/logs?level=ERROR" | jq '.data.logs[] | select(.message | contains("Pipeline API"))'

# Trace specific rules operation
curl "http://localhost:3000/logs?correlationId=abc123"
```

This comprehensive rules management system provides a powerful, user-friendly interface for creating, testing, and managing ETL pipeline rules while maintaining high standards for performance, accessibility, and user experience.