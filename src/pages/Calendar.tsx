import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { apiClient } from "@/integrations/api/client";

const Calendar = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [scheduledRequests, setScheduledRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      fetchScheduledRequests();
    }
  }, [user, role]);

  // live time ticker
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchScheduledRequests = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getServiceRequests();
      let data = response.requests || response || [];

      // Filter by current month manually if needed, or just show all
      const nowDate = new Date();
      const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      const endOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);

      data = data.filter((req: any) => {
        const createdAt = new Date(req.created_at);
        return createdAt >= startOfMonth && createdAt <= endOfMonth;
      });

      // Apply role-based filtering
      if (role === 'user') {
        data = data.filter((req: any) => req.user_id === user.id || req.user?._id === user.id);
      } else if (role === 'technician') {
        data = data.filter((req: any) => req.assigned_technician_id === user.id || req.assigned_technician?._id === user.id);
      }

      setScheduledRequests(data);
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
      // Use created_at instead of scheduled_date to show all requests
      const date = new Date(request.created_at).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(request);
    });
    return grouped;
  };

  const renderMonthGrid = () => {
    const d = new Date(now);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0-6
    const daysInMonth = lastDay.getDate();

    const cells: Array<{ date: Date | null }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
    for (let day = 1; day <= daysInMonth; day++) cells.push({ date: new Date(year, month, day) });

    const todayKey = new Date().toDateString();
    const grouped = groupRequestsByDate(scheduledRequests);

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(h => (
          <div key={h} className="text-xs font-medium text-muted-foreground text-center">{h}</div>
        ))}
        {cells.map((cell, idx) => {
          const label = cell.date ? cell.date.getDate() : '';
          const key = cell.date ? cell.date.toDateString() : `empty-${idx}`;
          const isToday = cell.date && key === todayKey;
          const count = cell.date && grouped[key] ? grouped[key].length : 0;
          return (
            <div key={key} className={`border rounded-md p-2 h-20 relative ${isToday ? 'bg-primary/10 border-primary/40' : 'bg-muted/20'}`}>
              <div className="text-xs absolute top-1 left-1">{label}</div>
              {count > 0 && (
                <div className="absolute bottom-1 right-1 text-[10px] px-1 rounded bg-primary/20 text-primary">
                  {count} req
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
            View all service requests for this month
          </p>
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{now.toLocaleString()}</span>
          </div>
        </div>

        {/* Month Grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>
                {now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </CardTitle>
            <CardDescription>Requests per day for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            {renderMonthGrid()}
          </CardContent>
        </Card>

        {/* List View */}
        {dates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-lg">No requests this month</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Service requests for this month will appear here
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
                    {groupedRequests[date].length} {groupedRequests[date].length === 1 ? 'request' : 'requests'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groupedRequests[date].map((request: any) => (
                      <div key={request._id || request.id} className="border border-border/40 rounded-lg p-4 bg-muted/20">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{request.title}</h4>
                            <p className="text-sm text-muted-foreground">#{(request._id || request.id || '').slice(0, 8)}</p>
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
                              {request.user?.first_name || request.profiles?.first_name} {request.user?.last_name || request.profiles?.last_name}
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