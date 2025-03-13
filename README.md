# Lily AI - AI Trading Assistant

A modern web application built with Next.js, React, and Privy authentication that provides AI-powered trading assistance.

## Features

- **Modern UI**: Clean and responsive design with Shadcn UI and Tailwind CSS
- **Authentication**: Secure user authentication with Privy
- **Personalized Experience**: Comprehensive onboarding flow to capture user preferences
- **AI Assistant**: Advanced chat interface for trading assistance powered by Vercel AI SDK
- **Responsive Design**: Optimized for all devices from mobile to desktop
- **Accessibility**: WCAG 2.1 compliant for an inclusive user experience

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI
- **AI Integration**: Vercel AI SDK
- **Authentication**: Privy
- **State Management**: React Server Components, React Hooks
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- pnpm 8.0.0 or later

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
   OPENAI_API_KEY=your-openai-api-key
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
│   ├── api/              # API routes including AI endpoints
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main dashboard
│   ├── onboarding/       # User onboarding flow
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── auth/             # Auth-related components
│   ├── chat/             # AI chat interface components
│   ├── dashboard/        # Dashboard-specific components
│   ├── onboarding/       # Onboarding flow components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility functions and shared logic
│   ├── actions/          # Server actions
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper utilities
├── styles/               # Global styles
└── public/               # Static assets
```

## User Flow

1. **Landing Page**: Users start here and click "Get Started"
2. **Authentication**: Users sign in using Privy (email, wallet, social)
3. **Onboarding**: Multi-step process to capture trading preferences and experience
4. **Dashboard**: Main application with AI assistant and personalized insights

## Development

### Key Concepts

- **Server Components**: Utilize React Server Components for improved performance
- **Streaming**: Implement streaming responses with Vercel AI SDK
- **Type Safety**: Comprehensive TypeScript types throughout the application
- **Accessibility**: Focus on keyboard navigation and screen reader support

### Adding New Features

- **Pages**: Create new directories in `src/app/` with appropriate page files
- **Components**: Add new components in the relevant subdirectory of `src/components/`
- **API Routes**: Implement new endpoints in `src/app/api/`
- **Styling**: Use Tailwind CSS utility classes and Shadcn UI components

## AI Integration

The chat interface is built using the Vercel AI SDK:

```typescript
// Example chat implementation
'use client';

import { useChat } from 'ai/react';

export function TradingAssistant() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    maxSteps: 5,
  });

  return (
    <div className='flex flex-col w-full max-w-md py-24 mx-auto stretch'>
      {/* Messages display */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder='Ask about trading strategies...'
          onChange={handleInputChange}
          className='w-full p-2 border border-gray-300 rounded shadow-xl'
        />
      </form>
    </div>
  );
}
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

## Performance Optimization

- Server Components for reduced client-side JavaScript
- Image optimization with next/image
- Font optimization with next/font
- Proper caching strategies with `staleTimes` configuration

## License

[MIT](LICENSE)
