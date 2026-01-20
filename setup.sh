#!/bin/bash

# Coffee Connect - Linux Setup Script
# This script installs all dependencies and sets up the database.

echo "☕ Setting up Coffee Connect..."

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# 2. Install Dependencies (Equivalent to pip install -r requirements.txt)
echo "📦 Installing dependencies from package.json..."
npm install

# 3. Generate Database Client
echo "🗄️  Generating Prisma Client..."
npx prisma generate

# 4. Success
echo "-----------------------------------"
echo "🎉 Setup Complete!"
echo "-----------------------------------"
echo "To start the app, run:"
echo "  npm run dev"
echo "-----------------------------------"
