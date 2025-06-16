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
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define interfaces for our data types
interface SheetDataRow {
  timestamp: string;
  'BD No': string;
  'Sl No': string | number;
  'Train Name': string | number;
  LOCO: string;
  Station: string;
  Status: string;
  Time: string;
  Remarks: string;
  FOISID: string;
  uid: string;
}

// Spreadsheet configuration
const DEFAULT_SPREADSHEET_ID = "1OuiQ3FEoNAtH10NllgLusxACjn2NU0yZUcHh68hLoI4";
const DEFAULT_RANGE = "Sheet1!A1:L";
const REFRESH_INTERVAL = 180000; // 3 minutes in milliseconds

export default function SheetsSearchPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [countdown, setCountdown] = useState(180); // 3 minutes in seconds
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Set up automatic refresh with visual indicator
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      setIsRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/sheets-search"] });
      setCountdown(180);
      setIsRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "The search results have been updated.",
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

  // Update the useQuery section
  const { data: searchResults = [], isLoading, error } = useQuery<SheetDataRow[]>({
    queryKey: ["/api/sheets-search", {
      query: debouncedQuery,
      spreadsheetId: DEFAULT_SPREADSHEET_ID,
      range: DEFAULT_RANGE
    }],
    onSuccess: (data) => {
      console.log("Sheets search response:", {
        dataLength: data?.length || 0,
        sampleData: data?.[0]
      });
    },
    onError: (err) => {
      console.error("Sheets search error:", err);
      toast({
        title: "Error",
        description: "Failed to fetch sheet data. Please try again.",
        variant: "destructive"
      });
    },
    select: (data) => {
      console.log("Raw sheet data:", data);
      if (!data || !Array.isArray(data)) {
        console.warn("Invalid data format received:", data);
        return [];
      }

      if (!debouncedQuery) return data;

      // Improved search algorithm
      const searchTerms = debouncedQuery.toLowerCase().split(' ').filter(Boolean);

      return data.filter(row => {
        // Convert all row values to searchable strings
        const rowValues = Object.values(row)
          .map(val => String(val || '').toLowerCase())
          .join(' ');

        // Check if ALL search terms are found in the row
        return searchTerms.every(term => {
          // Handle partial matches and common variations
          return rowValues.includes(term) ||
            // Handle number variations (with/without leading zeros)
            (term.match(/^\d+$/) && rowValues.includes(term.replace(/^0+/, ''))) ||
            // Handle common abbreviations
            (term === 'ld' && rowValues.includes('loaded')) ||
            (term === 'ey' && (rowValues.includes('empty') || rowValues.includes('n/e')));
        });
      });
    }
  });

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Search Railway Operations Data</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full">
                <RefreshCw className={`h-4 w-4 ${isRefreshing || countdown <= 30 ? 'animate-spin text-orange-500' : ''}`} />
                <span>Next sync in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="relative flex-1 min-w-[300px]">
                <Input
                  type="text"
                  placeholder="Search by any field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>BD No</TableHead>
                  <TableHead>Sl No</TableHead>
                  <TableHead>Train Name</TableHead>
                  <TableHead>LOCO</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>FOISID</TableHead>
                  <TableHead>UID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10">
                      <div className="flex justify-center items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : searchResults.length > 0 ? (
                  searchResults.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.timestamp || ''}</TableCell>
                      <TableCell>{row['BD No'] || ''}</TableCell>
                      <TableCell>{row['Sl No'] || ''}</TableCell>
                      <TableCell>{row['Train Name'] || ''}</TableCell>
                      <TableCell>{row.LOCO || ''}</TableCell>
                      <TableCell>{row.Station || ''}</TableCell>
                      <TableCell>{row.Status || ''}</TableCell>
                      <TableCell>{row.Time || ''}</TableCell>
                      <TableCell>{row.Remarks || ''}</TableCell>
                      <TableCell>{row.FOISID || ''}</TableCell>
                      <TableCell>{row.uid || ''}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10">
                      {debouncedQuery ? 'No matching results found' : 'No data available'}
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