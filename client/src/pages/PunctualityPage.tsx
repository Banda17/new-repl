import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export default function PunctualityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  
  // Sample punctuality data
  const punctualityData = [
    { train: "12345", route: "DVG-MAS", scheduled: "08:30", actual: "08:35", delay: 5, status: "LATE" },
    { train: "67890", route: "GTL-SC", scheduled: "10:15", actual: "10:10", delay: -5, status: "EARLY" },
    { train: "11111", route: "MAS-GNT", scheduled: "14:20", actual: "14:20", delay: 0, status: "ON TIME" },
    { train: "22222", route: "SC-DVG", scheduled: "16:45", actual: "17:15", delay: 30, status: "LATE" },
  ];

  const chartData = [
    { period: "Mon", onTime: 85, late: 12, early: 3 },
    { period: "Tue", onTime: 88, late: 10, early: 2 },
    { period: "Wed", onTime: 82, late: 15, early: 3 },
    { period: "Thu", onTime: 90, late: 8, early: 2 },
    { period: "Fri", onTime: 87, late: 11, early: 2 },
    { period: "Sat", onTime: 92, late: 6, early: 2 },
    { period: "Sun", onTime: 89, late: 9, early: 2 },
  ];

  const trendData = [
    { month: "Jan", punctuality: 86 },
    { month: "Feb", punctuality: 88 },
    { month: "Mar", punctuality: 85 },
    { month: "Apr", punctuality: 90 },
    { month: "May", punctuality: 87 },
    { month: "Jun", punctuality: 91 },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Train Punctuality</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-xs text-muted-foreground">+2% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Delay</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">8.5 min</div>
            <p className="text-xs text-muted-foreground">-1.2 min from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Today's operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Delays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">{'>'}30 min delay</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Train Punctuality Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Train No</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Delay (min)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {punctualityData.map((train, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{train.train}</TableCell>
                      <TableCell>{train.route}</TableCell>
                      <TableCell>{train.scheduled}</TableCell>
                      <TableCell>{train.actual}</TableCell>
                      <TableCell>
                        <span className={`${train.delay > 0 ? 'text-red-600' : train.delay < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {train.delay > 0 ? '+' : ''}{train.delay}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          train.status === 'ON TIME' ? 'bg-green-100 text-green-800' :
                          train.status === 'EARLY' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {train.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Punctuality Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="onTime" fill="#22c55e" name="On Time %" />
                  <Bar dataKey="late" fill="#ef4444" name="Late %" />
                  <Bar dataKey="early" fill="#3b82f6" name="Early %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Punctuality Trend (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[80, 95]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="punctuality" stroke="#22c55e" strokeWidth={2} name="Punctuality %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}