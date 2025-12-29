
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const configs = await db.$queryRaw`
    SELECT root, branch, value 
    FROM config 
    WHERE root = 'line_01' OR root = 'line_02'
  `;
  console.log("Config for Line 01 and 02:");
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
