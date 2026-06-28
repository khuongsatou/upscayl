---
description: This file defines the coding style guide for the project.
alwaysApply: true
---

# Code Style Guide

This file defines the preferred coding style for this repository. Follow it for all new code and refactors unless a specific task requires otherwise.

## Core Principles

- Write minimal but robust code.
- Think step by step and choose the simplest solution that fully solves the problem.
- Prefer shorter, clearer implementations over over-engineered abstractions.
- Keep everything practical: KISS, DRY, SOLID, YAGNI, SRP, and separation of concerns.
- Focus on minimum viable functionality first.
- Do not add excessive fail-safe checks for cases that are already handled upstream.
- Use modern patterns, not outdated ones.
- Keep code easy to read, easy to change, and easy to delete.

## Project Shape

- This repository is a desktop app, not a monorepo.
- Electron main-process and preload code live in `electron/`.
- The React renderer lives in `renderer/`.
- Shared cross-process utilities, constants, and types live in `common/` and `common/types/`.
- Shared renderer atoms live in `renderer/atoms/`.
- Shared renderer components live in `renderer/components/`.
- Reusable UI primitives live in `renderer/components/ui/`.
- Shared renderer utilities and helpers live in `renderer/lib/`.
- Support scripts live in `scripts/`.
- Documentation and API references live in `docs/`.
- Packaged assets and platform-specific resources live in `resources/`, `build/`, and `flatpak/`.
- Generated output lives in `out/`, `export/`, `renderer/out/`, and `renderer/.next/`; do not edit generated files unless the task explicitly requires it.

## Stack And Defaults

- Electron with `electron-vite`
- React 19 and TypeScript with `strict: true`
- Tailwind CSS v4, configured from `renderer/styles/globals.css`
- Jotai for renderer state
- Existing UI primitives in `renderer/components/ui/`, with current shadcn/Radix-compatible pieces. DaisyUI is being phased out.
- `electron-builder` for packaging and distribution
- `npm` for package management
- Node and npm pinned via Volta

## Package Management

- Always use `npm` to add, remove, or update JavaScript and TypeScript packages.
- This repo uses a single root `package.json`; do not use workspace install patterns here.
- Always install from the repo root instead of editing `package.json` by hand.
- Do not hand-edit dependency versions unless there is a specific reason.
- Keep build, packaging, and release scripts aligned with the existing root `package.json` conventions.

## TypeScript Style

- Keep TypeScript strict and lean into it rather than working around it.
- Prefer explicit types at important boundaries: props, shared utilities, IPC payloads, shared state, and return values when they improve clarity.
- Put reusable renderer-only types near the renderer code that owns them.
- Put reusable cross-process types in `common/types/` or in the shared `common/` module that owns the related constants or helpers.
- Keep preload bridge types aligned between `electron/preload.ts` and `renderer/renderer.d.ts`.
- Do not redefine shared command, model, or payload types in feature components.
- Keep one-off local types inline only when they are truly local and not reused.
- Follow the existing path alias convention and import app code through `@/*`, `@common/*`, and `@electron/*` where applicable.
- Prefer `T[]` over `Array<T>`.
- Prefer `import type` for type-only imports when it improves clarity.
- Avoid `any`. Use precise types, generics, or `unknown` plus narrowing.
- Keep type names short, clear, and domain-oriented.

## Electron Boundaries

- Keep filesystem, shell, updater, native-process, and OS integration logic in `electron/`.
- From the renderer, use the preload bridge such as `window.electron` instead of importing Electron or Node APIs directly.
- Keep shared IPC command names and cross-process constants in `common/`.
- If logic is used by both renderer and Electron, move it to `common/` instead of duplicating it.

## React Style

- Use function components.
- Use modern React patterns that fit the current Electron and React versions in this repo.
- Keep components focused and small enough that their purpose is obvious.
- Split a component only when that genuinely improves clarity or reuse.
- Do not extract helpers or components prematurely.
- If logic is used once and is still readable inline, keep it inline.
- Prefer direct, readable component bodies over layers of indirection.
- Use hooks when they create a clear separation of behavior.
- Name hooks with the `use-` convention in filenames and `useX` in code.
- Prefer default exports where surrounding file patterns already use them.
- For shared utilities and primitives, match the existing file export pattern instead of introducing a new export style arbitrarily.
- Prefer direct implementation in the owning file for local UI changes.
- Do not introduce a router or a new app-shell abstraction unless the task clearly requires it.

## State Management

- Use Jotai for shared renderer state.
- Do not introduce Redux or Context API for normal app state unless there is a very strong reason.
- When creating atoms, prefer simple atoms with initial values.
- Do not use atom getter and setter definitions by default when a plain atom is enough.
- Keep shared atoms in `renderer/atoms/` unless they are truly feature-local.
- Name atoms clearly and consistently, usually with the `Atom` suffix.
- Use storage-backed atoms only when persistence is actually needed.
- Prefer local component state when the state is not shared.

## Data Flow And Side Effects

- Prefer the existing repo patterns for IPC, local file access, settings, analytics, and external-service integrations over new abstractions.
- Keep side effects close to the feature component or hook unless extracting them clearly improves readability.
- Put renderer-side helpers in `renderer/lib/` or the relevant feature area.
- Reuse existing wrappers for analytics, settings, or networked features when extending them.
- Do not introduce a new data or state library as a default without a specific task or migration plan.

## Naming

- Function names should be short and self-explanatory.
- Prefer memorable and concise names over long descriptive names.
- Avoid unnecessary verbosity in naming.
- Do not create unnecessary wrapper functions just to give a name to one line of code.
- Use domain language already present in the repo: images, models, upscayl, batch, output, logs, GPU, compression, metadata, settings, and platform-specific flows.
- Use `kebab-case` for filenames, matching the current codebase.
- Use clear suffixes where the codebase already does so, such as `Atom`, `Card`, `Dialog`, `Button`, `Badge`, or `Page`.

## File Organization

- Follow the existing folder structure before inventing new folders.
- Place feature UI close to the renderer feature when it is not shared.
- Put generic UI building blocks in `renderer/components/ui/`.
- Put cross-feature renderer logic in `renderer/lib/`.
- Put cross-process shared code in `common/`.
- Put shared types in `common/types/` when they are used across renderer and Electron.
- Put shared state in `renderer/atoms/`.
- Put Electron-specific utilities and integrations in `electron/`.
- Prefer adding to an existing area over creating a parallel pattern.

## Styling

- Use Tailwind classes first.
- Reuse the existing design tokens and CSS variables defined in `renderer/styles/globals.css`.
- Tailwind v4 configuration lives in CSS here; do not introduce a legacy Tailwind config pattern unless the task explicitly requires it.
- Use the existing `cn()` helper from `renderer/lib/utils.ts` for class merging when needed.
- Keep styling close to the component unless it is truly global.
- Use the existing UI primitives before building new low-level controls.
- Prefer the current DaisyUI and Tailwind patterns where the repo already uses them.
- Preserve the current visual language unless the task explicitly asks for a redesign.

## Code Shape

- Keep logic flat where possible.
- Prefer early returns over deep nesting.
- Remove duplication when the duplication is real, not hypothetical.
- Avoid speculative abstractions.
- Avoid unnecessary custom hooks, utilities, and indirection.
- Do not create extra layers just to be clean on paper.
- Favor code that a future reader can understand in one pass.
- Avoid unnecessary conversion helpers for simple payloads or config objects. Prefer writing the object inline when that is clearer.
- Avoid tiny one-off helper abstractions for simple constants, command names, or derived strings when inlining is clearer.

## Comments

- Keep comments rare.
- Add comments only when the intent is not obvious from the code.
- Do not add noisy comments that restate the code.
- Prefer making the code clearer instead of explaining poor structure with comments.

## Imports

- Group imports in a readable way and keep them stable.
- Prefer app imports through `@/*`, `@common/*`, and `@electron/*` instead of deep relative paths when those aliases apply.
- Keep type imports separate when it improves readability.
- Import lucide-react icons with the `Icon` suffix, such as `InfoIcon` or `ChevronDownIcon`.
- Do not leave unused imports behind.

## Existing Repo Conventions Worth Preserving

- Use double quotes.
- Use semicolons.
- Use strict TypeScript.
- Validate schema-sensitive or packaging-sensitive changes with `npm run build`.
- Use `npm run tsc` for narrower TypeScript validation when a full build is unnecessary.
- Keep Electron-specific logic in dedicated helpers, hooks, or command handlers rather than scattering it across unrelated files.
- Prefer existing UI primitives over recreating the same look with one-off markup or CSS constants.
- If a skeuomorphic button or badge already exists, use it instead of creating a near-duplicate.

## When Adding New Code

- Match the surrounding file style first.
- If the surrounding code is inconsistent, choose the simpler and more modern option.
- New code should follow this guide even if some legacy code does not.
- Improve nearby code only when it directly supports the task.
- Do not do broad stylistic rewrites without being asked.

## What To Avoid

- Over-engineering
- Premature abstraction
- Long, overly descriptive names
- Shared types embedded inside random component files
- Context or Redux for normal app state
- Direct Electron or Node imports inside the renderer when the preload bridge already covers the use case
- Manual dependency edits when `npm install` should be used
- Creating new patterns when an existing repo pattern already works
- Adding complexity for hypothetical future needs

## Corrections And Copilot Alignment

- Treat this file as the default style authority for generated code.
- Prefer minimal diffs.
- Respect the current architecture and file placement.
- If a task conflicts with this guide, follow the explicit task and keep the deviation as small as possible.
- Whenever the user corrects the preferred working style, update `.github/.copilot-instructions.md` to keep it aligned with this file.

<!-- Copyright 2026-Present - Upscayl -->
