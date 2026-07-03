# Technical Plan

## Recommended Initial Stack

Two strong options:

### Option A: Android-first

- Kotlin
- Jetpack Compose
- Firebase Auth
- Firestore
- Firebase Storage
- RevenueCat or Google Play Billing

Best if the first launch target is Android and we want to reuse experience from the current codebase.

### Option B: Cross-platform app

- React Native with Expo
- TypeScript
- Supabase or Firebase
- RevenueCat

Best if we want Android, iOS, and a future web surface with shared product thinking.

## Recommendation

For Eligr, use React Native with Expo if the goal is a modern product that may reach Android and iOS quickly.

Use Kotlin/Compose if the immediate priority is Android only and keeping close to existing Android/Firebase experience.

## Architecture Principles

- Keep domain logic separate from UI.
- Make scoring deterministic and testable.
- Store structured rental data, not only notes.
- Treat AI as an enhancement, not the source of truth.
- Design premium limits in the domain layer from the start.

## Initial Modules

- auth
- searches
- rental-options
- scoring
- comparison
- billing
- settings

## First Implementation Milestone

Build a local-first prototype:

- No backend.
- Seed/sample data.
- Add/edit/delete rental options.
- Priority sliders.
- Score calculation.
- Ranking screen.

Once the workflow feels good, connect persistence and auth.
