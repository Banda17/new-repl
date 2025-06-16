import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SheetsReportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(180); // 3 minutes in seconds
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set up automatic refresh with visual indicator
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      setIsRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/worker-data"] });
      setCountdown(180);
      setIsRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "The data has been updated.",
      });
    }, 180000); // 3 minutes

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 180));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [queryClient, toast]);

  const { data: workerData, isLoading, error } = useQuery({
    queryKey: ["/api/worker-data"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Railway Operations Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-500">
              Failed to load data: {error instanceof Error ? error.message : String(error)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Railway Operations Data</CardTitle>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Next refresh in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {workerData && workerData.length > 0 && Object.keys(workerData[0]).map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerData && workerData.length > 0 ? (
                  workerData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, i) => (
                        <TableCell key={i}>{value?.toString() || ''}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={workerData?.[0] ? Object.keys(workerData[0]).length : 1} className="text-center py-10">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}