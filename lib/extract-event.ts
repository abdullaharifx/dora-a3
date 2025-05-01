"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function extractEvent(transcription: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an AI assistant that extracts event details from Urdu text. 
      Extract the following information and format it as a valid JSON object for Google Calendar API:
      - summary: Event title in Urdu
      - location: Location in Urdu (if mentioned)
      - description: Description in Urdu (if mentioned)
      - start.dateTime: Start date and time in ISO format (YYYY-MM-DDTHH:MM:SS+05:00)
      - start.timeZone: "Asia/Karachi"
      - end.dateTime: End date and time in ISO format (YYYY-MM-DDTHH:MM:SS+05:00)
      - end.timeZone: "Asia/Karachi"
      - recurrence: Array of RRULE strings (if mentioned)
      - attendees: Array of email objects (if mentioned)
      - reminders: Object with useDefault and overrides array (if mentioned)
      
      If any information is missing, make reasonable assumptions based on context.
      If no specific time is mentioned, use 9:00 AM as default start time and 10:00 AM as end time.
      If no specific date is mentioned, use tomorrow's date.
      
      Return ONLY the JSON object without any explanations or markdown.`,
      prompt: transcription,
    })

    // Parse the JSON response
    return JSON.parse(text)
  } catch (error) {
    console.error("Error extracting event:", error)
    throw new Error("Failed to extract event details")
  }
}
