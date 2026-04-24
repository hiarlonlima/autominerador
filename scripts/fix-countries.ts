import { PrismaClient } from "@prisma/client";
import { normalizeLibraryUrl } from "../lib/ad-library";

const prisma = new PrismaClient();

async function main() {
  const bad = await prisma.target.findMany({
    where: {
      OR: [{ country: "ALL" }, { inputValue: { contains: "country=ALL" } }],
    },
  });
  console.log(`${bad.length} alvos com country=ALL pra corrigir`);
  for (const t of bad) {
    const newUrl =
      t.inputType === "library_url" ? normalizeLibraryUrl(t.inputValue, "BR") : t.inputValue;
    await prisma.target.update({
      where: { id: t.id },
      data: { country: "BR", inputValue: newUrl, lastError: null },
    });
    console.log(`  ✔ ${t.name}`);
  }
}

main().finally(() => prisma.$disconnect());
