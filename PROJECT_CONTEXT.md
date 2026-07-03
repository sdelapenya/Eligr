# Eligr - Project Context

## What Eligr Is

Eligr is a rental comparison and decision app. It helps users compare rooms, flats, studios, coliving spaces, and other rental options according to their personal priorities.

The core idea is not to become a rental marketplace at the start. Eligr starts as a decision layer on top of the rental listings users already find on portals, messages, screenshots, and visits.

Core promise:

> Compare rentals. Decide better.

Spanish tagline:

> Compara alquileres. Decide mejor.

## Product Direction

Eligr should answer one key question:

> Which rental should I choose, and why?

The app should help users add several rental options, define what matters most to them, and receive an explainable ranking with tradeoffs, pros, cons, and risk warnings.

## Initial MVP

The first MVP should focus on a complete manual workflow:

1. Create a rental search.
2. Add 3 to 10 rental options manually.
3. Define personal priorities.
4. Calculate a transparent score.
5. Show a ranked comparison.
6. Explain why each rental is recommended, risky, cheap, balanced, or worth discarding.

## Initial Screens

- Search setup
- Rental option list
- Add/edit rental option
- Priorities setup
- Comparison/ranking
- Rental detail
- Visit notes/checklist
- Premium/paywall placeholder

## Chosen Stack

Use:

- React Native
- Expo
- TypeScript
- Expo Router
- Zustand for local state
- React Hook Form + Zod for forms and validation
- Local-first prototype first
- Backend later: Supabase or Firebase
- Monetization later: RevenueCat

## Why This Stack

React Native + Expo is chosen because Eligr is a new product that should be able to reach Android and iOS without rebuilding everything. The app is mostly forms, lists, scoring, comparison, notes, and eventually map/premium features, which fits React Native well.

## Monetization Direction

Recommended model: freemium with a short-term premium pass.

Free tier:

- 1 active search
- Up to 5 rental options
- Basic comparison
- Basic scoring
- Manual notes

Premium tier / Rental Decision Pass:

- Unlimited rental options
- Advanced weighted scoring
- AI-generated pros and cons
- Anti-scam/risk analysis
- Visit checklist
- Share/export comparison
- Collaboration with partner/friends/family

The pass idea fits the rental journey because users often need this kind of app intensely for 2 to 6 weeks, not forever.

## Domain Model

Main entities:

- User
- RentalSearch
- RentalOption
- PriorityWeights
- RentalScore
- VisitNote

Rental statuses:

- new
- contacted
- visit_planned
- visited
- favorite
- discarded

## Scoring Direction

Start with deterministic scoring, not AI-first.

Scoring should:

- Normalize each criterion to 0-100.
- Multiply by user-defined priority weights.
- Sum weighted scores.
- Show a breakdown.
- Flag missing or risky information.

AI can be added later to write clearer explanations, but the score itself should remain structured and explainable.

## UX Direction

The app should feel modern, simple, calm, and practical. It is not a marketing site and not a listing marketplace. The first screen should be the usable app experience.

Visual style:

- Clean, focused, mobile-first.
- Useful dashboards and comparison views.
- No oversized landing hero inside the app.
- No decorative clutter.
- Clear cards only for repeated rental items or modal surfaces.
- Prioritize fast scanning and decision confidence.

## First Development Milestone

Create a local-first Expo app with:

- Sample rental search
- Sample rental options
- Add/edit/delete rental option
- Priority sliders or segmented controls
- Score calculation utility
- Ranking screen
- Rental detail with score breakdown

No backend is needed for the first milestone.

## Existing Files

This project currently has planning docs:

- README.md
- docs/product.md
- docs/mvp.md
- docs/monetization.md
- docs/domain-model.md
- docs/technical-plan.md

## Next Conversation Suggested Prompt

Continue building Eligr from E:\\Eligr. Use React Native + Expo + TypeScript. Start by inspecting the project docs, then scaffold the Expo app in this folder and build the first local-first MVP screens for comparing rental options. Keep the code clean, modern, and simple. Prioritize a usable comparison workflow before backend integration.
