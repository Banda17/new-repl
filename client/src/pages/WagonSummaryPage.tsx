import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the wagon types as shown in the image
const WAGON_TYPES = ['BOXN', 'JUMBO', 'STEEL', 'BTAP', 'BTPN', 'NMG', 'CONTAINER'] as const;

interface TrainEntry {
  slNo: number;
  trainName: string;
  type: string;
  ex: string;
  time: string;
  date: string;
  loco: string;
  location: string;
  status: string;
  timeStatus: string;
}

interface WagonCount {
  ld: number;
  ey: number;
}

export default function WagonSummaryPage() {
  const [trainEntries] = useState<TrainEntry[]>([
    // Mock data for the left table
    // Add more entries as needed
  ]);

  const [wagonCounts] = useState<Record<typeof WAGON_TYPES[number], WagonCount>>({
    BOXN: { ld: 0, ey: 0 },
    JUMBO: { ld: 0, ey: 0 },
    STEEL: { ld: 0, ey: 0 },
    BTAP: { ld: 0, ey: 0 },
    BTPN: { ld: 0, ey: 0 },
    NMG: { ld: 0, ey: 0 },
    CONTAINER: { ld: 0, ey: 0 },
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">DVD INTERCHANGE</h1>
        <p className="text-sm text-gray-500">
          updated at {format(new Date(), 'MM/dd/yy HH:mm')}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Left side - Train Details Table */}
        <div className="col-span-3">
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">SL.NO</TableHead>
                  <TableHead className="text-center">TRAIN NAME</TableHead>
                  <TableHead className="text-center">TYPE</TableHead>
                  <TableHead className="text-center">EX</TableHead>
                  <TableHead className="text-center">TIME</TableHead>
                  <TableHead className="text-center">DATE</TableHead>
                  <TableHead className="text-center">LOCO</TableHead>
                  <TableHead className="text-center">LOCATION</TableHead>
                  <TableHead className="text-center">STATUS</TableHead>
                  <TableHead className="text-center">TIME</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Add rows for 1-32 as shown in image */}
                {Array.from({ length: 32 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-center"></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right side - Wagon Summary */}
        <div className="col-span-2">
          {/* MIX Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">MIX</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">LD</TableHead>
                  <TableHead className="text-center">EY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {WAGON_TYPES.map((type) => (
                  <TableRow key={type}>
                    <TableCell>{type}</TableCell>
                    <TableCell className="text-center">{wagonCounts[type].ld}</TableCell>
                    <TableCell className="text-center">{wagonCounts[type].ey}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">
                    {Object.values(wagonCounts).reduce((sum, count) => sum + count.ld, 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    {Object.values(wagonCounts).reduce((sum, count) => sum + count.ey, 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* ON RUN Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">ON RUN</h2>
            <Table>
              <TableBody>
                {WAGON_TYPES.map((type) => (
                  <TableRow key={type}>
                    <TableCell>{type}</TableCell>
                    <TableCell className="text-center">0</TableCell>
                    <TableCell className="text-center">0</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">0</TableCell>
                  <TableCell className="text-center">0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Handed Over Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Handed Over</h2>
            <Table>
              <TableBody>
                {WAGON_TYPES.map((type) => (
                  <TableRow key={type}>
                    <TableCell>{type}</TableCell>
                    <TableCell className="text-center">0</TableCell>
                    <TableCell className="text-center">0</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">0</TableCell>
                  <TableCell className="text-center">0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* TOTAL Section */}
          <div>
            <h2 className="text-xl font-bold mb-2">TOTAL</h2>
            <Table>
              <TableBody>
                {WAGON_TYPES.map((type) => (
                  <TableRow key={type}>
                    <TableCell>{type}</TableCell>
                    <TableCell className="text-center">0</TableCell>
                    <TableCell className="text-center">0</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">0</TableCell>
                  <TableCell className="text-center">0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
