Top Secret - React Migration

This project now runs as a React app built with Vite.

Requirements:
- Node.js 18+

Install dependencies:
- npm install

Configure Firebase env vars:
- Copy `.env.example` to `.env.local`
- Fill all `VITE_FIREBASE_*` values

Run development server:
- npm run dev
- npm run start

Build for production:
- npm run build

Preview production build:
- npm run preview

Main routes:
- /
- /coupons
- /recettes

Notes:
- Firebase configuration is in src/lib/firebase.js.
- Firebase values are loaded from `VITE_FIREBASE_*` environment variables (no hardcoded key in source).
- Global styles are in src/styles/ and loaded from src/main.jsx.
- Static images are in public/images/.
- Legacy static pages/scripts were removed. The app entrypoint is index.html -> src/main.jsx.

GitHub Pages:
- Add repository Secrets with the same names as in `.env.example`.
- The workflow injects these secrets during `npm run build` before deployment.
