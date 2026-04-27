# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Project layout (important)

This repository contains more than one app surface:

- `domaci-rytmus/` → primary React app variant to work on for household features.
- `src/` at repo root → secondary React variant with similar components.
- `app.py` + `static/` + `scrapers/` → Flask API and static price-comparator page.

When making user-facing changes for Domáci Rytmus, update `domaci-rytmus/` first.

## Safe change workflow

From the repository root:

1. Run backend API checks:
   - `python -m unittest tests/test_api.py`
2. Run frontend checks for Domáci Rytmus variant:
   - `npm run domaci:lint`
   - `npm run domaci:build`
3. Or run everything with one command:
   - `npm run verify`
