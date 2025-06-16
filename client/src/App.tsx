import { Switch, Route, useLocation } from "wouter";
import { SCRLogo } from "./components/SCRLogo";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Upload, Package2, FileText, Activity, Search, ChevronDown, Train, Users, Map, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import PunctualityPage from "./pages/PunctualityPage";
import DataSubmissionPage from "./pages/DataSubmissionPage";

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
        {/* 
          Updated Navigation Structure:
          - Removed DASHBOARD tab completely
          - Renamed OPERATIONS to BULK DATA UPLOAD
          - Restructured GOODS with nested sub-menus
        */}

        {/* GOODS Dropdown - Primary navigation with nested structure */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-white hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4">
              <Package2 className="w-4 h-4 mr-2" />
              GOODS
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {/* Root GOODS menu items */}
            <DropdownMenuItem onClick={() => navigate("/")}>
              <Activity className="w-4 h-4 mr-2" />
              Detention Form
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Data
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Interchange Sub-menu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Train className="w-4 h-4 mr-2" />
                Interchange
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => navigate("/goods/interchange/historical")}>
                  <Search className="w-4 h-4 mr-2" />
                  Historical
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            {/* Loading Sub-menu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Package2 className="w-4 h-4 mr-2" />
                Loading
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => navigate("/goods/loading/all-entries")}>
                  <Search className="w-4 h-4 mr-2" />
                  All Entries
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/goods/loading/punctuality")}>
                  <Clock className="w-4 h-4 mr-2" />
                  Punctuality
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/goods/loading/planning")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Planning
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSeparator />
            
            {/* Remaining root GOODS menu items */}
            <DropdownMenuItem onClick={() => navigate("/daily-reports")}>
              <FileText className="w-4 h-4 mr-2" />
              Daily Reports
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/excel-upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Excel Upload
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* BULK DATA UPLOAD Dropdown - Simplified operations menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-white hover:bg-white/20 transition-all rounded-md text-xs sm:text-sm h-9 px-3 sm:px-4">
              <Upload className="w-4 h-4 mr-2" />
              BULK DATA UPLOAD
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => navigate("/bulk/upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/bulk/excel-upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Excel Upload
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
        {/* 
          Updated Routes to match new navigation structure:
          - Removed /dashboard route (Dashboard tab removed)
          - Added nested routes for new GOODS structure
          - Added BULK DATA UPLOAD routes
        */}
        
        {/* Root route - Detention Form (GOODS main item) */}
        <Route path="/">
          {() => <DataSubmissionPage />}
        </Route>
        
        {/* GOODS routes */}
        <Route path="/upload">
          {() => <DataUploadPage />}
        </Route>
        <Route path="/daily-reports">
          {() => <DailyReportsPage />}
        </Route>
        <Route path="/excel-upload">
          {() => <ExcelUploadPage />}
        </Route>
        
        {/* GOODS -> Interchange sub-menu */}
        <Route path="/goods/interchange/historical">
          {() => <HistoricalRecords />}
        </Route>
        
        {/* GOODS -> Loading sub-menu */}
        <Route path="/goods/loading/all-entries">
          {() => <AllEntriesPage />}
        </Route>
        <Route path="/goods/loading/punctuality">
          {() => <PunctualityPage />}
        </Route>
        <Route path="/goods/loading/planning">
          {() => <PlanningTabPage />}
        </Route>
        
        {/* BULK DATA UPLOAD routes */}
        <Route path="/bulk/upload">
          {() => <DataUploadPage />}
        </Route>
        <Route path="/bulk/excel-upload">
          {() => <ExcelUploadPage />}
        </Route>
        
        {/* Legacy routes for backward compatibility */}
        <Route path="/goods">
          {() => <GoodsTabPage />}
        </Route>
        <Route path="/historical">
          {() => <HistoricalRecords />}
        </Route>
        <Route path="/all-entries">
          {() => <AllEntriesPage />}
        </Route>
        <Route path="/railway-reports">
          {() => <RailwayReportsPage />}
        </Route>
        
        {/* Admin route */}
        <Route path="/auth">
          {() => user?.isAdmin ? <AuthPage /> : <NotFound />}
        </Route>
        
        {/* 404 fallback */}
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