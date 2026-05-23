import { Router } from 'express';
import { User, ServiceRequest, Asset, Notification } from '../models';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/reports/summary — high-level KPIs
router.get('/summary', authenticateToken, requireRole(['admin', 'manager', 'ceo', 'sales']), async (req: any, res: any) => {
  try {
    const [totalUsers, totalRequests, totalAssets, totalNotifications] = await Promise.all([
      User.countDocuments(),
      ServiceRequest.countDocuments(),
      Asset.countDocuments(),
      Notification.countDocuments()
    ]);

    const [pendingRequests, completedRequests, activeAssets, maintenanceAssets, unreadNotifications] = await Promise.all([
      ServiceRequest.countDocuments({ status: 'pending' }),
      ServiceRequest.countDocuments({ status: 'completed' }),
      Asset.countDocuments({ status: 'active' }),
      Asset.countDocuments({ status: 'maintenance' }),
      Notification.countDocuments({ read: false })
    ]);

    return res.json({
      totalUsers,
      totalRequests,
      totalAssets,
      totalNotifications,
      pendingRequests,
      completedRequests,
      activeAssets,
      maintenanceAssets,
      unreadNotifications
    });
  } catch (error) {
    console.error('Error fetching report summary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/requests-by-status — breakdown of service requests by status
router.get('/requests-by-status', authenticateToken, requireRole(['admin', 'manager', 'ceo', 'technician', 'sales']), async (req: any, res: any) => {
  try {
    const breakdown = await ServiceRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    return res.json({ breakdown });
  } catch (error) {
    console.error('Error fetching requests by status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/requests-by-priority — breakdown of service requests by priority
router.get('/requests-by-priority', authenticateToken, requireRole(['admin', 'manager', 'ceo', 'technician', 'sales']), async (req: any, res: any) => {
  try {
    const breakdown = await ServiceRequest.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    return res.json({ breakdown });
  } catch (error) {
    console.error('Error fetching requests by priority:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/assets-by-type — breakdown of assets by type
router.get('/assets-by-type', authenticateToken, requireRole(['admin', 'manager', 'ceo', 'sales']), async (req: any, res: any) => {
  try {
    const breakdown = await Asset.aggregate([
      { $group: { _id: '$asset_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    return res.json({ breakdown });
  } catch (error) {
    console.error('Error fetching assets by type:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/users-by-role — breakdown of users by role
router.get('/users-by-role', authenticateToken, requireRole(['admin', 'manager', 'ceo', 'sales']), async (req: any, res: any) => {
  try {
    const breakdown = await User.aggregate([
      { $unwind: { path: '$roles', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$roles.role', 'user'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    return res.json({ breakdown });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/recent-activity — recent service requests
router.get('/recent-requests', authenticateToken, requireRole(['admin', 'manager', 'ceo', 'technician', 'sales']), async (req: any, res: any) => {
  try {
    const requests = await ServiceRequest.find()
      .sort({ created_at: -1 })
      .limit(10)
      .select('title status priority job_type created_at');
    return res.json({ requests });
  } catch (error) {
    console.error('Error fetching recent requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
