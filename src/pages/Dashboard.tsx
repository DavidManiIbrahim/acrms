import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Wrench, 
  Calendar,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  MapPin,
  Eye
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Layout } from "@/components/Layout";
import { apiClient } from "@/integrations/api/client";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC OR EARLY RETURNS
  // Real-time dashboard data will be fetched from the database
  const [stats, setStats] = useState({
    activeRequests: 0,
    completedJobs: 0,
    pendingReviews: 0,
    totalSpent: 0
  });

  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Role-based redirection
    if (!roleLoading && role && user) {
      switch (role) {
        case "admin":
          // Admins stay on this dashboard
          break;
        case "technician":
          navigate("/technician-dashboard");
          break;
        default:
          navigate("/user-dashboard");
          break;
      }
    }
  }, [role, roleLoading, user, navigate]);

  // Fetch real dashboard data + service requests in one call
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const response = await apiClient.getServiceRequests();
        const all = response.requests || [];

        const active = all.filter((r: any) =>
          ['pending', 'assigned', 'in_progress'].includes(r.status)
        ).length;
        const completed = all.filter((r: any) => r.status === 'completed').length;
        const pendingReviews = all.filter((r: any) =>
          r.status === 'completed' && !r.completed_at
        ).length;

        setStats({
          activeRequests: active,
          completedJobs: completed,
          pendingReviews,
          totalSpent: 0
        });

        // Show 5 most recent
        const mapped = all.slice(0, 5).map((req: any) => ({
          id: req._id || req.id,
          title: req.title,
          description: req.description || null,
          status: req.status,
          priority: req.priority,
          job_type: req.job_type,
          location: req.location || null,
          created_at: req.created_at,
          profiles: req.assigned_technician ? {
            first_name: req.assigned_technician.first_name,
            last_name: req.assigned_technician.last_name
          } : null
        }));
        setServiceRequests(mapped);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Helper functions for status and priority colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "assigned": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "in_progress": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // CONDITIONAL RENDERING AFTER ALL HOOKS ARE CALLED
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }


  return (
    <Layout showSidebar={true}>
      <div className="p-6 space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gradient">
            {role === 'sales' ? 'Sales Dashboard' : 
             role === 'technician' ? 'Technician Overview' : 
             'User Dashboard'}
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back! Here's an overview of your {role === 'sales' ? 'account' : 'service requests'} and activity.
          </p>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover animate-scale-in bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Requests</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.activeRequests}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Current requests
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                  <Wrench className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed Jobs</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.completedJobs}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    This month
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                  <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Reviews</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.pendingReviews}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Awaiting feedback
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
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Spent</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(stats.totalSpent)}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    This year
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                  <DollarSign className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Service Requests */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recent Service Requests</h2>
              <p className="text-muted-foreground">Your latest service requests and their current status</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/my-requests')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View All
            </Button>
          </div>

          {loadingRequests ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading requests...</span>
                </div>
              </CardContent>
            </Card>
          ) : serviceRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No service requests yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first service request to get started</p>
                  <Button onClick={() => navigate('/service-request')}>
                    Create Service Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {serviceRequests.map((request) => (
                <Card key={request.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{request.title}</h3>
                          <Badge variant={getPriorityColor(request.priority)} className="text-xs">
                            {request.priority}
                          </Badge>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {request.description || 'No description provided'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Wrench className="h-4 w-4" />
                            <span>{request.job_type}</span>
                          </div>
                          {request.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{request.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(request.created_at)}</span>
                          </div>
                        </div>

                        {request.profiles && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Assigned to:</span>
                            <span className="font-medium">
                              {request.profiles.first_name} {request.profiles.last_name}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/my-requests`)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;