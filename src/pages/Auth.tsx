import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import { Wrench, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.string().min(1, "Role is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "user",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onLogin = async (data: LoginForm) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      // Role-based routing will be handled by the Index component
      navigate("/");
    }
    setIsSubmitting(false);
  };

  const onSignup = async (data: SignupForm) => {
    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.firstName, data.lastName, data.role);
    if (!error) {
      // Stay on auth page to show success message
    }
    setIsSubmitting(false);
  };

  const onForgotPassword = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    await resetPassword(data.email);
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="relative mb-8">
          <Link
            to="/"
            className="absolute left-0 top-1 inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ zIndex: 2 }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "login" && "Welcome Back"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot" && "Reset Password"}
            </CardTitle>
            <CardDescription>
              {mode === "login" && "Sign in to your acrms account"}
              {mode === "signup" && "Get started with ACRMS"}
              {mode === "forgot" && "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "login" && (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            )}

            {mode === "signup" && (
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="technician">Technician</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="ceo">CEO</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            )}

            {mode === "forgot" && (
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
            )}

            <div className="space-y-4">
              <Separator />
              <div className="text-center space-y-2">
                {mode === "login" && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link to="/auth?mode=signup" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <Link to="/auth?mode=forgot" className="text-primary hover:underline">
                        Forgot your password?
                      </Link>
                    </p>
                  </>
                )}
                {mode === "signup" && (
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/auth" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                )}
                {mode === "forgot" && (
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link to="/auth" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;