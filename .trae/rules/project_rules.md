---
description: Core rules, conventions, and architectural guidelines for the Polling App with QR Code Sharing project.
globs:
alwaysApply: true
---

## Project Overview: Polling App with QR Code Sharing

You are an expert full-stack developer working on the Polling App codebase. Your primary goal is to build a web application that allows users to register, create polls, and share them via unique links and QR codes for others to vote on.

Adhere strictly to the rules, patterns, and conventions outlined in this document to ensure code quality, consistency, and maintainablity.

## Technology Stack

The project uses the following technologies. Do not introduce new libraries or frameworks without explicit instruction

- Language: TypeScript
- Main Framework: Next.js (App Router)
- Database & Auth: Supabase
- Styling: Tailwind CSS with shadcn/ui components
- State Managemnet: Primarily Server Components for server state. Use useState and useReducer for loal component state in Client Components.
- API Communication: Use Next.js Server Actions for mutations (creating polls, voting). Fetch data in Server Components using the Supabase client.
- Utility Libraries: A library like qrcode.react for generating QR codes.

## Architecture & Code Style

- Directory Structure: Follow the standard Next.js App Router structure.
  - `/app` for routes and pages.
  - `/components/ui` for `shadcn/ui` components.
  - `/components/` for custom, reusable components.
  - `lib` for Supabase client setup, utility functions, and Server Actions

## Code Patterns to Follow

- Use a form that calls a Server Action to handle data submission.
- Do not create a separate API route handler and use fetch on the client side to submit form data. Use Server Actions instead.
- Do not fetch data on the client side using useEffect and useState in a page component. Fetch data directly in a Server Component.
- Forms must use `react-hook-form` + `zod`, wrapped with `Form` from `@/components/ui/form`.
- Handle submissions with `async/await` + `try/catch`.

## Database & Auth

- Use Supabase for both auth and data.
- Use `@supabase/ssr` for auth/session.
- Never write raw SQL or bypass Supabase client.

## Polls Domain

### Poll Entity

- `id`, `title`, `description`, `is_active`, `is_public` `vote_count`, `creator_id`, `expires_at`

### Poll Options Entity

- `id`, `poll_id`, `option_text`, `option_order`, `vote_count`,

### Vote Entity

- `id`, `poll_id`, `poll_option_id`, `voter_id` (optional for anonymous votes), `voter_ip`,`voter_fingerprint` (optional, for anti-duplication), `user_agent`

## UI/UX Inspiration Rules

The Polling App UI should feel **modern, minimal, and content-focused**, drawing inspiration from Apple, iPhone, and Instagram design principles.

### Apple-Inspired Principles

- Prioritize **clarity**: simple typography, generous white space, no unnecessary clutter.
- Use **soft depth**: rounded corners, subtle shadows, smooth transitions.
- Keep **visual consistency**: similar button styles, uniform icon usage, predictable layouts.

### iPhone-Inspired Principles

- Design for **fluid interactions**: smooth animations, responsive feedback to user actions.
- Use **hierarchy with bold headers**: clear, large section titles that adapt on scroll.
- Apply **layering and transparency** where appropriate (e.g., modals, overlays).
- Maintain **accessibility**: legible text, proper contrast, balanced spacing.

### Instagram-Inspired Principles

- Make polls the **center of attention** (UI fades into the background, content stands out).
- Support **light and dark modes** seamlessly.
- Use **simple navigation** (e.g., bottom navigation bar, swipe gestures if possible).
- Add **micro-interactions**: lightweight animations (button press, vote confirmation).
- Use **subtle playfulness**: gradients or accent colors in highlights (not overused).

### Implementation Guidelines

- Default to **shadcn/ui** components styled with Tailwind.
- Use **optimistic updates** so interactions feel instant (e.g., voting).
- Keep layouts **mobile-first** but responsive to larger screens.
- Animate with **Framer Motion** for smooth micro-interactions.

## Verification Checklist

Before finalizing your response, you MUST verify the following:

- Does the code use the Next.js App Router and Server Components for data fetching?
- Are Server Actions used for data mutations (forms)?
- Is the Supabase client used for all database interactions?
- Are shadcn/ui components used for the UI where appropriate?
- Are Supabase keys and other secrets loaded from environment variables and not hardcoded?
- Does the Poll entity follow the domain rules?
- Are forms using `react-hook-form` with zod validation?
- Are Server Actions placed in the `/app/polls/` directory structure?
