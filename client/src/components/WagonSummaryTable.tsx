import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WagonType = 'BOXN' | 'JUMBO' | 'STEEL' | 'BTAP' | 'BTPN' | 'NMG' | 'CONTAINER';
type StationType = 'DVD' | 'MAS' | 'GLT' | 'GNT' | 'SC';

interface WagonCount {
  ld: number;
  ey: number;
}

interface StationData {
  [key: string]: WagonCount;
}

const defaultWagonCount: WagonCount = { ld: 0, ey: 0 };

const WAGON_TYPES: WagonType[] = ['BOXN', 'JUMBO', 'STEEL', 'BTAP', 'BTPN', 'NMG', 'CONTAINER'];
const STATIONS: StationType[] = ['DVD', 'MAS', 'GLT', 'GNT', 'SC'];

interface WagonSummaryTableProps {
  data: Record<StationType, StationData>;
}

export function WagonSummaryTable({ data }: WagonSummaryTableProps) {
  const calculateTotals = (stationData: StationData) => {
    return WAGON_TYPES.reduce(
      (acc, wagonType) => {
        const count = stationData[wagonType] || defaultWagonCount;
        return {
          ld: acc.ld + count.ld,
          ey: acc.ey + count.ey,
        };
      },
      { ld: 0, ey: 0 }
    );
  };

  const renderWagonTable = (stationData: StationData) => (
    <div className="border rounded-lg mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Type</TableHead>
            <TableHead>LD</TableHead>
            <TableHead>EY</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {WAGON_TYPES.map((wagonType) => {
            const count = stationData[wagonType] || defaultWagonCount;
            return (
              <TableRow key={wagonType}>
                <TableCell className="font-medium">{wagonType}</TableCell>
                <TableCell>{count.ld}</TableCell>
                <TableCell>{count.ey}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-bold bg-muted/50">
            <TableCell>TOTAL</TableCell>
            <TableCell>{calculateTotals(stationData).ld}</TableCell>
            <TableCell>{calculateTotals(stationData).ey}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wagon Type Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="DVD" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {STATIONS.map((station) => (
              <TabsTrigger key={station} value={station}>
                {station}
              </TabsTrigger>
            ))}
          </TabsList>
          {STATIONS.map((station) => (
            <TabsContent key={station} value={station}>
              {renderWagonTable(data[station] || {})}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
