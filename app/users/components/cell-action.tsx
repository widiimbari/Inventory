"use client";

import { useState } from "react";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "@/components/ui/alert-modal"; // Need to check if this exists or create it
import { UserForm } from "./user-form"; 

interface CellActionProps {
  data: any;
  onSuccess: () => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // For Alert Modal
  const [editOpen, setEditOpen] = useState(false); // For Edit Dialog

  const onConfirm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${data.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <UserForm 
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={data}
        onSuccess={onSuccess}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
