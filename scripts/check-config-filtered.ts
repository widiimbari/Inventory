
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const configs = await db.$queryRaw`
    SELECT root, branch, value 
    FROM config 
    WHERE branch LIKE '%type%' 
       OR branch LIKE '%meter%' 
       OR root LIKE '%line%'
    LIMIT 100
  `;
  console.log("Filtered Config Data:");
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
