import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const serial = searchParams.get("serial");

    if (!serial) {
      return NextResponse.json({ types: [] });
    }

    const [productMatch, moduleMatch, boxMatch, palletMatch] = await Promise.all([
        db.product.findFirst({ where: { serial: { startsWith: serial } }, select: { id: true } }),
        db.product.findFirst({ where: { module_serial: { startsWith: serial } }, select: { id: true } }),
        db.box.findFirst({ where: { serial: { startsWith: serial } }, select: { id: true } }),
        db.pallete.findFirst({ where: { serial: { startsWith: serial } }, select: { id: true } })
    ]);

    const types: string[] = [];
    if (productMatch) types.push("serial");
    if (moduleMatch) types.push("module_serial");
    if (boxMatch) types.push("box");
    if (palletMatch) types.push("pallet");

    return NextResponse.json({ types });
  } catch (error) {
    console.error("[DETECT_TYPE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
