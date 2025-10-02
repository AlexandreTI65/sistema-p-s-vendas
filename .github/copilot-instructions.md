# Copilot Instructions for AI Agents

## Project Overview
- This is an Electron-based desktop app for post-sales management ("Sistema Pós-Vendas"), using JavaScript/Node.js and Firebase for data storage.
- The main entry point is `main.js` (Electron setup). The UI is rendered via `index.html` and logic in `renderer.js`.
- All business logic and UI actions are handled in the renderer process (no backend server).

## Key Architectural Patterns
- **Modular Structure:**
  - `src/` is organized by domain: `atendimentos/`, `clientes/`, `produtos/`, `relatorios/`, each with subfolders for `cadastro`, `consulta`, etc.
  - Shared configuration is in `src/config/` (see `firebaseConfig.js` and `app/index.js`).
- **Data Storage:**
  - Uses Firebase Firestore (modular v9+ API) for all persistent data (clients, products, atendimentos, etc.).
  - Firebase is initialized in `renderer.js` (not in a separate config file).
- **UI Patterns:**
  - UI is built with vanilla HTML/CSS/JS, using dynamic DOM manipulation (no frameworks).
  - Modals and lists are generated via JS template strings.
  - All user actions (CRUD, filtering, etc.) are exposed as global `window.*` functions.

## Developer Workflows
- **Start the app:**
  - Run `npm install` then `npm start` (runs Electron).
- **No build step:**
  - All code is plain JS/HTML/CSS; no transpilation or bundling.
- **No automated tests:**
  - Testing is manual via the UI.

## Project-Specific Conventions
- **Global Functions:**
  - All UI actions are attached to `window` (e.g., `window.consultarClientesAcao`).
  - Data is cached in global variables (e.g., `window._sacAtivoCache`).
- **Direct Firebase Usage:**
  - Firestore is accessed directly from the renderer process.
  - Credentials/config are hardcoded in `renderer.js` (not recommended for production).
- **No Routing:**
  - Navigation is handled by showing/hiding DOM elements, not via SPA routing.
- **Portuguese Naming:**
  - All code, variables, and UI are in Brazilian Portuguese.

## Integration Points
- **Firebase:**
  - Uses `firebase` and `firebase/firestore` (see `renderer.js`).
  - No other external APIs or services.

## Examples
- To add a new domain (e.g., "fornecedores"), create a new folder in `src/` and follow the structure of `clientes/` or `produtos/`.
- To add a new UI action, define a global function in `renderer.js` and call it from HTML via `onclick`.

## Key Files
- `main.js` — Electron app entry
- `renderer.js` — All UI and data logic
- `src/config/firebaseConfig.js` — (empty, but intended for Firebase config)
- `src/config/app/index.js` — App metadata

---

**For AI agents:**
- Always use global `window.*` functions for UI actions.
- Follow the folder structure and naming conventions.
- Do not introduce frameworks or build steps unless explicitly requested.
- Keep all code and UI in Brazilian Portuguese.
