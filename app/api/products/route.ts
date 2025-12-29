import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const startSerial = searchParams.get("startSerial");
    const endSerial = searchParams.get("endSerial");
    const searchScope = searchParams.get("searchScope") || "serial"; // Default to serial
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    const skip = (page - 1) * limit;

    // --- RAW SQL OPTIMIZED SEARCH ---
    
    const whereConditions: Prisma.Sql[] = [];
    let joinClause = Prisma.sql``;

    // 1. Type Filter
    if (type && type !== "all") {
        whereConditions.push(Prisma.sql`p.type = ${type}`);
    }

    // 2. Date Filter
    if (startDate && endDate) {
        whereConditions.push(Prisma.sql`p.timestamp >= ${new Date(startDate)} AND p.timestamp <= ${new Date(endDate)}`);
    }

    // 3. Search Scope Logic
    if (startSerial) {
        const isRange = !!endSerial;

        if (searchScope === "serial") {
            if (isRange) {
                whereConditions.push(Prisma.sql`p.serial >= ${startSerial} AND p.serial <= ${endSerial}`);
            } else {
                // AUTO DETECT OPTIMIZATION
                const [productMatch, moduleMatch, boxMatch, palletMatch] = await Promise.all([
                    db.product.findFirst({ where: { serial: { startsWith: startSerial } }, select: { id: true } }),
                    db.product.findFirst({ where: { module_serial: { startsWith: startSerial } }, select: { id: true } }),
                    db.box.findFirst({ where: { serial: { startsWith: startSerial } }, select: { id: true } }),
                    db.pallete.findFirst({ where: { serial: { startsWith: startSerial } }, select: { id: true } })
                ]);

                const orConditions: Prisma.Sql[] = [];
                
                if (productMatch) orConditions.push(Prisma.sql`p.serial LIKE ${`${startSerial}%`}`);
                if (moduleMatch) orConditions.push(Prisma.sql`p.module_serial LIKE ${`${startSerial}%`}`);
                if (boxMatch) orConditions.push(Prisma.sql`b.serial LIKE ${`${startSerial}%`}`);
                if (palletMatch) orConditions.push(Prisma.sql`pal.serial LIKE ${`${startSerial}%`}`);

                if (orConditions.length > 0) {
                    whereConditions.push(Prisma.sql`(${Prisma.join(orConditions, ' OR ')})`);
                    
                    if (palletMatch) {
                         joinClause = Prisma.sql`LEFT JOIN box b ON p.box_id = b.id LEFT JOIN pallete pal ON b.pallete_id = pal.id`;
                    } else if (boxMatch) {
                         joinClause = Prisma.sql`LEFT JOIN box b ON p.box_id = b.id`;
                    }
                } else {
                    whereConditions.push(Prisma.sql`1=0`);
                }
            }
        } 
        else if (searchScope === "module_serial") {
            if (isRange) {
                whereConditions.push(Prisma.sql`p.module_serial >= ${startSerial} AND p.module_serial <= ${endSerial}`);
            } else {
                whereConditions.push(Prisma.sql`p.module_serial LIKE ${`${startSerial}%`}`);
            }
        }
        else if (searchScope === "box") {
            joinClause = Prisma.sql`JOIN box b ON p.box_id = b.id`;
            if (isRange) {
                whereConditions.push(Prisma.sql`b.serial >= ${startSerial} AND b.serial <= ${endSerial}`);
            } else {
                whereConditions.push(Prisma.sql`b.serial LIKE ${`${startSerial}%`}`);
            }
        }
        else if (searchScope === "pallet") {
            joinClause = Prisma.sql`JOIN box b ON p.box_id = b.id JOIN pallete pal ON b.pallete_id = pal.id`;
            if (isRange) {
                whereConditions.push(Prisma.sql`pal.serial >= ${startSerial} AND pal.serial <= ${endSerial}`);
            } else {
                whereConditions.push(Prisma.sql`pal.serial LIKE ${`${startSerial}%`}`);
            }
        }
    }

    const whereClause = whereConditions.length > 0 
        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}` 
        : Prisma.sql``;

    // 4. Optimize Sorting for Range Queries
    let orderByClause = Prisma.sql`ORDER BY p.timestamp DESC`;

    if (startSerial && endSerial) {
        if (searchScope === "serial") {
             orderByClause = Prisma.sql`ORDER BY p.serial ASC`;
        } else if (searchScope === "module_serial") {
             orderByClause = Prisma.sql`ORDER BY p.module_serial ASC`;
        } else if (searchScope === "box") {
             orderByClause = Prisma.sql`ORDER BY b.serial ASC, p.id ASC`;
        } else if (searchScope === "pallet") {
             orderByClause = Prisma.sql`ORDER BY pal.serial ASC, p.id ASC`;
        }
    }

    const countQuery = Prisma.sql`
        SELECT COUNT(p.id) as total 
        FROM product p 
        ${joinClause} 
        ${whereClause}
    `;
    
    // 5. Execute ID Fetch Query (Keyset Pagination)
    const idsQuery = Prisma.sql`
        SELECT p.id 
        FROM product p 
        ${joinClause} 
        ${whereClause}
        ${orderByClause}
        LIMIT ${limit} OFFSET ${skip}
    `;

    const [totalResult, idsResult] = await Promise.all([
        db.$queryRaw(countQuery) as Promise<{ total: bigint }[]>,
        db.$queryRaw(idsQuery) as Promise<{ id: number }[]>
    ]);

    const total = Number(totalResult[0]?.total || 0);
    const ids = idsResult.map(row => row.id);

    // 6. Fetch Full Data for these IDs
    // If no IDs found, return empty early
    if (ids.length === 0) {
        return NextResponse.json({
            data: [],
            metadata: {
                total: 0,
                page,
                limit,
                totalPages: 0,
            },
            type: 'product'
        });
    }

    const products = await db.product.findMany({
        where: { id: { in: ids } },
        orderBy: { timestamp: "desc" },
    });

    // --- MANUAL JOIN (EXISTING LOGIC) ---
    const boxIds = products.map(p => p.box_id).filter((id): id is number => id !== null);
    const attIds = products.map(p => p.attachment_id).filter((id): id is number => id !== null);
    const att2Ids = products.map(p => p.attachment2_id).filter((id): id is number => id !== null);
    
    let boxes: any[] = [];
    if (boxIds.length > 0) {
        boxes = await db.box.findMany({
            where: { id: { in: boxIds } }
        });
    }

    const palletIds = boxes.map(b => b.pallete_id).filter((id): id is number => id !== null);
    let pallets: any[] = [];
    if (palletIds.length > 0) {
        pallets = await db.pallete.findMany({
            where: { id: { in: palletIds } }
        });
    }

    let attachments: any[] = [];
    if (attIds.length > 0) {
        attachments = await db.attachment.findMany({
            where: { id: { in: attIds } },
            select: { id: true, nomor: true }
        });
    }

    let attachment2s: any[] = [];
    if (att2Ids.length > 0) {
        attachment2s = await db.attachment2.findMany({
            where: { id: { in: att2Ids } },
             select: { id: true, nomor: true, area: true } 
        });
    }

    const flatData = products.map(p => {
        const box = boxes.find(b => b.id === p.box_id);
        const pallet = box ? pallets.find(pal => pal.id === box.pallete_id) : null;
        const att = p.attachment_id ? attachments.find(a => a.id === p.attachment_id) : null;
        const att2 = p.attachment2_id ? attachment2s.find(a => a.id === p.attachment2_id) : null;

        return {
            ...p,
            box_serial: box ? box.serial : '-',
            pallet_serial: pallet ? pallet.serial : '-',
            attachment_nomor: att ? att.nomor : '-',
            attachment2_nomor: att2 ? att2.nomor : '-',
            area: att2 ? att2.area : '-', 
            status: p.attachment2_id ? 'Delivery' : 'Warehouse'
        };
    });

    return NextResponse.json({
      data: flatData,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      type: 'product'
    });
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}