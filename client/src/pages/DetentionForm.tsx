import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInMinutes, parse } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Combobox } from "@/components/ui/combobox";

const detentionFormSchema = z.object({
  stationId: z.string().min(1, { message: "Station is required" }),
  rakeId: z.string().min(1, { message: "Rake ID is required" }),
  rakeName: z.string().min(1, { message: "Rake name is required" }),
  wagonType: z.string().min(1, { message: "Wagon type is required" }),
  operationType: z.enum(["loading", "unloading"], { required_error: "Operation type is required" }),
  requiresTXR: z.boolean().default(false),
  arrivalDateTime: z.string().min(1, { message: "Arrival date and time is required" }),
  placementDateTime: z.string().min(1, { message: "Placement date and time is required" }),
  releaseDateTime: z.string().min(1, { message: "Release date and time is required" }),
  departureDateTime: z.string().min(1, { message: "Departure date and time is required" }),
  arPlReason: z.string().optional(),
  plRlReason: z.string().optional(),
  rlDpReason: z.string().optional(),
  remarks: z.string().optional(),
});

type DetentionFormValues = z.infer<typeof detentionFormSchema>;

// Station data with full names
const stationData = [
  { value: "RNGK", label: "RNGK - KAKINADA NEW GOODS COMPLEX" },
  { value: "TDD", label: "TDD - TADEPALLIGUDEM" },
  { value: "BVM", label: "BVM - BAYYAVARAM" },
  { value: "BVL", label: "BVL - BIRKAVOLU" },
  { value: "DWP", label: "DWP - DWARAPUDI" },
  { value: "OGL", label: "OGL - ONGOLE" },
  { value: "PGH", label: "PGH - PADUGUPADU" },
  { value: "SLO", label: "SLO - SAMALKOT JN" },
  { value: "KCC", label: "KCC - KRISHNA CANAL" },
  { value: "EE", label: "EE - ELURU" },
  { value: "GDV", label: "GDV - GUDIVADA" },
  { value: "TEL", label: "TEL - TENALI" },
  { value: "NDD", label: "NDD - NIDADAVOLU" },
  { value: "PKO", label: "PKO - PALAKOLLU" },
  { value: "ANVT", label: "ANVT - ANIVIDU" },
  { value: "CLX", label: "CLX - CHIRALA" },
  { value: "RZD", label: "RZD - NUZIVID" },
  { value: "REG", label: "REG - REGUPALAM" },
  { value: "RJY", label: "RJY - RAJAHMUNDRY" },
  { value: "MTM", label: "MTM - MACHILIPATNAM" },
  { value: "RVK", label: "RVK - RAVIKAMPADU" },
  { value: "BVRM", label: "BVRM - BHIMAVARAM" },
  { value: "NDM", label: "NDM - NIDAMANURU" },
  { value: "RYP", label: "RYP - RAYAVARAM" },
  { value: "MBL", label: "MBL - MANUBOLU" },
  { value: "NGPM", label: "NGPM - NIDUGUNTAPALEM" },
  { value: "KVR", label: "KVR - KOVVUR" },
  { value: "SPDP", label: "SPDP - SINGARAYAKONDA" },
  { value: "SKM", label: "SKM - SINGARAYAKONDA" },
  // Adding new stations from the image
  { value: "BTTR", label: "BTTR - BITRAGUNTA" },
  { value: "PTPU", label: "PTPU - PITHAPURAM" },
  { value: "KPLV", label: "KPLV - KAPILESWARAPURAM" },
  { value: "MPU", label: "MPU - MANDAPAKA" },
  { value: "COA", label: "COA - COCOANADA PORT" },
  { value: "MNDB", label: "MNDB - MANDAVALLI" },
  { value: "VSKP", label: "VSKP - VISAKHAPATNAM" },
  { value: "VBWD", label: "VBWD - VISAKHAPATNAM WEST" },
  { value: "DVD", label: "DVD - DUVVADA" },
  { value: "PDT", label: "PDT - PENDURTI" },
  { value: "KTV", label: "KTV - KOTHAVALASA" },
  { value: "VZM", label: "VZM - VIZIANAGARAM" },
  { value: "SNM", label: "SNM - SRIKAKULAM" },
  { value: "CHE", label: "CHE - CHIPURUPALLI" },
  { value: "KMX", label: "KMX - KOMATIPALLI" },
  { value: "TIU", label: "TIU - TILARU" },
  { value: "NWP", label: "NWP - NAUPADA JN" },
  { value: "PVP", label: "PVP - PALASA" },
  { value: "MMS", label: "MMS - MANCHESWAR" },
  { value: "NRG", label: "NRG - NARSINGAPALLI" },
  { value: "VZP", label: "VZP - VIZIANAGARAM PORT" },
  { value: "GPI", label: "GPI - GARIVIDI" },
  { value: "KPL", label: "KPL - KANTAKAPALLI" },
  { value: "ALM", label: "ALM - ALAMANDA" },
  { value: "KUK", label: "KUK - KORUKONDA" },
  { value: "RGDA", label: "RGDA - RAYAGADA" },
  { value: "SPRD", label: "SPRD - SINGAPURAM ROAD" },
  { value: "THY", label: "THY - TILARU HALT" },
  { value: "GTLM", label: "GTLM - GOTLAM" },
  { value: "KNRT", label: "KNRT - KUNERU" },
  { value: "PVPT", label: "PVPT - PARVATHIPURAM" },
  { value: "GRBL", label: "GRBL - GARBHAM" },
  { value: "MKRD", label: "MKRD - MALAKANGIRI" },
  { value: "KRPU", label: "KRPU - KORAPUT" },
  { value: "BCHL", label: "BCHL - BACHELI" },
  { value: "KRDL", label: "KRDL - KIRANDUL" }
];

// Wagon types with descriptions
const wagonTypes = [
  "BCN",
  "BCNAHSM1",
  "BCVN",
  "BOXNHL",
  "BOXNHL25T",
  "BCNHL",
  "BOXNS",
  "BTCS",
  "BTPN",
  "BTLN",
  "BLC",
  "BTAP",
];

const reasons = [
  "No Demand",
  "Crew Shortage",
  "Maintenance",
  "Weather Conditions",
  "Other",
];

interface DetentionFormProps {
  initialValues?: DetentionFormValues;
  onSubmit?: (data: DetentionFormValues) => void;
}

// Function to format date for input field
const formatDateForInput = (date: Date) => {
  return format(date, "dd-MM-yyyy HH:mm");
};

// Function to parse date from input
const parseDateFromInput = (dateStr: string) => {
  return parse(dateStr, "dd-MM-yyyy HH:mm", new Date());
};

export default function DetentionForm({ initialValues, onSubmit }: DetentionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [durations, setDurations] = useState({
    arPlDuration: "",
    plRlDuration: "",
    rlDpDuration: "",
  });

  // Convert initialValues dates to the new format if they exist
  const formattedInitialValues = initialValues ? {
    ...initialValues,
    arrivalDateTime: initialValues.arrivalDateTime ? formatDateForInput(new Date(initialValues.arrivalDateTime)) : "",
    placementDateTime: initialValues.placementDateTime ? formatDateForInput(new Date(initialValues.placementDateTime)) : "",
    releaseDateTime: initialValues.releaseDateTime ? formatDateForInput(new Date(initialValues.releaseDateTime)) : "",
    departureDateTime: initialValues.departureDateTime ? formatDateForInput(new Date(initialValues.departureDateTime)) : "",
  } : undefined;

  const form = useForm<DetentionFormValues>({
    resolver: zodResolver(detentionFormSchema),
    defaultValues: formattedInitialValues || {
      stationId: "",
      rakeId: "",
      rakeName: "",
      wagonType: "",
      operationType: "loading",
      requiresTXR: false,
      arrivalDateTime: "",
      placementDateTime: "",
      releaseDateTime: "",
      departureDateTime: "",
      arPlReason: "",
      plRlReason: "",
      rlDpReason: "",
      remarks: "",
    },
  });

  const timingFields = useWatch({
    control: form.control,
    name: ["arrivalDateTime", "placementDateTime", "releaseDateTime", "departureDateTime"],
  });

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return "";
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "";
      }

      if (endDate < startDate) {
        return "Invalid time range";
      }

      const diffMinutes = differenceInMinutes(endDate, startDate);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Duration calculation error:', error);
      return "";
    }
  };

  useEffect(() => {
    const [arrival, placement, release, departure] = timingFields;

    try {
      setDurations({
        arPlDuration: calculateDuration(arrival, placement),
        plRlDuration: calculateDuration(placement, release),
        rlDpDuration: calculateDuration(release, departure),
      });
    } catch (error) {
      console.error('Error updating durations:', error);
      setDurations({
        arPlDuration: "",
        plRlDuration: "",
        rlDpDuration: "",
      });
    }
  }, [timingFields]);

  const submitMutation = useMutation({
    mutationFn: async (data: DetentionFormValues) => {
      const response = await fetch("/api/detentions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit detention data");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Detention data saved successfully",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DetentionFormValues) => {
    setLoading(true);
    if (onSubmit) {
      onSubmit(data);
    } else {
      submitMutation.mutate(data);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Terminal Detention Data Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="stationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Station</FormLabel>
                      <FormControl>
                        <Combobox
                          options={stationData}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Search station..."
                          emptyText="No station found."
                        />
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
                  name="wagonType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wagon Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select wagon type" />
                          </SelectTrigger>
                          <SelectContent>
                            {wagonTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="operationType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Operation Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="loading" id="loading" />
                            <label htmlFor="loading">Loading</label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="unloading" id="unloading" />
                            <label htmlFor="unloading">Unloading</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresTXR"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Requires TXR
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-full grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Arrival to Placement Duration</p>
                    <p className="text-lg font-bold">{durations.arPlDuration || "---"}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Placement to Release Duration</p>
                    <p className="text-lg font-bold">{durations.plRlDuration || "---"}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Release to Departure Duration</p>
                    <p className="text-lg font-bold">{durations.rlDpDuration || "---"}</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="arrivalDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          placeholder="DD-MM-YYYY HH:mm"
                          pattern="\d{2}-\d{2}-\d{4} \d{2}:\d{2}"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placementDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placement Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          placeholder="DD-MM-YYYY HH:mm"
                          pattern="\d{2}-\d{2}-\d{4} \d{2}:\d{2}"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="releaseDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          placeholder="DD-MM-YYYY HH:mm"
                          pattern="\d{2}-\d{2}-\d{4} \d{2}:\d{2}"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departureDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          placeholder="DD-MM-YYYY HH:mm"
                          pattern="\d{2}-\d{2}-\d{4} \d{2}:\d{2}"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="arPlReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AR-PL Reason</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plRlReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PL-RL Reason</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rlDpReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RL-DP Reason</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}