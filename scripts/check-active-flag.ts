
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const configs = await db.$queryRaw`
    SELECT root, branch, value 
    FROM config 
    WHERE root IN ('line_01', 'line_02', 'line_03', 'line_04', 'line_05')
  `;
  console.log("Detailed Config for first 5 lines:");
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
