import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User, Profile, UserRole, AppRole } from '../models';
import { generateToken, authenticateToken } from '../middleware/auth';
import connectToDatabase from '../database';

const router = Router();

// Connect to database
connectToDatabase().catch((error) => {
  console.log('⚠️  Database connection failed, but server will continue');
});

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().isString(),
  body('lastName').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create profile
    const profile = new Profile({
      email,
      first_name: firstName,
      last_name: lastName
    });

    // Create user role (default to user)
    const userRole = new UserRole({
      role: AppRole.USER
    });

    // Create user
    const user = new User({
      email,
      password_hash,
      profile,
      roles: [userRole]
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('profile roles');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).populate('profile roles');
    res.json({
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;