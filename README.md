# Naki AI - AI Trading Assistant

A modern web application built with Next.js, React, and Privy authentication.

## Features

- **Modern UI**: Clean and responsive design based on Figma mockups
- **Authentication**: Secure user authentication with Privy
- **Personalized Experience**: Onboarding flow to capture user preferences
- **AI Assistant**: Chat interface for trading assistance

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Privy
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd naki-ai
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the root directory and add your Privy App ID:

   ```
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
   ```

   You can get your Privy App ID from the [Privy Dashboard](https://console.privy.io/).

4. Start the development server

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── auth/             # Authentication page
│   ├── dashboard/        # Main dashboard
│   ├── onboarding/       # User onboarding
│   └── page.tsx          # Landing page
├── components/           # React components
│   └── auth/             # Auth-related components
├── styles/               # Global styles
└── lib/                  # Utility functions
```

## User Flow

1. **Landing Page**: Users start here and click "Get Started"
2. **Authentication**: Users sign in using Privy (email, wallet, social)
3. **Onboarding**: Users select their trading preferences
4. **Dashboard**: Main application with AI assistant

## Development

- **Adding Pages**: Create new directories in `src/app/`
- **Styling**: Use Tailwind CSS classes for styling
- **Authentication**: Privy hooks are available in client components

## Deployment

This project can be easily deployed to Vercel:

```bash
vercel
```

## License

[MIT](LICENSE)
