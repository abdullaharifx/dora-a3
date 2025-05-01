"use client"

import { useState } from "react"
import type { User } from "next-auth"
import VoiceRecorder from "./voice-recorder"
import TranscriptionDisplay from "./transcription-display"
import EventCard from "./event-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { transcribeAudio } from "@/lib/transcribe"
import { extractEvent } from "@/lib/extract-event"
import { scheduleEvent } from "@/lib/schedule-event"
import { CalendarPlus, Loader2 } from "lucide-react"

interface VoiceSchedulerProps {
  user: User
}

export default function VoiceScheduler({ user }: VoiceSchedulerProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcription, setTranscription] = useState<string>("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const { toast } = useToast()

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
      const extractedEvent = await extractEvent(transcriptionResult.text)
      setEventData(extractedEvent)
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

  const handleScheduleEvent = async () => {
    if (!eventData) return

    setIsScheduling(true)
    try {
      const result = await scheduleEvent(eventData)
      toast({
        title: "ایونٹ شیڈول ہو گیا",
        description: "آپ کا ایونٹ کامیابی سے گوگل کیلنڈر میں شامل کر دیا گیا ہے۔",
      })
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

  const resetAll = () => {
    setAudioBlob(null)
    setTranscription("")
    setEventData(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>اردو وائس شیڈیولر</CardTitle>
          <CardDescription>اپنے ایونٹس کو اردو میں بول کر شیڈول کریں</CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

          {isTranscribing && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin ml-2 rtl:mr-2" />
              <span>آڈیو کو ٹرانسکرائب کیا جا رہا ہے...</span>
            </div>
          )}

          {transcription && <TranscriptionDisplay text={transcription} isLoading={isExtracting} />}

          {eventData && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">ایونٹ کی تفصیلات</h3>
              <EventCard event={eventData} />

              <div className="flex justify-end mt-4">
                <Button onClick={handleScheduleEvent} disabled={isScheduling} className="flex items-center gap-2">
                  {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-5 w-5" />}
                  گوگل کیلنڈر میں شامل کریں
                </Button>
              </div>
            </div>
          )}

          {(transcription || eventData) && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={resetAll}>
                دوبارہ شروع کریں
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
