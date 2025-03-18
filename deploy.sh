#!/bin/bash

# Static export deployment script for Next.js on Vercel
# This script helps prepare the project for deployment

echo "Starting deployment preparation..."

# Ensure we have the latest dependencies
echo "Installing dependencies..."
pnpm install

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf .next out

# Set environment for the build
export NEXT_PHASE=phase-production-build
export NODE_ENV=production
export NEXT_PUBLIC_VERCEL_ENV=production

# Build the project
echo "Building the project..."
pnpm run build

# Copy static files to out directory if needed
echo "Copying static files..."
cp -r public/* out/ 2>/dev/null || :

# Output success
echo "Deployment preparation complete!"
echo "The static site is ready in the 'out' directory"
echo "Push your changes to your repository to deploy on Vercel" 