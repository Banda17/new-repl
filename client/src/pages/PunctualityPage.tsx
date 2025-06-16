import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function PunctualityPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Punctuality Analysis</h1>
          <p className="text-gray-600">Train punctuality and on-time performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Punctuality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">87.5%</div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">+2.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Delay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-600">12.4 min</div>
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">-1.8 min from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">On-Time Arrivals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">342</div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Today's performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Delays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">23</div>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">&gt;30 min delays</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Station Performance</CardTitle>
            <CardDescription>Punctuality by major stations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">DVP (Davangere)</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">92.1%</Badge>
                  <span className="text-sm text-gray-500">Excellent</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">MAS (Chennai Central)</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">88.7%</Badge>
                  <span className="text-sm text-gray-500">Good</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">GLT (Guntakal)</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">81.3%</Badge>
                  <span className="text-sm text-gray-500">Average</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">SC (Secunderabad)</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">76.9%</Badge>
                  <span className="text-sm text-gray-500">Needs Attention</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Punctuality issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Major Delay - Train 12622</p>
                  <p className="text-sm text-red-700">45 min delay at Guntakal Junction</p>
                  <p className="text-xs text-red-600 mt-1">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Recurring Delays</p>
                  <p className="text-sm text-yellow-700">Platform congestion at Chennai Central</p>
                  <p className="text-xs text-yellow-600 mt-1">Pattern observed over 3 days</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Improvement Noted</p>
                  <p className="text-sm text-blue-700">Davangere station punctuality up 5%</p>
                  <p className="text-xs text-blue-600 mt-1">Weekly improvement</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}