import { Router } from 'express';
import { ServiceRequest, User } from '../models';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logActivity } from '../utils/logger';

const router = Router();

// Helper to check if user has admin-level role or staff role
const isAdminRole = (user: any): boolean => {
  const roles = user.roles?.map((r: any) => r.role) || [];
  return roles.some((r: string) => ['admin', 'manager', 'ceo', 'technician', 'sales'].includes(r));
};

// Get service requests (admin/manager/ceo see all, others see their own)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const query = isAdminRole(req.user) ? {} : { user_id: req.user._id.toString() };
    const serviceRequests = await ServiceRequest.find(query)
      .sort({ created_at: -1 });

    // Enrich with user info for admin views
    const enriched = await Promise.all(serviceRequests.map(async (sr: any) => {
      const obj = sr.toObject();
      obj._id = sr._id.toString();

      // Look up the requesting user
      if (sr.user_id) {
        const requestUser = await User.findById(sr.user_id).select('profile');
        if (requestUser?.profile) {
          obj.user = {
            first_name: requestUser.profile.first_name,
            last_name: requestUser.profile.last_name,
            email: requestUser.profile.email
          };
        }
      }

      // Look up the assigned technician
      if (sr.assigned_technician_id) {
        const tech = await User.findById(sr.assigned_technician_id).select('profile');
        if (tech?.profile) {
          obj.assigned_technician = {
            first_name: tech.profile.first_name,
            last_name: tech.profile.last_name,
            email: tech.profile.email
          };
        }
      }

      return obj;
    }));

    res.json({ requests: enriched });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service request by ID
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const query: any = { _id: req.params.id };
    if (!isAdminRole(req.user)) {
      query.user_id = req.user._id.toString();
    }
    const serviceRequest = await ServiceRequest.findOne(query);
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    return res.json(serviceRequest);
  } catch (error) {
    console.error('Error fetching service request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create service request
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const requestData = {
      ...req.body,
      user_id: req.user._id.toString(),
      status: 'pending'
    };
    const serviceRequest = new ServiceRequest(requestData);
    await serviceRequest.save();

    await logActivity(req.user._id.toString(), 'create_service_request', `Created service request: ${serviceRequest.title}`, 'service_request', serviceRequest._id.toString());

    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service request (admins can update any, users only their own)
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const query: any = { _id: req.params.id };
    if (!isAdminRole(req.user)) {
      query.user_id = req.user._id.toString();
    }

    const serviceRequest = await ServiceRequest.findOneAndUpdate(
      query,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    await logActivity(req.user._id.toString(), 'update_service_request', `Updated service request: ${serviceRequest.title}`, 'service_request', serviceRequest._id.toString());

    return res.json(serviceRequest);
  } catch (error) {
    console.error('Error updating service request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service request
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const query: any = { _id: req.params.id };
    if (!isAdminRole(req.user)) {
      query.user_id = req.user._id.toString();
    }

    const serviceRequest = await ServiceRequest.findOneAndDelete(query);
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    await logActivity(req.user._id.toString(), 'delete_service_request', `Deleted service request: ${serviceRequest.title}`, 'service_request', serviceRequest._id.toString());

    return res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;