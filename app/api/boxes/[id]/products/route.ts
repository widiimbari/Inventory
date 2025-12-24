import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const boxId = Number(idStr);
    if (isNaN(boxId)) {
      return new NextResponse("Invalid Box ID", { status: 400 });
    }

    const products = await db.product.findMany({
      where: {
        box_id: boxId,
      },
      select: {
        id: true,
        serial: true,
        type: true,
        orderno: true,
        line: true,
        timestamp: true,
      },
    });

    if (products.length === 0) {
      return new NextResponse("No products found for this box", { status: 404 });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("[GET_PRODUCTS_BY_BOX]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
