import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import { NotificationService } from "@/lib/notifications";

interface CreateRequestProps {
  onRequestCreated?: () => void;
}

export const CreateRequest = ({ onRequestCreated }: CreateRequestProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    job_type: "",
    priority: "medium",
    location: "",
    required_specialty: ""
  });

  const handleCreateRequest = async () => {
    if (!newRequest.title || !newRequest.description || !newRequest.job_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsCreating(true);

    try {
      const serviceRequest = await apiClient.createServiceRequest({
        title: newRequest.title,
        description: newRequest.description,
        job_type: newRequest.job_type,
        priority: newRequest.priority,
        location: newRequest.location || null,
        required_specialty: newRequest.required_specialty || null,
      });

      // Notify admins and technicians about the new request
      await NotificationService.notifyNewServiceRequest({
        id: serviceRequest._id || serviceRequest.id,
        title: newRequest.title,
        user_id: user.id,
        description: newRequest.description
      });

      toast({
        title: "Success",
        description: "Service request created successfully",
      });

      setNewRequest({ 
        title: "", 
        description: "", 
        job_type: "", 
        priority: "medium", 
        location: "",
        required_specialty: ""
      });

      if (onRequestCreated) {
        onRequestCreated();
      }
    } catch (error: any) {
      console.error('Error creating service request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create service request",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="card-hover border-border/40 bg-gradient-to-br from-card to-card/80 hover:shadow-lg transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <span>Create Service Request</span>
        </CardTitle>
        <CardDescription>
          Submit a new service request for your equipment maintenance needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={newRequest.title}
              onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="job_type">Job Type *</Label>
            <Select value={newRequest.job_type} onValueChange={(value) => setNewRequest({...newRequest, job_type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hardware_repair">Hardware Repair</SelectItem>
                <SelectItem value="software_installation">Software Installation</SelectItem>
                <SelectItem value="network_setup">Network Setup</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
                <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Detailed description of the problem"
            rows={4}
            value={newRequest.description}
            onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={newRequest.priority} onValueChange={(value) => setNewRequest({...newRequest, priority: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Office, building, etc."
              value={newRequest.location}
              onChange={(e) => setNewRequest({...newRequest, location: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="required_specialty">Required Specialty</Label>
            <Select value={newRequest.required_specialty} onValueChange={(value) => setNewRequest({...newRequest, required_specialty: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleCreateRequest} 
          className="w-full" 
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Submit Request"}
        </Button>
      </CardContent>
    </Card>
  );
};