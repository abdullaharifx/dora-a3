"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, Clock, MapPin, Users, FileText, AlertTriangle } from "lucide-react"
import { formatDate, formatTime, parseDateTime, isDateInFuture, ensureFutureDate } from "@/lib/date-utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EventCardProps {
  event: {
    summary: string
    location?: string
    description?: string
    start: {
      dateTime: string
      timeZone: string
    }
    end: {
      dateTime: string
      timeZone: string
    }
    attendees?: { email: string }[]
    recurrence?: string[]
    reminders?: {
      useDefault: boolean
      overrides?: { method: string; minutes: number }[]
    }
  }
  isEditable?: boolean
  isEditing?: boolean
  onEdit?: (updatedEvent: any) => void
  timeZone?: string
}

export default function EventCard({
  event,
  isEditable = false,
  isEditing = false,
  onEdit,
  timeZone = "Asia/Karachi",
}: EventCardProps) {
  const [editableEvent, setEditableEvent] = useState({ ...event })
  const [dateWarning, setDateWarning] = useState(false)
  const [is2023Warning, setIs2023Warning] = useState(false)

  useEffect(() => {
    setEditableEvent({ ...event })

    // Check if the event date is in the past
    const startDate = new Date(event.start.dateTime)
    setDateWarning(!isDateInFuture(startDate))

    // Check if the date is in 2023
    setIs2023Warning(startDate.getFullYear() === 2023)
  }, [event, isEditing])

  const handleChange = (field: string, value: any) => {
    setEditableEvent((prev) => {
      const updated = { ...prev }

      // Handle nested fields
      if (field.includes(".")) {
        const [parent, child] = field.split(".")
        updated[parent] = { ...updated[parent], [child]: value }
      } else {
        updated[field] = value
      }

      // Check if the date is in the future when changing date/time fields
      if (field.includes("start.dateTime") || field.includes("end.dateTime")) {
        const startDate = new Date(updated.start.dateTime)
        setDateWarning(!isDateInFuture(startDate))
        setIs2023Warning(startDate.getFullYear() === 2023)

        // If the date is in 2023, adjust it to the current year
        if (startDate.getFullYear() === 2023) {
          const now = new Date()
          const tomorrow = new Date(now)
          tomorrow.setDate(tomorrow.getDate() + 1)

          // Keep the same time but change the date
          const newDate = new Date(startDate)
          newDate.setFullYear(tomorrow.getFullYear())
          newDate.setMonth(tomorrow.getMonth())
          newDate.setDate(tomorrow.getDate())

          updated.start.dateTime = newDate.toISOString()

          // Adjust end time to maintain the same duration
          const originalDuration = new Date(prev.end.dateTime).getTime() - new Date(prev.start.dateTime).getTime()
          const newEndTime = new Date(newDate.getTime() + originalDuration)
          updated.end.dateTime = newEndTime.toISOString()
        }
        // If the date is in the past, adjust it to the future
        else if (!isDateInFuture(startDate) && field.includes("start.dateTime")) {
          const futureDate = ensureFutureDate(startDate)
          updated.start.dateTime = futureDate.toISOString()

          // Adjust end time to maintain the same duration
          const originalDuration = new Date(prev.end.dateTime).getTime() - new Date(prev.start.dateTime).getTime()
          const newEndTime = new Date(futureDate.getTime() + originalDuration)
          updated.end.dateTime = newEndTime.toISOString()
        }
      }

      if (onEdit) {
        onEdit(updated)
      }

      return updated
    })
  }

  // Use the appropriate event data based on edit mode
  const displayEvent = isEditing ? editableEvent : event

  // Format the date for display, with special handling for 2023 dates
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString)
    if (date.getFullYear() === 2023) {
      return `${formatDate(date, timeZone)} (⚠️ 2023 - needs update)`
    }
    return formatDate(date, timeZone)
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <div className="bg-primary/10 p-4">
        {isEditing ? (
          <Input
            value={displayEvent.summary}
            onChange={(e) => handleChange("summary", e.target.value)}
            className="text-xl font-bold"
            placeholder="ایونٹ کا عنوان"
          />
        ) : (
          <h3 className="text-xl font-bold">{displayEvent.summary}</h3>
        )}
      </div>
      <CardContent className="p-6 space-y-4">
        {dateWarning && (
          <Alert className="bg-yellow-50 border-yellow-200 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              ایونٹس صرف مستقبل میں شیڈول کیے جا سکتے ہیں۔ تاریخ کو خود بخود ایڈجسٹ کیا جائے گا۔
            </AlertDescription>
          </Alert>
        )}

        {is2023Warning && (
          <Alert className="bg-red-50 border-red-200 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              ایونٹ کی تاریخ 2023 میں ہے! یہ تاریخ موجودہ سال میں ایڈجسٹ کی جائے گی۔
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="w-full">
              <p className="font-medium">تاریخ</p>
              {isEditing ? (
                <Input
                  type="date"
                  value={parseDateTime(displayEvent.start.dateTime, timeZone).toISOString().split("T")[0]}
                  onChange={(e) => {
                    const date = e.target.value
                    const startTime = parseDateTime(displayEvent.start.dateTime, timeZone).toISOString().split("T")[1]
                    const endTime = parseDateTime(displayEvent.end.dateTime, timeZone).toISOString().split("T")[1]
                    handleChange("start.dateTime", `${date}T${startTime}`)
                    handleChange("end.dateTime", `${date}T${endTime}`)
                  }}
                  className="w-full"
                />
              ) : (
                <p className="text-muted-foreground">{formatDisplayDate(displayEvent.start.dateTime)}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="w-full">
              <p className="font-medium">وقت</p>
              {isEditing ? (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Input
                    type="time"
                    value={parseDateTime(displayEvent.start.dateTime, timeZone)
                      .toISOString()
                      .split("T")[1]
                      .substring(0, 5)}
                    onChange={(e) => {
                      const date = parseDateTime(displayEvent.start.dateTime, timeZone).toISOString().split("T")[0]
                      handleChange("start.dateTime", `${date}T${e.target.value}:00.000Z`)
                    }}
                    className="w-full"
                  />
                  <span>تا</span>
                  <Input
                    type="time"
                    value={parseDateTime(displayEvent.end.dateTime, timeZone)
                      .toISOString()
                      .split("T")[1]
                      .substring(0, 5)}
                    onChange={(e) => {
                      const date = parseDateTime(displayEvent.end.dateTime, timeZone).toISOString().split("T")[0]
                      handleChange("end.dateTime", `${date}T${e.target.value}:00.000Z`)
                    }}
                    className="w-full"
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {formatTime(new Date(displayEvent.start.dateTime), timeZone)} -{" "}
                  {formatTime(new Date(displayEvent.end.dateTime), timeZone)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="w-full">
              <p className="font-medium">مقام</p>
              {isEditing ? (
                <Input
                  value={displayEvent.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="مقام"
                  className="w-full"
                />
              ) : (
                <p className="text-muted-foreground">{displayEvent.location || "کوئی مقام نہیں"}</p>
              )}
            </div>
          </div>

          {(displayEvent.attendees && displayEvent.attendees.length > 0) || isEditing ? (
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="w-full">
                <p className="font-medium">شرکاء</p>
                {isEditing ? (
                  <Input
                    value={displayEvent.attendees ? displayEvent.attendees.map((a) => a.email).join(", ") : ""}
                    onChange={(e) => {
                      const emails = e.target.value.split(",").map((email) => ({ email: email.trim() }))
                      handleChange("attendees", emails)
                    }}
                    placeholder="ای میل ایڈریس (کاما سے الگ کریں)"
                    className="w-full"
                  />
                ) : (
                  <div className="text-muted-foreground">
                    {displayEvent.attendees &&
                      displayEvent.attendees.map((attendee, index) => <p key={index}>{attendee.email}</p>)}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {displayEvent.description || isEditing ? (
          <div className="flex items-start space-x-3 rtl:space-x-reverse pt-2">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="w-full">
              <p className="font-medium">تفصیل</p>
              {isEditing ? (
                <Textarea
                  value={displayEvent.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="ایونٹ کی تفصیل"
                  className="w-full"
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">{displayEvent.description}</p>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
