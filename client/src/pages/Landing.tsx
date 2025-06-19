import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SCRLogo } from "@/components/SCRLogo";
import { Train, Users, BarChart3, FileText } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <SCRLogo />
          <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-4">
            Railway Operations Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive data management and analytics platform for South Central Railway operations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Train className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Operations Management</CardTitle>
              <CardDescription>
                Track detention times, wagon movements, and operational efficiency
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Data Analytics</CardTitle>
              <CardDescription>
                Comprehensive charts and comparative analysis for informed decisions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Report Generation</CardTitle>
              <CardDescription>
                Generate detailed PDF reports for operational insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle className="text-lg">User Management</CardTitle>
              <CardDescription>
                Secure authentication and role-based access control
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Access Your Dashboard</CardTitle>
              <CardDescription className="text-center">
                Sign in to access the railway operations management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogin} 
                className="w-full" 
                size="lg"
              >
                Sign In with Replit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}