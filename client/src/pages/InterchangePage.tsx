import { useState, useEffect } from "react";
import { format, parse, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

// Types
type BaseWagonType = 'BOXN' | 'JUMBO' | 'STEEL' | 'NMG' | 'CONTAINER';
type LoadStatus = 'L' | 'E';
type FormattedType = 'N/L' | 'N/E' | 'J/L' | 'J/E' | 'S/L' | 'S/E' | 'NMG/L' | 'NMG/E' | 'C/S' | 'MIX';
type Station = 
  | 'DVG'  // Davangere
  | 'MAS'  // Chennai Central
  | 'GTL'  // Guntakal
  | 'SC'   // Secunderabad
  | 'GNT'; // Guntur

interface RawData {
  timestamp: string;
  'Train Name': string;
  LOCO: string;
  Station: string;
  Status: string;
  Time: string;
  uid: string;
}

interface TrainEntry {
  slNo: number;
  uid: string;
  trainName: string;
  type: string;
  ex: string;
  time: string;
  date: string;
  loco: string;
  location: string;
  status: string;
}

// Constants
const INITIAL_WAGON_COUNTS = {
  BOXN: { ld: 0, ey: 0 },
  JUMBO: { ld: 0, ey: 0 },
  STEEL: { ld: 0, ey: 0 },
  NMG: { ld: 0, ey: 0 },
  CONTAINER: { ld: 0, ey: 0 }
};

const SPREADSHEET_ID = "1OuiQ3FEoNAtH10NllgLusxACjn2NU0yZUcHh68hLoI4";
const RANGE = "Sheet1!A2:K";

// Station names mapping for display
const STATION_NAMES: Record<Station, string> = {
  DVG: "Davangere",
  MAS: "Chennai Central",
  GTL: "Guntakal",
  SC: "Secunderabad",
  GNT: "Guntur"
};

export default function InterchangePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStation, setSelectedStation] = useState<Station>('SC'); // Default to Secunderabad
  const [localChanges, setLocalChanges] = useState<Record<number, Partial<TrainEntry>>>({});
  const [countdown, setCountdown] = useState(30);

  // Query to fetch shared interchange data
  const { data: stationData } = useQuery({
    queryKey: ['interchange-data', selectedStation],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/interchange/${selectedStation}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch interchange data');
        return response.json();
      } catch (error) {
        console.error('[InterchangePage] Error fetching interchange data:', error);
        return { trainEntries: {}, wagonCounts: { ...INITIAL_WAGON_COUNTS } };
      }
    },
    refetchInterval: 30000
  });

  // Fetch raw sheet data
  const { data: rawData } = useQuery<{ values: RawData[] }>({
    queryKey: ["/api/sheets-search", { spreadsheetId: SPREADSHEET_ID, range: RANGE }],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/sheets-search?${new URLSearchParams({
          spreadsheetId: SPREADSHEET_ID,
          range: RANGE
        })}`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch sheet data');
        const data = await response.json();
        return { values: Array.isArray(data) ? data : [] };
      } catch (error) {
        console.error('[InterchangePage] Error fetching sheet data:', error);
        return { values: [] };
      }
    }
  });

  // Mutation to update shared interchange data
  const updateInterchangeMutation = useMutation({
    mutationFn: async (newData: { trainEntries: Record<number, TrainEntry> }) => {
      const response = await fetch(`/api/interchange/${selectedStation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newData),
      });

      if (!response.ok) throw new Error('Failed to update interchange data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interchange-data', selectedStation] });
      toast({
        title: "Success",
        description: "Interchange data updated successfully",
      });
    }
  });

  const trainEntries = stationData?.trainEntries || {};

  const handleLocalUidChange = (slNo: number, uid: string) => {
    setLocalChanges(prev => ({
      ...prev,
      [slNo]: { ...prev[slNo], uid: uid.trim() }
    }));
  };

  const handleSubmitChanges = async (slNo: number) => {
    if (!rawData?.values) {
      toast({
        title: "Error",
        description: "No sheet data available",
        variant: "destructive",
      });
      return;
    }

    const changes = localChanges[slNo];
    if (!changes) return;

    try {
      const cleanUid = changes.uid?.trim() || '';
      const existingEntry = trainEntries[slNo];
      const newData = { trainEntries: { ...trainEntries } };

      // Default empty entry
      const emptyEntry: TrainEntry = {
        slNo,
        uid: '',
        trainName: '',
        type: existingEntry?.type || '',
        ex: '',
        time: '',
        date: format(new Date(), 'dd/MM/yy'),
        loco: '',
        location: '',
        status: '',
      };

      if (!cleanUid) {
        newData.trainEntries[slNo] = emptyEntry;
      } else {
        const matchingRawData = rawData.values.find(row => 
          row.uid?.toString().trim() === cleanUid
        );

        if (matchingRawData) {
          let formattedDate = format(new Date(), 'dd/MM/yy');
          if (matchingRawData.timestamp) {
            try {
              const parsedDate = parse(matchingRawData.timestamp, 'dd-MM-yy HH:mm', new Date());
              if (isValid(parsedDate)) {
                formattedDate = format(parsedDate, 'dd/MM/yy');
              }
            } catch (error) {
              console.error('[InterchangePage] Error parsing date:', error);
            }
          }

          newData.trainEntries[slNo] = {
            slNo,
            uid: cleanUid,
            trainName: matchingRawData['Train Name']?.toString() || '',
            type: existingEntry?.type || '',
            ex: matchingRawData.Station?.toString() || '',
            time: matchingRawData.Time?.toString() || '',
            date: formattedDate,
            loco: matchingRawData.LOCO?.toString() || '',
            location: matchingRawData.Station?.toString() || '',
            status: matchingRawData.Status?.toString() || ''
          };

          toast({
            title: "Success",
            description: `Data populated for UID: ${cleanUid}`,
          });
        } else {
          newData.trainEntries[slNo] = { ...emptyEntry, uid: cleanUid };
          toast({
            title: "No Data Found",
            description: `No matching data for UID: ${cleanUid}`,
            variant: "destructive",
          });
        }
      }

      await updateInterchangeMutation.mutateAsync(newData);
      setLocalChanges(prev => {
        const next = { ...prev };
        delete next[slNo];
        return next;
      });
    } catch (error) {
      console.error('[InterchangePage] Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['interchange-data', selectedStation] });
      queryClient.invalidateQueries({ queryKey: ["/api/sheets-search"] });
      setCountdown(30);
    }, 30000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [queryClient, selectedStation]);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
      <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-lg shadow-sm p-3 sm:p-4 gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
            RAILWAY INTERCHANGE
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground bg-primary/5 px-3 py-1 rounded-full">
              <RefreshCw className={`h-4 w-4 ${countdown <= 10 ? 'animate-spin text-orange-500' : ''}`} />
              <span>Next sync: {countdown}s</span>
            </div>
          </div>
        </div>

        <Tabs value={selectedStation} onValueChange={(v) => setSelectedStation(v as Station)}>
          <TabsList className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 w-full bg-card gap-0.5 sm:gap-1 p-0.5 sm:p-1">
            {Object.keys(STATION_NAMES).map((station) => (
              <TabsTrigger
                key={station}
                value={station}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm whitespace-nowrap"
                title={STATION_NAMES[station as Station]}
              >
                {station}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedStation} className="mt-6">
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL.NO</TableHead>
                    <TableHead>UID</TableHead>
                    <TableHead>Train Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>EX</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Loco</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 32 }, (_, i) => {
                    const slNo = i + 1;
                    const entry = trainEntries[slNo];
                    return (
                      <TableRow key={i}>
                        <TableCell>{slNo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              value={localChanges[slNo]?.uid ?? entry?.uid ?? ''}
                              onChange={(e) => handleLocalUidChange(slNo, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSubmitChanges(slNo);
                                }
                              }}
                              placeholder="Enter UID..."
                            />
                            {localChanges[slNo]?.uid !== undefined && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSubmitChanges(slNo)}
                              >
                                ✓
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{entry?.trainName || ''}</TableCell>
                        <TableCell>{entry?.type || ''}</TableCell>
                        <TableCell>{entry?.ex || ''}</TableCell>
                        <TableCell>{entry?.time || ''}</TableCell>
                        <TableCell>{entry?.date || ''}</TableCell>
                        <TableCell>{entry?.loco || ''}</TableCell>
                        <TableCell>{entry?.location || ''}</TableCell>
                        <TableCell>{entry?.status || ''}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function parseLoadStatus(status: string): LoadStatus | null {
  if (status.toUpperCase().includes('L')) return 'L';
  if (status.toUpperCase().includes('E')) return 'E';
  return null;
}

const normalizeWagonType = (typeString: string): { baseType: BaseWagonType | null; isLoaded: boolean | null } => {
  if (!typeString) return { baseType: null, isLoaded: null };

  const [typeCode, loadStatus] = typeString.split('/').map(p => p?.trim().toUpperCase() ?? '');
  if (!typeCode || !loadStatus) return { baseType: null, isLoaded: null };

  // Special case for Container and Mix types
  if (typeCode === 'C' || typeCode === 'CONTAINER') {
    return { baseType: 'CONTAINER', isLoaded: true }; // Containers always count as loaded
  }

  // Normalize type code to base type - strict matching
  let baseType: BaseWagonType | null = null;
  switch (typeCode) {
    case 'N':
    case 'BOXN':
      baseType = 'BOXN';
      break;
    case 'J':
    case 'JUMBO':
      baseType = 'JUMBO';
      break;
    case 'S':
    case 'STEEL':
      baseType = 'STEEL';
      break;
    case 'NMG':
      baseType = 'NMG';
      break;
    default:
      return { baseType: null, isLoaded: null };
  }

  // Parse load status - strict matching
  if (loadStatus === 'L') return { baseType, isLoaded: true };
  if (loadStatus === 'E') return { baseType, isLoaded: false };
  return { baseType: null, isLoaded: null };
};