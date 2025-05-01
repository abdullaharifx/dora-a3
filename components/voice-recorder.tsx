"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Square, Play, Pause } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize audio element for playback
    if (typeof window !== "undefined") {
      audioRef.current = new Audio()
      audioRef.current.onended = () => setIsPlaying(false)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  const startRecording = async () => {
    audioChunksRef.current = []
    setAudioBlob(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
        onRecordingComplete(audioBlob)

        // Stop all tracks of the stream
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "مائیکروفون تک رسائی میں خرابی",
        description: "براہ کرم مائیکروفون تک رسائی کی اجازت دیں",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const togglePlayback = () => {
    if (!audioBlob) return

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
    } else {
      if (audioRef.current) {
        const audioUrl = URL.createObjectURL(audioBlob)
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center space-x-4 rtl:space-x-reverse">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="w-40"
            >
              {isRecording ? (
                <>
                  <Square className="h-5 w-5 ml-2 rtl:mr-2" />
                  ریکارڈنگ روکیں
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 ml-2 rtl:mr-2" />
                  ریکارڈ کریں
                </>
              )}
            </Button>

            {audioBlob && (
              <Button onClick={togglePlayback} variant="outline" size="lg" className="w-40" disabled={!audioBlob}>
                {isPlaying ? (
                  <>
                    <Pause className="h-5 w-5 ml-2 rtl:mr-2" />
                    روکیں
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 ml-2 rtl:mr-2" />
                    سنیں
                  </>
                )}
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center justify-center h-8">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="mr-2 rtl:ml-2">ریکارڈنگ جاری ہے...</span>
            </div>
          )}

          {audioBlob && !isRecording && <div className="text-sm text-muted-foreground">آڈیو ریکارڈ کر لیا گیا ہے</div>}
        </div>
      </CardContent>
    </Card>
  )
}
