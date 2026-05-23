import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone,
  CheckCircle,
  PlayCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Wrench,
  Calendar as CalendarIcon,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Layout } from "@/components/Layout";
import { apiClient } from "@/integrations/api/client";

const TechnicianDashboard = () => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [requests, setRequests] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    totalCompleted: 0,
    totalAssigned: 0,
    totalPending: 0,
    thisMonthCompleted: 0,
    averageCompletionTime: 0,
    customerSatisfaction: 0
  });

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user) {
        navigate("/auth");
      } else if (role !== "technician") {
        navigate("/user-dashboard");
      }
    }
  }, [user, role, loading, roleLoading, navigate]);

  useEffect(() => {
    if (user && role === 'technician') {
      fetchRequests();
      fetchAnalytics();
    }
  }, [user, role]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const response = await apiClient.getServiceRequests();
      const raw = response.requests || [];
      const mapped = raw.map((req: any) => ({
        id: req._id || req.id,
        title: req.title,
        description: req.description || null,
        status: req.status,
        priority: req.priority,
        job_type: req.job_type,
        location: req.location || null,
        assigned_technician_id: req.assigned_technician_id || null,
        created_at: req.created_at
      }));
      setRequests(mapped);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!user) return;
    try {
      const response = await apiClient.getServiceRequests();
      const all = response.requests || [];
      const myId = user.id || user._id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalCompleted = all.filter((r: any) => r.assigned_technician_id === myId && r.status === 'completed').length;
      const totalAssigned = all.filter((r: any) => r.assigned_technician_id === myId && r.status === 'assigned').length;
      const totalPending = all.filter((r: any) => r.status === 'pending').length;
      const thisMonthCompleted = all.filter((r: any) =>
        r.assigned_technician_id === myId &&
        r.status === 'completed' &&
        r.completed_at &&
        new Date(r.completed_at) >= startOfMonth
      ).length;

      setAnalytics({
        totalCompleted,
        totalAssigned,
        totalPending,
        thisMonthCompleted,
        averageCompletionTime: 2.5,
        customerSatisfaction: 4.8
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await apiClient.updateServiceRequest(requestId, {
        status: 'assigned',
        assigned_technician_id: user?.id
      });
      toast({ title: "Request Accepted", description: `You have accepted the request.` });
      fetchRequests();
      fetchAnalytics();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to accept request", variant: "destructive" });
    }
  };

  const handleStartWork = async (requestId: string) => {
    try {
      await apiClient.updateServiceRequest(requestId, { status: 'in_progress' });
      toast({ title: "Work Started", description: `You have started working on the request.` });
      fetchRequests();
      fetchAnalytics();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start work", variant: "destructive" });
    }
  };

  const handleCompleteWork = async (requestId: string) => {
    try {
      await apiClient.updateServiceRequest(requestId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      toast({ title: "Work Completed", description: `Request has been marked as completed.` });
      fetchRequests();
      fetchAnalytics();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to complete work", variant: "destructive" });
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter || 
                         (statusFilter === "my-tasks" && request.assigned_technician_id === user?.id);
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
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
      case "completed": return "default";
      case "in_progress": return "default";
      case "assigned": return "secondary";
      case "pending": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string, assignedTo?: string) => {
    if (assignedTo === user?.id) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    switch (status) {
      case "pending": return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "assigned": return <PlayCircle className="h-4 w-4 text-orange-500" />;
      case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading technician dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== "technician") {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6 space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gradient">Technician Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Manage your assigned tasks and view available service requests
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover animate-scale-in bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Completed</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{analytics.totalCompleted}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Jobs finished
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                  <CheckCircle className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Currently Assigned</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{analytics.totalAssigned}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <Wrench className="h-3 w-3 mr-1" />
                    Active tasks
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                  <Wrench className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">This Month</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{analytics.thisMonthCompleted}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Completed
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-200 dark:bg-orange-800">
                  <CalendarIcon className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Satisfaction</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{analytics.customerSatisfaction}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Rating
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                  <TrendingUp className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Requests Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Job Requests</h2>
              <p className="text-muted-foreground">View and manage available service requests</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="my-tasks">My Tasks</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="text-muted-foreground text-lg">No requests found</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try adjusting your search criteria
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="card-hover animate-scale-in">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status, request.assigned_technician_id)}
                          <h3 className="font-semibold text-lg">{request.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">#{request.id.slice(0, 8)}</p>
                        {request.description && (
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={getPriorityColor(request.priority) as any}>
                          {request.priority}
                        </Badge>
                        <Badge variant={getStatusColor(request.status) as any}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                      {request.estimated_duration && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{request.estimated_duration}</span>
                        </div>
                      )}
                      {request.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{request.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-4 border-t">
                      {request.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Request
                        </Button>
                      )}
                      
                      {request.status === 'assigned' && request.assigned_technician_id === user?.id && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStartWork(request.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Work
                        </Button>
                      )}
                      
                      {request.status === 'in_progress' && request.assigned_technician_id === user?.id && (
                        <Button 
                          size="sm" 
                          onClick={() => handleCompleteWork(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Work
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TechnicianDashboard;