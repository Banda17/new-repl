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
// Railway station background image will be loaded via URL

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
    // If user is already logged in and not an admin, redirect to dashboard
    // Admin users can stay to manage users
    if (user && !user.isAdmin) {
      setLocation("/dashboard");
    } else if (user && user.isAdmin) {
      // Set registration mode for admin users
      setIsRegistering(true);
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

  // If user is logged in and not an admin, they shouldn't be here
  if (user && !user.isAdmin) {
    return null;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(/attached_assets/newindianexpress_2025-01-17_7zra51ol_Vijayawada_1750328706751.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <Card className="w-full max-w-md relative z-10 backdrop-blur-lg bg-blue-500/5 border-white/15 shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-white font-bold">
            {isRegistering ? "Register New User" : "Railway Operations Login"}
            {user?.isAdmin && (
              <span className="text-xs sm:text-sm bg-white/20 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                Admin
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-white/90">
            {isRegistering
              ? "As an admin, you can create new user accounts here"
              : user?.isAdmin
                ? "Login or use the button below to register new users"
                : "South Central Railway Operations Management System"}
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
                className={`h-11 sm:h-10 text-base sm:text-sm bg-blue-500/10 border-white/20 text-white placeholder:text-white/70 backdrop-blur-sm ${isRegistering ? "border-white/30" : ""}`}
              />
              {isRegistering && (
                <p className="text-xs sm:text-sm text-white/80">
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
                className={`h-11 sm:h-10 text-base sm:text-sm bg-blue-500/10 border-white/20 text-white placeholder:text-white/70 backdrop-blur-sm ${isRegistering ? "border-white/30" : ""}`}
              />
              {isRegistering && (
                <div className="space-y-2 sm:space-y-1">
                  <p className="text-sm sm:text-xs text-white/80">
                    Password requirements:
                  </p>
                  <ul className="text-sm sm:text-xs text-white/80 list-disc list-inside">
                    <li>At least 6 characters long</li>
                    <li>Will be stored securely</li>
                  </ul>
                </div>
              )}
            </div>
            {isRegistering && (
              <div className="rounded-lg bg-blue-500/10 backdrop-blur-sm border border-white/15 p-4 sm:p-3">
                <p className="text-sm sm:text-xs text-white/90">
                  Creating a new user account. This user will have regular (non-admin) access to the system.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 sm:space-y-2 p-4 sm:p-6">
            <Button
              type="submit"
              className="w-full h-11 sm:h-10 text-base sm:text-sm bg-blue-500/15 hover:bg-blue-500/25 border-white/20 text-white backdrop-blur-sm font-semibold"
              disabled={isLoading || authLoading}
            >
              {isLoading ? "Processing..." : isRegistering ? "Register User" : "Login"}
            </Button>
            {user?.isAdmin && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 sm:h-10 text-base sm:text-sm bg-transparent hover:bg-blue-500/15 border-white/20 text-white backdrop-blur-sm"
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