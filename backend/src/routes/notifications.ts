import { Router } from 'express';
import { Notification } from '../models';
import { authenticateToken } from '../middleware/auth';
import connectToDatabase from '../database';

const router = Router();

// Connect to database
connectToDatabase().catch(() => {
  console.log('⚠️  Database not available for notifications routes');
});

// Get notifications for user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notification
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const notificationData = {
      ...req.body,
      // Use user_id from body if provided, otherwise default to current user
      user_id: req.body.user_id || req.user._id
    };
    const notification = new Notification(notificationData);
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    return res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    return res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;