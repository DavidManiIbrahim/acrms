import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle,
  PlayCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/lib/notifications";

interface ServiceRequest {
  id: string;
  title: string;
  description: string | null;
  job_type: string;
  priority: string;
  status: string;
  location: string | null;
  estimated_duration: string | null;
  created_at: string;
  user_id: string;
  assigned_technician_id: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export const ServiceRequestsList = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchServiceRequests();
    }
  }, [user, role]);

  const fetchServiceRequests = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getServiceRequests();
      const raw = response.requests || [];
      const mapped = raw.map((req: any) => ({
        id: req._id || req.id,
        title: req.title,
        description: req.description || null,
        job_type: req.job_type,
        priority: req.priority,
        status: req.status,
        location: req.location || null,
        estimated_duration: req.estimated_duration || null,
        created_at: req.created_at,
        user_id: req.user_id?._id || req.user_id || '',
        assigned_technician_id: req.assigned_technician_id?._id || req.assigned_technician_id || null,
        profiles: req.user ? {
          first_name: req.user.first_name || null,
          last_name: req.user.last_name || null,
          email: req.user.email || ''
        } : null
      }));
      setRequests(mapped);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (request: ServiceRequest, newStatus: string, assignTechnician = false) => {
    try {
      const updates: any = { status: newStatus };
      
      if (assignTechnician && role === 'technician') {
        updates.assigned_technician_id = user?.id;
      }

      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      await apiClient.updateServiceRequest(request.id, updates);

      // Notify the user who created the request
      if (request.user_id) {
        await NotificationService.notifyServiceRequestUpdate({
          id: request.id,
          title: request.title,
          user_id: request.user_id,
          status: newStatus
        });
      }

      toast({
        title: "Success",
        description: `Request ${newStatus} successfully`
      });

      fetchServiceRequests();
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update request status",
        variant: "destructive"
      });
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "assigned": return <User className="h-4 w-4 text-orange-500" />;
      case "pending": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center">Loading service requests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
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
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg">No service requests found</div>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{request.title}</h3>
                      <p className="text-sm text-muted-foreground">#{request.id.slice(0, 8)}</p>
                    </div>
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
                
                {request.description && (
                  <p className="text-sm mb-4 text-muted-foreground">
                    {request.description}
                  </p>
                )}

                <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {request.profiles?.first_name} {request.profiles?.last_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{request.profiles?.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {request.location && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>{request.location}</span>
                      </div>
                    )}
                    {request.estimated_duration && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Est. {request.estimated_duration}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {role === 'technician' && request.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateRequestStatus(request, 'assigned', true)}
                      >
                        Accept Request
                      </Button>
                    )}
                    {role === 'technician' && request.status === 'assigned' && request.assigned_technician_id === user?.id && (
                      <Button 
                        size="sm" 
                        onClick={() => updateRequestStatus(request, 'in_progress')}
                      >
                        Start Work
                      </Button>
                    )}
                    {role === 'technician' && request.status === 'in_progress' && request.assigned_technician_id === user?.id && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateRequestStatus(request, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};