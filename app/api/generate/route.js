import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1) Healthcheck (프런트에서 연결 확인용)
    //    body가 없거나 JSON 파싱이 불가하면 에러가 날 수 있으니 먼저 clone → text 확인 후 처리해도 됩니다.
    let body;
    try {
      body = await req.json();
    } catch (_) {
      return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
    }

    if (body && body.healthcheck) {
      return NextResponse.json({ ok: true });
    }

    // 2) 환경 변수 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // 3) 입력 검증
    const { model = "gpt-4o-mini", foodName, prompt } = body || {};
    if (typeof foodName !== "string" || !foodName.trim()) {
      return NextResponse.json({ error: "Missing or invalid 'foodName'" }, { status: 400 });
    }
    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Missing or invalid 'prompt'" }, { status: 400 });
    }

    // 4) OpenAI 호출 (서버 측에서만 실행; 키는 브라우저에 노출되지 않음)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [
      { role: "system", content: "You are a Korean food synonym generation expert." },
      { role: "user", content: `${prompt}\n\n[식품명]: ${foodName}` },
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    });

    const text = completion?.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[/api/generate] OpenAI error:", err);
    const message = err?.message ? String(err.message) : "OpenAI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// (옵션) GET 핸들러
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
