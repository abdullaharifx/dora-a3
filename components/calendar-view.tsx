"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { fetchCalendarEvents } from "@/lib/calendar-api"
import { formatDate, formatTime, getCurrentDateTime } from "@/lib/date-utils"
import {
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  isToday,
  isSameDay,
} from "date-fns"
import { utcToZonedTime } from "date-fns-tz"

interface CalendarViewProps {
  timeZone: string
}

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: { dateTime: string }
  end: { dateTime: string }
  colorId?: string
}

export default function CalendarView({ timeZone }: CalendarViewProps) {
  const [view, setView] = useState<"day" | "week" | "month">("day")
  const [currentDate, setCurrentDate] = useState<Date>(getCurrentDateTime(timeZone))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Calculate date range based on current view
  const getDateRange = () => {
    const zonedDate = utcToZonedTime(currentDate, timeZone)

    switch (view) {
      case "day":
        return { start: zonedDate, end: zonedDate }
      case "week":
        return {
          start: startOfWeek(zonedDate, { weekStartsOn: 1 }),
          end: endOfWeek(zonedDate, { weekStartsOn: 1 }),
        }
      case "month":
        return {
          start: startOfMonth(zonedDate),
          end: endOfMonth(zonedDate),
        }
      default:
        return { start: zonedDate, end: zonedDate }
    }
  }

  // Navigate through calendar
  const navigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setCurrentDate(getCurrentDateTime(timeZone))
      return
    }

    const moveForward = direction === "next"

    switch (view) {
      case "day":
        setCurrentDate(moveForward ? addDays(currentDate, 1) : subDays(currentDate, 1))
        break
      case "week":
        setCurrentDate(moveForward ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
        break
      case "month":
        setCurrentDate(moveForward ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
        break
    }
  }

  // Fetch events from Google Calendar
  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const { start, end } = getDateRange()
      const fetchedEvents = await fetchCalendarEvents(start, end, timeZone)
      setEvents(fetchedEvents)
    } catch (error) {
      console.error("Error fetching calendar events:", error)
      toast({
        title: "ایونٹس لوڈ کرنے میں خرابی",
        description: "کیلنڈر ایونٹس کو لوڈ کرنے میں خرابی ہوئی ہے۔ براہ کرم دوبارہ کوشش کریں۔",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Reload events when view or date changes
  useEffect(() => {
    loadEvents()
  }, [view, currentDate, timeZone])

  // Generate day cells for month view
  const generateMonthDays = () => {
    const { start, end } = getDateRange()
    const days = []
    let currentDay = start

    while (currentDay <= end) {
      days.push(currentDay)
      currentDay = addDays(currentDay, 1)
    }

    return days
  }

  // Generate hour cells for day view
  const generateDayHours = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push(i)
    }
    return hours
  }

  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start.dateTime)
      return isSameDay(utcToZonedTime(eventStart, timeZone), day)
    })
  }

  // Filter events for a specific hour
  const getEventsForHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventStart = utcToZonedTime(new Date(event.start.dateTime), timeZone)
      return isSameDay(eventStart, day) && eventStart.getHours() === hour
    })
  }

  // Render day view
  const renderDayView = () => {
    const hours = generateDayHours()

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-center mb-4">{formatDate(currentDate, timeZone)}</h3>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {hours.map((hour) => {
              const hourEvents = getEventsForHour(currentDate, hour)
              return (
                <div key={hour} className="flex border-b py-2">
                  <div className="w-16 text-muted-foreground text-sm">
                    {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                  </div>
                  <div className="flex-1">
                    {hourEvents.length > 0
                      ? hourEvents.map((event) => (
                          <div key={event.id} className="bg-primary/10 rounded-md p-2 mb-1 border-r-4 border-primary">
                            <p className="font-medium">{event.summary}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 ml-1 rtl:mr-1" />
                              {formatTime(new Date(event.start.dateTime), timeZone)} -{" "}
                              {formatTime(new Date(event.end.dateTime), timeZone)}
                            </div>
                            {event.location && <p className="text-xs text-muted-foreground mt-1">{event.location}</p>}
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    const { start, end } = getDateRange()
    const days = []
    let currentDay = start

    while (currentDay <= end) {
      days.push(currentDay)
      currentDay = addDays(currentDay, 1)
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-center mb-4">
          {format(start, "MMMM d")} - {format(end, "MMMM d, yyyy")}
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => (
              <div
                key={index}
                className={`border rounded-md p-2 min-h-[100px] ${isToday(day) ? "bg-primary/5 border-primary" : ""}`}
              >
                <div className="text-center mb-2 font-medium">
                  {format(day, "EEE")}
                  <div className={`text-sm ${isToday(day) ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </div>
                </div>

                <div className="space-y-1">
                  {getEventsForDay(day).map((event) => (
                    <div key={event.id} className="bg-primary/10 rounded-md p-1 text-xs" title={event.summary}>
                      <p className="truncate font-medium">{event.summary}</p>
                      <p className="text-muted-foreground truncate">
                        {formatTime(new Date(event.start.dateTime), timeZone)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Render month view
  const renderMonthView = () => {
    const days = generateMonthDays()

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-center mb-4">{format(currentDate, "MMMM yyyy")}</h3>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center font-medium text-sm p-1">
                {day}
              </div>
            ))}

            {days.map((day, index) => (
              <div
                key={index}
                className={`border rounded-md p-1 min-h-[80px] ${isToday(day) ? "bg-primary/5 border-primary" : ""}`}
              >
                <div className={`text-right text-sm ${isToday(day) ? "text-primary font-bold" : ""}`}>
                  {format(day, "d")}
                </div>

                <div className="space-y-1 mt-1">
                  {getEventsForDay(day)
                    .slice(0, 3)
                    .map((event) => (
                      <div key={event.id} className="bg-primary/10 rounded-md p-1 text-xs" title={event.summary}>
                        <p className="truncate">{event.summary}</p>
                      </div>
                    ))}

                  {getEventsForDay(day).length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{getEventsForDay(day).length - 3} مزید
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>گوگل کیلنڈر</span>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button variant="outline" size="sm" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("today")}>
              آج
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week" | "month")}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="day">دن</TabsTrigger>
            <TabsTrigger value="week">ہفتہ</TabsTrigger>
            <TabsTrigger value="month">مہینہ</TabsTrigger>
          </TabsList>

          <TabsContent value="day">{renderDayView()}</TabsContent>

          <TabsContent value="week">{renderWeekView()}</TabsContent>

          <TabsContent value="month">{renderMonthView()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
