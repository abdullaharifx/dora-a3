"use client"

import { useState, useEffect } from "react"
import type { User } from "next-auth"
import VoiceRecorder from "./voice-recorder"
import TranscriptionDisplay from "./transcription-display"
import EventCard from "./event-card"
import TimeZoneSelector from "./timezone-selector"
import CalendarView from "./calendar-view"
import DateTest from "./date-test"
import DebugInfo from "./debug-info"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { transcribeAudio } from "@/lib/transcribe"
import { extractEvent } from "@/lib/extract-event"
import { scheduleEvent, deleteEvent } from "@/lib/schedule-event"
import { CalendarPlus, Loader2, Trash2, Edit, Check, X, Calendar, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isDateInFuture, adjustEventDatesToFuture } from "@/lib/date-utils"

interface VoiceSchedulerProps {
  user: User
}

interface EventItem {
  id: string
  data: any
  transcription: string
  isScheduled: boolean
  calendarEventId?: string
  isEditing?: boolean
  needsAdjustment?: boolean
}

export default function VoiceScheduler({ user }: VoiceSchedulerProps) {
  const [activeTab, setActiveTab] = useState<"record" | "calendar" | "test">("record")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcription, setTranscription] = useState<string>("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [events, setEvents] = useState<EventItem[]>([])
  const [timeZone, setTimeZone] = useState<string>("Asia/Karachi")
  const { toast } = useToast()

  // Try to detect user's timezone on component mount
  useEffect(() => {
    try {
      const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (detectedTimeZone) {
        setTimeZone(detectedTimeZone)
      }
    } catch (error) {
      console.error("Error detecting timezone:", error)
    }
  }, [])

  const handleRecordingComplete = async (blob: Blob) => {
    setAudioBlob(blob)
    await processAudio(blob)
  }

  const processAudio = async (blob: Blob) => {
    // Step 1: Transcribe audio
    setIsTranscribing(true)
    try {
      const transcriptionResult = await transcribeAudio(blob)
      setTranscription(transcriptionResult.text)

      // Step 2: Extract event data
      setIsExtracting(true)

      // Get the current date in a more explicit format
      const now = new Date()
      const currentDateTime = now.toISOString()

      const extractedEvent = await extractEvent(transcriptionResult.text, currentDateTime, timeZone)

      // Check if the event is in the future
      const startDate = new Date(extractedEvent.start.dateTime)
      const needsAdjustment = !isDateInFuture(startDate)

      // If the event was adjusted, we'll show a warning
      const wasAdjusted = needsAdjustment && isDateInFuture(startDate)

      // Add to events list
      const newEventId = `event-${Date.now()}`
      setEvents((prev) => [
        ...prev,
        {
          id: newEventId,
          data: extractedEvent,
          transcription: transcriptionResult.text,
          isScheduled: false,
          needsAdjustment: wasAdjusted,
        },
      ])

      // Reset current transcription
      setTranscription("")
      setAudioBlob(null)

      toast({
        title: "ایونٹ کی معلومات نکال لی گئیں",
        description: wasAdjusted
          ? "ایونٹ کی تاریخ ماضی میں تھی، اسے مستقبل میں منتقل کر دیا گیا ہے۔"
          : "آپ کے ایونٹ کی تفصیلات کو کامیابی سے نکال لیا گیا ہے۔",
        variant: wasAdjusted ? "warning" : "default",
      })
    } catch (error) {
      console.error("Error processing audio:", error)
      toast({
        title: "پروسیسنگ میں خرابی",
        description: "آڈیو کو پروسیس کرنے میں خرابی ہوئی ہے۔ براہ کرم دوبارہ کوشش کریں۔",
        variant: "destructive",
      })
    } finally {
      setIsTranscribing(false)
      setIsExtracting(false)
    }
  }

  const validateEventBeforeScheduling = (eventData: any) => {
    // Check if the event start time is in the future
    const startDate = new Date(eventData.start.dateTime)

    // Check if the date is in October 2023
    if (startDate.getFullYear() === 2023 && startDate.getMonth() === 9) {
      // October is month 9 in JS
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)

      const oneHourLater = new Date(tomorrow)
      oneHourLater.setHours(10, 0, 0, 0)

      const adjustedEvent = {
        ...eventData,
        start: {
          ...eventData.start,
          dateTime: tomorrow.toISOString(),
        },
        end: {
          ...eventData.end,
          dateTime: oneHourLater.toISOString(),
        },
      }

      toast({
        title: "ایونٹ کی تاریخ ایڈجسٹ کی گئی",
        description: "ایونٹ کی تاریخ 2023 میں تھی، اسے کل کی تاریخ میں منتقل کر دیا گیا ہے۔",
        variant: "warning",
      })

      return adjustedEvent
    }

    if (!isDateInFuture(startDate)) {
      // Adjust the event to be in the future
      const adjustedEvent = adjustEventDatesToFuture(eventData)

      toast({
        title: "ایونٹ کی تاریخ ایڈجسٹ کی گئی",
        description: "ایونٹ کی تاریخ ماضی میں تھی، اسے مستقبل میں منتقل کر دیا گیا ہے۔",
        variant: "warning",
      })

      return adjustedEvent
    }

    return eventData
  }

  const handleScheduleEvent = async (eventId: string) => {
    const eventToSchedule = events.find((e) => e.id === eventId)
    if (!eventToSchedule) return

    // Validate and potentially adjust the event
    const validatedEventData = validateEventBeforeScheduling(eventToSchedule.data)

    // Update the event data if it was adjusted
    if (validatedEventData !== eventToSchedule.data) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, data: validatedEventData, needsAdjustment: true } : e)),
      )
    }

    setIsScheduling(true)
    try {
      const result = await scheduleEvent(validatedEventData)

      // Update event with scheduled status and calendar ID
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isScheduled: true, calendarEventId: result.id } : e)),
      )

      toast({
        title: "ایونٹ شیڈول ہو گیا",
        description: "آپ کا ایونٹ کامیابی سے گوگل کیلنڈر میں شامل کر دیا گیا ہے۔",
      })

      // Switch to calendar view to see the new event
      setActiveTab("calendar")
    } catch (error) {
      console.error("Error scheduling event:", error)
      toast({
        title: "شیڈولنگ میں خرابی",
        description: "ایونٹ کو شیڈول کرنے میں خرابی ہوئی ہے۔ براہ کرم دوبارہ کوشش کریں۔",
        variant: "destructive",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const handleScheduleAll = async () => {
    setIsScheduling(true)
    const unscheduledEvents = events.filter((e) => !e.isScheduled)

    if (unscheduledEvents.length === 0) {
      toast({
        title: "کوئی ایونٹ نہیں",
        description: "شیڈول کرنے کے لیے کوئی ایونٹ نہیں ہے۔",
      })
      setIsScheduling(false)
      return
    }

    try {
      let successCount = 0
      let failCount = 0
      let adjustedCount = 0

      for (const event of unscheduledEvents) {
        try {
          // Validate and potentially adjust the event
          const validatedEventData = validateEventBeforeScheduling(event.data)

          // Check if the event was adjusted
          const wasAdjusted = validatedEventData !== event.data
          if (wasAdjusted) {
            adjustedCount++
            // Update the event data in state
            setEvents((prev) =>
              prev.map((e) => (e.id === event.id ? { ...e, data: validatedEventData, needsAdjustment: true } : e)),
            )
          }

          const result = await scheduleEvent(validatedEventData)

          // Update event with scheduled status
          setEvents((prev) =>
            prev.map((e) => (e.id === event.id ? { ...e, isScheduled: true, calendarEventId: result.id } : e)),
          )
          successCount++
        } catch (error) {
          console.error(`Error scheduling event ${event.id}:`, error)
          failCount++
        }
      }

      let message = `${successCount} ایونٹس کامیابی سے شیڈول ہو گئے۔`
      if (adjustedCount > 0) {
        message += ` ${adjustedCount} ایونٹس کی تاریخ ایڈجسٹ کی گئی۔`
      }
      if (failCount > 0) {
        message += ` ${failCount} ایونٹس میں خرابی۔`
      }

      toast({
        title: "ایونٹس شیڈول ہو گئے",
        description: message,
        variant: failCount > 0 ? "destructive" : adjustedCount > 0 ? "warning" : "default",
      })

      // Switch to calendar view to see the new events
      if (successCount > 0) {
        setActiveTab("calendar")
      }
    } catch (error) {
      console.error("Error in schedule all:", error)
      toast({
        title: "شیڈولنگ میں خرابی",
        description: "ایونٹس کو شیڈول کرنے میں خرابی ہوئی ہے۔",
        variant: "destructive",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    const eventToDelete = events.find((e) => e.id === eventId)
    if (!eventToDelete) return

    if (eventToDelete.isScheduled && eventToDelete.calendarEventId) {
      try {
        await deleteEvent(eventToDelete.calendarEventId)
        toast({
          title: "ایونٹ حذف ہو گیا",
          description: "آپ کا ایونٹ کامیابی سے گوگل کیلنڈر سے حذف کر دیا گیا ہے۔",
        })
      } catch (error) {
        console.error("Error deleting event from calendar:", error)
        toast({
          title: "حذف کرنے میں خرابی",
          description: "ایونٹ کو کیلنڈر سے حذف کرنے میں خرابی ہوئی ہے۔",
          variant: "destructive",
        })
        return
      }
    }

    // Remove from local state
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  const toggleEditMode = (eventId: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, isEditing: !e.isEditing } : e)))
  }

  const updateEventData = (eventId: string, newData: any) => {
    // Check if the date is in October 2023
    const startDate = new Date(newData.start.dateTime)
    if (startDate.getFullYear() === 2023 && startDate.getMonth() === 9) {
      // October is month 9 in JS
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)

      const oneHourLater = new Date(tomorrow)
      oneHourLater.setHours(10, 0, 0, 0)

      newData = {
        ...newData,
        start: {
          ...newData.start,
          dateTime: tomorrow.toISOString(),
        },
        end: {
          ...newData.end,
          dateTime: oneHourLater.toISOString(),
        },
      }

      toast({
        title: "ایونٹ کی تاریخ ایڈجسٹ کی گئی",
        description: "ایونٹ کی تاریخ 2023 میں تھی، اسے کل کی تاریخ میں منتقل کر دیا گیا ہے۔",
        variant: "warning",
      })
    }

    // Validate that the updated event is in the future
    const needsAdjustment = !isDateInFuture(startDate)

    if (needsAdjustment) {
      // Adjust the event to be in the future
      newData = adjustEventDatesToFuture(newData)

      toast({
        title: "ایونٹ کی تاریخ ایڈجسٹ کی گئی",
        description: "ایونٹ کی تاریخ ماضی میں تھی، اسے مستقبل میں منتقل کر دیا گیا ہے۔",
        variant: "warning",
      })
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, data: newData, needsAdjustment: needsAdjustment } : e)),
    )
  }

  const resetAll = () => {
    setAudioBlob(null)
    setTranscription("")
    setEvents([])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>اردو وائس شیڈیولر</CardTitle>
          <CardDescription>اپنے ایونٹس کو اردو میں بول کر شیڈول کریں</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <TimeZoneSelector value={timeZone} onChange={setTimeZone} />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "record" | "calendar" | "test")}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="record">
                <Loader2 className="h-4 w-4 ml-2 rtl:mr-2" />
                ریکارڈنگ
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 ml-2 rtl:mr-2" />
                کیلنڈر
              </TabsTrigger>
              <TabsTrigger value="test">تاریخ ٹیسٹ</TabsTrigger>
            </TabsList>

            <TabsContent value="record">
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

              {isTranscribing && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin ml-2 rtl:mr-2" />
                  <span>آڈیو کو ٹرانسکرائب کیا جا رہا ہے...</span>
                </div>
              )}

              {transcription && <TranscriptionDisplay text={transcription} isLoading={isExtracting} />}

              {events.length > 0 && (
                <div className="mt-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-medium">ایونٹس کی فہرست ({events.length})</h3>
                    <div className="space-x-2 rtl:space-x-reverse">
                      <Button
                        onClick={handleScheduleAll}
                        disabled={isScheduling || events.every((e) => e.isScheduled)}
                        variant="default"
                      >
                        {isScheduling ? <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" /> : null}
                        تمام شیڈول کریں
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground">ٹرانسکرپشن: {event.transcription}</p>
                        </div>

                        {event.needsAdjustment && (
                          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertTitle className="text-yellow-600">ایونٹ کی تاریخ ایڈجسٹ کی گئی</AlertTitle>
                            <AlertDescription className="text-yellow-700">
                              ایونٹ کی تاریخ ماضی میں تھی، اسے مستقبل میں منتقل کر دیا گیا ہے۔
                            </AlertDescription>
                          </Alert>
                        )}

                        <EventCard
                          event={event.data}
                          isEditable={!event.isScheduled}
                          isEditing={event.isEditing}
                          onEdit={(updatedData) => updateEventData(event.id, updatedData)}
                          timeZone={timeZone}
                        />

                        <div className="flex justify-end mt-4 space-x-2 rtl:space-x-reverse">
                          {!event.isScheduled && !event.isEditing && (
                            <Button onClick={() => toggleEditMode(event.id)} variant="outline" size="sm">
                              <Edit className="h-4 w-4 ml-2 rtl:mr-2" />
                              ترمیم کریں
                            </Button>
                          )}

                          {event.isEditing && (
                            <>
                              <Button onClick={() => toggleEditMode(event.id)} variant="outline" size="sm">
                                <Check className="h-4 w-4 ml-2 rtl:mr-2" />
                                محفوظ کریں
                              </Button>

                              <Button onClick={() => toggleEditMode(event.id)} variant="ghost" size="sm">
                                <X className="h-4 w-4 ml-2 rtl:mr-2" />
                                منسوخ کریں
                              </Button>
                            </>
                          )}

                          {!event.isScheduled && !event.isEditing && (
                            <Button onClick={() => handleScheduleEvent(event.id)} disabled={isScheduling} size="sm">
                              {isScheduling ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                              ) : (
                                <CalendarPlus className="h-4 w-4 ml-2 rtl:mr-2" />
                              )}
                              شیڈول کریں
                            </Button>
                          )}

                          <Button onClick={() => handleDeleteEvent(event.id)} variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 ml-2 rtl:mr-2" />
                            حذف کریں
                          </Button>
                        </div>

                        {event.isScheduled && (
                          <Alert className="mt-2 bg-green-50">
                            <Check className="h-4 w-4" />
                            <AlertTitle>شیڈول ہو گیا</AlertTitle>
                            <AlertDescription>یہ ایونٹ آپ کے گوگل کیلنڈر میں شامل کر دیا گیا ہے۔</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>

                  {events.length > 0 && (
                    <div className="flex justify-center mt-6">
                      <Button variant="outline" onClick={resetAll}>
                        سب کچھ صاف کریں
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <DebugInfo timeZone={timeZone} />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView timeZone={timeZone} />
            </TabsContent>

            <TabsContent value="test">
              <DateTest />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
