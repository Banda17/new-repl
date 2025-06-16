import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit, Save, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  name: string;
  type: 'Speed' | 'Route' | 'Load' | 'Station';
  category: string;
  description: string;
  parameters: Record<string, any>;
  status: 'Active' | 'Draft' | 'Archived';
  lastModified: string;
}

const sampleProfiles: Profile[] = [
  {
    id: "1",
    name: "Freight Speed Profile A",
    type: "Speed",
    category: "Coal Transport",
    description: "Standard speed profile for coal freight trains",
    parameters: { maxSpeed: 60, avgSpeed: 45, acceleration: 0.5 },
    status: "Active",
    lastModified: "2025-01-20"
  },
  {
    id: "2", 
    name: "GTL-MAS Route Profile",
    type: "Route",
    category: "Main Line",
    description: "Optimized route profile for Guntakal to Chennai",
    parameters: { distance: 420, stops: 8, avgTime: 480 },
    status: "Active",
    lastModified: "2025-01-18"
  },
  {
    id: "3",
    name: "Container Load Profile",
    type: "Load",
    category: "Container",
    description: "Standard loading parameters for container operations",
    parameters: { capacity: 45, weight: 25000, timePerContainer: 3 },
    status: "Draft",
    lastModified: "2025-01-15"
  }
];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>(sampleProfiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || profile.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleEdit = (profile: Profile) => {
    setEditingProfile({ ...profile });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingProfile({
      id: "",
      name: "",
      type: "Speed",
      category: "",
      description: "",
      parameters: {},
      status: "Draft",
      lastModified: new Date().toISOString().split('T')[0]
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editingProfile) return;
    
    if (isCreating) {
      const newProfile = {
        ...editingProfile,
        id: Date.now().toString(),
        lastModified: new Date().toISOString().split('T')[0]
      };
      setProfiles([...profiles, newProfile]);
    } else {
      setProfiles(profiles.map(p => 
        p.id === editingProfile.id 
          ? { ...editingProfile, lastModified: new Date().toISOString().split('T')[0] }
          : p
      ));
    }
    
    setEditingProfile(null);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingProfile(null);
    setIsCreating(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Operation Profiles</h1>
        <div className="flex items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Profile Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Speed">Speed</SelectItem>
              <SelectItem value="Route">Route</SelectItem>
              <SelectItem value="Load">Load</SelectItem>
              <SelectItem value="Station">Station</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profiles List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Library</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{profile.type}</Badge>
                      </TableCell>
                      <TableCell>{profile.category}</TableCell>
                      <TableCell>
                        <Badge variant={
                          profile.status === 'Active' ? 'default' :
                          profile.status === 'Draft' ? 'secondary' : 'outline'
                        }>
                          {profile.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{profile.lastModified}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(profile)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Profile Editor */}
        <div className="space-y-4">
          {editingProfile ? (
            <Card>
              <CardHeader>
                <CardTitle>{isCreating ? 'Create Profile' : 'Edit Profile'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={editingProfile.name}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      name: e.target.value
                    })}
                    placeholder="Profile name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={editingProfile.type} 
                    onValueChange={(value) => setEditingProfile({
                      ...editingProfile,
                      type: value as Profile['type']
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Speed">Speed</SelectItem>
                      <SelectItem value="Route">Route</SelectItem>
                      <SelectItem value="Load">Load</SelectItem>
                      <SelectItem value="Station">Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={editingProfile.category}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      category: e.target.value
                    })}
                    placeholder="Profile category"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editingProfile.description}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      description: e.target.value
                    })}
                    placeholder="Profile description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={editingProfile.status} 
                    onValueChange={(value) => setEditingProfile({
                      ...editingProfile,
                      status: value as Profile['status']
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Profiles</span>
                  <span className="font-semibold">{profiles.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-semibold text-green-600">
                    {profiles.filter(p => p.status === 'Active').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Draft</span>
                  <span className="font-semibold text-yellow-600">
                    {profiles.filter(p => p.status === 'Draft').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Archived</span>
                  <span className="font-semibold text-gray-600">
                    {profiles.filter(p => p.status === 'Archived').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Freight Speed Profile A</div>
                <div className="text-muted-foreground">Modified 2 days ago</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">GTL-MAS Route Profile</div>
                <div className="text-muted-foreground">Created 4 days ago</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Container Load Profile</div>
                <div className="text-muted-foreground">Updated 1 week ago</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}