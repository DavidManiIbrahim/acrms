import { Router } from 'express';
import { ServiceRequest } from '../models';
import { authenticateToken } from '../middleware/auth';
import connectToDatabase from '../database';

const router = Router();

// Connect to database
connectToDatabase().catch(() => {
  console.log('⚠️  Database not available for service requests routes');
});

// Get service requests for user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const serviceRequests = await ServiceRequest.find({ user_id: req.user._id })
      .sort({ created_at: -1 });
    res.json(serviceRequests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service request by ID
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const serviceRequest = await ServiceRequest.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    res.json(serviceRequest);
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create service request
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const requestData = {
      ...req.body,
      user_id: req.user._id,
      status: 'pending'
    };
    const serviceRequest = new ServiceRequest(requestData);
    await serviceRequest.save();
    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service request
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const serviceRequest = await ServiceRequest.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      req.body,
      { new: true }
    );
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    res.json(serviceRequest);
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service request
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const serviceRequest = await ServiceRequest.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;