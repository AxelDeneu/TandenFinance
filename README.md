# 💰 TandenFinance

[![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&labelColor=white)](https://www.typescriptlang.org)
[![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-v4-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A personal family budget management system built for Axel & Dorine — track transactions, manage accounts, and visualize your financial health.

---

## ✨ Features

- 📊 **Dashboard Overview** — At-a-glance summary of your financial situation
- 💳 **Transaction Tracking** — Log and categorize income and expenses
- 🗂️ **Budget Categories** — Organize spending by custom categories
- 🏦 **Account Management** — Manage multiple bank accounts and balances
- 📈 **Financial Reports & Visualizations** — Charts and graphs powered by Unovis
- 🔁 **Recurring Expenses** — Track subscriptions and regular bills
- 🎯 **Budget Goals & Limits** — Set targets and get notified when you're close
- ⌨️ **Keyboard Shortcuts** — Fast navigation (`g-h`, `g-i`, `g-c`, `g-s`, `n`)
- 🌗 **Light & Dark Mode** — Full theme support
- 📱 **Responsive Design** — Works on desktop and mobile

> **Note:** TandenFinance is a work in progress. Some features are planned and not yet implemented.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | [Nuxt 3](https://nuxt.com) (v4.3.1) + TypeScript |
| **UI Library** | [Nuxt UI v4](https://ui.nuxt.com) + Tailwind CSS v4 |
| **Package Manager** | pnpm (v10.29.2) |
| **Testing** | [Vitest](https://vitest.dev) (unit + Nuxt integration) |
| **State Management** | [VueUse](https://vueuse.org) composables |
| **Data Validation** | [Zod](https://zod.dev) |
| **Date Handling** | [date-fns](https://date-fns.org) |
| **Charts** | [Unovis](https://unovis.dev) (`@unovis/vue`, `@unovis/ts`) |
| **Tables** | [TanStack Table](https://tanstack.com/table) Core |
| **Deployment** | [NuxtHub](https://hub.nuxt.com) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 10

### Installation

```bash
# Clone the repository
git clone https://github.com/AxelDeneu/TandenFinance.git
cd TandenFinance

# Install dependencies
pnpm install
```

### Start the Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 🧑‍💻 Development

### Available Commands

```bash
# Start development server
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

# Generate database migrations (after modifying server/db/schema.ts)
npx nuxt db generate
```

> Database migrations are applied automatically on dev server startup.

---

## 🐳 Docker

A `Dockerfile` and `docker-compose.yml` are included for containerized deployment.

```bash
# Build and start the application
docker compose up --build

# Run in detached mode
docker compose up -d
```

> The `NUXT_MCP_TOKEN` environment variable is pre-configured in `docker-compose.yml` for MCP integration.

---

## 📁 Project Structure

```
TandenFinance/
├── app/
│   ├── pages/          # File-based routing (index, customers, inbox, settings/*)
│   ├── components/     # Vue components organized by feature
│   ├── composables/    # Shared Vue composables (useDashboard.ts, ...)
│   ├── layouts/        # Layout components (default.vue)
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── assets/css/     # Global styles
│   └── app.config.ts   # Nuxt UI configuration
├── server/
│   └── api/            # Server-side API route handlers
├── test/
│   ├── unit/           # Pure unit tests (Node environment)
│   └── nuxt/           # Nuxt integration tests (happy-dom)
├── Dockerfile
├── docker-compose.yml
└── nuxt.config.ts
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with ❤️ for Axel & Dorine*
