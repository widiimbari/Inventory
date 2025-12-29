
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const configs = await db.$queryRaw`SELECT root, branch, value FROM config LIMIT 50`;
  console.log("Sample Config Data (Raw):");
  console.table(configs);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
