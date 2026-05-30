# ProStrike Manager

Jogo manager de e-sports de CS (React + TypeScript + Vite + Zustand).

## Rodar localmente
```bash
npm install
npm run dev      # desenvolvimento (localhost:5173)
npm run build    # build de produção -> pasta dist/
npm run preview  # serve o build localmente para testar
```

## Deploy na Cloudflare Pages (IMPORTANTE)

> ⚠️ O erro **"Failed to load module script: ... MIME type application/octet-stream"** acontece quando a Pages serve a **raiz do projeto** (o `index.html` de desenvolvimento aponta para `/src/main.tsx`, que o servidor entrega como `octet-stream`). A correção é a Pages **buildar e servir a pasta `dist/`**, nunca a raiz.

Configuração correta no painel da Cloudflare Pages (Settings → Builds & deployments):

| Campo | Valor |
|-------|-------|
| **Framework preset** | Vite |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

O `wrangler.toml` na raiz já declara `pages_build_output_dir = "dist"`. Os arquivos `public/_headers` (reforço de MIME dos `.js`) e `public/_redirects` (fallback SPA) são copiados para o `dist/` no build. A pasta `dist/` **não** é versionada (está no `.gitignore`) — a Pages a gera no build.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, 2 official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
