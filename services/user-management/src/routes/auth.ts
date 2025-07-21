import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

import { validateRequest } from '../middleware/validation';
import { sendEmail } from '../utils/emailService';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const RegisterSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  organizationName: z.string().min(1).max(100).optional(),
  organizationId: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const ForgotPasswordSchema = z.object({
  email: z.string().email()
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100)
});

// Register endpoint
router.post('/register', validateRequest(RegisterSchema), async (req, res) => {
  try {
    const { firstName, lastName, email, password, organizationName, organizationId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    let orgId = organizationId;

    // Create organization if not provided
    if (!orgId && organizationName) {
      const organization = await prisma.organization.create({
        data: {
          name: organizationName,
          domain: email.split('@')[1]
        }
      });
      orgId = organization.id;
    }

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID or name is required' });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        organizationId: orgId,
        role: organizationName ? 'ADMIN' : 'VIEWER' // First user becomes admin
      },
      include: {
        organization: true
      }
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await redisClient.setex(`verify:${verificationToken}`, 86400, user.id); // 24 hours

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify your SMEBI account',
      template: 'verification',
      data: {
        firstName,
        verificationLink: `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`
      }
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organization: user.organization.name
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', validateRequest(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Store session
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        organization: {
          id: user.organization.id,
          name: user.organization.name
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', validateRequest(ForgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal whether user exists
      return res.json({ message: 'If an account exists, a reset email has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    await prisma.passwordReset.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      }
    });

    // Send reset email
    await sendEmail({
      to: email,
      subject: 'Reset your SMEBI password',
      template: 'password-reset',
      data: {
        firstName: user.firstName,
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      }
    });

    logger.info(`Password reset requested: ${email}`);

    res.json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
});

// Reset password endpoint
router.post('/reset-password', validateRequest(ResetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find valid reset token
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash }
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    });

    logger.info(`Password reset completed: ${resetRecord.user.email}`);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Verify email endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Get user ID from Redis
    const userId = await redisClient.get(`verify:${token}`);
    
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });

    // Remove token from Redis
    await redisClient.del(`verify:${token}`);

    logger.info(`Email verified for user: ${userId}`);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Remove session
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
