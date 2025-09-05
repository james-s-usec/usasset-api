<!--
  Pipeline Frontend Components Documentation
  
  Purpose: React components for ETL pipeline interface with rules management
  Audience: Frontend developers working on data processing features
  Last Updated: 2025-09-05
  Version: 1.0
-->

# Pipeline Frontend Components

## Overview
Comprehensive React component system for ETL pipeline management, featuring responsive design, real-time progress tracking, and integrated rules management interface.

## Architecture

### Component Hierarchy
```
PipelineWithRules (Main container)
├── PipelineToolbar (Top controls)
├── SplitPanelLayout (Responsive layout)
│   ├── PipelineFlow (Left panel - main pipeline)
│   │   ├── PipelineHeader
│   │   ├── PipelineStepper
│   │   ├── PipelinePhases
│   │   │   ├── ExtractPhase
│   │   │   ├── TransformPhase
│   │   │   └── LoadPhase
│   │   ├── StagingDataPreview
│   │   ├── ProcessingButtons
│   │   └── PipelineDebugBar
│   └── RulesManagement (Right panel - rules editor)
├── ResizableDivider (Panel sizing)
└── MobileRulesPanel (Mobile overlay)
```

## Project Structure
```
src/components/pipeline/
├── PipelineWithRules.tsx           # Main container component
├── PipelineFlow.tsx                # Core pipeline flow component
├── FileSelectionModal.tsx          # File upload modal
├── StagingDataPreview.tsx          # Data preview component
├── components/                     # Reusable UI components
│   ├── FileSelector.tsx
│   ├── LoadPhaseActions.tsx
│   ├── LoadPhaseButtonGroup.tsx
│   ├── MobileRulesPanel.tsx
│   ├── PipelineAlerts.tsx
│   ├── PipelineDebugBar.tsx
│   ├── PipelineHeader.tsx
│   ├── PipelinePhases.tsx
│   ├── PipelineStepper.tsx
│   ├── PipelineToolbar.tsx
│   ├── ProcessingButtons.tsx
│   ├── RawDataPreview.tsx
│   ├── ResizableDivider.tsx
│   ├── SplitPanelLayout.tsx
│   ├── StagingDataPreview.tsx
│   ├── StagingDataRow.tsx
│   ├── StagingDataStats.tsx
│   ├── StagingInvalidRows.tsx
│   ├── StagingRowStatus.tsx
│   ├── StagingTableRow.tsx
│   ├── StagingValidationResults.tsx
│   ├── StagingValidationSummary.tsx
│   └── ValidationReport.tsx
├── hooks/                          # Custom React hooks
│   ├── useExtractPhase.ts
│   ├── usePipelineActions.ts
│   └── usePipelineStatus.ts
├── phases/                         # Phase-specific components
│   ├── ExtractPhase.tsx
│   ├── LoadPhase.tsx
│   ├── TransformPhase.tsx
│   └── components/
│       ├── ExtractPhaseContent.tsx
│       ├── InvalidDataSamples.tsx
│       ├── ValidationErrors.tsx
│       └── ValidationResults.tsx
├── rules/                          # Rules management components
│   ├── ExtractRules.tsx
│   ├── JobsList.tsx
│   ├── LoadRules.tsx
│   ├── RuleEditor.tsx
│   ├── RuleFilters.tsx
│   ├── RulesList.tsx
│   ├── RulesManagement.tsx
│   ├── TestResults.tsx
│   ├── TransformRules.tsx
│   ├── hooks/                      # Rules-specific hooks
│   │   ├── useRulesEditor.ts
│   │   ├── useRulesLoader.ts
│   │   ├── useRulesState.ts
│   │   └── useRulesTester.ts
│   ├── types.ts                    # Rules type definitions
│   ├── useRulesManagement.ts
│   ├── utils/                      # Rules utilities
│   │   ├── ruleOperations.ts
│   │   └── testResultExtractor.ts
│   └── validation.ts
├── types.ts                        # Pipeline type definitions
└── utils/
    └── pipelineSteps.ts            # Pipeline step utilities
```

## Key Features

### ✅ Responsive Design
- **Desktop**: Split-panel layout with resizable divider
- **Mobile**: Overlay panels with touch-friendly controls
- **Tablet**: Adaptive layout switching based on screen size
- **Breakpoint**: Material-UI `md` breakpoint (900px)

### ✅ Real-Time Progress Tracking
- Phase-by-phase progress visualization
- Step-by-step pipeline status updates
- Processing statistics and timing
- Error tracking and validation results

### ✅ Interactive Data Preview
- Raw data preview after file selection
- Staging data preview with validation results
- Row-level status indicators (valid, invalid, will import)
- Expandable error details for debugging

### ✅ Integrated Rules Management
- Visual rules editor with form validation
- Real-time rule testing and preview
- Phase-specific rule filtering
- Priority-based rule ordering

### ✅ File Upload and Processing
- Drag-and-drop file selection
- File format validation
- Upload progress tracking
- File metadata display

## Component Details

### Main Container Components

#### PipelineWithRules
**Main container managing layout and responsive behavior**

```typescript
interface PipelineWithRulesProps {
  selectedFile: string | null;
  selectedFileName: string | null;
  currentJobId: string | null;
  importError: string | null;
  onSelectFile: () => void;
  onStartImport: () => Promise<void>;
}
```

Key features:
- Manages split-panel layout with resizable controls
- Handles responsive breakpoints (desktop vs mobile)
- Coordinates between pipeline flow and rules management
- Maintains panel width state and preferences

#### SplitPanelLayout
**Responsive layout manager for desktop split-panel view**

```typescript
interface SplitPanelLayoutProps {
  actuallyShowRules: boolean;
  pipelineWidth: number;
  rulesWidth: number;
  onWidthChange: (width: number) => void;
  pipelineContent: React.ReactNode;
}
```

Features:
- Draggable divider for panel resizing
- Minimum and maximum width constraints
- Smooth transitions and visual feedback
- Responsive collapse on small screens

### Pipeline Flow Components

#### PipelineFlow
**Core pipeline visualization and control**

Manages:
- File selection and upload
- Pipeline phase progression
- Data preview and validation
- Processing controls and status

#### PipelineStepper
**Visual progress indicator**

```typescript
const phases = [
  'Select File',
  'Extract',
  'Validate', 
  'Clean',
  'Transform',
  'Map',
  'Load'
];
```

Features:
- Material-UI Stepper component
- Phase-specific icons and colors
- Progress percentage display
- Error state visualization

#### Phase Components
**Individual phase processors with specific UI**

- **ExtractPhase**: File parsing and initial data loading
- **TransformPhase**: Data transformation and cleaning
- **LoadPhase**: Final validation and import controls

### Rules Management Components

#### RulesManagement
**Main rules interface container**

Features:
- Tab-based interface for different rule types
- Create, edit, delete rule operations
- Rule testing and validation
- Import/export functionality

#### RuleEditor
**Form-based rule creation and editing**

```typescript
interface Rule {
  id?: string;
  name: string;
  type: RuleType;
  phase: PipelinePhase;
  target_field?: string;
  configuration: Record<string, any>;
  priority: number;
  is_active: boolean;
}
```

Supports all rule types:
- TRIM, REGEX_REPLACE, EXACT_MATCH
- FUZZY_MATCH, DATE_FORMAT, NUMBER_FORMAT
- CASE_TRANSFORM, CUSTOM

#### RulesList
**Sortable, filterable list of existing rules**

Features:
- Priority-based sorting
- Phase-based filtering
- Bulk operations (enable/disable, delete)
- Drag-and-drop reordering

### Custom Hooks

#### usePipelineStatus
**Pipeline state management and API integration**

```typescript
const {
  currentPhase,
  progress,
  status,
  errors,
  warnings,
  refreshStatus
} = usePipelineStatus(jobId);
```

#### useRulesEditor
**Rules form management and validation**

```typescript
const {
  formData,
  errors,
  isValid,
  handleChange,
  handleSubmit,
  resetForm
} = useRulesEditor(initialRule);
```

#### useExtractPhase
**Extract phase specific operations**

```typescript
const {
  fileMetadata,
  rawDataPreview,
  columnMapping,
  handleFileSelect,
  startExtraction
} = useExtractPhase();
```

## State Management

### Local State Patterns
- **Component State**: UI state, form data, local preferences
- **Custom Hooks**: Business logic, API calls, complex state
- **Context (Limited)**: Global UI state like theme, layout preferences

### Data Flow
```
User Action → Component → Custom Hook → API Service → Backend
Backend Response → Custom Hook → Component → UI Update
```

### Error Handling
- Component-level error boundaries
- Hook-level error state management
- Global error notification system
- Graceful degradation on failures

## API Integration

### Pipeline API Endpoints
```typescript
// Job management
POST /api/pipeline/import        // Start new job
GET  /api/pipeline/jobs/:id      // Job status
GET  /api/pipeline/staged-data   // Preview data

// Rules management  
GET    /api/pipeline/rules       // List rules
POST   /api/pipeline/rules       // Create rule
PUT    /api/pipeline/rules/:id   // Update rule
DELETE /api/pipeline/rules/:id   // Delete rule
POST   /api/pipeline/rules/test  // Test rule
```

### Data Types and Interfaces
```typescript
// Core types
interface PipelineJob {
  id: string;
  status: JobStatus;
  phase: PipelinePhase;
  progress: JobProgress;
  errors: string[];
  created_at: string;
}

interface JobProgress {
  totalRows: number;
  processedRows: number;
  validRows: number;
  invalidRows: number;
  currentPhase: PipelinePhase;
}

// UI-specific types
interface StagingDataRow {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  errors: string[] | null;
}
```

## Styling and Theming

### Material-UI Integration
- Consistent design system with MUI components
- Theme-based styling for dark/light mode
- Responsive breakpoints and spacing
- Custom component variants where needed

### CSS Modules
- Component-scoped styles
- BEM naming convention for clarity
- Responsive utilities and mixins
- Performance optimization

### Layout Patterns
```css
/* Split panel layout */
.pipeline-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Responsive breakpoints */
@media (max-width: 900px) {
  .split-panels {
    flex-direction: column;
  }
}
```

## Performance Optimization

### React Performance
- Proper use of React.memo for pure components
- useCallback and useMemo for expensive operations
- Component code splitting with React.lazy
- Virtualization for large data lists

### Data Loading
- Progressive data loading for large datasets
- Debounced search and filtering
- Optimistic UI updates
- Background data refresh

### Bundle Optimization
- Tree shaking for unused code
- Code splitting by route and feature
- Dynamic imports for heavy components
- Asset optimization and caching

## Testing Strategy

### Component Testing
```typescript
// Example test structure
describe('PipelineFlow', () => {
  it('displays file selection when no file selected', () => {
    render(<PipelineFlow selectedFile={null} />);
    expect(screen.getByText('Select File')).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
// Custom hook testing
import { renderHook, act } from '@testing-library/react';

describe('usePipelineStatus', () => {
  it('fetches job status on mount', async () => {
    const { result } = renderHook(() => usePipelineStatus('job-123'));
    expect(result.current.status).toBe('loading');
  });
});
```

## Accessibility

### ARIA Support
- Proper heading hierarchy
- Screen reader navigation
- Form labeling and validation messages
- Keyboard navigation support

### Responsive Design
- Touch-friendly controls on mobile
- Adequate contrast ratios
- Scalable text and icons
- Focus management

## Common Patterns and Best Practices

### Component Structure
```typescript
// Standard component pattern
interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  onAction
}) => {
  // Local state
  const [state, setState] = useState();
  
  // Custom hooks
  const { data, loading, error } = useCustomHook();
  
  // Event handlers
  const handleAction = useCallback(() => {
    onAction();
  }, [onAction]);
  
  // Render
  return <div>{/* JSX */}</div>;
};
```

### Error Boundaries
```typescript
class PipelineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### Custom Hook Pattern
```typescript
export const useCustomHook = (dependency: string) => {
  const [state, setState] = useState<StateType>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Effect logic
  }, [dependency]);
  
  const action = useCallback(async () => {
    // Action logic
  }, []);
  
  return { state, loading, error, action };
};
```

## Integration with Backend

### Real-time Updates
- WebSocket integration for job progress (planned)
- Polling for status updates (current)
- Event-driven UI updates
- Error recovery and reconnection

### File Upload
- Chunked upload for large files
- Progress tracking and cancellation
- File validation and preview
- Temporary file cleanup

## Mobile Considerations

### Touch Interface
- Large touch targets (minimum 44px)
- Gesture support for common actions
- Pull-to-refresh functionality
- Swipe navigation between phases

### Performance
- Reduced animation complexity
- Optimized images and assets
- Progressive web app capabilities
- Offline functionality (planned)

## Deployment and Build

### Build Configuration
```bash
# Development
npm run dev              # Local development server

# Production
npm run build           # Optimized production build
npm run preview         # Preview production build locally
```

### Environment Configuration
```typescript
// vite.config.ts optimizations
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        }
      }
    }
  }
});
```

This component system provides a comprehensive, maintainable, and user-friendly interface for complex ETL pipeline operations while maintaining high performance and accessibility standards.