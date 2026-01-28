export async function POST(req: Request) {
  try {
    const payload = await req.json();
    // Basic server-side logging; viewable in Vercel function logs
    console.log("[analytics]", payload);
  } catch (error) {
    console.error("[analytics] invalid payload", error);
  }

  return Response.json({ ok: true });
}
