"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface TimeZoneSelectorProps {
  value: string
  onChange: (value: string) => void
}

export default function TimeZoneSelector({ value, onChange }: TimeZoneSelectorProps) {
  const [timeZones, setTimeZones] = useState<string[]>([
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Riyadh",
    "Europe/London",
    "America/New_York",
    "America/Los_Angeles",
  ])

  useEffect(() => {
    // Try to detect user's timezone if not already set
    if (!value) {
      try {
        const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (detectedTimeZone) {
          onChange(detectedTimeZone)
          // Add the detected timezone to the list if it's not already there
          if (!timeZones.includes(detectedTimeZone)) {
            setTimeZones((prev) => [...prev, detectedTimeZone])
          }
        }
      } catch (error) {
        console.error("Error detecting timezone:", error)
      }
    }
  }, [value, onChange, timeZones])

  return (
    <div className="space-y-2">
      <Label htmlFor="timezone">ٹائم زون</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="timezone" className="w-full">
          <SelectValue placeholder="ٹائم زون منتخب کریں" />
        </SelectTrigger>
        <SelectContent>
          {timeZones.map((tz) => (
            <SelectItem key={tz} value={tz}>
              {tz}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
