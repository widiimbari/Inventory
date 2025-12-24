import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

// --- Helper Types ---
type ExportColumn = { header: string; key: string; width: number };

export async function GET(req: Request) {
  try {
    // 1. Parse Search Parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const groupBy = searchParams.get("groupBy");

    // 2. Prepare Filters
    const productWhere: Prisma.productWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { serial: { contains: search } },
                { type: { contains: search } },
                { orderno: { contains: search } },
              ],
            }
          : {},
        type && type !== "all" ? { type: { equals: type } } : {},
        startDate && endDate
          ? {
              timestamp: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {},
      ],
    };

    // 3. Fetch Data Logic
    let exportData: any[] = [];
    let title = "PRODUCTS REPORT"; // Default Title
    let columns: ExportColumn[] = [];

    // --- LOGIC: GROUP BY BOX ---
    if (groupBy === "box") {
      title = "BOX GROUP REPORT";
      let matchingBoxIds: number[] = [];
      const hasProductFilters = search || (type && type !== "all") || (startDate && endDate);

      if (hasProductFilters) {
        const products = await db.product.findMany({
          where: productWhere,
          select: { box_id: true },
          distinct: ["box_id"],
        });
        matchingBoxIds = products.map((p) => p.box_id).filter((id): id is number => id !== null);
      }

      let finalBoxWhere: Prisma.boxWhereInput = {};
      if (search) {
        finalBoxWhere = {
          OR: [{ serial: { contains: search } }, { id: { in: matchingBoxIds } }],
        };
      } else if (hasProductFilters) {
        finalBoxWhere = { id: { in: matchingBoxIds } };
      }

      const boxes = await db.box.findMany({
        where: finalBoxWhere,
        orderBy: { timestamp: "desc" },
      });

      // Manual fetching of related data
      const pIds = boxes.map(b => b.pallete_id).filter((id): id is number => id !== null);
      let pallets: any[] = [];
      if (pIds.length > 0) {
          pallets = await db.pallete.findMany({
              where: { id: { in: pIds } },
              select: { id: true, serial: true }
          });
      }

      // Manual counting of products per box
      const boxIdsForCounting = boxes.map(b => b.id);
      const counts = await db.product.groupBy({
          by: ['box_id'],
          where: { box_id: { in: boxIdsForCounting } },
          _count: { _all: true }
      });

      exportData = boxes.map((b) => {
        const pallet = pallets.find(p => p.id === b.pallete_id);
        const countObj = counts.find(c => c.box_id === b.id);
        return {
          serial: b.serial,
          pallet_serial: pallet?.serial || "-",
          type: b.type,
          count: countObj?._count._all || 0,
          line: b.line,
          timestamp: b.timestamp,
        };
      });

      columns = [
        { header: "Box Serial", key: "serial", width: 25 },
        { header: "Pallet Serial", key: "pallet_serial", width: 25 },
        { header: "Type", key: "type", width: 15 },
        { header: "Qty", key: "count", width: 10 },
        { header: "Line", key: "line", width: 10 },
        { header: "Last Update", key: "timestamp", width: 20 },
      ];
    } 
    // --- LOGIC: GROUP BY PALLET ---
    else if (groupBy === "pallet") {
      title = "PALLET GROUP REPORT";
      let matchingPalletIds: number[] = [];
      const hasProductFilters = search || (type && type !== "all") || (startDate && endDate);

      if (hasProductFilters) {
        const products = await db.product.findMany({
          where: productWhere,
          select: { box_id: true },
          distinct: ["box_id"],
        });
        const pBoxIds = products.map((p) => p.box_id).filter((id): id is number => id !== null);
        
        if (pBoxIds.length > 0) {
          const boxes = await db.box.findMany({
            where: { id: { in: pBoxIds } },
            select: { pallete_id: true },
            distinct: ["pallete_id"],
          });
          matchingPalletIds = boxes.map((b) => b.pallete_id).filter((id): id is number => id !== null);
        }
      }

      let finalPalletWhere: Prisma.palleteWhereInput = {};
      if (search) {
        finalPalletWhere = {
          OR: [{ serial: { contains: search } }, { id: { in: matchingPalletIds } }],
        };
      } else if (hasProductFilters) {
        finalPalletWhere = { id: { in: matchingPalletIds } };
      }

      const pallets = await db.pallete.findMany({
        where: finalPalletWhere,
        orderBy: { timestamp: "desc" },
      });

      // Manual counting of boxes per pallet
      const palIdsForCounting = pallets.map(p => p.id);
      const boxCounts = await db.box.groupBy({
          by: ['pallete_id'],
          where: { pallete_id: { in: palIdsForCounting } },
          _count: { _all: true }
      });

      exportData = pallets.map((p) => {
        const bCountObj = boxCounts.find(bc => bc.pallete_id === p.id);
        return {
          serial: p.serial,
          type: p.type,
          count: bCountObj?._count._all || 0,
          line: p.line,
          timestamp: p.timestamp,
        };
      });

      columns = [
        { header: "Pallet Serial", key: "serial", width: 25 },
        { header: "Type", key: "type", width: 15 },
        { header: "Total Boxes", key: "count", width: 15 },
        { header: "Line", key: "line", width: 10 },
        { header: "Last Update", key: "timestamp", width: 20 },
      ];
    } 
    // --- LOGIC: ALL PRODUCTS (DEFAULT) ---
    else {
      title = "PRODUCTS REPORT";
      const products = await db.product.findMany({
        where: productWhere,
        take: 10000, // Limit for performance safety
        orderBy: { timestamp: "desc" },
      });

      // Manual relation fetching for better performance than deep nested includes on large datasets
      const boxIds = products.map((p) => p.box_id).filter((id): id is number => id !== null);
      let boxes: any[] = [];
      if (boxIds.length > 0) {
        boxes = await db.box.findMany({
          where: { id: { in: boxIds } },
          select: { id: true, serial: true, pallete_id: true },
        });
      }

      const palletIds = boxes.map((b) => b.pallete_id).filter((id): id is number => id !== null);
      let pallets: any[] = [];
      if (palletIds.length > 0) {
        pallets = await db.pallete.findMany({
          where: { id: { in: palletIds } },
          select: { id: true, serial: true },
        });
      }

      exportData = products.map((p) => {
        const box = boxes.find((b) => b.id === p.box_id);
        const pallet = box ? pallets.find((pal) => pal.id === box.pallete_id) : null;
        return {
          serial: p.serial,
          type: p.type,
          orderno: p.orderno,
          box_serial: box ? box.serial : "-",
          pallet_serial: pallet ? pallet.serial : "-",
          line: p.line,
          timestamp: p.timestamp,
        };
      });

      columns = [
        { header: "Serial Number", key: "serial", width: 25 },
        { header: "Type", key: "type", width: 15 },
        { header: "Order No", key: "orderno", width: 20 },
        { header: "Box Serial", key: "box_serial", width: 25 },
        { header: "Pallet Serial", key: "pallet_serial", width: 25 },
        { header: "Line", key: "line", width: 10 },
        { header: "Production Date", key: "timestamp", width: 20 },
      ];
    }

    // ==========================================
    // 4. GENERATE EXCEL
    // ==========================================
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // --- SETUP VISUAL (LOGO & ADDRESS) ---
    // Sesuaikan path logo dengan struktur folder project Anda
    // Biasanya ada di 'public/HEXING LOGO.png' atau sejenisnya
            // --- SETUP VISUAL (LOGO & ADDRESS) ---
        const logoFileName = "HEXING LOGO.png"; // GANTI SESUAI NAMA FILE ASLI DI FOLDER PUBLIC
        const logoPath = path.join(process.cwd(), "public", logoFileName);
        
        // DEBUGGING: Cek di terminal Next.js apakah path benar
        console.log("Mencari logo di:", logoPath);
        console.log("Apakah file ada?", fs.existsSync(logoPath));

        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoId = workbook.addImage({
                buffer: logoBuffer as any,
                extension: 'png',
            });

            // CARA LEBIH AMAN: Gunakan 'ext' (lebar x tinggi dalam pixel)
            // tl: { col: 0.2, row: 0.2 } artinya geser sedikit dari pojok kiri atas A1 biar rapi
            worksheet.addImage(logoId, {
                tl: { col: 0.2, row: 0.2 }, 
                ext: { width: 180, height: 65 }, // Sesuaikan ukuran pixel ini sesuai selera
                editAs: 'oneCell' 
            });
        } else {
            console.error("ERROR: Logo tidak ditemukan! Pastikan file ada di folder public.");
        }

        // --- ADDRESS TEXT ---
        // Karena kita pakai 'ext' untuk gambar, kita tidak perlu khawatir gambar menimpa teks
        // asalkan teks dimulai dari kolom C (index 2) atau D.
        
        // (Lanjutkan dengan kode Address sebelumnya...)
    const nameCell = worksheet.getCell("C1");
    nameCell.value = "PT. HEXING TECHNOLOGY"; // Sesuaikan nama PT lengkap
    nameCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF003366" } }; // Biru tua profesional
    nameCell.alignment = { vertical: "bottom", horizontal: "left" };

    // Row 2: Kawasan
    const areaCell = worksheet.getCell("C2");
    areaCell.value = "Kawasan Industri Mitra Karawang";
    areaCell.font = { name: "Arial", size: 10 };
    areaCell.alignment = { vertical: "middle", horizontal: "left" };

    // Row 3: Jalan
    const streetCell = worksheet.getCell("C3");
    streetCell.value = "Jl. Mitra Timur II Blok D-24 Karawang-Indonesia";
    streetCell.font = { name: "Arial", size: 10 };
    streetCell.alignment = { vertical: "middle", horizontal: "left" };

    // Row 4: Phone/Fax
    const phoneCell = worksheet.getCell("C4");
    phoneCell.value = "Phone: (0267) 8610077, Fax: (0267) 8610078";
    phoneCell.font = { name: "Arial", size: 10 };
    phoneCell.alignment = { vertical: "top", horizontal: "left" };

    // --- SETUP TITLE ---
    // Merge cell untuk judul di baris 6
    worksheet.mergeCells("A6:G6");
    const titleCell = worksheet.getCell("A6");
    titleCell.value = title;
    titleCell.font = { name: "Arial", size: 16, bold: true, underline: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    // --- SETUP TABLE HEADER ---
    // Baris ke-8 untuk Header Tabel
    const headerRowIdx = 8;
    const headerRow = worksheet.getRow(headerRowIdx);
    
    // Mapping Values
    headerRow.values = columns.map((col) => col.header);

    // Styling Header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // Font Putih
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2F75B5" }, // Warna Biru Header
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // --- SETUP DATA ROWS ---
    exportData.forEach((item) => {
      const rowValues = columns.map((col) => item[col.key]);
      const row = worksheet.addRow(rowValues);

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Border untuk semua sel data
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        
        // Alignment
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

        // Khusus kolom tanggal (asumsi kolom terakhir atau yang mengandung 'timestamp')
        const colKey = columns[colNumber - 1].key;
        if (colKey === "timestamp" && cell.value) {
            // Menggunakan NumFmt Excel agar user bisa filter by Date
            cell.numFmt = 'dd/mm/yyyy hh:mm'; 
        }
      });
    });

    // --- FINISHING TOUCHES ---
    // Set lebar kolom manual
    columns.forEach((col, index) => {
      // +1 karena ExcelJS index mulai dari 1
      worksheet.getColumn(index + 1).width = col.width;
    });

    // 5. WRITE BUFFER & RETURN RESPONSE
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${title.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("[EXPORT_ERROR]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}