import { ActivityLog } from '../models';

export const logActivity = async (
  userId: string,
  action: string,
  description: string,
  entityType?: string,
  entityId?: string,
  metadata?: any
) => {
  try {
    const log = new ActivityLog({
      user_id: userId,
      action,
      description,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    });
    await log.save();
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
};
