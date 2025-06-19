import { Switch, Route, useLocation } from "wouter";
import { SCRLogo } from "./components/SCRLogo";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Upload, Package2, FileText, Activity, Search, ChevronDown, Train, Users, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AuthPage from "./pages/AuthPage";
import DetentionForm from "./pages/DetentionForm";
import HistoricalRecords from "./pages/HistoricalRecords";
import DashboardPage from "./pages/DashboardPage";
import GoodsTabPage from "./pages/GoodsTabPage";
import CoachingTabPage from "./pages/CoachingTabPage";
import PlanningTabPage from "./pages/PlanningTabPage";
import DataUploadPage from "./pages/DataUploadPage";
import { useUser } from "./hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import RailwayReportsPage from "./pages/RailwayReportsPage";
import DailyReportsPage from "./pages/DailyReportsPage";
import AllEntriesPage from "./pages/AllEntriesPage";
import ExcelUploadPage from "./pages/ExcelUploadPage";
import StationComparativePage from "./pages/StationComparativePage";

function Navigation() {
  const [location, navigate] = useLocation();
  const { logout, user } = useUser();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-[#1a365d] text-white px-4 py-3 sm:p-4 overflow-x-auto shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex flex-nowrap gap-3 sm:gap-4 items-center min-w-max">
        {/* Main Dashboard */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className={`text-white hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4 ${location === "/dashboard" ? "bg-white/25 font-bold shadow-sm" : ""}`}
        >
          <Activity className="w-4 h-4 mr-2" />
          Operating Dashboard
        </Button>

        {/* Goods Tab */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/goods")}
          className={`text-white hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4 ${location === "/goods" ? "bg-white/25 font-bold shadow-sm" : ""}`}
        >
          <Package2 className="w-4 h-4 mr-2" />
          Goods
        </Button>

        {/* Coaching Tab - Hidden for now */}
        {false && (
          <Button 
            variant="ghost" 
            onClick={() => navigate("/coaching")}
            className={`text-white hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4 ${location === "/coaching" ? "bg-white/25 font-bold shadow-sm" : ""}`}
          >
            <Train className="w-4 h-4 mr-2" />
            Coaching
          </Button>
        )}

        {/* Planning Tab - Hidden for now */}
        {false && (
          <Button 
            variant="ghost" 
            onClick={() => navigate("/planning")}
            className={`text-white hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4 ${location === "/planning" ? "bg-white/25 font-bold shadow-sm" : ""}`}
          >
            <Map className="w-4 h-4 mr-2" />
            Planning
          </Button>
        )}

        {/* Operations Dropdown - moved to secondary position */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-white hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4">
              Operations
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => navigate("/")}>
              <Activity className="w-4 h-4 mr-2" />
              Detention Form
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/historical")}>
              <Search className="w-4 h-4 mr-2" />
              Historical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/railway-reports")}>
              <FileText className="w-4 h-4 mr-2" />
              Railway Reports
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/daily-reports")}>
              <FileText className="w-4 h-4 mr-2" />
              Daily Reports
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/all-entries")}>
              <Search className="w-4 h-4 mr-2" />
              All Entries
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/excel-upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Excel Upload
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/station-comparative")}>
              <FileText className="w-4 h-4 mr-2" />
              Station Comparative (May 26-31)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {user?.isAdmin && (
            <Button 
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="text-white/90 hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4"
            >
              Users
            </Button>
          )}
          <Button 
            variant="ghost"
            onClick={handleLogout}
            className="text-white/90 hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const { user, isLoading } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchDetentionData = async () => {
      //  Implementation to prefetch detention data here.  This will depend on your data fetching mechanism.
      // Example using react-query:
      // await queryClient.prefetchQuery(['detentions'], fetchDetentionData);
    };

    if (user) { //Only prefetch if user is logged in
      prefetchDetentionData();
    }
  }, [user, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div>
      <SCRLogo />
      <Navigation />
      <Switch>
        <Route path="/">
          {() => <DetentionForm />}
        </Route>
        <Route path="/dashboard">
          {() => <DashboardPage />}
        </Route>
        <Route path="/goods">
          {() => <GoodsTabPage />}
        </Route>
        <Route path="/coaching">
          {() => <CoachingTabPage />}
        </Route>
        <Route path="/planning">
          {() => <PlanningTabPage />}
        </Route>
        <Route path="/railway-reports">
          {() => <RailwayReportsPage />}
        </Route>
        <Route path="/daily-reports">
          {() => <DailyReportsPage />}
        </Route>
        <Route path="/all-entries">
          {() => <AllEntriesPage />}
        </Route>
        <Route path="/excel-upload">
          {() => <ExcelUploadPage />}
        </Route>
        <Route path="/historical">
          {() => <HistoricalRecords />}
        </Route>
        <Route path="/upload">
          {() => <DataUploadPage />}
        </Route>
        <Route path="/auth">
          {() => user?.isAdmin ? <AuthPage /> : <NotFound />}
        </Route>
        <Route>
          {() => <NotFound />}
        </Route>
      </Switch>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;