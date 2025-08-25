# 🚀 Koyeb Deployment Setup Guide

## The Issue You're Facing

When you go to Koyeb and try to deploy, you only see "Main" branch and no backend/frontend folders. **This is normal!** Your project is a monorepo (single repository with multiple apps).

## ✅ Correct Deployment Steps

### 1. Deploy Backend First

1. **Koyeb Dashboard** → **Create Service**
2. **Source**: GitHub
3. **Repository**: Select your repository  
4. **Branch**: main (this is correct - only main will show)
5. **Directory**: Leave empty or put `.` 
6. **Service Name**: `mining-dashboard-backend`

#### Backend Build Configuration:
```bash
Build Command: cd backend && npm ci --only=production && npm run build
Run Command: cd backend && npm start
Port: 5000
```

#### Environment Variables:
```env
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_super_secure_session_secret_min_32_chars
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. Deploy Frontend Second

1. **Koyeb Dashboard** → **Create Service** (new service)
2. **Source**: GitHub
3. **Repository**: Same repository as backend
4. **Branch**: main 
5. **Directory**: Leave empty or put `.`
6. **Service Name**: `mining-dashboard-frontend`

#### Frontend Build Configuration:
```bash
Build Command: cd frontend && npm ci && npm run build
Static Files: frontend/dist
```

#### Environment Variables:
```env
VITE_API_URL=https://your-backend-service-name.koyeb.app
VITE_APP_NAME=Mining Dashboard
VITE_ENV=production
```

## 🔧 Why This Works

- **Monorepo Structure**: Your code is in one repository with backend/ and frontend/ folders
- **Build Commands**: The `cd backend` and `cd frontend` commands navigate to the right folders during build
- **Static Path**: `frontend/dist` tells Koyeb where to find the built frontend files

## 📋 Step-by-Step Koyeb UI

### Backend Deployment:
1. Create Service → Web Service
2. GitHub → Select your repo → main branch
3. Build settings:
   - Build: `cd backend && npm ci --only=production && npm run build`
   - Run: `cd backend && npm start` 
   - Port: 5000
4. Environment variables (add your actual values)
5. Deploy

### Frontend Deployment:
1. Create Service → Static Site
2. GitHub → Same repo → main branch  
3. Build settings:
   - Build: `cd frontend && npm ci && npm run build`
   - Static: `frontend/dist`
4. Environment variables (with your backend URL)
5. Deploy

## 🎯 Quick Commands to Copy

**Backend Build Command:**
```bash
cd backend && npm ci --only=production && npm run build
```

**Backend Run Command:**
```bash
cd backend && npm start
```

**Frontend Build Command:**
```bash
cd frontend && npm ci && npm run build
```

**Frontend Static Path:**
```
frontend/dist
```

## ⚠️ Common Mistakes

❌ **Don't** look for separate backend/frontend folders in Koyeb
❌ **Don't** try to select subdirectories 
❌ **Don't** create separate repositories

✅ **Do** use the same repository for both services
✅ **Do** use `cd backend` and `cd frontend` in build commands
✅ **Do** set the correct static path for frontend

## 🚀 After Deployment

1. **Backend URL**: Will be `https://your-backend-name.koyeb.app`
2. **Frontend URL**: Will be `https://your-frontend-name.koyeb.app`  
3. **Update Environment**: Put the backend URL in your frontend's `VITE_API_URL`

Your monorepo deployment will work perfectly with this setup!