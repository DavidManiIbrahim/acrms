import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Wrench,
  Bell,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw
} from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";

interface ReportSummary {
  totalUsers: number;
  totalRequests: number;
  totalAssets: number;
  totalNotifications: number;
  pendingRequests: number;
  completedRequests: number;
  activeAssets: number;
  maintenanceAssets: number;
  unreadNotifications: number;
}

interface BreakdownItem {
  _id: string;
  count: number;
}

interface RecentRequest {
  _id: string;
  title: string;
  status: string;
  priority: string;
  job_type: string;
  created_at: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case "completed": return "default";
    case "pending": return "secondary";
    case "in_progress": return "outline";
    case "cancelled": return "destructive";
    default: return "outline";
  }
};

const priorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "destructive";
    case "medium": return "default";
    case "low": return "secondary";
    default: return "outline";
  }
};

const Reports = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [requestsByStatus, setRequestsByStatus] = useState<BreakdownItem[]>([]);
  const [requestsByPriority, setRequestsByPriority] = useState<BreakdownItem[]>([]);
  const [assetsByType, setAssetsByType] = useState<BreakdownItem[]>([]);
  const [usersByRole, setUsersByRole] = useState<BreakdownItem[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        sumRes,
        statusRes,
        priorityRes,
        assetsRes,
        usersRes,
        recentRes
      ] = await Promise.all([
        apiClient.getReportSummary(),
        apiClient.getRequestsByStatus(),
        apiClient.getRequestsByPriority(),
        apiClient.getAssetsByType(),
        apiClient.getUsersByRole(),
        apiClient.getRecentRequests()
      ]);

      setSummary(sumRes);
      setRequestsByStatus(statusRes.breakdown || []);
      setRequestsByPriority(priorityRes.breakdown || []);
      setAssetsByType(assetsRes.breakdown || []);
      setUsersByRole(usersRes.breakdown || []);
      setRecentRequests(recentRes.requests || []);
    } catch (error: any) {
      toast({
        title: "Error loading reports",
        description: error.message || "Failed to fetch report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const exportJSON = () => {
    const data = { summary, requestsByStatus, requestsByPriority, assetsByType, usersByRole, recentRequests };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acrms_report_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout showSidebar={true}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Live data from the database</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={exportJSON} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground text-lg">Loading report data...</span>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalUsers ?? "—"}</div>
                  <p className="text-xs text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalRequests ?? "—"}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.pendingRequests} pending · {summary?.completedRequests} completed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalAssets ?? "—"}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.activeAssets} active · {summary?.maintenanceAssets} maintenance
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalNotifications ?? "—"}</div>
                  <p className="text-xs text-muted-foreground">{summary?.unreadNotifications} unread</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Requests by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Requests by Status</CardTitle>
                  <CardDescription>Breakdown of service request statuses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requestsByStatus.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  ) : requestsByStatus.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <Badge variant={statusColor(item._id) as any} className="capitalize">{item._id}</Badge>
                      <span className="font-bold text-lg">{item.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Requests by Priority */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Requests by Priority</CardTitle>
                  <CardDescription>Distribution across priority levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requestsByPriority.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  ) : requestsByPriority.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <Badge variant={priorityColor(item._id) as any} className="capitalize">{item._id}</Badge>
                      <span className="font-bold text-lg">{item.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Users by Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Users by Role</CardTitle>
                  <CardDescription>Role distribution across the organisation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {usersByRole.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  ) : usersByRole.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="capitalize font-medium">{item._id || "user"}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Assets by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Assets by Type</CardTitle>
                  <CardDescription>Inventory breakdown by asset category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assetsByType.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  ) : assetsByType.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="capitalize font-medium">{item._id}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Recent Service Requests</CardTitle>
                <CardDescription>Last 10 submitted requests</CardDescription>
              </CardHeader>
              <CardContent>
                {recentRequests.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No requests yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentRequests.map((req) => (
                      <div key={req._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{req.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{req.job_type} · {new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={priorityColor(req.priority) as any} className="capitalize">{req.priority}</Badge>
                          <Badge variant={statusColor(req.status) as any} className="capitalize">{req.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Reports;