import { apiClient } from "@/integrations/api/client";

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user_id?: string;
  target_roles?: string[];
}

export class NotificationService {
  /**
   * Create notifications for specific users
   */
  static async createNotification(data: NotificationData & { user_id: string }) {
    try {
      await apiClient.createNotification({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        read: false
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  }

  /**
   * Create notifications for users with specific roles
   */
  static async createNotificationForRoles(data: NotificationData & { target_roles: string[] }) {
    try {
      // The backend should handle role-based notification creation
      // but if we need to do it from frontend:
      const response = await apiClient.getUsers();
      const users = response.users || response || [];
      const targetUsers = users.filter((u: any) => 
        (u.user_roles || u.roles || []).some((r: any) => data.target_roles.includes(r.role))
      );

      if (targetUsers.length === 0) {
        return { success: true, count: 0 };
      }

      // Create notifications for each user
      await Promise.all(targetUsers.map((user: any) => 
        apiClient.createNotification({
          user_id: user._id || user.id,
          title: data.title,
          message: data.message,
          type: data.type,
          read: false
        })
      ));

      return { success: true, count: targetUsers.length };
    } catch (error) {
      console.error('Error creating notifications for roles:', error);
      return { success: false, error };
    }
  }

  /**
   * Notify admins and technicians about new service requests
   */
  static async notifyNewServiceRequest(requestData: {
    id: string;
    title: string;
    user_id: string;
    description?: string;
  }) {
    const notificationData: NotificationData = {
      title: 'New Service Request',
      message: `A new service request "${requestData.title}" has been created and requires attention.`,
      type: 'info',
      target_roles: ['admin', 'technician', 'manager']
    };

    return await this.createNotificationForRoles(notificationData);
  }

  /**
   * Notify user about service request updates
   */
  static async notifyServiceRequestUpdate(requestData: {
    id: string;
    title: string;
    user_id: string;
    status: string;
    updated_by?: string;
  }) {
    const notificationData: NotificationData = {
      title: 'Service Request Updated',
      message: `Your service request "${requestData.title}" has been updated to status: ${requestData.status}.`,
      type: 'info',
      user_id: requestData.user_id
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Notify about new asset assignments
   */
  static async notifyAssetAssignment(assetData: {
    id: string;
    name: string;
    user_id: string;
    assigned_by?: string;
  }) {
    const notificationData: NotificationData = {
      title: 'Asset Assigned',
      message: `Asset "${assetData.name}" has been assigned to you.`,
      type: 'success',
      user_id: assetData.user_id
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Notify about maintenance schedules
   */
  static async notifyMaintenanceSchedule(maintenanceData: {
    asset_id: string;
    asset_name: string;
    user_id: string;
    scheduled_date: string;
  }) {
    const notificationData: NotificationData = {
      title: 'Maintenance Scheduled',
      message: `Maintenance for asset "${maintenanceData.asset_name}" is scheduled for ${new Date(maintenanceData.scheduled_date).toLocaleDateString()}.`,
      type: 'warning',
      user_id: maintenanceData.user_id
    };

    return await this.createNotification(maintenanceData);
  }

  /**
   * Notify about system alerts
   */
  static async notifySystemAlert(alertData: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    target_roles?: string[];
  }) {
    if (alertData.target_roles) {
      return await this.createNotificationForRoles({
        title: alertData.title,
        message: alertData.message,
        type: alertData.severity,
        target_roles: alertData.target_roles
      });
    } else {
      // Notify all users
      try {
        const response = await apiClient.getUsers();
        const users = response.users || response || [];
        await Promise.all(users.map((user: any) => 
          apiClient.createNotification({
            user_id: user._id || user.id,
            title: alertData.title,
            message: alertData.message,
            type: alertData.severity,
            read: false
          })
        ));
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      const response = await apiClient.getNotifications();
      const unread = response.notifications?.filter((n: any) => !n.read) || [];
      await Promise.all(unread.map((n: any) => apiClient.markNotificationAsRead(n._id || n.id)));
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error };
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string) {
    try {
      const response = await apiClient.getNotifications();
      const unreadCount = response.notifications?.filter((n: any) => !n.read).length || 0;
      return { count: unreadCount, error: null };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { count: 0, error };
    }
  }
}
