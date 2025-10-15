cat << 'EOF' > pages/api/generate.js
import OpenAI from "openai";

/**
 * /api/generate
 * 브라우저 → 서버리스 함수 → OpenAI API 호출 → 결과 반환
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 헬스체크용
  if (req.body?.healthcheck) {
    return res.status(200).json({ ok: true });
  }

  try {
    const { model = "gpt-4", foodName, prompt } = req.body || {};

    if (!foodName) {
      return res.status(400).json({ error: "foodName is required" });
    }
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
      { role: "system", content: "You are a Korean food synonym generation expert." },
      { role: "user", content: prompt },
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    });

    const text = completion?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("[/api/generate] error:", err);
    return res.status(500).json({ error: "OpenAI request failed" });
  }
}
EOF