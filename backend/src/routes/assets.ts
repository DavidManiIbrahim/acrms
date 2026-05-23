import { Router } from 'express';
import { Asset } from '../models';
import { authenticateToken } from '../middleware/auth';
import { logActivity } from '../utils/logger';

const router = Router();

// Helper to check if user has admin-level role
const isAdminRole = (user: any): boolean => {
  const roles = user.roles?.map((r: any) => r.role) || [];
  return roles.some((r: string) => ['admin', 'manager', 'ceo', 'technician'].includes(r));
};

// Get all assets (admin/manager/ceo/technician see all, others see their own)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const query = isAdminRole(req.user) ? {} : { user_id: req.user._id.toString() };
    const assets = await Asset.find(query).sort({ created_at: -1 });
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset by ID
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const query: any = { _id: req.params.id };
    if (!isAdminRole(req.user)) {
      query.user_id = req.user._id.toString();
    }
    const asset = await Asset.findOne(query);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    return res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create asset
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const assetData = {
      ...req.body,
      user_id: req.user._id.toString()
    };
    const asset = new Asset(assetData);
    await asset.save();

    await logActivity(
      req.user._id.toString(),
      'create_asset',
      `Created asset: ${asset.name}`,
      'asset',
      asset._id.toString()
    );

    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update asset
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const query: any = { _id: req.params.id };
    if (!isAdminRole(req.user)) {
      query.user_id = req.user._id.toString();
    }

    const asset = await Asset.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    );
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await logActivity(
      req.user._id.toString(),
      'update_asset',
      `Updated asset: ${asset.name}`,
      'asset',
      asset._id.toString()
    );

    return res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete asset
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const query: any = { _id: req.params.id };
    if (!isAdminRole(req.user)) {
      query.user_id = req.user._id.toString();
    }

    const asset = await Asset.findOneAndDelete(query);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await logActivity(
      req.user._id.toString(),
      'delete_asset',
      `Deleted asset: ${asset.name}`,
      'asset',
      req.params.id
    );

    return res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;