import { PrismaClient } from "@prisma/client";
import { normalizeLibraryUrl } from "../lib/ad-library";

const prisma = new PrismaClient();

async function main() {
  const targets = await prisma.target.findMany({
    where: { inputType: "library_url" },
  });
  console.log(`Verificando ${targets.length} alvos (library_url)...`);
  let fixed = 0;
  for (const t of targets) {
    const country = t.country === "ALL" ? "BR" : t.country;
    const newUrl = normalizeLibraryUrl(t.inputValue, country || "BR");
    if (newUrl !== t.inputValue || t.country !== country) {
      await prisma.target.update({
        where: { id: t.id },
        data: { country, inputValue: newUrl, lastError: null },
      });
      console.log(`  ✔ ${t.name}`);
      console.log(`    ${t.inputValue}`);
      console.log(`    → ${newUrl}`);
      fixed++;
    }
  }
  console.log(`${fixed} alvos atualizados.`);
}

main().finally(() => prisma.$disconnect());
