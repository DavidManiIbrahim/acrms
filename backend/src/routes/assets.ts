import { Router } from 'express';
import { Asset } from '../models';
import { authenticateToken } from '../middleware/auth';
import connectToDatabase from '../database';

const router = Router();

// Connect to database
connectToDatabase().catch(() => {
  console.log('⚠️  Database not available for assets routes');
});

// Get all assets for user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const assets = await Asset.find({ user_id: req.user._id }).sort({ created_at: -1 });
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset by ID
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, user_id: req.user._id });
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
      user_id: req.user._id
    };
    const asset = new Asset(assetData);
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update asset
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      req.body,
      { new: true }
    );
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    return res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete asset
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    return res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;