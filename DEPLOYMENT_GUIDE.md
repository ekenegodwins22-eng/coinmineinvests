# Deployment Guide - Multiple Platform Options

This guide explains how to deploy your mining dashboard application with separate backend and frontend deployments across different platforms.

## Prerequisites

1. GitHub repository with your code
2. Environment variables ready
3. Account on your chosen platform(s)

## 🚀 Deployment Platform Options

You can mix and match different platforms for optimal performance and cost. Here are the recommended combinations:

### **Option 1: Backend on Koyeb + Frontend on Vercel** ⭐ **RECOMMENDED**
✅ **Best Performance Combo**
- **Vercel**: Built specifically for React/frontend apps with global CDN
- **Koyeb**: Excellent for backend APIs with persistent containers
- **Setup**: Deploy backend on Koyeb, frontend on Vercel
- **Pros**: Lightning-fast frontend, reliable backend, automatic deployments

### **Option 2: Both Backend + Frontend on Render** 💪 **SOLID CHOICE**
✅ **Unified Management**
- **Render**: Good all-around platform for both services
- **Setup**: Two separate services on same platform
- **Pros**: One dashboard, excellent database integration, simple management
- **Best for**: Teams who prefer managing everything in one place

### **Option 3: Backend on Render + Frontend on Vercel** 🚀 **ALSO GREAT**
✅ **Best of Both Worlds**
- **Render**: Excellent database integration for backend
- **Vercel**: Unmatched frontend performance
- **Setup**: Backend on Render, frontend on Vercel
- **Pros**: Database ease + frontend speed

### 📊 **Platform Strengths Summary:**

| Platform | Frontend | Backend | Database | Best For |
|----------|----------|---------|----------|----------|
| **Vercel** | ⭐ Excellent | ❌ Limited | ❌ None | React/Next.js apps |
| **Koyeb** | ⚠️ Basic | ⭐ Excellent | ✅ Good | Docker/API services |
| **Render** | ✅ Good | ✅ Good | ⭐ Excellent | Full-stack apps |

---

## 🎯 Quick Setup Instructions by Platform

### **Koyeb + Vercel Setup** (Recommended)

**Koyeb (Backend):**
- Build: `cd backend && npm ci --only=production && npm run build`
- Run: `cd backend && npm start`

**Vercel (Frontend):**
- Connect GitHub repo → Auto-detected as React app
- Set env: `VITE_API_URL=https://your-backend.koyeb.app`

### **Render (Both) Setup**

**Backend Service:**
- Build: `cd backend && npm ci && npm run build`
- Start: `cd backend && npm start`

**Frontend Service:**
- Build: `cd frontend && npm ci && npm run build`
- Static: `frontend/dist`

---

## 🔧 Detailed Platform Instructions

Choose your preferred option above, then follow the detailed instructions below:

---

# Option 1: Koyeb Deployment (Both Backend + Frontend)

## Backend Deployment (API Server)

### 1. Deploy to Koyeb

**Important**: Since your backend and frontend are in the same repository, Koyeb won't show separate backend/frontend folders. Follow these steps:

1. Go to your Koyeb dashboard
2. Click "Create Service"  
3. Choose "GitHub" as the source
4. Select your repository (you'll only see the main branch - this is normal)
5. **Leave the directory path empty** or put `.` (root)
6. Configure the following:

#### Build Settings
- **Build command**: `cd backend && npm ci --only=production && npm run build`
- **Run command**: `cd backend && npm start`
- **Port**: `5000`

#### Environment Variables
Set the following environment variables:

```
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_super_secure_session_secret_min_32_chars
FRONTEND_URL=https://your-frontend-domain.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

#### Health Check
- **Health check path**: `/health`
- **Port**: `5000`

### 2. Database Setup

You'll need a PostgreSQL database. You can use:
- Koyeb's managed PostgreSQL
- External providers like Neon, Supabase, or PlanetScale

## Frontend Deployment on Koyeb (Static Site)

### 1. Update Environment Variables

Update `frontend/.env.production` with your actual backend URL:

```
VITE_API_URL=https://your-backend-service.koyeb.app
VITE_APP_NAME=Mining Dashboard
VITE_ENV=production
```

### 2. Deploy to Koyeb (Static)

1. Create another service in Koyeb
2. Choose "GitHub" as the source  
3. Select your repository (same repo, just create a new service)
4. **Leave the directory path empty** or put `.` (root)
5. Configure the following:

#### Build Settings
- **Build command**: `cd frontend && npm ci && npm run build`
- **Static files**: `frontend/dist`

---

# Option 2: Koyeb + Vercel Deployment (Recommended)

## Backend on Koyeb

Follow the **Backend Deployment** instructions above.

## Frontend on Vercel

### 1. Connect Repository
1. Go to Vercel dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a React app

### 2. Configure Build Settings
Vercel automatically detects the frontend folder structure:
- **Framework Preset**: Vite (auto-detected)
- **Root Directory**: `frontend` 
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

### 3. Environment Variables
Add these in Vercel dashboard:
```env
VITE_API_URL=https://your-backend-service.koyeb.app
VITE_APP_NAME=Mining Dashboard
VITE_ENV=production
```

### 4. Deploy
- Click "Deploy" - Vercel handles everything automatically
- Your frontend will be available at `https://your-app.vercel.app`

---

# Option 3: Render Deployment (Both Services)

## Backend Service on Render

### 1. Create Web Service
1. Go to Render dashboard
2. Click "New Web Service"  
3. Connect your GitHub repository
4. Configure:

**Build Settings:**
- **Build Command**: `cd backend && npm ci && npm run build`
- **Start Command**: `cd backend && npm start`
- **Port**: 5000

**Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_super_secure_session_secret_min_32_chars
FRONTEND_URL=https://your-frontend-name.onrender.com
```

## Frontend Service on Render

### 1. Create Static Site
1. Create "New Static Site" in Render
2. Connect same GitHub repository
3. Configure:

**Build Settings:**
- **Build Command**: `cd frontend && npm ci && npm run build`
- **Publish Directory**: `frontend/dist`

**Environment Variables:**
```env
VITE_API_URL=https://your-backend-name.onrender.com
VITE_APP_NAME=Mining Dashboard
VITE_ENV=production
```

---

# Cross-Platform Configuration

## CORS Setup
Update your backend's CORS configuration to allow requests from your frontend domain:

**For Koyeb + Vercel:**
```env
FRONTEND_URL=https://your-app.vercel.app
```

**For Render (both):**
```env
FRONTEND_URL=https://your-frontend-name.onrender.com
```

## Database Connection
All platforms work with external PostgreSQL providers:
- **Neon** (recommended for serverless)
- **Supabase** (good free tier)
- **PlanetScale** (MySQL alternative)
- **Render PostgreSQL** (if using Render for backend)

---

## Performance Optimizations Implemented

✅ **API Performance**
- Reduced earnings API calls from 1s to 5s intervals
- Smart caching with stale time strategies
- Retry logic with exponential backoff

✅ **Animation Performance** 
- GPU acceleration with `will-change` CSS property
- Optimized easing functions
- Reduced animation duration for better UX

✅ **Loading Performance**
- Code splitting with manual chunks
- Lazy loading of components
- Optimized bundle sizes

## CORS Configuration

The backend is configured with proper CORS settings to accept requests from your frontend domain. Make sure to update the `FRONTEND_URL` environment variable with your actual frontend URL.

## Environment Variables Reference

### Backend Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (min 32 characters)
- `NODE_ENV`: Set to "production"
- `FRONTEND_URL`: Your frontend domain for CORS

### Frontend Required Variables
- `VITE_API_URL`: Your backend API URL
- `VITE_APP_NAME`: Application name
- `VITE_ENV`: Environment identifier

## Monitoring

- **Health checks**: Available at `/health` endpoint
- **Logs**: Access via Koyeb dashboard
- **Performance**: Monitor API response times

## Troubleshooting

### Common Issues

1. **CORS Errors**: Verify `FRONTEND_URL` matches your frontend domain
2. **Database Connection**: Check `DATABASE_URL` format and connectivity
3. **Session Issues**: Ensure `SESSION_SECRET` is properly set
4. **Build Failures**: Check Node.js version compatibility

### Performance Issues

1. **Slow Loading**: Check if code splitting is working properly
2. **High API Usage**: Monitor query frequencies and adjust stale times
3. **Animation Lag**: Check for missing `will-change` optimizations

## Security Considerations

- All sensitive data is handled via environment variables
- Sessions are stored securely in PostgreSQL
- CORS is properly configured for production
- HTTPS is enforced in production environment

## Backup and Rollback

- Database: Ensure regular backups of your PostgreSQL database
- Code: Use GitHub releases for version management
- Configuration: Document all environment variable changes

## Support

For issues with:
- Koyeb platform: Check Koyeb documentation
- Application code: Review error logs in Koyeb dashboard
- Database: Monitor connection health and query performance