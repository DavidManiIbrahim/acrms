import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Settings, 
  Calendar, 
  BarChart3,
  Search,
  Filter,
  UserPlus,
  UserX,
  UserCog,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  Zap,
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Layout } from "@/components/Layout";
import { apiClient } from "@/integrations/api/client";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
      } else if (role !== "admin") {
        navigate("/dashboard");
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Real data from database
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    if (user && role === 'admin') {
      fetchDashboardData();
    }
  }, [user, role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersResponse = await apiClient.getUsers();
      const usersData = usersResponse.users || [];
      
      const formattedUsers = usersData.map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User',
        email: profile.email,
        role: profile.user_roles?.[0]?.role || 'user',
        status: 'active',
        lastActive: new Date(profile.updated_at || profile.created_at || Date.now()).toLocaleDateString(),
        tasksAssigned: 0,
        tasksCompleted: 0
      }));
      setUsers(formattedUsers);

      // Fetch service requests
      const requestsResponse = await apiClient.getServiceRequests();
      const requestsData = requestsResponse.requests || [];
      
      const formattedRequests = requestsData.map((request: any) => ({
        id: request._id,
        title: request.title,
        customerName: request.user ? `${request.user.first_name || ''} ${request.user.last_name || ''}`.trim() || 'Customer' : 'Customer',
        priority: request.priority,
        status: request.status,
        assignedTo: request.assigned_technician ? `${request.assigned_technician.first_name || ''} ${request.assigned_technician.last_name || ''}`.trim() : null,
        createdAt: new Date(request.created_at).toLocaleDateString(),
        estimatedTime: request.estimated_duration || 'Not specified'
      }));
      setRequests(formattedRequests);

      // Fetch technicians from users with technician role
      const technicianUsers = formattedUsers.filter((user: any) => user.role === 'technician');
      setTechnicians(technicianUsers.map((tech: any) => ({
        id: tech.id,
        name: tech.name,
        available: true,
        currentTasks: 0
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRequest = async (requestId: string, technicianId: string) => {
    try {
      const technician = technicians.find(t => t.id === technicianId);

      // Persist assignment in DB
      await apiClient.updateServiceRequest(requestId, {
        assigned_technician_id: technicianId,
        status: 'assigned'
      });

      // Optimistically update local UI state
      setRequests(prev => prev.map(r => r.id === requestId 
        ? { ...r, status: 'assigned', assignedTo: technician?.name || null }
        : r
      ));

      // Notify the technician
      if (technicianId) {
        await apiClient.createNotification({
          user_id: technicianId,
          title: 'New Task Assigned',
          message: `You have been assigned to request ${requestId}${technician?.name ? ' by admin' : ''}.`,
          type: 'info',
          read: false
        });
      }

      toast({
        title: 'Request Assigned',
        description: `Request has been assigned to ${technician?.name || 'technician'}`,
      });
    } catch (e: any) {
      console.error('Unexpected error assigning request:', e);
      toast({ title: 'Error', description: e.message || 'Unexpected error assigning request', variant: 'destructive' });
    }
  };

  const handleUserStatusChange = (userId: string, newStatus: string) => {
    toast({
      title: "User Status Updated",
      description: `User status has been changed to ${newStatus}`,
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "default";
      case "assigned": return "secondary";
      case "in-progress": return "default";
      case "completed": return "secondary";
      default: return "default";
    }
  };

  // Quick stats
  const totalUsers = users.length;
  const activeTechnicians = users.filter(u => u.role === "technician" && u.status === "active").length;
  const pendingRequests = requests.filter(r => r.status === "pending").length;
  const inProgressRequests = requests.filter(r => r.status === "in-progress").length;

  if (loading || roleLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== "admin") {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6 space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gradient">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive oversight of users, tasks, and system operations
          </p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover animate-scale-in bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalUsers}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                  <Users className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Technicians</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{activeTechnicians}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    All available
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                  <Activity className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Requests</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{pendingRequests}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Awaiting assignment
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-200 dark:bg-orange-800">
                  <AlertTriangle className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">In Progress</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{inProgressRequests}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Being worked on
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                  <Target className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger 
              value="requests" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Service Requests
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              User Management
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Service Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {/* Enhanced Filters */}
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Requests List */}
            <div className="grid gap-4">
              {filteredRequests.map((request, index) => (
                <Card 
                  key={request.id} 
                  className="card-hover animate-scale-in border-border/40 bg-gradient-to-r from-card to-card/80 hover:shadow-lg transition-all duration-300" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{request.title}</h3>
                        <p className="text-sm text-muted-foreground">#{request.id} • {request.customerName}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={getPriorityColor(request.priority) as any}>
                          {request.priority}
                        </Badge>
                        <Badge variant={getStatusColor(request.status) as any}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{request.createdAt}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{request.estimatedTime}</span>
                        </div>
                        {request.assignedTo && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{request.assignedTo}</span>
                          </div>
                        )}
                      </div>
                      
                      {request.status === "pending" && (
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={(value) => handleAssignRequest(request.id, value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Assign to technician" />
                            </SelectTrigger>
                            <SelectContent>
                              {technicians.map((tech) => (
                                <SelectItem key={tech.id} value={tech.id}>
                                  {tech.name} ({tech.currentTasks} tasks)
                                  {!tech.available && " - Busy"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
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
                        <SelectItem value="user">Users</SelectItem>
                        <SelectItem value="technician">Technicians</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="manager">Managers</SelectItem>
                        <SelectItem value="ceo">CEOs</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => navigate('/user-management')}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="card-hover animate-scale-in">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === "active" ? "default" : "destructive"}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {user.role === "technician" && (
                      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <div className="text-sm font-medium">Active Tasks</div>
                          <div className="text-2xl font-bold text-orange-600">{user.tasksAssigned}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Completed Tasks</div>
                          <div className="text-2xl font-bold text-green-600">{user.tasksCompleted}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Last active: {user.lastActive}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Select onValueChange={(value) => handleUserStatusChange(user.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Actions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activate">Activate</SelectItem>
                            <SelectItem value="deactivate">Deactivate</SelectItem>
                            <SelectItem value="suspend">Suspend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">127</div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from last month
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.2%</div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    +2.1% from last month
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4h</div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    -0.3h from last month
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8/5</div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +0.2 from last month
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Key metrics and trends for the past 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Analytics charts would be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;