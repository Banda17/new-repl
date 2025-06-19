import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, SearchIcon, DownloadIcon, EditIcon, SaveIcon, XIcon, FileTextIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

export default function AllEntriesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [stationFilter, setStationFilter] = useState("all");
  const [commodityFilter, setCommodityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("pDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<RailwayLoadingOperation>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all entries with pagination and filtering
  const { data: entriesData, isLoading } = useQuery({
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

  const handleExport = async (format: 'csv' | 'excel') => {
    const params = new URLSearchParams({
      search: searchTerm,
      station: stationFilter,
      commodity: commodityFilter,
      sortBy,
      sortOrder,
      format
    });
    
    const response = await fetch(`/api/railway-loading-operations/export?${params}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `railway-operations-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

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

  // PDF Export Function for All Entries
  const exportAllEntriesPDF = async () => {
    try {
      const response = await fetch(`/api/exports/all-entries-pdf?page=${page}&limit=${pageSize}`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `railway-entries-page-${page}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Export Successful",
        description: `Exported page ${page} railway entries to PDF.`,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const entries = entriesData?.data || [];
  const totalPages = entriesData?.totalPages || 1;
  const totalRecords = entriesData?.totalRecords || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">All Railway Loading Operations</h1>
          <p className="text-white/80">
            View and search through all railway loading operation entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAllEntriesPDF}>
            <FileTextIcon className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-lg bg-blue-900/10 border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white">Filters & Search</CardTitle>
          <CardDescription className="text-white/80">
            Filter and search through {totalRecords.toLocaleString()} total records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
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
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Operations Data</CardTitle>
          <CardDescription>
            Showing {entries.length} of {totalRecords.toLocaleString()} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                    <TableHead>RR No.</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: RailwayLoadingOperation) => {
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
                          {entry.rrNoFrom && entry.rrNoTo ? 
                            `${entry.rrNoFrom}-${entry.rrNoTo}` : '-'}
                        </TableCell>
                        <TableCell>{entry.state || '-'}</TableCell>
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
              Page {page} of {totalPages} • {totalRecords.toLocaleString()} total entries
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
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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