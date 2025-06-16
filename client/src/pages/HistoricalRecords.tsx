import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Download, Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import DetentionForm from "./DetentionForm";
import { DetentionInsights } from "@/components/DetentionInsights";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";
import { SelectDetention } from "@db/schema";

const wagonTypes = ["BOXNHL", "BW", "BCN"];
const stations = ["AJNI", "AMLA", "BSL", "CD", "NGP", "WR"];

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function HistoricalRecords() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterWagonType, setFilterWagonType] = useState<string>("");
  const [filterStation, setFilterStation] = useState<string>("");
  const [filterOperation, setFilterOperation] = useState<"all" | "loading" | "unloading">("all");
  const [editingDetention, setEditingDetention] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });

  const { data: detentions, isLoading, error, isFetching, refetch } = useQuery<SelectDetention[]>({
    queryKey: ["/api/detentions"],
    queryFn: async () => {
      const response = await fetch("/api/detentions");
      if (!response.ok) {
        throw new Error("Failed to fetch detentions");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Keep data fresh for 10 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/detentions/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update detention data");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/detentions"] });
      toast({
        title: "Success",
        description: "Detention record updated successfully",
      });
      setEditingDetention(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredDetentions = detentions?.filter((detention: SelectDetention) => {
    const matchesSearch = search === "" || 
      Object.values(detention).some(
        value => value && value.toString().toLowerCase().includes(search.toLowerCase())
      );
    
    const matchesWagonType = filterWagonType === '_all' || !filterWagonType || detention.wagonType === filterWagonType;
    const matchesStation = filterStation === '_all' || !filterStation || detention.stationId === filterStation;
    const matchesOperation = filterOperation === "all" || 
      (filterOperation === "loading" && detention.wagonType === "BOXNHL") ||
      (filterOperation === "unloading" && detention.wagonType !== "BOXNHL");
    
    // Date range filtering
    const detentionDate = new Date(detention.arrivalTime);
    const matchesDateRange = !dateRange.from || !dateRange.to || isWithinInterval(detentionDate, {
      start: startOfDay(dateRange.from ?? new Date(0)),
      end: endOfDay(dateRange.to ?? new Date())
    });
    
    console.log("Filtering record:", {
      detention,
      matchesSearch,
      matchesWagonType,
      matchesStation,
      matchesOperation,
      matchesDateRange
    });
    
    return matchesSearch && matchesWagonType && matchesStation && matchesOperation && matchesDateRange;
  });

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Historical Detention Records</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading || isFetching}
              >
                Refresh Data
                {(isLoading || isFetching) && (
                  <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDetentions && filteredDetentions.length > 0 && (
            <>
              <PerformanceDashboard detentions={filteredDetentions} />
              <DetentionInsights detentions={filteredDetentions} />
            </>
          )}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal w-[240px]",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(selectedRange: any) => {
                        if (selectedRange) {
                          setDateRange({
                            from: selectedRange.from,
                            to: selectedRange.to
                          });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  onClick={() => {
                    if (!filteredDetentions?.length) return;
                    
                    const exportData = filteredDetentions.map(detention => ({
                      Station: detention.stationId,
                      'Rake ID': detention.rakeId,
                      'Wagon Type': detention.wagonType,
                      'Arrival Time': format(new Date(detention.arrivalTime), "PPpp"),
                      'Departure Time': format(new Date(detention.departureTime), "PPpp"),
                      'Total Duration (minutes)': Math.round(
                        (new Date(detention.departureTime).getTime() -
                          new Date(detention.arrivalTime).getTime()) /
                          (1000 * 60)
                      ),
                      'AR-PL Reason': detention.arPlReason || '',
                      'PL-RL Reason': detention.plRlReason || '',
                      'RL-DP Reason': detention.rlDpReason || '',
                      Remarks: detention.remarks || ''
                    }));

                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Detention Records');
                    XLSX.writeFile(wb, `detention-records-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
                  }}
                  className="flex items-center gap-2"
                  disabled={!filteredDetentions?.length}
                >
                  <Download className="h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <Select
                value={filterStation}
                onValueChange={setFilterStation}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by station" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Stations</SelectItem>
                  {stations.map((station) => (
                    <SelectItem key={station} value={station}>
                      {station}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterOperation}
                onValueChange={(value: "all" | "loading" | "unloading") => setFilterOperation(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  <SelectItem value="loading">Loading</SelectItem>
                  <SelectItem value="unloading">Unloading</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterWagonType}
                onValueChange={setFilterWagonType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by wagon type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Types</SelectItem>
                  {wagonTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Rake ID</TableHead>
                  <TableHead>Wagon Type</TableHead>
                  <TableHead>Arrival Time</TableHead>
                  <TableHead>Departure Time</TableHead>
                  <TableHead>Total Duration</TableHead>
                  <TableHead>Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <TableRow>
                      <TableCell colSpan={7} className="py-8">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i} className="animate-in fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                        <TableCell>
                          <div className="h-4 w-16 bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 bg-[length:200%_100%] animate-shimmer rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 bg-[length:200%_100%] animate-shimmer rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 bg-[length:200%_100%] animate-shimmer rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-32 bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 bg-[length:200%_100%] animate-shimmer rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-32 bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 bg-[length:200%_100%] animate-shimmer rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 bg-[length:200%_100%] animate-shimmer rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-8 bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 bg-[length:200%_100%] animate-shimmer rounded"></div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : filteredDetentions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDetentions?.map((detention: any) => (
                    <TableRow key={detention.id}>
                      <TableCell>{detention.stationId}</TableCell>
                      <TableCell>{detention.rakeId}</TableCell>
                      <TableCell>{detention.wagonType}</TableCell>
                      <TableCell>
                        {format(new Date(detention.arrivalTime), "PPpp")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(detention.departureTime), "PPpp")}
                      </TableCell>
                      <TableCell>
                        {Math.round(
                          (new Date(detention.departureTime).getTime() -
                            new Date(detention.arrivalTime).getTime()) /
                            (1000 * 60)
                        )}{" "}
                        minutes
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingDetention(detention)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingDetention} onOpenChange={() => setEditingDetention(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Detention Record</DialogTitle>
          </DialogHeader>
          {editingDetention && (
            <DetentionForm
              initialValues={{
                ...editingDetention,
                arrivalDateTime: new Date(editingDetention.arrivalTime).toISOString().slice(0, 16),
                placementDateTime: new Date(editingDetention.placementTime).toISOString().slice(0, 16),
                releaseDateTime: new Date(editingDetention.releaseTime).toISOString().slice(0, 16),
                departureDateTime: new Date(editingDetention.departureTime).toISOString().slice(0, 16),
              }}
              onSubmit={(data) => updateMutation.mutate({ ...data, id: editingDetention.id })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
