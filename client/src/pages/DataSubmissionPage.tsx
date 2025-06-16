import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, DownloadIcon, EditIcon, SaveIcon, XIcon } from "lucide-react";
import { format } from "date-fns";

const detentionSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  rakeId: z.string().min(1, "Rake ID is required"),
  rakeName: z.string().min(1, "Rake Name is required"),
  wagonType: z.string().min(1, "Wagon Type is required"),
  arrivalTime: z.string().min(1, "Arrival Time is required"),
  placementTime: z.string().min(1, "Placement Time is required"),
  releaseTime: z.string().min(1, "Release Time is required"),
  departureTime: z.string().min(1, "Departure Time is required"),
  arPlReason: z.string().optional(),
  plRlReason: z.string().optional(),
  rlDpReason: z.string().optional(),
  remarks: z.string().optional(),
});

type DetentionFormData = z.infer<typeof detentionSchema>;

interface RailwayLoadingOperation {
  id: number;
  pDate: string;
  station: string;
  siding: string;
  imported: string;
  commodity: string;
  commType: string;
  commCg: string;
  demand: string;
  state: string;
  rly: string;
  wagons: number;
  type: string;
  units: number;
  loadingType: string;
  rrNoFrom: number;
  rrNoTo: number;
  rrDate: string;
  tonnage: number;
  freight: number;
}

export default function DataSubmissionPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Railway operations state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [stationFilter, setStationFilter] = useState("all");
  const [commodityFilter, setCommodityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("pDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<RailwayLoadingOperation>>({});
  
  const queryClient = useQueryClient();

  // Fetch all entries with pagination and filtering
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/railway-loading-operations/all', page, pageSize, searchTerm, stationFilter, commodityFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchTerm,
        station: stationFilter,
        commodity: commodityFilter,
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/railway-loading-operations/all?${params}`);
      if (!response.ok) throw new Error('Failed to fetch entries');
      return response.json();
    }
  });

  // Fetch dropdown options for filters
  const { data: dropdownOptions } = useQuery({
    queryKey: ['/api/railway-loading-operations/dropdown-options'],
    queryFn: async () => {
      const response = await fetch('/api/railway-loading-operations/dropdown-options');
      if (!response.ok) throw new Error('Failed to fetch dropdown options');
      return response.json();
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RailwayLoadingOperation> }) => {
      const response = await fetch(`/api/railway-loading-operations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/railway-loading-operations/all'] });
      toast({
        title: "Success",
        description: "Entry updated successfully",
      });
      setEditingId(null);
      setEditValues({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    },
  });

  const startEdit = (entry: RailwayLoadingOperation) => {
    setEditingId(entry.id);
    setEditValues({
      station: entry.station,
      siding: entry.siding,
      commodity: entry.commodity,
      type: entry.type,
      wagons: entry.wagons,
      units: entry.units,
      tonnage: entry.tonnage,
      freight: entry.freight,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = (id: number) => {
    updateMutation.mutate({ id, data: editValues });
  };

  const handleFieldChange = (field: keyof RailwayLoadingOperation, value: string | number) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const form = useForm<DetentionFormData>({
    resolver: zodResolver(detentionSchema),
    defaultValues: {
      stationId: "",
      rakeId: "",
      rakeName: "",
      wagonType: "",
      arrivalTime: "",
      placementTime: "",
      releaseTime: "",
      departureTime: "",
      arPlReason: "",
      plRlReason: "",
      rlDpReason: "",
      remarks: "",
    },
  });

  const onSubmit = async (data: DetentionFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/external/detentions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([data]), // Wrap in array as API expects array
      });

      if (!response.ok) {
        throw new Error("Failed to submit data");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Data submitted successfully",
      });

      // Reset form after successful submission
      form.reset();
    } catch (error) {
      console.error("Error submitting data:", error);
      toast({
        title: "Error",
        description: "Failed to submit data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Submit Detention Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="stationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Station ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rakeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rake ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rakeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rake Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wagonType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wagon Type</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="arrivalTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="placementTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placement Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="releaseTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="arPlReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival to Placement Reason</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plRlReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placement to Release Reason</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rlDpReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release to Departure Reason</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Data"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Railway Loading Operations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Railway Loading Operations</CardTitle>
          <CardDescription>
            View and edit all railway loading operation entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by station, commodity, etc."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Station</label>
              <Select value={stationFilter} onValueChange={setStationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  {dropdownOptions?.stations?.map((station: string) => (
                    <SelectItem key={station} value={station}>
                      {station}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Commodity</label>
              <Select value={commodityFilter} onValueChange={setCommodityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Commodities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Commodities</SelectItem>
                  {dropdownOptions?.commodities?.map((commodity: string) => (
                    <SelectItem key={commodity} value={commodity}>
                      {commodity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pDate">Date</SelectItem>
                    <SelectItem value="station">Station</SelectItem>
                    <SelectItem value="commodity">Commodity</SelectItem>
                    <SelectItem value="wagons">Wagons</SelectItem>
                    <SelectItem value="tonnage">Tonnage</SelectItem>
                    <SelectItem value="freight">Freight</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">ASC</SelectItem>
                    <SelectItem value="desc">DESC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">entries per page</span>
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStationFilter("all");
                setCommodityFilter("all");
                setSortBy("pDate");
                setSortOrder("desc");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Data Table */}
          {entriesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Siding</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Wagons</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Tonnage</TableHead>
                    <TableHead>Freight</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesData?.data?.map((entry: RailwayLoadingOperation) => {
                    const isEditing = editingId === entry.id;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.pDate ? format(new Date(entry.pDate), 'dd-MM-yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editValues.station || entry.station}
                              onValueChange={(value) => handleFieldChange('station', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {dropdownOptions?.stations?.map((station: string) => (
                                  <SelectItem key={station} value={station}>
                                    {station}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{entry.station || '-'}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.siding ?? entry.siding}
                              onChange={(e) => handleFieldChange('siding', e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            entry.siding || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editValues.commodity || entry.commodity}
                              onValueChange={(value) => handleFieldChange('commodity', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {dropdownOptions?.commodities?.map((commodity: string) => (
                                  <SelectItem key={commodity} value={commodity}>
                                    {commodity}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary">{entry.commodity || '-'}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editValues.type || entry.type}
                              onValueChange={(value) => handleFieldChange('type', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {dropdownOptions?.wagonTypes?.map((type: string) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            entry.type || '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.wagons ?? entry.wagons}
                              onChange={(e) => handleFieldChange('wagons', parseInt(e.target.value) || 0)}
                              className="w-full text-right"
                            />
                          ) : (
                            entry.wagons?.toLocaleString() || '0'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.units ?? entry.units}
                              onChange={(e) => handleFieldChange('units', parseInt(e.target.value) || 0)}
                              className="w-full text-right"
                            />
                          ) : (
                            entry.units?.toLocaleString() || '0'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editValues.tonnage ?? entry.tonnage}
                              onChange={(e) => handleFieldChange('tonnage', parseFloat(e.target.value) || 0)}
                              className="w-full text-right"
                            />
                          ) : (
                            entry.tonnage ? Number(entry.tonnage).toLocaleString() : '0'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editValues.freight ?? entry.freight}
                              onChange={(e) => handleFieldChange('freight', parseFloat(e.target.value) || 0)}
                              className="w-full text-right"
                            />
                          ) : (
                            `₹${entry.freight ? Number(entry.freight).toLocaleString() : '0'}`
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(entry.id)}
                                  disabled={updateMutation.isPending}
                                >
                                  <SaveIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(entry)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {entriesData?.totalPages || 1} • {entriesData?.totalRecords?.toLocaleString() || 0} total entries
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(entriesData?.totalPages || 1, p + 1))}
                disabled={page === (entriesData?.totalPages || 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
