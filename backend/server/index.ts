import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();

// Environment variable validation
const requiredEnvVars = ['SESSION_SECRET'];
const dbVar = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!dbVar) {
  console.error('❌ Missing required database environment variable: MONGODB_URI or DATABASE_URL');
  process.exit(1);
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your environment or .env file');
  process.exit(1);
}

console.log('✓ Environment variables validated');

// CORS configuration for cross-origin requests
const corsOptions = {
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`${new Date().toLocaleTimeString()} [backend] ${logLine}`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error('Server Error:', err);
    res.status(status).json({ message });
  });

  // 404 handler for unmatched routes
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`${new Date().toLocaleTimeString()} [backend] API server running on port ${port}`);
    console.log(`${new Date().toLocaleTimeString()} [backend] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})();
