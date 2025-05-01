import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get event data from request
    const eventData = await request.json()

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

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error scheduling event:", error)
    return NextResponse.json({ error: "Failed to schedule event" }, { status: 500 })
  }
}
