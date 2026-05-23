import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export const AppRole = {
  USER: 'user',
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  SALES: 'sales',
  CEO: 'ceo',
  MANAGER: 'manager'
} as const;

export type AppRoleType = typeof AppRole[keyof typeof AppRole];

// Interfaces
export interface IActivityLog extends Document {
  action: string;
  created_at: Date;
  description: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: any;
  user_id: string;
}

export interface IAsset extends Omit<Document, 'model'> {
  asset_type: string;
  cpu?: string;
  created_at: Date;
  graphics_card?: string;
  image_url?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  name: string;
  network_ports?: string;
  operating_system?: string;
  other_specs?: string;
  power_supply?: string;
  purchase_date?: Date;
  ram?: string;
  screen_size?: string;
  serial_number?: string;
  specifications?: any;
  status: string;
  storage?: string;
  updated_at: Date;
  user_id: string;
  warranty_expires?: Date;
}

export interface INotification extends Document {
  created_at: Date;
  message: string;
  read: boolean;
  title: string;
  type: string;
  user_id: string;
}

export interface IProfile extends Document {
  avatar_url?: string;
  bio?: string;
  company?: string;
  created_at: Date;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
  address?: string;
  department?: string;
  emergency_contact?: string;
  employee_id?: string;
  updated_at: Date;
  password_hash?: string;
}

export interface IServiceRequest extends Document {
  assigned_technician_id?: string;
  completed_at?: Date;
  created_at: Date;
  description?: string;
  estimated_duration?: string;
  job_type: string;
  location?: string;
  priority: string;
  required_specialty?: string;
  scheduled_date?: Date;
  status: string;
  title: string;
  updated_at: Date;
  user_id: string;
}

export interface IInventory extends Document {
  name: string;
  description?: string;
  category: string;
  quantity: number;
  min_stock_level: number;
  unit_price: number;
  supplier?: string;
  location?: string;
  status: string;
  last_updated: Date;
  user_id: string;
}

export interface IUserRole extends Document {
  created_at: Date;
  role: AppRoleType;
  specialty?: string;
  user_id: string;
}

export interface IUser extends Document {
  email: string;
  password_hash: string;
  profile: IProfile;
  roles: IUserRole[];
  created_at: Date;
  updated_at: Date;
}

// Schemas
const ActivityLogSchema = new Schema<IActivityLog>({
  action: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  description: { type: String, required: true },
  entity_id: String,
  entity_type: String,
  metadata: Schema.Types.Mixed,
  user_id: { type: String, required: true }
});

const AssetSchema = new Schema<IAsset>({
  asset_type: { type: String, required: true },
  cpu: String,
  created_at: { type: Date, default: Date.now },
  graphics_card: String,
  image_url: String,
  location: String,
  manufacturer: String,
  model: String,
  name: { type: String, required: true },
  network_ports: String,
  operating_system: String,
  other_specs: String,
  power_supply: String,
  purchase_date: Date,
  ram: String,
  screen_size: String,
  serial_number: String,
  specifications: Schema.Types.Mixed,
  status: { type: String, required: true },
  storage: String,
  updated_at: { type: Date, default: Date.now },
  user_id: { type: String, required: true },
  warranty_expires: Date
});

const NotificationSchema = new Schema<INotification>({
  created_at: { type: Date, default: Date.now },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  title: { type: String, required: true },
  type: { type: String, required: true },
  user_id: { type: String, required: true }
});

const ProfileSchema = new Schema<IProfile>({
  avatar_url: String,
  bio: String,
  company: String,
  created_at: { type: Date, default: Date.now },
  email: { type: String, required: true, unique: true },
  first_name: String,
  last_name: String,
  phone: String,
  position: String,
  address: String,
  department: String,
  emergency_contact: String,
  employee_id: String,
  updated_at: { type: Date, default: Date.now },
  password_hash: String
});

const ServiceRequestSchema = new Schema<IServiceRequest>({
  assigned_technician_id: String,
  completed_at: Date,
  created_at: { type: Date, default: Date.now },
  description: String,
  estimated_duration: String,
  job_type: { type: String, required: true },
  location: String,
  priority: { type: String, required: true },
  required_specialty: String,
  scheduled_date: Date,
  status: { type: String, required: true },
  title: { type: String, required: true },
  updated_at: { type: Date, default: Date.now },
  user_id: { type: String, required: true }
});

const UserRoleSchema = new Schema<IUserRole>({
  created_at: { type: Date, default: Date.now },
  role: { type: String, enum: Object.values(AppRole), required: true },
  specialty: String,
  user_id: { type: String, required: true }
});

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  profile: ProfileSchema,
  roles: [UserRoleSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const InventorySchema = new Schema<IInventory>({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  min_stock_level: { type: Number, required: true, default: 0 },
  unit_price: { type: Number, required: true, default: 0 },
  supplier: String,
  location: String,
  status: { type: String, required: true, default: 'in_stock' },
  last_updated: { type: Date, default: Date.now },
  user_id: { type: String, required: true }
});

// Models
export const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export const Asset: Model<IAsset> = mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const Profile: Model<IProfile> = mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
export const ServiceRequest: Model<IServiceRequest> = mongoose.models.ServiceRequest || mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
export const UserRole: Model<IUserRole> = mongoose.models.UserRole || mongoose.model<IUserRole>('UserRole', UserRoleSchema);
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Inventory: Model<IInventory> = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);