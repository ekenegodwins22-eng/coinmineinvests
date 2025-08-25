# Deployment Guide for Koyeb

This guide explains how to deploy your mining dashboard application to Koyeb with separate backend and frontend deployments.

## Prerequisites

1. A Koyeb account
2. GitHub repository with your code
3. Environment variables ready

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

## Frontend Deployment (Static Site)

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