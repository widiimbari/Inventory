import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, startOfWeek, subDays, format } from "date-fns";

export const revalidate = 60; 

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const last7DaysStart = subDays(todayStart, 6);

    // Parallelize Independent Queries
    const [
      boxCount, 
      palletCount,
      dailyOutput,
      weeklyOutput,
      topTypesRaw,
      recentLogs,
      dailyStatsRaw,
      activeLinesRaw
    ] = await Promise.all([
      db.box.count(),
      db.pallete.count(),
      db.product.count({ where: { timestamp: { gte: todayStart } } }),
      db.product.count({ where: { timestamp: { gte: weekStart } } }),
      db.product.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
        take: 5,
      }),
      db.logs.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        select: { id: true, desc: true, timestamp: true, line: true, code: true }
      }),
      db.$queryRaw`
        SELECT DATE(timestamp) as date, COUNT(*) as count 
        FROM product 
        WHERE timestamp >= ${last7DaysStart} 
        GROUP BY DATE(timestamp) 
        ORDER BY date ASC
      `,
      // Fetch meter_type and no_po for all lines
      db.$queryRaw`
        SELECT root as line, branch, value
        FROM config 
        WHERE root LIKE 'line_%' 
          AND branch IN ('meter_type', 'no_po', 'daily_counter', 'qty_box')
      `
    ]);

    // Format Chart Data
    const chartData = (dailyStatsRaw as any[]).map((item: any) => ({
      date: format(new Date(item.date), 'dd MMM'),
      count: Number(item.count)
    }));

    const topTypes = topTypesRaw.map(t => ({ type: t.type, count: t._count.type }));

    // Group Active Lines
    const linesMap = new Map();
    (activeLinesRaw as any[]).forEach(item => {
        if (!linesMap.has(item.line)) {
            linesMap.set(item.line, { line: item.line.replace('line_', 'Line '), meter_type: '-', no_po: '-', daily_counter: '0', qty_box: '0' });
        }
        const lineData = linesMap.get(item.line);
        if (item.branch === 'meter_type' && item.value) lineData.meter_type = item.value;
        if (item.branch === 'no_po' && item.value) lineData.no_po = item.value;
        if (item.branch === 'daily_counter') lineData.daily_counter = item.value;
        if (item.branch === 'qty_box') lineData.qty_box = item.value;
    });

    // Filter only lines that have a meter_type assigned AND daily_counter > 0
    const activeLines = Array.from(linesMap.values())
        .filter(l => l.meter_type !== '-' && l.meter_type !== '' && parseInt(l.daily_counter) > 0)
        .sort((a, b) => a.line.localeCompare(b.line));

    return NextResponse.json({
      summary: {
        boxCount,
        palletCount,
        dailyOutput,
        weeklyOutput,
      },
      topTypes,
      recentLogs,
      chartData,
      activeLines
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
