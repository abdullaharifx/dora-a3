// /app/api/save-embedding/route.ts (Next.js App Router)
import { Pinecone } from "@pinecone-database/pinecone"
import { NextRequest, NextResponse } from "next/server"

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const index = pc.Index("dorag")

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    // Get embedding from OpenAI
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1024, // Match Pinecone index dimension
      }),
    })

    const embeddingData = await embeddingRes.json()
    

    if (!embeddingData?.data?.[0]?.embedding) {
    console.error("Embedding API failed response:", embeddingData)
    return NextResponse.json({ error: "Failed to get embedding" }, { status: 500 })
    }

    const embedding = embeddingData.data[0].embedding

    // Save in Pinecone
    await index.upsert([
      {
        id: `voice-${Date.now()}`, // or UUID
        values: embedding,
        metadata: { text },
      },
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Embedding/Pinecone error:", error)
    return NextResponse.json({ error: "Failed to save embedding" }, { status: 500 })
  }
}
