"use server";

export async function transcribeAudio(audioBlob: Blob, saveToPinecone: boolean = false) {
  try {
    // Log audio blob details
    console.log("Debug - Audio Blob Input:", {
      size: audioBlob.size,
      type: audioBlob.type,
      saveToPinecone,
    });

    // Validate blob
    if (audioBlob.size === 0) {
      console.error("Debug - Empty audio blob");
      throw new Error("Empty audio blob provided");
    }

    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const formData = new FormData();
    formData.append("file", new Blob([buffer]), audioBlob.type === "audio/webm" ? "audio.webm" : "audio.wav");
    formData.append("model", "whisper-1");
    formData.append("language", "ur");

    // Log API request details
    console.log("Debug - Sending Whisper API request:", {
      model: "whisper-1",
      language: "ur",
      hasApiKey: !!process.env.OPENAI_API_KEY,
    });

    // Transcribe audio using Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Debug - Whisper API error:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Debug - Whisper API result:", result);

    const transcription = result.text;
    if (!transcription || typeof transcription !== "string" || transcription.trim() === "") {
      console.error("Debug - Invalid transcription:", transcription);
      throw new Error("No valid transcription returned from Whisper API");
    }

    // Save to Pinecone if requested
    if (saveToPinecone) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      console.log("Debug - Sending to save-embedding:", { text: transcription });

      const embeddingResponse = await fetch(`${backendUrl}/api/save-embedding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: transcription }),
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        console.error("Debug - save-embedding error:", {
          status: embeddingResponse.status,
          statusText: embeddingResponse.statusText,
          errorText,
        });
        throw new Error(`Failed to save embedding to Pinecone: ${embeddingResponse.statusText}`);
      }

      const embeddingResult = await embeddingResponse.json();
      console.log("Debug - save-embedding response:", embeddingResult);
    } else {
      console.log("Debug - Skipping Pinecone save as saveToPinecone is false");
    }

    return { transcription };
  } catch (error: any) {
    console.error("Error transcribing or saving to Pinecone:", error.message, error.stack);
    throw new Error(`Failed to transcribe or save audio input: ${error.message}`);
  }
}