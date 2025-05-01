import { addDays, addWeeks, addMonths, parseISO, isValid, isBefore, addHours } from "date-fns"
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz"

// Format date in Urdu style
export function formatDate(date: Date, timeZone = "Asia/Karachi"): string {
  try {
    const zonedDate = utcToZonedTime(date, timeZone)

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }

    return zonedDate.toLocaleDateString("ur-PK", options)
  } catch (error) {
    console.error("Error formatting date:", error)
    return date.toLocaleDateString("ur-PK")
  }
}

// Format time in Urdu style
export function formatTime(date: Date, timeZone = "Asia/Karachi"): string {
  try {
    const zonedDate = utcToZonedTime(date, timeZone)

    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }

    return zonedDate.toLocaleTimeString("ur-PK", options)
  } catch (error) {
    console.error("Error formatting time:", error)
    return date.toLocaleTimeString("ur-PK")
  }
}

// Get current date-time in the specified timezone
export function getCurrentDateTime(timeZone = "Asia/Karachi"): Date {
  try {
    const now = new Date()
    return utcToZonedTime(now, timeZone)
  } catch (error) {
    console.error("Error getting current date-time:", error)
    return new Date()
  }
}

// Convert a date string to a date object in the specified timezone
export function parseDateTime(dateTimeString: string, timeZone = "Asia/Karachi"): Date {
  try {
    if (!dateTimeString) return new Date()

    const date = parseISO(dateTimeString)
    if (!isValid(date)) return new Date()

    return utcToZonedTime(date, timeZone)
  } catch (error) {
    console.error("Error parsing date-time:", error)
    return new Date()
  }
}

// Convert a local date to UTC ISO string with timezone
export function formatToISOString(date: Date, timeZone = "Asia/Karachi"): string {
  try {
    const utcDate = zonedTimeToUtc(date, timeZone)
    return utcDate.toISOString()
  } catch (error) {
    console.error("Error formatting to ISO string:", error)
    return date.toISOString()
  }
}

// Get relative date based on Urdu phrases
export function getRelativeDate(phrase: string, baseDate: Date = new Date(), timeZone = "Asia/Karachi"): Date {
  try {
    const zonedDate = utcToZonedTime(baseDate, timeZone)

    // Common Urdu time phrases
    if (phrase.includes("آج") || phrase.includes("اج")) {
      return zonedDate
    } else if (phrase.includes("کل") || phrase.includes("کل")) {
      return addDays(zonedDate, 1)
    } else if (phrase.includes("پرسوں") || phrase.includes("پرسون")) {
      return addDays(zonedDate, 2)
    } else if (phrase.includes("اگلے ہفتے") || phrase.includes("اگلے ہفتہ")) {
      return addWeeks(zonedDate, 1)
    } else if (phrase.includes("اگلے مہینے") || phrase.includes("اگلے مہینہ")) {
      return addMonths(zonedDate, 1)
    }

    return zonedDate
  } catch (error) {
    console.error("Error getting relative date:", error)
    return baseDate
  }
}

// Format date range for display
export function formatDateRange(startDate: Date, endDate: Date, timeZone = "Asia/Karachi"): string {
  try {
    const start = utcToZonedTime(startDate, timeZone)
    const end = utcToZonedTime(endDate, timeZone)

    // If same day, just show times
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(start, timeZone)} ${formatTime(start, timeZone)} - ${formatTime(end, timeZone)}`
    }

    // Different days
    return `${formatDate(start, timeZone)} ${formatTime(start, timeZone)} - ${formatDate(end, timeZone)} ${formatTime(end, timeZone)}`
  } catch (error) {
    console.error("Error formatting date range:", error)
    return `${startDate.toLocaleString()} - ${endDate.toLocaleString()}`
  }
}

// Check if a date is in the future
export function isDateInFuture(date: Date): boolean {
  const now = new Date()
  return isBefore(now, date)
}

// Ensure a date is in the future
export function ensureFutureDate(date: Date, minimumHoursAhead = 1): Date {
  const now = new Date()

  if (isBefore(date, now)) {
    // If the date is in the past, set it to now + minimumHoursAhead
    return addHours(now, minimumHoursAhead)
  }

  return date
}

// Adjust event dates to ensure they're in the future
export function adjustEventDatesToFuture(event: any): any {
  if (!event || !event.start || !event.end) return event

  const startDate = new Date(event.start.dateTime)
  const endDate = new Date(event.end.dateTime)
  const now = new Date()

  // If start date is in the past
  if (isBefore(startDate, now)) {
    // Calculate how much we need to shift the dates
    const futureStartDate = addHours(now, 1) // Set to 1 hour from now
    const durationMs = endDate.getTime() - startDate.getTime()
    const futureEndDate = new Date(futureStartDate.getTime() + durationMs)

    // Update the event
    return {
      ...event,
      start: {
        ...event.start,
        dateTime: futureStartDate.toISOString(),
      },
      end: {
        ...event.end,
        dateTime: futureEndDate.toISOString(),
      },
    }
  }

  return event
}
