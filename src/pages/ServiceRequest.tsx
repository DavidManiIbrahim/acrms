import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { CreateRequest } from "@/components/CreateRequest";
import { MyRequestsList } from "@/components/MyRequestsList";

const ServiceRequest = () => {
  const { user, loading } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Redirect non-staff/users who try to access this page
  useEffect(() => {
    const allowedRoles = ['user', 'admin', 'sales', 'manager', 'ceo'];
    if (role && !allowedRoles.includes(role)) {
      navigate("/user-dashboard");
    }
  }, [role, navigate]);

  // Refresh state for triggering list reload
  const [refresh, setRefresh] = useState(false);
  const handleCreated = () => setRefresh(r => !r);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading service requests...</p>
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
        <h1 className="text-4xl font-bold text-gradient">Service Requests</h1>
        <CreateRequest onRequestCreated={handleCreated} />
        {/* <MyRequestsList refresh={refresh} /> */}
      </div>
    </Layout>
  );
};

export default ServiceRequest;