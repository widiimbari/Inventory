"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attachment } from "@prisma/client";

// Define the type for fetched masters
type AttachmentWithCounts = attachment & {
  total: number;
  tersedia: number;
};

const formSchema = z.object({
  nomor: z.string().min(1, "No Packing List Slave is required."),
  timestamp: z.date({
    message: "Tanggal is required.",
  }),
  tgl_order: z.date({
    message: "Tanggal Order is required.",
  }),
  area: z.string().min(1, "Area is required."),
  no_do: z.string().min(1, "No DO is required."),
  no_order: z.string().min(1, "No Order is required."),
});

interface Attachment2FormProps {
  onSuccess: () => void;
  initialData?: any; 
  preSelectedMaster?: AttachmentWithCounts | null;
}

export function Attachment2Form({ onSuccess, initialData, preSelectedMaster }: Attachment2FormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<AttachmentWithCounts | null>(preSelectedMaster || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomor: initialData?.nomor || "",
      area: initialData?.area || "", 
      no_do: initialData?.no_do || preSelectedMaster?.no_do || "",
      no_order: initialData?.no_order || preSelectedMaster?.no_order || "",
      timestamp: initialData?.timestamp ? new Date(initialData.timestamp) : undefined,
      tgl_order: initialData?.tgl_order ? new Date(initialData.tgl_order) : undefined,
    },
  });

  useEffect(() => {
    if (preSelectedMaster && !initialData) {
      setSelectedMaster(preSelectedMaster);
      // Only pre-fill DO and Order, let Area be user input
      form.setValue("no_do", preSelectedMaster.no_do);
      form.setValue("no_order", preSelectedMaster.no_order);
    }
  }, [preSelectedMaster, initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const slaveType = initialData ? initialData.type : selectedMaster?.type;
    
    if (!initialData && !slaveType) {
      alert("Error: Master PL Type not found. Please try closing this dialog and clicking 'Create Slave' again.");
      return;
    }

    try {
      setIsLoading(true);
      const url = initialData 
        ? `/api/attachments2/${initialData.id}` 
        : "/api/attachments2";
      
      const method = initialData ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          type: slaveType,
          timestamp: format(values.timestamp, "yyyy-MM-dd"),
          tgl_order: format(values.tgl_order, "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to create/update PL Slave.");
      }

      router.refresh();
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!initialData && selectedMaster && (
            <div className="p-3 bg-slate-100 rounded-md mb-4 border border-slate-200">
                <p className="text-sm font-semibold text-slate-800">Source Master: {selectedMaster.nomor}</p>
                <p className="text-xs text-slate-600">Type: {selectedMaster.type} | Available: {selectedMaster.tersedia}</p>
            </div>
        )}

        <div className="border-t pt-4 mt-4 grid grid-cols-1 gap-4">
            <FormField
            control={form.control}
            name="nomor"
            render={({ field }) => (
                <FormItem>
                <FormLabel>No PL Slave</FormLabel>
                <FormControl>
                    <Input placeholder="No PL Slave" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="space-y-4 border-t pt-4">
            <FormField
              control={form.control}
              name="no_do"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No DO</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter No DO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="no_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No Order</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter No Order" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Area" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="timestamp"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Tanggal</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
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
                        date < new Date("1900-01-01")
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
              name="tgl_order"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Order</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
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
                           date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : initialData ? "Update Slave Details" : "Create Slave (Input Items Later)"}
        </Button>
      </form>
    </Form>
  );
}
