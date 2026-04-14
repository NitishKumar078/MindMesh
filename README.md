# 🧠 MindMesh

**MindMesh** is a sleek, privacy-first AI chat interface built with Next.js. It lets you bring your own API key and chat with your preferred AI provider — no backend accounts, no data storage. Your key lives in your browser only.

---

## ✨ Features

- **Multi-provider support** — Switch between **Perplexity**, **OpenAI (GPT-3.5 Turbo)**, and **Google Gemini** from a single UI.
- **Perplexity web citations** — When using Perplexity's `sonar-pro` model, responses include source URLs with favicons for easy reference.
- **Bring Your Own Key (BYOK)** — API keys are stored locally in `localStorage` and are never sent to any server other than the chosen AI provider.
- **Multi-turn conversations** — Full chat history is maintained in the session so context carries across messages.
- **Dark / Light theme** — Powered by `next-themes` with system-preference detection.
- **Animated UI** — Smooth particle backgrounds, vapour text effects, and micro-animations via Framer Motion.
- **Zero environment variables required** — Everything is configured through the in-app settings form.

---

## 🏗️ How It Works

```
User Browser
    │
    ├─ / (Home page)
    │   └─ ModelInfo component
    │       ├─ Select AI Provider (Perplexity | OpenAI | Gemini)
    │       ├─ Enter API Key  → saved to localStorage
    │       └─ "Save & Start Chat" → redirect to /chat
    │
    └─ /chat
        └─ AnimatedAIChat component
            ├─ Sends messages to POST /api/chat
            └─ Displays streaming response with citations (Perplexity)

Server (Next.js API Route)
    └─ POST /api/chat
        ├─ Receives: { message, provider, apiKey, messages[] }
        ├─ Routes to the correct provider handler:
        │   ├─ callPerplexityAPI  → api.perplexity.ai  (sonar-pro, + citations + favicons)
        │   ├─ callOpenAIAPI      → api.openai.com     (gpt-3.5-turbo)
        │   └─ callGeminiAPI      → generativelanguage.googleapis.com (gemini-2.0-flash)
        └─ Returns: { text, citations[], icons[], provider, timestamp }
```

The API route acts as a thin proxy — it forwards your request to the chosen provider using the key you supplied. The key is passed from the client on every request and is **never persisted on the server**.

---

## 🗂️ Project Structure

```
MindMesh/
├── app/
│   ├── api/chat/route.ts      # API proxy for all AI providers
│   ├── chat/page.tsx          # Chat UI page (/chat)
│   ├── lib/types.ts           # Shared types (Provider, AIPROVIDERS)
│   ├── layout.tsx             # Root layout (theme, fonts)
│   ├── page.tsx               # Home / landing page (/)
│   └── globals.css            # Global styles
├── components/ui/
│   ├── animated-ai-chat.tsx   # Full chat interface component
│   ├── Modoleinfo.tsx         # Provider & API key setup card
│   ├── particles.tsx          # Animated particle background
│   ├── vapour-text-effect.tsx # Animated headline text
│   ├── ThemeButton.tsx        # Dark/light mode toggle
│   ├── animated-tooltip.tsx   # Tooltip component
│   └── theme-provider.tsx     # next-themes provider wrapper
├── lib/
│   └── utils.ts               # Tailwind class merger utility
└── public/                    # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or later
- An API key from at least one of the supported providers:
  | Provider | Key URL |
  |---|---|
  | Perplexity | https://www.perplexity.ai/settings/api |
  | OpenAI | https://platform.openai.com/api-keys |
  | Google Gemini | https://aistudio.google.com/app/apikey |

### 1. Clone the repository

```bash
git clone https://github.com/NitishKumar078/MindMesh.git
cd MindMesh
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The app uses **Turbopack** for fast builds during development.

### 4. Configure your AI provider in the app

1. On the home page, select your preferred AI provider from the dropdown.
2. Paste your API key into the input field.
3. Click **Save & Start Chat** — you'll be redirected to `/chat`.

Your key is saved in your browser's `localStorage`. You can update it anytime by returning to the home page.

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with Turbopack |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint checks |

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | React framework & API routes |
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark/light mode |
| [Lucide React](https://lucide.dev) | Icon library |
| [cheerio](https://cheerio.js.org) | HTML parsing |
| [favicon-extractor](https://www.npmjs.com/package/favicon-extractor) | Fetch provider favicons for citations |

---

## 🔒 Privacy & Security

- **Your API key stays in your browser.** It is stored in `localStorage` and sent directly to the AI provider's API through the Next.js API route.
- **No database, no accounts, no telemetry.** MindMesh does not persist your messages or API keys anywhere on the server.
- If you share a device, be aware that `localStorage` is accessible to anyone using the same browser profile. Clear it via browser DevTools (`Application → Local Storage`) when done.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
