# Kereru AI Chat Demo

A standalone demo of Kereru AI - a sovereign New Zealand AI assistant with comprehensive safety guardrails and NZ-focused capabilities.

## Features

- **NZ-Sovereign AI**: Powered by Kereru AI model with New Zealand context
- **Safety First**: Built-in toxicity detection, output sanitization, and content filtering
- **Clean Interface**: Modern, responsive chat UI with Tailwind CSS
- **Web Search**: Integrated NZ-focused web search capabilities
- **Security Guardrails**:
  - Secret detection (API keys, tokens, credentials)
  - Disallowed content filtering (weapons, malware, etc.)
  - Toxicity scoring and blocking
  - HTML sanitization to prevent XSS
  - Rate limiting

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates a production build in the `dist/` folder.

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy:
```bash
npm run deploy
```

Or manually:
```bash
npm run build
wrangler pages deploy dist --project-name=kereru-chat-demo
```

### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Option 4: GitHub Pages

1. Update `vite.config.ts` to set base path:
```typescript
export default defineConfig({
  base: '/kereru-chat-demo/',
  // ... rest of config
});
```

2. Build and deploy:
```bash
npm run build
npx gh-pages -d dist
```

## API Configuration

The chat uses the Together AI API. The API key is included in the code for demo purposes.

**For production use, you should:**
1. Get your own API key from [Together AI](https://api.together.xyz/)
2. Move the key to environment variables
3. Update [src/services/kereruService.ts](src/services/kereruService.ts):

```typescript
const TOGETHER_API_KEY = import.meta.env.VITE_TOGETHER_API_KEY;
```

Then create a `.env` file:
```
VITE_TOGETHER_API_KEY=your_api_key_here
```

## Project Structure

```
kereru-chat-demo/
├── src/
│   ├── components/
│   │   └── ChatPage.tsx       # Main chat interface
│   ├── services/
│   │   ├── kereruService.ts   # AI service integration
│   │   └── guardrails.ts      # Security & safety checks
│   ├── functions/
│   │   └── api/
│   │       └── search.ts      # NZ web search endpoint
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Safety Features

### Input Guardrails
- Secret pattern detection (API keys, tokens, etc.)
- Disallowed content blocking (weapons, explosives, malware, etc.)
- NZ-specific fraud pattern detection
- Rate limiting (30 requests/minute default)

### Toxicity Detection
- Pattern-based scoring (0.0 - 1.0 scale)
- Threshold blocking at 0.7
- Weighted patterns for different severity levels

### Output Sanitization
- HTML entity escaping to prevent XSS
- Safe refusal messages for blocked content
- Error handling and fallbacks

## Customization

### Update Colors
Edit [tailwind.config.js](tailwind.config.js):
```javascript
colors: {
  'kereru-dark': '#0a0e1a',
  'kereru-green': '#2d5f3f',
  'kereru-neon': '#00ff9d',
  // Add your colors
}
```

### Modify Guardrails
Edit [src/services/guardrails.ts](src/services/guardrails.ts) to adjust:
- `DISALLOWED_PATTERNS` - content to block
- `TOXICITY_PATTERNS` - toxicity detection rules
- `TOXICITY_THRESHOLD` - sensitivity level (default: 0.7)
- `RATE_LIMIT_MAX` - requests per window (default: 30)

### Change AI Model
Edit [src/services/kereruService.ts](src/services/kereruService.ts):
```typescript
const MODEL_NAME = 'your-model-name';
```

## Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

This is a demo project. The Kereru AI brand and technology are property of their respective owners.

## Support

For questions about Kereru AI, visit [kereru.ai](https://kereru.ai)

## Security Note

⚠️ **This demo includes hardcoded API keys for demonstration purposes only.**

For production deployment:
1. Remove all hardcoded API keys
2. Use environment variables
3. Implement backend proxy for API calls
4. Add authentication and authorization
5. Set up monitoring and logging
6. Review and test all security guardrails
