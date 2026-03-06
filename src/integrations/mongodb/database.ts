import connectToDatabase from './client';
import {
  ActivityLog,
  Asset,
  Notification,
  Profile,
  ServiceRequest,
  UserRole,
  IActivityLog,
  IAsset,
  INotification,
  IProfile,
  IServiceRequest,
  IUserRole
} from './models';

// Database service that mimics Supabase API
class DatabaseService {
v    await connectToDatabase();
  }

  // Activity Logs
  async getActivityLogs(userId?: string) {
    await this.ensureConnection();
    const query = userId ? { user_id: userId } : {};
    return await ActivityLog.find(query).sort({ created_at: -1 });
  }

  async createActivityLog(data: Partial<IActivityLog>) {
    await this.ensureConnection();
    const log = new ActivityLog(data);
    return await log.save();
  }

  // Assets
  async getAssets(userId?: string) {
    await this.ensureConnection();
    const query = userId ? { user_id: userId } : {};
    return await Asset.find(query).sort({ created_at: -1 });
  }

  async getAssetById(id: string) {
    await this.ensureConnection();
    return await Asset.findById(id);
  }

  async createAsset(data: Partial<IAsset>) {
    await this.ensureConnection();
    const asset = new Asset(data);
    return await asset.save();
  }

  async updateAsset(id: string, data: Partial<IAsset>) {
    await this.ensureConnection();
    return await Asset.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteAsset(id: string) {
    await this.ensureConnection();
    return await Asset.findByIdAndDelete(id);
  }

  // Notifications
  async getNotifications(userId: string) {
    await this.ensureConnection();
    return await Notification.find({ user_id: userId }).sort({ created_at: -1 });
  }

  async createNotification(data: Partial<INotification>) {
    await this.ensureConnection();
    const notification = new Notification(data);
    return await notification.save();
  }

  async markNotificationAsRead(id: string) {
    await this.ensureConnection();
    return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
  }

  // Profiles
  async getProfile(userId: string) {
    await this.ensureConnection();
    return await Profile.findOne({ _id: userId });
  }

  async createProfile(data: Partial<IProfile>) {
    await this.ensureConnection();
    const profile = new Profile(data);
    return await profile.save();
  }

  async updateProfile(userId: string, data: Partial<IProfile>) {
    await this.ensureConnection();
    return await Profile.findByIdAndUpdate(userId, data, { new: true });
  }

  // Service Requests
  async getServiceRequests(userId?: string, filters?: any) {
    await this.ensureConnection();
    let query: any = {};
    if (userId) query.user_id = userId;
    if (filters) {
      Object.assign(query, filters);
    }
    return await ServiceRequest.find(query).sort({ created_at: -1 });
  }

  async getServiceRequestById(id: string) {
    await this.ensureConnection();
    return await ServiceRequest.findById(id);
  }

  async createServiceRequest(data: Partial<IServiceRequest>) {
    await this.ensureConnection();
    const request = new ServiceRequest(data);
    return await request.save();
  }

  async updateServiceRequest(id: string, data: Partial<IServiceRequest>) {
    await this.ensureConnection();
    return await ServiceRequest.findByIdAndUpdate(id, data, { new: true });
  }

  // User Roles
  async getUserRole(userId: string) {
    await this.ensureConnection();
    return await UserRole.findOne({ user_id: userId });
  }

  async createUserRole(data: Partial<IUserRole>) {
    await this.ensureConnection();
    const role = new UserRole(data);
    return await role.save();
  }

  async updateUserRole(userId: string, data: Partial<IUserRole>) {
    await this.ensureConnection();
    return await UserRole.findOneAndUpdate({ user_id: userId }, data, { new: true });
  }

  // Utility methods
  async hasRole(userId: string, role: string) {
    await this.ensureConnection();
    const userRole = await UserRole.findOne({ user_id: userId, role });
    return !!userRole;
  }
}

export const db = new DatabaseService();