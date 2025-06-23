import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Shield, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface UserData {
  id: number;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    isAdmin: false
  });

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setFormData({ username: "", password: "", isAdmin: false });
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handleDeleteUser = (userId: number, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? "Cancel" : "Add User"}
          </Button>
        </div>

        {/* Create User Form */}
        {isCreating && (
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Username</label>
                    <Input
                      type="text"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                      minLength={3}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Password</label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isAdmin: checked as boolean })
                    }
                    className="border-white/20"
                  />
                  <label htmlFor="isAdmin" className="text-sm text-white">
                    Grant administrator privileges
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setFormData({ username: "", password: "", isAdmin: false });
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">System Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="ml-3 text-white/80">Loading users...</p>
              </div>
            ) : users && users.length > 0 ? (
              <div className="bg-white rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-900">Username</TableHead>
                      <TableHead className="text-gray-900">Role</TableHead>
                      <TableHead className="text-gray-900">Created</TableHead>
                      <TableHead className="text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: UserData) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-gray-900 flex items-center gap-2">
                          {user.isAdmin ? (
                            <Shield className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-gray-500" />
                          )}
                          {user.username}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isAdmin ? "default" : "secondary"}
                            className={user.isAdmin ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                          >
                            {user.isAdmin ? "Administrator" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-white/80">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}