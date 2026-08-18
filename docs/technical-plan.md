# Technical Plan

## Chosen Stack

The stack decision is complete:

- React Native with Expo
- TypeScript and Expo Router
- Zustand with AsyncStorage for local-first persistence
- React Hook Form and Zod
- Maestro for Android end-to-end flows

The first release intentionally has no backend, authentication, billing, or marketplace supply. Supabase/Firebase and RevenueCat remain possible later phases, after validating the local decision workflow.

## Architecture Principles

- Keep domain logic separate from UI.
- Make scoring deterministic and testable.
- Store structured rental data, not only notes.
- Treat AI as an enhancement, not the source of truth.
- Design premium limits in the domain layer from the start.

## Current Modules

- searches
- rental-options
- scoring
- comparison
- visits
- backup-and-sharing
- settings

## Current Release Milestone

Stabilize the local-first MVP for internal beta:

- No backend.
- Reliable persistence and migrations.
- Reproducible test, typecheck, and lint gates.
- Android smoke test and Maestro flows.
- Signed production AAB and Play Internal Testing.

Do not start backend/auth until real-user feedback shows that sync or collaboration is a release constraint.
