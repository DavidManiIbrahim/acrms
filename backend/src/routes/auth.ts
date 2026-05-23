import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User, Profile, UserRole, AppRole } from '../models';
import { generateToken, authenticateToken } from '../middleware/auth';
import connectToDatabase from '../database';
import { logActivity } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/avatars';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: any, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user?._id || 'unknown'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
  }
});

// Connect to database
connectToDatabase().catch((error) => {
  console.log('⚠️  Database connection failed, but server will continue');
});

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('role').optional().isIn(Object.values(AppRole))
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user first to get the _id
    const user = new User({
      email,
      password_hash
    });

    // Create profile
    const profile = new Profile({
      email,
      first_name: firstName,
      last_name: lastName
    });

    // Create user role (default to user)
    const userRole = new UserRole({
      role: role || AppRole.USER,
      user_id: user._id.toString()
    });

    // Assign profile and roles
    user.profile = profile;
    user.roles = [userRole];

    await user.save();

    // Log activity
    logActivity(user._id.toString(), 'user_register', `User registered: ${email}`, 'user', user._id.toString());

    // Generate token
    const token = generateToken(user._id.toString());

    return res.status(201).json({
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
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

    // Log activity
    await logActivity(user._id.toString(), 'user_login', `User logged in: ${email}`, 'user', user._id.toString());

    return res.json({
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create profile object if it doesn't exist
    if (!user.profile) {
      user.profile = { email: user.email } as any;
    }

    // Generate full URL for the avatar
    const protocol = req.protocol;
    const host = req.get('host');
    const avatarPath = req.file.path.replace(/\\/g, '/'); // Normalize path
    const avatarUrl = `${protocol}://${host}/${avatarPath}`;

    user.profile.avatar_url = avatarUrl;
    user.profile.updated_at = new Date();
    await user.save();

    await logActivity(user._id.toString(), 'update_avatar', `User updated avatar: ${user.email}`, 'user', user._id.toString());

    return res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile
router.put('/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      first_name,
      last_name,
      phone,
      bio,
      company,
      position,
      address,
      department,
      emergency_contact,
      employee_id,
      avatar_url
    } = req.body;

    // Create profile object if it doesn't exist
    if (!user.profile) {
      user.profile = { email: user.email } as any;
    }

    // Update profile fields
    if (first_name !== undefined) user.profile.first_name = first_name;
    if (last_name !== undefined) user.profile.last_name = last_name;
    if (phone !== undefined) user.profile.phone = phone;
    if (bio !== undefined) user.profile.bio = bio;
    if (company !== undefined) user.profile.company = company;
    if (position !== undefined) user.profile.position = position;
    if (address !== undefined) user.profile.address = address;
    if (department !== undefined) user.profile.department = department;
    if (emergency_contact !== undefined) user.profile.emergency_contact = emergency_contact;
    if (employee_id !== undefined) user.profile.employee_id = employee_id;
    if (avatar_url !== undefined) user.profile.avatar_url = avatar_url;

    user.profile.updated_at = new Date();
    await user.save();

    // Log activity
    await logActivity(user._id.toString(), 'update_profile', `Updated profile information`, 'user', user._id.toString());

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;