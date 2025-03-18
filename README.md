# Lily AI - Solana AI Trading Assistant

A modern web application built with Next.js, React, and Privy authentication that provides AI-powered trading assistance on the Solana blockchain.

## Features

- **Modern UI**: Clean and responsive design with Tailwind CSS
- **Authentication**: Secure user authentication with Privy
- **Personalized Experience**: Comprehensive onboarding flow to capture user preferences
- **AI Assistant**: Advanced chat interface for trading assistance
- **Solana Integration**: Direct interaction with the Solana blockchain for balance checks, token swaps, and transaction history
- **Responsive Design**: Optimized for all devices from mobile to desktop
- **Accessibility**: WCAG 2.1 compliant for an inclusive user experience

## Solana Features

- **Wallet Integration**: Display SOL balance and wallet address in the navigation bar
- **Token Swapping**: Swap tokens directly through the chat interface with commands like "swap 1 USDC to SOL"
- **Transaction History**: View your recent transactions directly in the chat
- **Token Prices**: Get real-time token prices from CoinGecko
- **Error Handling**: Robust error handling for network congestion and rate limits

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI
- **Blockchain**: Solana Agent Kit (Sendai) for Solana blockchain interaction
- **Authentication**: Privy
- **State Management**: React Server Components, React Hooks
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- pnpm 8.0.0 or later
- Solana wallet with some SOL for test transactions

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd lily-fe
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the root directory with the required environment variables:

   ```
   # Authentication
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

   # AI Configuration
   NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key

   # Solana Configuration
   NEXT_PUBLIC_SOLANA_PRIVATE_KEY=your-base58-encoded-private-key
   NEXT_PUBLIC_RPC_URL=your-solana-rpc-url
   NEXT_PUBLIC_COINGECKO_DEMO_API_KEY=your-coingecko-api-key
   ```

4. Start the development server

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # API routes including chat and Solana endpoints
│   │   ├── chat/         # Chat API routes with Solana integration
│   │   └── top-coins/    # API for AI token recommendations
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main dashboard
│   ├── home/             # Main home page with chat interface
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── auth/             # Auth-related components
│   ├── chat/             # AI chat interface components
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # Reusable UI components
├── constant/             # Constant values like token information
├── lib/                  # Utility functions and shared logic
└── public/               # Static assets
```

## User Flow

1. **Landing Page**: Users start here and click "Get Started"
2. **Authentication**: Users sign in using Privy (email, wallet, social)
3. **Home Page**: Main application with AI assistant for Solana interactions
4. **Dashboard**: View portfolio, trading interface, and other features

## Chat Commands

The AI assistant can handle the following commands:

- **Balance Check**: "What's my wallet balance?" or "balance"
- **Wallet Address**: "What's my wallet address?" or "address"
- **Transaction History**: "Show my transaction history" or "transactions"
- **Token Swap**: "Swap 1 USDC to SOL" (supports various token pairs)
- **Token Prices**: "What's the price of SOL?" or "Show me token prices"
- **AI Recommendations**: "What tokens do you recommend?" or "Show recommendations"
- **Help**: "What commands can you help me with?" or "help"

## Development

### Key Concepts

- **Server Components**: Utilize React Server Components for improved performance
- **Solana Integration**: Direct blockchain interaction through the Solana Agent Kit
- **Rate Limit Handling**: Automatic retry logic for handling RPC rate limits
- **Chat-Based Interface**: All blockchain interactions available through natural language

### Working with Solana

The application uses the Solana Agent Kit (Sendai) for blockchain interactions:

```typescript
// Example for creating Solana tools
import { createSolanaTools, SolanaAgentKit } from 'solana-agent-kit';

// Initialize with private key and RPC URL
const solanaKit = new SolanaAgentKit(
  privateKeyBase58,
  process.env.NEXT_PUBLIC_RPC_URL!,
  {
    OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
);

// Create tools for more advanced use cases
const tools = createSolanaTools(solanaKit);
```

## Deployment

This project is optimized for deployment on Vercel:

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

## Error Handling

The application includes robust error handling:

- Automatic retry for rate-limited API requests
- Exponential backoff for retrying blockchain operations
- User-friendly error messages in the chat interface
- Fallback mechanisms for when tools are unavailable

## License

[MIT](LICENSE)
