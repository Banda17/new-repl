import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { toast } = useToast();
  const { login, register, user, isLoading: authLoading } = useUser();
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    isAdmin: false
  });

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering && !user?.isAdmin) {
        throw new Error("Only administrators can register new users");
      }

      const action = isRegistering ? register : login;
      await action(formData);

      toast({
        title: "Success",
        description: isRegistering ? "Registration successful" : "Login successful",
      });

      // Clear form after success
      setFormData({ username: "", password: "", isAdmin: false });
      setIsRegistering(false);

      // Redirect to dashboard on successful login
      if (!isRegistering) {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user is logged in and we're still on auth page, redirect
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            {isRegistering ? "Register New User" : "Login"}
            {user?.isAdmin && (
              <span className="text-xs sm:text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                Admin
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isRegistering
              ? "As an admin, you can create new user accounts here"
              : user?.isAdmin
                ? "Login or use the button below to register new users"
                : "Enter your credentials to continue"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 sm:space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                minLength={3}
                className={`h-11 sm:h-10 text-base sm:text-sm ${isRegistering ? "border-primary/50" : ""}`}
              />
              {isRegistering && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Username must be at least 3 characters
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
                className={`h-11 sm:h-10 text-base sm:text-sm ${isRegistering ? "border-primary/50" : ""}`}
              />
              {isRegistering && (
                <div className="space-y-2 sm:space-y-1">
                  <p className="text-sm sm:text-xs text-muted-foreground">
                    Password requirements:
                  </p>
                  <ul className="text-sm sm:text-xs text-muted-foreground list-disc list-inside">
                    <li>At least 6 characters long</li>
                    <li>Will be stored securely</li>
                  </ul>
                </div>
              )}
            </div>
            {isRegistering && (
              <div className="rounded-lg bg-primary/5 p-4 sm:p-3">
                <p className="text-sm sm:text-xs text-primary">
                  Creating a new user account. This user will have regular (non-admin) access to the system.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 sm:space-y-2 p-4 sm:p-6">
            <Button
              type="submit"
              className="w-full h-11 sm:h-10 text-base sm:text-sm"
              disabled={isLoading || authLoading}
            >
              {isLoading ? "Processing..." : isRegistering ? "Register User" : "Login"}
            </Button>
            {user?.isAdmin && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 sm:h-10 text-base sm:text-sm"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setFormData({ username: "", password: "", isAdmin: false });
                }}
                disabled={isLoading}
              >
                {isRegistering ? "Back to Login" : "Register New User"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}