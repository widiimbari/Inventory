import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const boxId = Number(idStr);
    if (isNaN(boxId)) {
      return new NextResponse("Invalid Box ID", { status: 400 });
    }

    // Use a transaction to ensure both operations succeed or fail together
    await db.$transaction(async (prisma) => {
      // 1. Unassign all products from this box
      await prisma.product.updateMany({
        where: {
          box_id: boxId,
        },
        data: {
          box_id: null,
        },
      });

      // 2. Delete the box itself
      await prisma.box.delete({
        where: {
          id: boxId,
        },
      });
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error: any) {
    // Prisma's P2025 error code means "Record to delete not found."
    if (error.code === "P2025") {
      return new NextResponse("Box not found", { status: 404 });
    }
    console.error("[DELETE_BOX]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
