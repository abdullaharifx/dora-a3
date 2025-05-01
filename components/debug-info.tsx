"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime, getCurrentDateTime } from "@/lib/date-utils"

interface DebugInfoProps {
  timeZone: string
}

export default function DebugInfo({ timeZone }: DebugInfoProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const zonedCurrentTime = getCurrentDateTime(timeZone)

  return (
    <div className="mt-4">
      <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)} className="mb-2">
        {isVisible ? "ڈیبگ معلومات چھپائیں" : "ڈیبگ معلومات دکھائیں"}
      </Button>

      {isVisible && (
        <Card>
          <CardHeader>
            <CardTitle>ڈیبگ معلومات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="font-medium">موجودہ تاریخ اور وقت (UTC):</p>
                <p>{currentTime.toISOString()}</p>
              </div>
              <div>
                <p className="font-medium">موجودہ تاریخ اور وقت ({timeZone}):</p>
                <p>
                  {formatDate(zonedCurrentTime, timeZone)} {formatTime(zonedCurrentTime, timeZone)}
                </p>
              </div>
              <div>
                <p className="font-medium">ٹائم زون:</p>
                <p>{timeZone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
