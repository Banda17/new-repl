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
import UsersPage from "./pages/UsersPage";
import CustomReportsPage from "./pages/CustomReportsPage";

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
    <nav className="backdrop-blur-lg bg-blue-900/30 border-b border-white/30 text-white px-2 py-2 sm:px-4 sm:py-3 overflow-x-auto shadow-xl sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto flex flex-nowrap gap-1 sm:gap-3 md:gap-4 items-center min-w-max lg:min-w-0 lg:justify-start">
        {/* Main Dashboard */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className={`text-white hover:bg-blue-500/20 transition-all duration-300 rounded-md text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4 backdrop-blur-sm ${location === "/dashboard" ? "bg-blue-500/25 font-bold shadow-lg border border-white/20" : ""}`}
        >
          <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Operating Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </Button>

        {/* Goods Tab */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/goods")}
          className={`text-white hover:bg-blue-500/20 transition-all duration-300 rounded-md text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4 backdrop-blur-sm ${location === "/goods" ? "bg-blue-500/25 font-bold shadow-lg border border-white/20" : ""}`}
        >
          <Package2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
            <Button variant="ghost" className="text-white hover:bg-white/20 transition-all duration-300 rounded-md text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4">
              <span className="hidden sm:inline">Operations</span>
              <span className="sm:hidden">Ops</span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 sm:w-48 backdrop-blur-lg bg-white/95 border border-white/20 shadow-xl">
            <DropdownMenuItem onClick={() => navigate("/upload")} className="transition-colors duration-200">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-xs sm:text-sm">Upload Data</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/historical")} className="transition-colors duration-200">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-xs sm:text-sm">Historical</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/excel-upload")} className="transition-colors duration-200">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-xs sm:text-sm">Excel Upload</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/custom-reports")} className="transition-colors duration-200">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-xs sm:text-sm">Custom Reports</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-4">
          {user?.isAdmin && (
            <Button 
              variant="ghost"
              onClick={() => navigate("/users")}
              className="text-white/90 hover:bg-white/20 transition-all duration-300 rounded-md text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </Button>
          )}
          <Button 
            variant="ghost"
            onClick={handleLogout}
            className="text-white/90 hover:bg-red-500/30 transition-all duration-300 rounded-md text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Exit</span>
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
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(/attached_assets/newindianexpress_2025-01-17_7zra51ol_Vijayawada_1750328706751.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative z-10">
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
          <Route path="/station-comparative">
            {() => <StationComparativePage />}
          </Route>
          <Route path="/historical">
            {() => <HistoricalRecords />}
          </Route>
          <Route path="/upload">
            {() => <DataUploadPage />}
          </Route>
          <Route path="/users">
            {() => user?.isAdmin ? <UsersPage /> : <NotFound />}
          </Route>
          <Route path="/custom-reports">
            {() => <CustomReportsPage />}
          </Route>
          <Route path="/auth">
            {() => user?.isAdmin ? <AuthPage /> : <NotFound />}
          </Route>
          <Route>
            {() => <NotFound />}
          </Route>
        </Switch>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4 backdrop-blur-lg bg-blue-900/10 border border-white/20 shadow-2xl">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <h1 className="text-2xl font-bold text-white">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-white/80">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;