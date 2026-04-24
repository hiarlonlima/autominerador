import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_HOSTS = [/\.fbcdn\.net$/i, /\.facebook\.com$/i, /^scontent/i];

function isAllowed(url: URL) {
  return ALLOWED_HOSTS.some((re) => re.test(url.hostname));
}

// Proxy de download — busca o arquivo do CDN do Facebook e devolve com
// Content-Disposition: attachment pra forçar o download em vez de abrir.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url");
  const suggestedName = searchParams.get("filename") ?? "criativo";
  if (!raw) return NextResponse.json({ error: "url obrigatório" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }

  if (!isAllowed(target)) {
    return NextResponse.json(
      { error: "host não permitido" },
      { status: 400 },
    );
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      // user-agent "normal" evita bloqueios do CDN
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    },
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `fetch falhou: ${upstream.status}` },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const ext = contentType.includes("video")
    ? "mp4"
    : contentType.includes("image/jpeg")
      ? "jpg"
      : contentType.includes("image/png")
        ? "png"
        : "bin";
  const filename = `${suggestedName}.${ext}`.replace(/[^\w.\-]+/g, "_");

  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
