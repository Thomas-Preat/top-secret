Top Secret - React Migration

This project now runs as a React app built with Vite.

Requirements:
- Node.js 18+

Install dependencies:
- npm install

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
- Global styles are in src/styles/ and loaded from src/main.jsx.
- Static images are in public/images/.
- Legacy static pages/scripts were removed. The app entrypoint is index.html -> src/main.jsx.
