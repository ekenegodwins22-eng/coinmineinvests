import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { OAuth2Client } from 'google-auth-library';
import { loginSchema, registerSchema, type LoginData, type RegisterData } from '@shared/schema';
import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';

// Session configuration
export function setupSession(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb+srv://clonedatabase:clonedatabase@clonedatabase.hfmunxm.mongodb.net/?retryWrites=true&w=majority&appName=CLONEDATABASE",
      touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));
}

// Authentication middleware
export async function isAuthenticated(req: any, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy((err: any) => {
        if (err) console.error('Session destroy error:', err);
      });
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

// Admin middleware
export async function isAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
);

export function setupAuth(app: Express) {
  setupSession(app);

  // Get current user
  app.get('/api/auth/user', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy((err: any) => {
          if (err) console.error('Session destroy error:', err);
        });
        return res.status(401).json({ message: 'User not found' });
      }

      // Don't send password
      const { password, ...userWithoutPassword } = user.toObject();
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // Register with email/password
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await storage.createUser({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isEmailVerified: false,
        isAdmin: false,
      });

      // Create session
      (req as any).session.userId = user._id.toString();

      // Don't send password
      const { password, ...userWithoutPassword } = user.toObject();
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid registration data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Registration failed' });
      }
    }
  });

  // Login with email/password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(loginData.email);
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Create session
      (req as any).session.userId = user._id.toString();

      // Don't send password
      const { password, ...userWithoutPassword } = user.toObject();
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid login data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Login failed' });
      }
    }
  });

  // Google OAuth URL
  app.get('/api/auth/google', (req, res) => {
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'],
      state: req.query.returnTo as string || '/'
    });
    res.json({ url: authUrl });
  });

  // Google OAuth callback
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.redirect('/?error=no_code');
      }

      // Get tokens from Google
      const { tokens } = await googleClient.getToken(code as string);
      googleClient.setCredentials(tokens);

      // Get user profile
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const profile = ticket.getPayload();
      if (!profile) {
        return res.redirect('/?error=no_profile');
      }

      // Check if user exists
      let user = await storage.getUserByGoogleId(profile.sub);
      
      if (!user) {
        // Check if user exists with same email
        const existingUser = await storage.getUserByEmail(profile.email!);
        if (existingUser) {
          // Link Google account to existing user
          user = await storage.updateUser(existingUser._id.toString(), {
            googleId: profile.sub
          });
        } else {
          // Create new user
          user = await storage.createUser({
            email: profile.email!,
            firstName: profile.given_name,
            lastName: profile.family_name,
            profileImageUrl: profile.picture,
            googleId: profile.sub,
            isEmailVerified: true,
            isAdmin: false,
          });
        }
      }

      if (!user) {
        return res.redirect('/?error=auth_failed');
      }

      // Create session
      (req as any).session.userId = user._id.toString();

      // Redirect to the original page or home
      const returnTo = state && typeof state === 'string' ? state : '/';
      res.redirect(returnTo);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Change password
  app.post('/api/auth/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required' });
      }

      const user = await storage.getUser(req.user._id);
      if (!user || !user.password) {
        return res.status(400).json({ message: 'Password change not available for this account' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await storage.updateUser(user._id.toString(), {
        password: hashedNewPassword
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });
}