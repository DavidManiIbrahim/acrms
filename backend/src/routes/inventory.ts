import { Router } from 'express';
import { Inventory } from '../models';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logActivity } from '../utils/logger';

const router = Router();

// GET /api/inventory - Get all inventory items
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const items = await Inventory.find().sort({ last_updated: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/inventory - Add a new inventory item (Admin, Manager, Technician, CEO only)
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'ceo', 'technician']), async (req: any, res) => {
  try {
    const itemData = {
      ...req.body,
      user_id: req.user._id.toString()
    };
    const item = new Inventory(itemData);
    await item.save();
    
    await logActivity(
      req.user._id.toString(),
      'create_inventory_item',
      `Added inventory item: ${item.name}`,
      'inventory',
      item._id.toString()
    );

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/inventory/:id - Update an inventory item
router.put('/:id', authenticateToken, requireRole(['admin', 'manager', 'ceo', 'technician']), async (req: any, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, last_updated: new Date() },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await logActivity(
      req.user._id.toString(),
      'update_inventory_item',
      `Updated inventory item: ${item.name}`,
      'inventory',
      item._id.toString()
    );

    return res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/inventory/:id - Delete an inventory item
router.delete('/:id', authenticateToken, requireRole(['admin', 'manager', 'ceo']), async (req: any, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await logActivity(
      req.user._id.toString(),
      'delete_inventory_item',
      `Deleted inventory item: ${item.name}`,
      'inventory',
      req.params.id
    );

    return res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
