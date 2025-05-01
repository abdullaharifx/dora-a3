"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"
import { formatToISOString } from "./date-utils"

export async function fetchCalendarEvents(startDate: Date, endDate: Date, timeZone: string) {
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

    // Format dates for API
    const timeMin = formatToISOString(startDate, timeZone)
    const timeMax = formatToISOString(endDate, timeZone)

    // Fetch events
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      timeZone,
    })

    return response.data.items || []
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    throw new Error("Failed to fetch calendar events")
  }
}

export async function getCalendarList() {
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

    // Fetch calendar list
    const response = await calendar.calendarList.list()

    return response.data.items || []
  } catch (error) {
    console.error("Error fetching calendar list:", error)
    throw new Error("Failed to fetch calendar list")
  }
}
