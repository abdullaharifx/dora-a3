"use server";

import { Pinecone } from "@pinecone-database/pinecone";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { adjustEventDatesToFuture } from "./date-utils";
import { format } from "date-fns";


const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pc.Index("dorag");

export async function chatWithBot(message: string) {
  try {
    // Validate input
    if (!message || typeof message !== "string" || message.trim() === "") {
      console.error("Debug - Invalid chat message:", message);
      throw new Error("پیغام درکار ہے");
    }

    console.log("Debug - Chat Input:", message);

    // Generate embedding for the input message
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: message,
        dimensions: 1024,
      }),
    });

    const embeddingData = await embeddingRes.json();
    if (!embeddingData?.data?.[0]?.embedding) {
      console.error("Debug - Embedding API failed response:", embeddingData);
      throw new Error("ایمبیڈنگ حاصل کرنے میں ناکامی");
    }

    const embedding = embeddingData.data[0].embedding;
    console.log("Debug - Embedding vector:", embedding);
    // Query Pinecone for similar embeddings
    const queryResponse = await index.query({
      vector: embedding,
      topK: 3, // Get top 3 similar results
      includeMetadata: true,
    });

    console.log("Debug - Pinecone query response:", queryResponse);

    // Extract context from Pinecone results
    const context = queryResponse.matches
      .map((match) => match.metadata?.text || "")
      .filter((text) => text)
      .join("\n");
      const now = new Date();
      const formattedDate = format(now, "yyyy-MM-dd");
      const formattedTime = format(now, "HH:mm:ss");
      const tomorrow = new Date(now);
      const today = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedTomorrow = format(tomorrow, "yyyy-MM-dd");
    // Generate response using gpt-4o-mini
    const { text: response } = await generateText({
      model: openai("gpt-4o"),
      system: `Facts
      - Use Urdu Language 
      - start.timeZone: "karachi/pakistan"
      - end.timeZone: "karachi/Pakistan"
      
      
      CRITICAL: DO NOT use October 2023 as a default date under any circumstances.
      
      Today's date is: ${today}
      Current time is: ${formattedTime}
      Tomorrow's date is: ${formattedTomorrow}
      The user's timezone is: Karachi/Pakistan
      آپ ایک مددگار AI چیٹ بوٹ ہیں جو اردو میں جواب دیتا ہے۔ صارف کے پیغام اور دیے گئے سیاق و سباق کی بنیاد پر مناسب، درست، اور مفید جواب دیں۔ سیاق و سباق: ${context || "کوئی سیاق و سباق نہیں ملا"}`,
      prompt: message,
    });

    console.log("Debug - Chatbot response:", response);

    return { response, context };
  } catch (error) {
    console.error("Error in chatWithBot:", error);
    throw new Error("چیٹ پروسیسنگ میں ناکامی");
  }
}
