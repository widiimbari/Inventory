import {
  PrismaClient
} from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Checking latest activity per line in 'product' table...");
  const productActivity = await db.product.groupBy({
    by: ['line'],
    _max: {
      timestamp: true
    },
    orderBy: {
      _max: {
        timestamp: 'desc'
      }
    }
  });
  console.table(productActivity);

  console.log("\nChecking latest activity per line in 'logs' table...");
  const logActivity = await db.logs.groupBy({
    by: ['line'],
    _max: {
      timestamp: true
    },
    orderBy: {
      _max: {
        timestamp: 'desc'
      }
    }
  });
  console.table(logActivity);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
