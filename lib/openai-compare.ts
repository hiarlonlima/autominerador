import OpenAI from "openai";
import { prisma } from "./prisma";
import { formatRelativeDays } from "./utils";

const MODEL = "gpt-4o-mini";

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não configurado");
  return new OpenAI({ apiKey: key });
}

// Reune dados que realmente importam pra decisão de modelagem:
// - contagem atual e histórico recente
// - tempo que o anúncio mais antigo está ativo (sinal de "vencedor")
// - top criativos (collations) + amostra de copy
export async function gatherTargetSnapshot(targetId: string) {
  const [target, recentSnapshots, topAds] = await Promise.all([
    prisma.target.findUnique({ where: { id: targetId } }),
    prisma.snapshot.findMany({
      where: { targetId },
      orderBy: { capturedAt: "desc" },
      take: 30,
      select: { activeCount: true, capturedAt: true },
    }),
    prisma.ad.findMany({
      where: { targetId, isActive: true },
      orderBy: [{ collationCount: "desc" }, { startDate: "asc" }],
      take: 50,
      select: {
        archiveId: true,
        bodyText: true,
        mediaType: true,
        ctaText: true,
        collationId: true,
        collationCount: true,
        startDate: true,
        firstSeenAt: true,
      },
    }),
  ]);
  if (!target) throw new Error(`Alvo ${targetId} não encontrado`);

  // dedup por collation (um representante por collation)
  const seen = new Set<string>();
  const uniqueCreatives = topAds.filter((a) => {
    const key = a.collationId ?? a.archiveId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);

  const oldest = topAds
    .map((a) => a.startDate ?? a.firstSeenAt)
    .filter(Boolean)
    .map((d) => new Date(d as Date).getTime())
    .sort((a, b) => a - b)[0];

  const activeNow = recentSnapshots[0]?.activeCount ?? 0;
  const avgLast7 = recentSnapshots.slice(0, 7).reduce((s, x) => s + x.activeCount, 0) /
    Math.max(1, Math.min(7, recentSnapshots.length));

  return {
    name: target.name,
    pageName: target.pageName,
    activeNow,
    avgLast7: Math.round(avgLast7),
    oldestActiveAt: oldest ? new Date(oldest).toISOString() : null,
    oldestActiveLabel: oldest ? formatRelativeDays(new Date(oldest)) : "—",
    topCreatives: uniqueCreatives.map((a) => ({
      copy: (a.bodyText ?? "").slice(0, 400),
      mediaType: a.mediaType,
      cta: a.ctaText,
      duplicates: a.collationCount,
    })),
  };
}

export type TargetSnapshot = Awaited<ReturnType<typeof gatherTargetSnapshot>>;

export async function compareTargetsWithAI(
  snapshots: TargetSnapshot[],
): Promise<string> {
  const client = getClient();

  const blocks = snapshots.map((s, i) => {
    const creatives = s.topCreatives
      .map(
        (c, j) =>
          `    ${j + 1}. [${c.mediaType ?? "?"}] ×${c.duplicates} (CTA: ${c.cta ?? "—"})\n       "${c.copy.replace(/\n/g, " ").slice(0, 200)}"`,
      )
      .join("\n");
    return `### Alvo ${i + 1}: ${s.name}${s.pageName ? ` (${s.pageName})` : ""}
- Anúncios ativos agora: ${s.activeNow}
- Média últimos 7 dias: ${s.avgLast7}
- Anúncio ativo mais antigo: ${s.oldestActiveLabel}
- Top 10 criativos (por duplicação):
${creatives || "  (sem criativos coletados)"}`;
  }).join("\n\n");

  const prompt = `Você é um especialista em marketing direto (direct response) e arbitragem de anúncios pagos no Facebook/Meta. Analise os anunciantes abaixo e diga qual é o mais forte pra MODELAR (ou seja, extrair aprendizados e replicar na operação do usuário).

Critérios de avaliação:
1. **Escala** — volume de anúncios ativos agora + média histórica
2. **Tempo em atividade** — anúncios que rodam há muito tempo são "vencedores" validados pelo algoritmo
3. **Duplicação de criativos** — quantos ads usam o mesmo texto/criativo (sinal de que testaram e escalaram esse ângulo)
4. **Consistência da copy** — padrão claro de gancho, promessa, dor/benefício

${blocks}

Responda em português, formato markdown, com estas seções:

## 🏆 Recomendação
Em 1 frase: qual anunciante modelar e por quê.

## 📊 Análise comparativa
Bullets curtos comparando os 3 em escala, tempo ativo, duplicação.

## ✅ Padrões do vencedor
3–5 bullets dos padrões de copy/criativo que aparecem nos anúncios mais escalados. Cite trechos textuais das copies como evidência.

## ⚠️ Red flags
Sinais de fraqueza nos outros alvos (se houver).

## 🎯 Próximos passos
3 ações concretas pro usuário aplicar na próxima campanha.

Seja objetivo, sem enrolação.`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0]?.message?.content ?? "Sem resposta.";
}
