const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default async function Home() {
  let apiStatus = "unreachable";
  let postgres = "unknown";

  try {
    const res = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { status?: string; postgres?: string };
      apiStatus = data.status ?? "ok";
      postgres = data.postgres ?? "unknown";
    } else {
      apiStatus = `http ${res.status}`;
    }
  } catch {
    apiStatus = "unreachable";
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        agenda-online-simple
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
        Agenda online simple
      </h1>
      <p className="text-lg text-zinc-600">
        Base lista: Next.js + NestJS + PostgreSQL + Traefik.
      </p>
      <dl className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
        <div className="flex justify-between gap-4">
          <dt>API</dt>
          <dd className="font-mono">{apiStatus}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>PostgreSQL</dt>
          <dd className="font-mono">{postgres}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>API URL</dt>
          <dd className="font-mono">{apiUrl}</dd>
        </div>
      </dl>
    </main>
  );
}
