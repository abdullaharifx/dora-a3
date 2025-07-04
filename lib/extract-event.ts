"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { adjustEventDatesToFuture } from "./date-utils"
import { format } from "date-fns"

export async function extractEvent(transcription: string, currentDateTime: string, timeZone: string) {
  try {
    // Get the current date in a more explicit format
    const now = new Date()
    const formattedDate = format(now, "yyyy-MM-dd")
    const formattedTime = format(now, "HH:mm:ss")
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formattedTomorrow = format(tomorrow, "yyyy-MM-dd")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an AI assistant that extracts event details from Urdu text. 
      Extract the following information and format it as a valid JSON object for Google Calendar API:
      - summary: Event title in Urdu
      - location: Location in Urdu (if mentioned)
      - description: Description in Urdu (if mentioned)
      - start.dateTime: Start date and time in ISO format (YYYY-MM-DDTHH:MM:SS+00:00)
      - start.timeZone: "${timeZone}"
      - end.dateTime: End date and time in ISO format (YYYY-MM-DDTHH:MM:SS+00:00)
      - end.timeZone: "${timeZone}"
      - recurrence: Array of RRULE strings (if mentioned)
      - attendees: Array of email objects (if mentioned)
      - reminders: Object with useDefault and overrides array (if mentioned)
      
      IMPORTANT: All events MUST be scheduled in the future, not in the past.
      If the user mentions a time that would be in the past, schedule it for the future.
      
      CRITICAL: DO NOT use October 2023 as a default date under any circumstances.
      
      Today's date is: ${formattedDate}
      Current time is: ${formattedTime}
      Tomorrow's date is: ${formattedTomorrow}
      The user's timezone is: ${timeZone}
      
      If no specific date is mentioned, use tomorrow's date (${formattedTomorrow}).
      If no specific time is mentioned, use 9:00 AM as default start time and 10:00 AM as end time.
      
      Pay special attention to relative time phrases in Urdu like "کل" (tomorrow), "پرسوں" (day after tomorrow), 
      "اگلے ہفتے" (next week), "اگلے مہینے" (next month), etc. and interpret them correctly relative to the current date.
      
      Return ONLY the JSON object without any explanations or markdown.`,
      prompt: transcription,
    })

    // Parse the JSON response
    const extractedEvent = JSON.parse(text)

    // Double-check that the event is in the future and adjust if needed
    const adjustedEvent = adjustEventDatesToFuture(extractedEvent)

    // Force override any dates that might still be in October 2023
    const startDate = new Date(adjustedEvent.start.dateTime)
    if (startDate.getFullYear() === 2023 && startDate.getMonth() === 9) {
      // October is month 9 in JS
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)

      const oneHourLater = new Date(tomorrow)
      oneHourLater.setHours(10, 0, 0, 0)

      adjustedEvent.start.dateTime = tomorrow.toISOString()
      adjustedEvent.end.dateTime = oneHourLater.toISOString()
    }

    return adjustedEvent
  } catch (error) {
    console.error("Error extracting event:", error)
    throw new Error("Failed to extract event details")
  }
}
