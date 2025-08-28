// @ts-check
import eslint from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  {
    rules: {
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
      // Prevent floating promises
      '@typescript-eslint/no-floating-promises': 'error',
      // Prevent unsafe arguments
      '@typescript-eslint/no-unsafe-argument': 'error',
      // Force explicit member accessibility
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
      
      // === DEPENDENCY MANAGEMENT (Shallow dependencies) ===
      // Prevent circular dependencies between features
      'import/no-cycle': 'error',
      // Prevent self-imports
      'import/no-self-import': 'error',
      
      // === ONE THING PER FILE ENFORCEMENT ===
      // Prevent multiple classes per file
      'max-classes-per-file': ['error', 1],
      
      // === CLEAN CODE PATTERNS ===
      // Force consistent code patterns
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Prevent unused variables (clean up)
      '@typescript-eslint/no-unused-vars': 'error',
      // Force consistent naming
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase']
        },
        {
          selector: 'class',
          format: ['PascalCase']
        },
        {
          selector: 'method',
          format: ['camelCase']
        }
      ],
      
      // === MAGIC NUMBERS PREVENTION ===
      // Force explicit constants instead of magic numbers
      'no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false
        }
      ],
    },
  },
);