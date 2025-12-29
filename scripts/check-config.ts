
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const configs = await db.config.findMany({
    take: 20
  });
  console.log("Sample Config Data:");
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
