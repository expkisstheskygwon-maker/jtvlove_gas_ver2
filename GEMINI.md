# Project Analysis: jtvlove_gas_ver2 (2026-05-14)

## Project Overview
Comprehensive management and social platform for the Philippine JTV industry. Supports multiple personas: General Users, CCAs (Staff), Venue Admins, and Super Admins.

## Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Material UI, Framer Motion, React Router 7.
- **Backend:** Cloudflare Pages Functions (Serverless).
- **Database:** Cloudflare D1 (SQLite-based distributed DB).
- **Storage:** Cloudflare R2 (Media/Image storage).
- **Dev Environment:** Custom Express server (`server.ts`) with Vite middleware.

## Core Modules & Features
- **Dashboards:** Dedicated portals for Admins, CCAs, and Super Admins.
- **Social:** Follows, likes, community boards, and "Link-in-Bio" profiles.
- **Business Logic:** Real-time reservations, attendance tracking, and point/penalty system.
- **Monetization:** Paid "Secret Conversations" and user subscriptions.

## Database Schema Highlights
- `venues`, `ccas`, `users`: Core entities.
- `reservations`, `cca_attendance`: Operational data.
- `cca_point_categories`, `cca_point_logs`: Staff reward/penalty system.
- `secret_conversations`, `secret_messages`: Paid messaging infrastructure.
- `board_configs`: Dynamic forum management.

## Critical Issues & Findings
- **`apiService.ts` Incomplete:** Many components call methods (e.g., `getCCAs`, `getVenues`, `getPosts`) that are currently missing from `services/apiService.ts`. This is the most urgent task to resolve for application functionality.
- **Schema Auto-Migration:** Backend functions (`[[id]].ts`) include logic to add missing columns to D1 tables automatically, which is helpful but should be monitored for consistency.
- **Mock vs. Real Data:** The project is in a transition phase between local mock data and real Cloudflare D1 integration.

## Next Steps
1. Complete the implementation of `services/apiService.ts` to match all frontend calls.
2. Verify all API endpoints in `functions/api/` correspond to the service layer.
3. Establish a consistent pattern for handling JSON fields (e.g., `tags`, `sns`) across all API responses.
