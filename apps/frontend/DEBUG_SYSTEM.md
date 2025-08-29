# Frontend Debug System

## Overview

A comprehensive frontend debug system following CLAUDE.md principles for debugging React applications. This system provides conditional logging, component lifecycle tracking, performance monitoring, and integration with backend logging.

## Key Features

### 1. Conditional Logging (CLAUDE.md Rule #8)
- Debug logs controlled by environment variables
- Categorical logging (component, hook, api, state, event, performance, navigation, render, lifecycle)
- Automatic disable in production
- Console and backend logging options

### 2. Component Debug Hooks
- **`useDebugComponent`**: Component lifecycle and render tracking
- **`useDebugState`**: Enhanced useState with automatic change logging
- **`useDebugEffect`**: Enhanced useEffect with dependency and cleanup tracking

### 3. Debug Utilities
- **`debugLog(category, message, data)`**: Main logging function
- **Performance timing**: `startPerformanceMark()` / `endPerformanceMark()`
- **API call logging**: Automatic request/response tracking
- **Event logging**: User interaction tracking

## Configuration

### Environment Variables (.env.local)
```bash
# Enable debug mode
VITE_DEBUG=true
VITE_DEBUG_ENABLED=true

# Specify categories (comma-separated)
VITE_DEBUG_CATEGORIES=component,hook,api,state,event

# Backend integration
VITE_DEBUG_SEND_TO_BACKEND=true

# Console output
VITE_DEBUG_CONSOLE_ENABLED=true
```

### Available Categories
- `component`: Component renders, mounts, unmounts
- `hook`: Hook lifecycle and state changes  
- `api`: HTTP requests and responses
- `state`: State changes and updates
- `event`: User interactions (clicks, form submissions)
- `performance`: Timing measurements
- `navigation`: Route changes
- `render`: Component re-render causes
- `lifecycle`: Mount/unmount events

## Usage Examples

### Basic Component Debug
```tsx
import { useDebugComponent } from '../hooks/useDebugComponent';

const MyComponent = () => {
  const { logEvent, logCustom } = useDebugComponent({
    name: 'MyComponent',
    trackRenders: true,
    trackPerformance: true
  });

  const handleClick = () => {
    logEvent('click', 'my-button');
    // ... handle click
  };

  return <button onClick={handleClick}>Click me</button>;
};
```

### Enhanced State with Debug
```tsx
import { useDebugState } from '../hooks/useDebugState';

const MyComponent = () => {
  const [count, setCount] = useDebugState(0, {
    name: 'count',
    componentName: 'MyComponent'
  });

  // All state changes are automatically logged
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
};
```

### API Effect with Debug
```tsx
import { useDebugApiEffect } from '../hooks/useDebugEffect';

const MyComponent = () => {
  useDebugApiEffect(
    async () => {
      const data = await fetchData();
      setData(data);
    },
    [],
    {
      name: 'fetchInitialData',
      componentName: 'MyComponent'
    }
  );
};
```

### Direct Debug Logging
```tsx
import { debugLog } from '../utils/debug';

const MyComponent = () => {
  const handleComplexOperation = () => {
    debugLog('component', '🔍 Starting complex operation', { step: 1 });
    
    // ... complex logic
    
    debugLog('component', '✅ Complex operation completed', { result: 'success' });
  };
};
```

## Integration Points

### Existing Components Enhanced
- **UsersPage**: Full component and hook debug tracking
- **DebugPage**: Performance monitoring and event logging
- **FloatingDebugConsole**: User interaction tracking

### Backend Integration
Debug logs are automatically sent to the backend logging system when `VITE_DEBUG_SEND_TO_BACKEND=true`, appearing in the database logs table.

## Development Workflow

### 1. Enable Debug Mode
Create `.env.local` with debug settings:
```bash
cp .env.local.example .env.local
# Edit categories as needed
```

### 2. Use Debug Hooks
Replace standard hooks with debug versions in components you're debugging:
- `useState` → `useDebugState`
- `useEffect` → `useDebugEffect` 
- Add `useDebugComponent` for comprehensive tracking

### 3. Monitor Output
- Console: Real-time debug output
- FloatingConsole: UI-based message viewer
- DebugPage: Full database logs with filtering

### 4. Production Deployment
Debug is automatically disabled in production environment, with minimal API-only logging.

## Performance Impact

- **Development**: Minimal impact, all logging async
- **Production**: Zero impact when disabled
- **Categories**: Selective enabling reduces overhead
- **Backend**: Fire-and-forget logging, non-blocking

## Best Practices

1. **Use Categories**: Enable only needed categories
2. **Hide Sensitive Data**: Never log passwords, tokens, or PII
3. **Performance Marks**: Use sparingly, only for bottlenecks  
4. **Conditional Logic**: Check `debug.enabled` for expensive operations
5. **Clean Messages**: Use consistent prefixes and clear descriptions

## Troubleshooting

### Debug Not Showing
1. Check `.env.local` exists and has correct variables
2. Verify category is enabled in `VITE_DEBUG_CATEGORIES`
3. Check browser console for errors
4. Restart Vite dev server after env changes

### Too Much Output  
1. Reduce enabled categories
2. Set `VITE_DEBUG_CONSOLE_ENABLED=false` 
3. Use specific categories like `api,event` only
4. Disable performance category unless needed

### Backend Logs Missing
1. Check `VITE_DEBUG_SEND_TO_BACKEND=true`
2. Verify backend API is running
3. Check network tab for failed log requests
4. Backend debug-logger service must be working