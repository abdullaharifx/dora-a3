"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { extractEvent } from "@/lib/extract-event"

export default function DateTest() {
  const [testText, setTestText] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTest = async () => {
    if (!testText) {
      toast({
        title: "متن درکار ہے",
        description: "براہ کرم ٹیسٹ کرنے کے لیے کچھ متن درج کریں۔",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const now = new Date()
      const currentDateTime = now.toISOString()
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

      const extractedEvent = await extractEvent(testText, currentDateTime, timeZone)
      setResult(extractedEvent)

      toast({
        title: "ٹیسٹ کامیاب",
        description: "ایونٹ کی معلومات کامیابی سے نکال لی گئیں۔",
      })
    } catch (error: any) {
      console.error("Test error:", error)
      toast({
        title: "ٹیسٹ میں خرابی",
        description: error.message || "ایونٹ کی معلومات نکالنے میں خرابی ہوئی ہے۔",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>تاریخ ٹیسٹ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="ٹیسٹ کرنے کے لیے اردو متن درج کریں۔ مثال: کل صبح 9 بجے میٹنگ ہے۔"
              rows={4}
            />
          </div>

          <Button onClick={handleTest} disabled={isLoading}>
            {isLoading ? "ٹیسٹ ہو رہا ہے..." : "ٹیسٹ کریں"}
          </Button>

          {result && (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">نتیجہ:</h3>
              <div className="bg-muted p-4 rounded-md">
                <p>
                  <strong>عنوان:</strong> {result.summary}
                </p>
                <p>
                  <strong>شروع:</strong> {new Date(result.start.dateTime).toLocaleString()}
                </p>
                <p>
                  <strong>اختتام:</strong> {new Date(result.end.dateTime).toLocaleString()}
                </p>
                <p>
                  <strong>ٹائم زون:</strong> {result.start.timeZone}
                </p>
                {result.location && (
                  <p>
                    <strong>مقام:</strong> {result.location}
                  </p>
                )}
                {result.description && (
                  <p>
                    <strong>تفصیل:</strong> {result.description}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <h4 className="font-medium">خام JSON:</h4>
                <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
