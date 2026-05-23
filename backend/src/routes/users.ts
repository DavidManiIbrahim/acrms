import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User, Profile, UserRole, AppRole } from '../models';
import { authenticateToken, requireRole, generateToken } from '../middleware/auth';

const router = Router();

// GET /api/users — list all users (admin/manager only)
router.get('/', authenticateToken, requireRole(['admin', 'manager', 'ceo']), async (req: any, res: any) => {
  try {
    const users = await User.find().select('-password_hash').sort({ created_at: -1 });
    const result = users.map(u => ({
      id: u._id,
      email: u.email,
      created_at: u.created_at,
      first_name: u.profile?.first_name || null,
      last_name: u.profile?.last_name || null,
      user_roles: u.roles?.map(r => ({ role: r.role, specialty: r.specialty })) || []
    }));
    return res.json({ users: result });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users — create a new staff member (admin only)
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'ceo']), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('role').optional().isIn(Object.values(AppRole)),
  body('specialty').optional().isString()
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, specialty } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = new User({ email, password_hash });

    const profile = new Profile({
      email,
      first_name: firstName,
      last_name: lastName
    });

    const userRole = new UserRole({
      role: role || AppRole.USER,
      user_id: user._id.toString(),
      specialty: role === 'technician' ? specialty : undefined
    });

    user.profile = profile;
    user.roles = [userRole];
    await user.save();

    return res.status(201).json({
      message: 'Staff member created successfully',
      user: {
        id: user._id,
        email: user.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        user_roles: [{ role: userRole.role, specialty: userRole.specialty }]
      }
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id/role — update a user's role (admin only)
router.put('/:id/role', authenticateToken, requireRole(['admin', 'manager', 'ceo']), async (req: any, res: any) => {
  try {
    const { role, specialty } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.roles && user.roles.length > 0) {
      user.roles[0].role = role;
      user.roles[0].specialty = role === 'technician' ? specialty : undefined;
    } else {
      const newRole = new UserRole({ role, user_id: user._id.toString(), specialty });
      user.roles = [newRole];
    }

    await user.save();
    return res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id — delete a user (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: any, res: any) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
