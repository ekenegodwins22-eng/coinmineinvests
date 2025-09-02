# Deployment Guide

This guide explains how to deploy CryptoMine Pro with the backend on Render and frontend on Vercel.

## Backend Deployment (Render)

1. **Push your code to GitHub**
2. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Root Directory: Leave blank (uses entire repo)
   - Runtime: Node
   - Build Command: `npm install && npm run build:backend`
   - Start Command: `npm run start:backend`

3. **Environment Variables on Render:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<your-postgres-connection-string>
   SESSION_SECRET=<generate-a-secure-random-key>
   FRONTEND_URL=<your-vercel-frontend-url>
   ```

4. **Database Setup:**
   - Use Render PostgreSQL or external PostgreSQL service
   - Copy the DATABASE_URL to your environment variables

## Frontend Deployment (Vercel)

1. **Create a new project on Vercel**
   - Import your GitHub repository
   - Framework Preset: Vite
   - Root Directory: Leave blank
   - Build Command: `npm run build:frontend`
   - Output Directory: `dist/public`

2. **Environment Variables on Vercel:**
   ```
   VITE_BACKEND_URL=<your-render-backend-url>
   ```

3. **Domain Configuration:**
   - Copy your Vercel domain
   - Update the FRONTEND_URL in your Render backend environment

## Local Development

For local development with separate backend/frontend:

1. **Start Backend:**
   ```bash
   export VITE_BACKEND_URL=http://localhost:5000
   npm run start:backend
   ```

2. **Start Frontend (in separate terminal):**
   ```bash
   export VITE_BACKEND_URL=http://localhost:5000
   npm run dev
   ```

## Important Notes

- Make sure CORS is properly configured for cross-origin requests
- Session cookies require the same domain or proper CORS credentials setup
- The backend health check is available at `/api/health`
- Database migrations should be run before deployment using `npm run db:push`

## Scripts Reference

- `npm run build:backend` - Build backend only
- `npm run build:frontend` - Build frontend only  
- `npm run start:backend` - Start backend in production mode
- `npm run dev` - Start development server (both backend and frontend)