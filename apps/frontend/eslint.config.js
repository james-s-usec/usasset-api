import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
        runtime: 'automatic',
      },
    },
    rules: {
      // Disable React in scope rule for automatic JSX runtime
      'react/react-in-jsx-scope': 'off',
      // === COMPLEXITY BUDGET RULES (CLAUDE.md principles) ===
      // "If you can't explain it in one sentence, it's too complex"
      'complexity': ['error', { max: 7 }],
      // "Each method has max 20-30 lines"
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
      // Limit statements per function to keep methods focused
      'max-statements': ['error', 15],
      // Limit nesting depth to prevent complex branching
      'max-depth': ['error', 3],
      // "Each service has max 3-5 public methods" - limit parameters supports this
      'max-params': ['error', 4],
      
      // === NO CLEVER CODE RULES (Explicit over implicit) ===
      // Force explicit return types - no implicit any
      '@typescript-eslint/explicit-function-return-type': 'error',
      // Prevent any types - must be explicit
      '@typescript-eslint/no-explicit-any': 'error',
      // Force explicit variable declarations
      'prefer-const': 'error',
      // Prevent unused variables (clean up)
      '@typescript-eslint/no-unused-vars': 'error',
      
      // === ONE THING PER FILE ENFORCEMENT ===
      // Prevent multiple classes per file (React components are functions, not classes)
      'max-classes-per-file': ['error', 1],
      
      // === REACT-SPECIFIC COMPLEXITY RULES ===
      // Limit JSX nesting depth to prevent complex components
      'react/jsx-max-depth': ['error', { max: 4 }],
      // Prevent too many props (similar to max-params)
      'react/jsx-max-props-per-line': ['error', { maximum: 3 }],
      // Disable prop-types since we use TypeScript
      'react/prop-types': 'off',
    },
  },
])
