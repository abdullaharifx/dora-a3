"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface TranscriptionDisplayProps {
  text: string
  isLoading: boolean
}

export default function TranscriptionDisplay({ text, isLoading }: TranscriptionDisplayProps) {
  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-2">ٹرانسکرپشن</h3>
        <div className="p-4 bg-muted rounded-md min-h-[100px]">
          <p className="whitespace-pre-wrap text-right">{text}</p>

          {isLoading && (
            <div className="flex items-center mt-4">
              <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
              <span className="text-sm text-muted-foreground">ایونٹ کی معلومات نکالی جا رہی ہیں...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
