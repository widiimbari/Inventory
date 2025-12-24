import { db } from "@/lib/db";
import { columns } from "./components/columns";
import DataTable from "../products/components/data-table"; // Re-using the DataTable component

export default async function HistoryPage() {
  let data: any[] = [];
  try {
    data = await db.logs.findMany({
      take: 100, // Limit to the latest 100 entries for performance
      orderBy: {
        timestamp: "desc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch history logs:", error);
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Activity History</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
