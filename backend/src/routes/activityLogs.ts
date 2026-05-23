import { Router } from 'express';
import { ActivityLog, User } from '../models';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/activity-logs
router.get('/', authenticateToken, requireRole(['admin', 'manager', 'ceo']), async (req: any, res: any) => {
  try {
    const logs = await ActivityLog.find().sort({ created_at: -1 }).limit(100);
    
    const logsWithUser = await Promise.all(logs.map(async (log) => {
      const logObj = log.toObject();
      try {
        const logUser = await User.findById(log.user_id);
        logObj.user = logUser ? {
          first_name: logUser.profile?.first_name || '',
          last_name: logUser.profile?.last_name || '',
          email: logUser.email
        } : {
          first_name: 'System',
          last_name: 'User',
          email: ''
        };
      } catch (err) {
        logObj.user = { first_name: 'Unknown', last_name: 'User', email: '' };
      }
      return logObj;
    }));

    return res.json({ logs: logsWithUser });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
