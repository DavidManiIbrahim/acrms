import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Search, Edit, Trash2, Shield, Users, Briefcase, HardHat, TrendingUp, Building, BarChart3, Package, Activity, Bell, Download, Filter, Calendar, AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface StaffMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  user_roles: { role: string; specialty?: string }[];
  created_at: string;
}

interface RoleStats {
  total: number;
  admin: number;
  ceo: number;
  manager: number;
  technician: number;
  sales: number;
  user: number;
}

interface ServiceRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  user: { first_name: string; last_name: string; email: string };
  assigned_technician: { first_name: string; last_name: string } | null;
  job_type: string;
  location: string | null;
}

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  status: string;
  location: string | null;
  purchase_date: string | null;
  warranty_expires: string | null;
  manufacturer: string | null;
  model: string | null;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
  user: { first_name: string; last_name: string };
  entity_type: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  totalRequests: number;
  totalAssets: number;
  pendingRequests: number;
  completedRequests: number;
  activeAssets: number;
  maintenanceAssets: number;
  totalNotifications: number;
  unreadNotifications: number;
}

export const StaffManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canManageStaff } = useRoleAccess();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats>({
    total: 0,
    admin: 0,
    ceo: 0,
    manager: 0,
    technician: 0,
    sales: 0,
    user: 0
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRequests: 0,
    totalAssets: 0,
    pendingRequests: 0,
    completedRequests: 0,
    activeAssets: 0,
    maintenanceAssets: 0,
    totalNotifications: 0,
    unreadNotifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState("staff");
  const [hasLoadedRequests, setHasLoadedRequests] = useState(false);
  const [hasLoadedAssets, setHasLoadedAssets] = useState(false);
  const [hasLoadedActivity, setHasLoadedActivity] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  
  const [staffForm, setStaffForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "user",
    specialty: ""
  });

  useEffect(() => {
    if (canManageStaff()) {
      fetchAllData();
    } else {
      setLoading(false);
    
    }
  }, []);

  useEffect(() => {
    if (!canManageStaff()) return;
    if (activeTab === 'requests' && !hasLoadedRequests) {
      setHasLoadedRequests(true);
      fetchServiceRequests();
    }
    if (activeTab === 'assets' && !hasLoadedAssets) {
      setHasLoadedAssets(true);
      fetchAssets();
    }
    if (activeTab === 'activity' && !hasLoadedActivity) {
      setHasLoadedActivity(true);
      fetchActivityLogs();
    }
    if (activeTab === 'notifications' && !hasLoadedNotifications) {
      setHasLoadedNotifications(true);
      fetchNotifications();
    }
  }, [activeTab, canManageStaff]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await fetchStaff();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await apiClient.getUsers();
      const staffData = response.users || [];
      setStaff(staffData);
      setDashboardStats(prev => ({ ...prev, totalUsers: staffData.length }));

      const stats = staffData.reduce((acc: any, member: any) => {
        const role = member.user_roles?.[0]?.role || 'user';
        acc.total++;
        if (role in acc) acc[role]++;
        return acc;
      }, { total: 0, admin: 0, ceo: 0, manager: 0, technician: 0, sales: 0, user: 0 });

      setRoleStats(stats);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const response = await apiClient.getServiceRequests();
      const rawData = response.requests || [];
      const data = rawData.map((req: any) => ({
        id: req._id || req.id,
        title: req.title,
        status: req.status,
        priority: req.priority,
        created_at: req.created_at,
        user: req.user_id ? {
          first_name: req.user_id.profile?.first_name || '',
          last_name: req.user_id.profile?.last_name || '',
          email: req.user_id.email
        } : { first_name: 'Unknown', last_name: 'User', email: '' },
        assigned_technician: req.assigned_technician_id ? {
          first_name: req.assigned_technician_id.profile?.first_name || '',
          last_name: req.assigned_technician_id.profile?.last_name || ''
        } : null,
        job_type: req.job_type,
        location: req.location || null
      }));

      setServiceRequests(data);
      const total = data.length;
      const pending = data.filter(req => req.status === 'pending').length;
      const completed = data.filter(req => req.status === 'completed').length;
      
      setDashboardStats(prev => ({ 
        ...prev, 
        totalRequests: total,
        pendingRequests: pending,
        completedRequests: completed
      }));
    } catch (error) {
      console.error('Error fetching service requests:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await apiClient.getAssets();
      if (data) {
        const normalized = data.map((asset: any) => ({
          id: asset._id || asset.id,
          name: asset.name,
          asset_type: asset.asset_type,
          status: asset.status,
          location: asset.location || null,
          purchase_date: asset.purchase_date || null,
          warranty_expires: asset.warranty_expires || null,
          manufacturer: asset.manufacturer || null,
          model: asset.model || null
        }));
        setAssets(normalized);
        const total = normalized.length;
        const active = normalized.filter(asset => asset.status === 'active').length;
        const maintenance = normalized.filter(asset => asset.status === 'maintenance').length;
        
        setDashboardStats(prev => ({ 
          ...prev, 
          totalAssets: total,
          activeAssets: active,
          maintenanceAssets: maintenance
        }));
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const response = await apiClient.getActivityLogs();
      const rawData = response.logs || [];
      const normalized = rawData.map((log: any) => ({
        id: log._id || log.id,
        action: log.action,
        description: log.description,
        created_at: log.created_at,
        user: log.user ? {
          first_name: log.user.first_name,
          last_name: log.user.last_name
        } : { first_name: 'System', last_name: 'User' },
        entity_type: log.entity_type || null
      }));
      setActivityLogs(normalized);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.getNotifications();
      const rawData = response.notifications || response || [];
      const data = Array.isArray(rawData) ? rawData : [];
      const normalized = data.map((notif: any) => ({
        id: notif._id || notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: !!notif.read,
        created_at: notif.created_at
      }));

      setNotifications(normalized);
      const total = normalized.length;
      const unread = normalized.filter(notif => !notif.read).length;
      
      setDashboardStats(prev => ({ 
        ...prev, 
        totalNotifications: total,
        unreadNotifications: unread
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const exportData = async (dataType: string) => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (dataType) {
        case 'staff':
          {
            const response = await apiClient.getUsers();
            data = response.users || staff;
          }
          filename = `staff_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'requests':
          {
            const response = await apiClient.getServiceRequests();
            data = response.requests || serviceRequests;
          }
          filename = `service_requests_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'assets':
          {
            data = await apiClient.getAssets();
          }
          filename = `assets_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'activity':
          {
            const response = await apiClient.getActivityLogs();
            data = response.logs || activityLogs;
          }
          filename = `activity_logs_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'notifications':
          {
            const response = await apiClient.getNotifications();
            data = response.notifications || response || notifications;
          }
          filename = `notifications_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${dataType} data exported successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const createStaffMember = async () => {
    try {
      if (!canManageStaff()) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to create staff members.",
          variant: "destructive"
        });
        return;
      }

      await apiClient.createUser({
        email: staffForm.email,
        password: staffForm.password,
        firstName: staffForm.first_name,
        lastName: staffForm.last_name,
        role: staffForm.role,
        specialty: staffForm.role === 'technician' ? staffForm.specialty : undefined
      });

      toast({
        title: "Success",
        description: `${staffForm.role === 'user' ? 'User' : 'Staff member'} created successfully. They can now log in with their credentials.`
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchAllData();
    } catch (error: any) {
      console.error('Error creating staff member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create staff member.",
        variant: "destructive"
      });
    }
  };

  const updateStaffRole = async (staffId: string, newRole: string, specialty?: string) => {
    try {
      await apiClient.updateUserRole(staffId, newRole, specialty);
      toast({ title: "Success", description: "Staff role updated successfully" });
      fetchStaff();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update role", variant: "destructive" });
    }
  };

  const deleteStaffMember = async (staffId: string) => {
    try {
      await apiClient.deleteUser(staffId);
      toast({ title: "Success", description: "Staff member deleted successfully" });
      fetchStaff();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete staff member", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setStaffForm({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "user",
      specialty: ""
    });
    setEditingStaff(null);
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const memberRole = member.user_roles[0]?.role || 'user';
    const matchesRole = roleFilter === "all" || memberRole === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'ceo': return Building;
      case 'manager': return BarChart3;
      case 'technician': return HardHat;
      case 'sales': return TrendingUp;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'ceo': return 'default';
      case 'manager': return 'secondary';
      case 'technician': return 'outline';
      case 'sales': return 'default';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'default';
      case 'pending':
      case 'maintenance':
        return 'secondary';
      case 'inactive':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return <div className="text-center">Loading staff management...</div>;
  }

  if (!canManageStaff()) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive text-lg font-semibold">Access Denied</div>
        <div className="text-muted-foreground">You don't have permission to manage staff.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
     

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
   

        {/* Staff Management Tab */}
        <TabsContent value="staff" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{roleStats.total}</p>
                  </div>
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold">{roleStats.admin}</p>
                  </div>
                  <Shield className="h-6 w-6 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CEOs</p>
                    <p className="text-2xl font-bold">{roleStats.ceo}</p>
                  </div>
                  <Building className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Managers</p>
                    <p className="text-2xl font-bold">{roleStats.manager}</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Technicians</p>
                    <p className="text-2xl font-bold">{roleStats.technician}</p>
                  </div>
                  <HardHat className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sales</p>
                    <p className="text-2xl font-bold">{roleStats.sales}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">{roleStats.user}</p>
                  </div>
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Management Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search staff members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="ceo">CEO</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                  <Button onClick={() => exportData('staff')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          <div className="grid gap-4">
            {filteredStaff.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="text-muted-foreground text-lg">No staff members found</div>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredStaff.map((member) => {
                const role = member.user_roles[0]?.role || 'user';
                const RoleIcon = getRoleIcon(role);
                return (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full font-semibold">
                            {member.first_name?.[0] || member.email[0].toUpperCase()}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg">
                                {member.first_name} {member.last_name} 
                                {!member.first_name && !member.last_name && 'Unnamed User'}
                              </h3>
                              <div className="flex items-center space-x-1">
                                <RoleIcon className="h-4 w-4" />
                                <Badge variant={getRoleColor(role) as any}>
                                  {role}
                                </Badge>
                                {role === 'technician' && member.user_roles[0]?.specialty && (
                                  <Badge variant="outline">
                                    {member.user_roles[0].specialty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {new Date(member.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingStaff(member);
                              setStaffForm({
                                email: member.email,
                                password: "",
                                first_name: member.first_name || "",
                                last_name: member.last_name || "",
                                role: role,
                                specialty: member.user_roles[0]?.specialty || ""
                              });
                              setIsCreateDialogOpen(true);
                            }}
                            disabled={user?.user_metadata?.role !== 'admin'}
                            title={user?.user_metadata?.role !== 'admin' ? 'Only admins can edit users' : 'Edit staff member'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                disabled={user?.user_metadata?.role !== 'admin'}
                                title={user?.user_metadata?.role !== 'admin' ? 'Only admins can delete users' : 'Delete staff member'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {member.first_name} {member.last_name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteStaffMember(member.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Service Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Service Requests</CardTitle>
                <Button onClick={() => exportData('requests')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{request.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        by {request.user.first_name} {request.user.last_name} ({request.user.email})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Type: {request.job_type} | Location: {request.location || 'Not specified'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.assigned_technician 
                          ? `Assigned to: ${request.assigned_technician.first_name} ${request.assigned_technician.last_name}`
                          : 'Unassigned'
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <Badge variant={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Asset Inventory</CardTitle>
                <Button onClick={() => exportData('assets')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Type: {asset.asset_type} | Manufacturer: {asset.manufacturer || 'Unknown'} | Model: {asset.model || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Location: {asset.location || 'Unknown'} | Purchase: {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                      {asset.warranty_expires && (
                        <Badge variant={new Date(asset.warranty_expires) < new Date() ? 'destructive' : 'default'}>
                          {new Date(asset.warranty_expires) < new Date() ? 'Warranty Expired' : 'Under Warranty'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Activity Logs</CardTitle>
                <Button onClick={() => exportData('activity')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{log.action}</h3>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                      <p className="text-sm text-muted-foreground">
                        by {log.user.first_name} {log.user.last_name}
                        {log.entity_type && ` | Entity: ${log.entity_type}`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>System Notifications</CardTitle>
                <Button onClick={() => exportData('notifications')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {notification.type}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={notification.read ? 'default' : 'secondary'}>
                        {notification.read ? 'Read' : 'Unread'}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Staff Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={staffForm.first_name}
                  onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={staffForm.last_name}
                  onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              />
            </div>
            
            {!editingStaff && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={staffForm.role} onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="ceo">CEO</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {staffForm.role === 'technician' && (
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select value={staffForm.specialty} onValueChange={(value) => setStaffForm({ ...staffForm, specialty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editingStaff ? () => updateStaffRole(editingStaff.id, staffForm.role, staffForm.specialty) : createStaffMember}>
                {editingStaff ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};