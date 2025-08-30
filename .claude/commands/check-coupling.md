# Check Module Coupling (Orthogonality)

Analyze module dependencies to find tight coupling:

Module to analyze: $ARGUMENTS

Check for:
1. Direct imports vs interface imports
2. Circular dependencies
3. Cross-feature imports (violating feature boundaries)
4. Modules that know too much about others
5. Hidden dependencies (global state, side effects)

Analysis steps:
- List all imports for the module
- Check if imports are interfaces or concrete classes
- Find which modules import this module
- Identify if changes here would break other modules
- Suggest how to reduce coupling

Report:
- Coupling score (1-10, lower is better)
- Specific violations of orthogonality
- Refactoring suggestions to reduce coupling