import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Clock, 
  User,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/integrations/api/client";

interface ServiceRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
   refresh?: boolean;
  priority: string;
  job_type: string;
  location: string | null;
  estimated_duration: string | null;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  assigned_technician_id: string | null;
  user_id: string;
  completed_at: string | null;
  required_specialty: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export const MyRequestsList = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchMyRequests();
    }
  }, [user]);

  const fetchMyRequests = async () => {
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
        estimated_duration: req.estimated_duration || null,
        created_at: req.created_at,
        updated_at: req.updated_at,
        scheduled_date: req.scheduled_date || null,
        assigned_technician_id: req.assigned_technician_id || null,
        user_id: req.user_id,
        completed_at: req.completed_at || null,
        required_specialty: req.required_specialty || null,
        profiles: req.assigned_technician ? {
          first_name: req.assigned_technician.first_name || null,
          last_name: req.assigned_technician.last_name || null,
          email: req.assigned_technician.email || ''
        } : null
      }));
      setRequests(mapped);
    } catch (error) {
      console.error('Error fetching my requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.job_type.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      case "completed": return CheckCircle2;
      case "in_progress": return Clock3;
      case "assigned": return Users;
      case "pending": return AlertCircle;
      default: return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
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
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground text-lg">No service requests found</div>
              <p className="text-sm text-muted-foreground mt-2">
                {requests.length === 0 
                  ? "You haven't created any service requests yet."
                  : "Try adjusting your search criteria."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4" />
                        <span>{request.title}</span>
                      </CardTitle>
                      <CardDescription>#{request.id.slice(0, 8)} • {request.job_type}</CardDescription>
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
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.description && (
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  )}

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>
                        {request.profiles?.first_name} {request.profiles?.last_name}
                      </span>
                    </div>
                    
                    {request.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{request.location}</span>
                      </div>
                    )}
                    
                    {request.estimated_duration && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Est. {request.estimated_duration}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground border-t">
                    <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                    <span>Updated: {new Date(request.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};