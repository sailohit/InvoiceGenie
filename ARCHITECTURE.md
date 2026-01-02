# Invoice Genie - Technical Architecture

## Overview
Invoice Genie is a **Local-First** web application designed for generating invoices and shipping labels efficiently. It is built as a Progressive Web App (PWA) capable of running in the browser or as a desktop application via Electron.

## Technology Stack
- **Frontend Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **Database**: Dexie.js (IndexedDB wrapper) - *Local Storage*
- **Authentication**: Custom Local Authentication (Web Crypto API)
- **Desktop Runtime**: Electron

## Data Architecture
The application uses a **Local-First** approach. All data is stored in the user's browser using IndexedDB. There is no central backend server.

### Database Schema (`src/db/db.ts`)
The `InvoiceGenieDB` consists of three main tables:

1.  **`orders`**: Stores generated invoice/order records.
    - `id` (Auto-inc): Primary Key
    - `orderNumber`, `invoiceNumber`: Searchable indices
    - `timestamp`, `orderDate`: For sorting and reporting
    - Also stores snapshot of `financials` (tax, currency) and `product` info at time of order.
2.  **`users`**: Stores user credentials for RBAC.
    - `username`: Unique identifier
    - `passwordHash`: SHA-256 hash
    - `role`: 'admin' | 'user'
3.  **`products`**: Stores inventory items (Enhanced Phase 3).
    - `sku`: Unique Stock Keeping Unit
    - `name`: Product Name
    - `price`: Unit Price
    - `inventory`: Current stock level
    - `minStock`: Low stock alert threshold
    - `category`: Product grouping
4.  **`customers`**: Stores customer profiles (auto-saved from orders).
5.  **`settings`**: Key-value store for app configuration (Company Info, Globals).

## Core Modules

### 1. Invoice Engine (Phase 4)
-   **Multi-Currency**: Supports global currency configuration with `Intl.NumberFormat` for localization.
-   **Tax Engine**: Configurable Tax Name and Rate. Auto-calculates totals.
-   **Templates**: Strategy pattern for rendering different Invoice UI styles (Modern, Minimal, Business).

### 2. Product Management (Phase 3)
-   **Inventory Tracking**: Deducts stock upon order creation (`saveOrder` transaction).
-   **Bulk Import**: Uses `papaparse` to ingest CSV files into IndexedDB.

### 3. Data Management (Phase 2)
-   **Export/Import**: Full database dump/restore using JSON format.
-   **Factory Reset**: Clears data while preserving Admin accounts.

## Authentication & Security
### Design
Since there is no backend, authentication is handled locally to restrict access to UI features (Role-Based Access Control).

-   **Hashing**: Passwords are hashed using **SHA-256** via the browser's native `Function` (Web Crypto API).
-   **Session**: User session state is persisted in `localStorage` but validated against the IndexedDB `users` table on load.
-   **RBAC**: Components check `user.role` to conditionally render sensitive features (e.g., Admin Panel, Company Settings).

## Project Structure
```
src/
├── components/     # Reusable UI components (Layout, forms)
│   ├── ui/         # shadcn/ui primitive components
│   ├── InvoicePreview.tsx # Invoice rendering logic
├── contexts/       # React Contexts (AuthContext)
├── db/             # Dexie Database configuration and schema
├── pages/          # Route components (Index, Login, Admin)
└── utils/          # Helper functions (order parsing, formatting)
```

## Developer Notes
-   **Migrations**: Database schema changes are handled via Dexie's `version().stores()`. Always increment the version number when changing schema.
-   **Electron**: The electron build process wraps the Vite build output. Ensure checking `package.json` scripts for `electron:dev` vs `dev`.
