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
    const requestData = await request.json()
    const { events, isBatch } = requestData

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

    oauth2Client.setCredentials({
      access_token: session.accessToken,
    })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Handle batch or single event
    if (isBatch && Array.isArray(events)) {
      const results = []
      const errors = []

      for (const eventData of events) {
        try {
          const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: eventData,
          })
          results.push(response.data)
        } catch (error) {
          console.error("Error scheduling event in batch:", error)
          errors.push({ event: eventData.summary, error: "Failed to schedule" })
        }
      }

      return NextResponse.json({
        success: errors.length === 0,
        results,
        errors,
        totalScheduled: results.length,
        totalFailed: errors.length,
      })
    } else {
      // Single event
      const eventData = isBatch ? events[0] : requestData

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: eventData,
      })

      return NextResponse.json(response.data)
    }
  } catch (error) {
    console.error("Error scheduling event:", error)
    return NextResponse.json({ error: "Failed to schedule event" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get event ID from URL
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

    oauth2Client.setCredentials({
      access_token: session.accessToken,
    })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Delete event
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
