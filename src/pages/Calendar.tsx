import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

const Calendar = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [scheduledRequests, setScheduledRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchScheduledRequests();
    }
  }, [user, role]);

  const fetchScheduledRequests = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          profiles!service_requests_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .not('scheduled_date', 'is', null)
        .order('scheduled_date', { ascending: true });

      // Apply role-based filtering
      if (role === 'user') {
        query = query.eq('user_id', user.id);
      } else if (role === 'technician') {
        query = query.eq('assigned_technician_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching scheduled requests:', error);
        return;
      }

      setScheduledRequests(data || []);
    } catch (error) {
      console.error('Error fetching scheduled requests:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "default";
      case "assigned": return "secondary";
      case "pending": return "outline";
      default: return "outline";
    }
  };

  const groupRequestsByDate = (requests: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    requests.forEach(request => {
      const date = new Date(request.scheduled_date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(request);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6">
          <div className="text-center">Loading calendar...</div>
        </div>
      </Layout>
    );
  }

  const groupedRequests = groupRequestsByDate(scheduledRequests);
  const dates = Object.keys(groupedRequests).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <Layout showSidebar={true}>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gradient">Calendar</h1>
          <p className="text-muted-foreground text-lg">
            View your scheduled service requests and appointments
          </p>
        </div>

        {/* Calendar View */}
        {dates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-lg">No scheduled appointments</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Scheduled service requests will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => (
              <Card key={date} className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <span>{new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </CardTitle>
                  <CardDescription>
                    {groupedRequests[date].length} scheduled {groupedRequests[date].length === 1 ? 'appointment' : 'appointments'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groupedRequests[date].map((request) => (
                      <div key={request.id} className="border border-border/40 rounded-lg p-4 bg-muted/20">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{request.title}</h4>
                            <p className="text-sm text-muted-foreground">#{request.id.slice(0, 8)}</p>
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
                          <p className="text-sm text-muted-foreground mb-3">
                            {request.description}
                          </p>
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Calendar;