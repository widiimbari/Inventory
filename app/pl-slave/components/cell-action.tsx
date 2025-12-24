"use client";

import { useState } from "react";
import { attachment2 } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Attachment2Form } from "./attachment2-form";

interface CellActionProps {
  data: attachment2;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const onDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/attachments2/${data.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete PL Slave.");
      }

      router.refresh();
      // TODO: Add a success toast notification
    } catch (error) {
      console.error(error);
      // TODO: Add an error toast notification
    } finally {
      setIsLoading(false);
      setIsAlertOpen(false);
    }
  };

  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit PL Slave {data.nomor}</DialogTitle>
          </DialogHeader>
          <Attachment2Form
            initialData={data}
            onSuccess={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete PL Slave{" "}
              <span className="font-semibold">{data.nomor}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            Edit PL Slave
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-500"
            onClick={() => setIsAlertOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
