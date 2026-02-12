# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TandenFinance** is a family budget financial management system. The project is built on the Nuxt Dashboard Template and is being customized for personal family financial tracking and management.

The codebase currently contains template components (customers, inbox, settings) which will be adapted and extended for budget-specific features.

## Tech Stack

- **Framework**: Nuxt 3 (v4.3.1) with TypeScript
- **UI Library**: Nuxt UI v4 with Tailwind CSS v4
- **Package Manager**: pnpm (v10.29.2)
- **Testing**: Vitest with separate unit and Nuxt test projects
- **Linting**: ESLint with Nuxt conventions
- **State Management**: VueUse composables
- **Data Validation**: Zod
- **Date Handling**: date-fns
- **Charts/Visualization**: Unovis (@unovis/vue, @unovis/ts)
- **Tables**: TanStack Table Core
- **Deployment**: NuxtHub ready

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run only unit tests
pnpm test:unit

# Run only Nuxt integration tests
pnpm test:nuxt

# Run tests with coverage
pnpm test:coverage

# Lint codebase
pnpm lint

# Type checking
pnpm typecheck
```

## Architecture

### File Structure

- **app/**: Main application code
  - **pages/**: File-based routing (index, customers, inbox, settings/*)
  - **components/**: Vue components organized by feature (home/, customers/, inbox/, settings/)
  - **composables/**: Shared Vue composables (useDashboard.ts)
  - **layouts/**: Layout components (default.vue)
  - **types/**: TypeScript type definitions (User, Sale, Notification, etc.)
  - **utils/**: Utility functions
  - **assets/css/**: Global styles
  - **app.config.ts**: Nuxt UI configuration (primary: green, neutral: zinc)

- **server/**: Server-side code
  - **api/**: API route handlers (customers.ts, mails.ts, members.ts, notifications.ts)

- **test/**: Test files
  - **unit/**: Pure unit tests (Node environment)
  - **nuxt/**: Nuxt integration tests (Nuxt environment with happy-dom)

### Key Features

**Keyboard Shortcuts** (defined in useDashboard composable):
- `g-h`: Navigate to home
- `g-i`: Navigate to inbox
- `g-c`: Navigate to customers
- `g-s`: Navigate to settings
- `n`: Toggle notifications slideover

**Routing**: File-based routing with nested routes under `/settings`

**API Layer**: Server routes in `/server/api` return mock data (will need real data layer for budget features)

**Type Safety**: TypeScript interfaces in `app/types/index.d.ts` define core data structures

## Current Data Models

Current types (in `app/types/index.d.ts`) from dashboard template:
- `User`: User profiles with status and location
- `Mail`: Email messages
- `Member`: Team members
- `Stat`: Dashboard statistics
- `Sale`: Sales/transaction records
- `Notification`: User notifications
- `Period`: Time period selection (daily/weekly/monthly)
- `Range`: Date range selection

These will need to be adapted/extended for budget management (e.g., transactions, categories, budgets, accounts).

## Testing Strategy

The project uses **Vitest** with two separate test environments:
- **unit**: For testing utilities, composables, and pure functions (Node environment)
- **nuxt**: For testing components and Nuxt-specific features (Nuxt environment with happy-dom)

Coverage is enabled using v8 provider.

## Nuxt Configuration

Key modules in use:
- `@nuxt/ui`: Component library and design system
- `@nuxthub/core`: NuxtHub deployment utilities
- `@nuxt/scripts`: Script management
- `@vueuse/nuxt`: Vue composition utilities
- `@nuxtjs/google-fonts`: Google Fonts integration
- `@nuxt/hints`: Development hints
- `@nuxt/test-utils`: Testing utilities

API routes have CORS enabled via route rules.

## ESLint Configuration

Custom rules:
- `vue/no-multiple-template-root`: off (allows multiple root elements)
- `vue/max-attributes-per-line`: max 3 attributes on single line
- Stylistic: comma-dangle 'never', brace-style '1tbs'

## Project Status

This is a **work in progress** being customized for family budget management. The current template structure (customers, inbox, sales) serves as scaffolding and will be replaced/adapted with budget-specific features such as:
- Transaction tracking
- Budget categories
- Account management
- Financial reports and visualizations
- Recurring expenses
- Budget goals and limits

The mock data in server API routes will need to be replaced with a real data persistence layer.

---
*Based on Nuxt Dashboard Template - Customized for Family Budget Management*
