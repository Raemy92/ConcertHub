import { defineConfig, globalIgnores } from 'eslint/config'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import typescriptEslintParser from '@typescript-eslint/parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default defineConfig([
  globalIgnores([
    '**/*.mjs',
    '**/CHANGELOG.md',
    '**/dist/**',
    '**/node_modules/**',
    '**/coverage/**',
    '**/build/**',
    '**/out/**'
  ]),
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
    extends: compat.extends('prettier'),

    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports
    },

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: typescriptEslintParser,
      parserOptions: {
        project: path.resolve(__dirname, './tsconfig.json') // Typinformationen aus tsconfig.json
      }
    },

    rules: {
      'simple-import-sort/imports': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',

      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ],

      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowTernary: true,
          allowShortCircuit: true
        }
      ]
    }
  }
])