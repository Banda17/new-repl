import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const loadingFormSchema = z.object({
  pDate: z.date({
    required_error: "Date is required",
  }),
  station: z.string().min(1, "Station is required"),
  siding: z.string().min(1, "SIDING is required"),
  imported: z.string().min(1, "Imported field is required"),
  commodity: z.string().min(1, "Commodity is required"),
  commType: z.string().min(1, "COMM TYPE is required"),
  commCg: z.string().min(1, "COMM CG is required"),
  demand: z.string().min(1, "Demand is required"),
  state: z.string().min(1, "State is required"),
  rly: z.string().min(1, "RLY is required"),
  wagons: z.number().min(0, "Wagons must be 0 or greater"),
  type: z.string().min(1, "Wagon type is required"),
  units: z.number().min(0, "Units must be 0 or greater"),
  loadingType: z.string().min(1, "Loading type is required"),
  rrNoFrom: z.number().min(0, "RR NO FROM is required"),
  rrNoTo: z.number().min(0, "RR NO TO is required"),
  rrDate: z.date({
    required_error: "RR Date is required",
  }),
  tonnage: z.number().min(0, "Tonnage must be 0 or greater"),
  freight: z.number().min(0, "Freight must be 0 or greater"),
  tIndents: z.number().min(0, "T_INDENTS must be 0 or greater"),
  osIndents: z.number().min(0, "OS_INDENTS must be 0 or greater"),
});

type LoadingFormValues = z.infer<typeof loadingFormSchema>;

// These will be fetched from database

export default function LoadingFormPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dropdown options from database
  const { data: dropdownOptions } = useQuery({
    queryKey: ["/api/railway-loading-operations/dropdown-options"],
    queryFn: async () => {
      const response = await fetch("/api/railway-loading-operations/dropdown-options");
      if (!response.ok) {
        throw new Error("Failed to fetch dropdown options");
      }
      return response.json();
    },
  });

  const form = useForm<LoadingFormValues>({
    resolver: zodResolver(loadingFormSchema),
    defaultValues: {
      wagons: 0,
      units: 105,
      tonnage: 0,
      freight: 0,
      tIndents: 0,
      osIndents: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LoadingFormValues) => {
      const response = await fetch("/api/railway-loading-operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          pDate: data.pDate.toISOString(),
          rrDate: data.rrDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create loading record");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loading record created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/railway-loading-operations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoadingFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="bg-blue-200 border-b border-blue-300">
          <CardTitle className="text-xl font-bold text-center text-blue-900 p-2">
            LOADING F
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-blue-50 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="font-semibold text-gray-700">DATE</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="station"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>STATION</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select station" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.stations || []).map((station: string) => (
                              <SelectItem key={station} value={station}>
                                {station}
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
                    name="siding"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SIDING</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imported"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMPORTED</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commodity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COMMODITY</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select commodity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.commodities || []).map((commodity: string) => (
                              <SelectItem key={commodity} value={commodity}>
                                {commodity}
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
                    name="commType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COMM TYPE</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.commTypes || []).map((type: string) => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                    name="commCg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COMM CG</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select CG" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.commCgs || []).map((cg: string) => (
                              <SelectItem key={cg} value={cg}>
                                {cg}
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
                    name="demand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DEMAND</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>STATE</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.states || []).map((state: string) => (
                              <SelectItem key={state} value={state}>
                                {state}
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
                    name="rly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RLY</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select railway" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.railways || []).map((rly: string) => (
                              <SelectItem key={rly} value={rly}>
                                {rly}
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
                    name="wagons"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WAGONS:</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WAGON TYPE</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.wagonTypes || []).map((type: string) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UNITS</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loadingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LOADING TYPE</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.loadingTypes || []).map((type: string) => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                    name="rrNoFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RR NO FROM</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rrNoTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RR NO TO</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rrDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>RR DATE</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tonnage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TONNAGE</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="freight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FREIGHT</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tIndents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>T_INDENTS</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="osIndents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OS_INDENTS</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-center space-x-4 pt-6">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-8"
                >
                  {createMutation.isPending ? "Saving..." : "Save Record"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  className="px-8"
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}