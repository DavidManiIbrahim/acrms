import { useState, useEffect } from "react";
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
  Activity,
  FileText,
  Settings,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle
} from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export const ActivityLog = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    if (user) fetchActivityLogs();
  }, [user, role]);

  const fetchActivityLogs = async () => {
    if (!user) return;
    try {
      const response = await apiClient.getActivityLogs();
      const raw = response.logs || [];
      const mapped = raw.map((log: any) => ({
        id: log._id || log.id,
        action: log.action,
        description: log.description,
        entity_type: log.entity_type || null,
        entity_id: log.entity_id || null,
        metadata: log.metadata || null,
        created_at: log.created_at,
        profiles: log.user ? {
          first_name: log.user.first_name || null,
          last_name: log.user.last_name || null,
          email: log.user.email || ''
        } : { first_name: 'System', last_name: '', email: '' }
      }));
      setActivities(mapped);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || activity.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const getActivityIcon = (action: string) => {
    if (action.includes('request')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (action.includes('user')) return <User className="h-4 w-4 text-green-500" />;
    if (action.includes('asset')) return <Settings className="h-4 w-4 text-purple-500" />;
    if (action.includes('completed')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes('cancelled')) return <XCircle className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'default';
    if (action.includes('update')) return 'secondary';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('completed')) return 'default';
    return 'outline';
  };

  if (loading) {
    return <div className="text-center">Loading activity log...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Activity Log</h2>
        <p className="text-muted-foreground">Track recent actions and system events</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="request">Requests</SelectItem>
                  <SelectItem value="user">User Actions</SelectItem>
                  <SelectItem value="asset">Asset Actions</SelectItem>
                  <SelectItem value="create">Created</SelectItem>
                  <SelectItem value="update">Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-lg">No activities found</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Activities will appear here as users interact with the system
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <p className="font-medium">{activity.description}</p>
                        <Badge variant={getActionColor(activity.action) as any}>
                          {activity.action.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(activity.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>
                          {activity.profiles?.first_name} {activity.profiles?.last_name} 
                          ({activity.profiles?.email})
                        </span>
                      </div>
                      {activity.entity_type && (
                        <div className="flex items-center space-x-1">
                          <span>Entity: {activity.entity_type}</span>
                        </div>
                      )}
                    </div>

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                        <pre className="text-muted-foreground">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </div>
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