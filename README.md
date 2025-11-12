# Cinematic 3D B‑Roll Generator

Generate ultra‑realistic, featureless humanoid stills and short b‑roll shots for documentaries and interviews. Rendered entirely in the browser using WebGL/Three.js for easy, private, and fast results.

## Features
- Minimalistic scenes with cinematic lighting and post‑processing (bloom, vignette)
- Featureless humanoid mannequin with multiple poses
- Prompt parser to set mood, lighting color, FOV, camera path
- Upload a photo to match lighting color
- Export PNG stills and 6s WebM b‑roll clips

## Tech
- Next.js App Router, React 18, TypeScript
- react‑three‑fiber, drei, postprocessing
- Tailwind CSS for UI

## Scripts
```bash
npm install
npm run build
npm start
```

## Deploy
Deployment is configured for Vercel. Use the CLI:
```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-b3576e10
```
