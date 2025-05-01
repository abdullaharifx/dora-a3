"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"

export async function scheduleEvent(eventData: any) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      throw new Error("Not authenticated")
    }

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

    oauth2Client.setCredentials({
      access_token: session.accessToken,
    })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Create event
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
    })

    return response.data
  } catch (error) {
    console.error("Error scheduling event:", error)
    throw new Error("Failed to schedule event")
  }
}
