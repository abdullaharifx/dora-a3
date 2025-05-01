"use server"

export async function transcribeAudio(audioBlob: Blob) {
  try {
    // Convert blob to base64
    const buffer = Buffer.from(await audioBlob.arrayBuffer())
    const base64Audio = buffer.toString("base64")

    // Create FormData for OpenAI API
    const formData = new FormData()
    formData.append("file", new Blob([buffer]), "audio.wav")
    formData.append("model", "whisper-1")
    formData.append("language", "ur")

    // Call OpenAI Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error transcribing audio:", error)
    throw new Error("Failed to transcribe audio")
  }
}
