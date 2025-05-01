"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, Clock, MapPin, Users, FileText, Bell } from "lucide-react"
import { formatDate, formatTime } from "@/lib/date-utils"

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
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <div className="bg-primary/10 p-4">
        <h3 className="text-xl font-bold">{event.summary}</h3>
      </div>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">تاریخ</p>
              <p className="text-muted-foreground">{formatDate(new Date(event.start.dateTime))}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">وقت</p>
              <p className="text-muted-foreground">
                {formatTime(new Date(event.start.dateTime))} - {formatTime(new Date(event.end.dateTime))}
              </p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">مقام</p>
                <p className="text-muted-foreground">{event.location}</p>
              </div>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">شرکاء</p>
                <div className="text-muted-foreground">
                  {event.attendees.map((attendee, index) => (
                    <p key={index}>{attendee.email}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {event.description && (
          <div className="flex items-start space-x-3 rtl:space-x-reverse pt-2">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">تفصیل</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>
        )}

        {event.recurrence && event.recurrence.length > 0 && (
          <div className="flex items-start space-x-3 rtl:space-x-reverse pt-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">تکرار</p>
              <p className="text-muted-foreground">
                {event.recurrence[0].includes("DAILY")
                  ? "روزانہ"
                  : event.recurrence[0].includes("WEEKLY")
                    ? "ہفتہ وار"
                    : event.recurrence[0].includes("MONTHLY")
                      ? "ماہانہ"
                      : "سالانہ"}
              </p>
            </div>
          </div>
        )}

        {event.reminders && event.reminders.overrides && (
          <div className="flex items-start space-x-3 rtl:space-x-reverse pt-2">
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">یاد دہانیاں</p>
              <div className="text-muted-foreground">
                {event.reminders.overrides.map((reminder, index) => (
                  <p key={index}>
                    {reminder.method === "email" ? "ای میل" : "پاپ اپ"}: {reminder.minutes} منٹ پہلے
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
