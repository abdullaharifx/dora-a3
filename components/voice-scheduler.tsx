"use client";

import { useState, useEffect } from "react";
import type { User } from "next-auth";
import VoiceRecorder from "./voice-recorder";
import TranscriptionDisplay from "./transcription-display";
import EventCard from "./event-card";
import TimeZoneSelector from "./timezone-selector";
import CalendarView from "./calendar-view";
import ChatBot from "./ChatBot";
import DebugInfo from "./debug-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { transcribeAudio } from "@/lib/transcribe";
import { extractEvent } from "@/lib/extract-event";
import { scheduleEvent, deleteEvent } from "@/lib/schedule-event";
import { CalendarPlus, Loader2, Trash2, Edit, Check, X, Calendar, AlertTriangle, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isDateInFuture, adjustEventDatesToFuture } from "@/lib/date-utils";

interface VoiceSchedulerProps {
  user: User;
}

interface EventItem {
  id: string;
  data: any;
  transcription: string;
  isScheduled: boolean;
  calendarEventId?: string;
  isEditing?: boolean;
  needsAdjustment?: boolean;
}

export default function VoiceScheduler({ user }: VoiceSchedulerProps) {
  const [activeTab, setActiveTab] = useState<"record" | "calendar" | "chat">("record");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [timeZone, setTimeZone] = useState<string>("Asia/Karachi");
  const { toast } = useToast();

  // Try to detect user's timezone on component mount
  useEffect(() => {
    try {
      const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTimeZone) {
        setTimeZone(detectedTimeZone);
      }
    } catch (error) {
      console.error("Error detecting timezone:", error);
    }
  }, []);

  const handleRecordingComplete = async (blob: Blob) => {
    setAudioBlob(blob);
    await processAudio(blob);
  };

  const processAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      // Log audio blob details
      console.log("Debug - Audio Blob:", {
        size: blob.size,
        type: blob.type,
        duration: blob.size > 0 ? "unknown" : "empty",
      });

      // Transcribe audio and save to Pinecone
      const result = await transcribeAudio(blob, true);
      console.log("Debug - TranscribeAudio Result:", result);

      const transcription = result?.transcription;
      if (!transcription || transcription.trim() === "") {
        console.error("Debug - Empty or invalid transcription:", transcription);
        toast({
          title: "ٹرانسکریپشن ناکام",
          description: "آواز سے کوئی متن نہیں مل سکا۔ براہ کرم واضح طور پر اردو میں بولیں اور دوبارہ کوشش کریں۔",
          variant: "destructive",
        });
        return;
      }

      setTranscription(transcription);

      setIsExtracting(true);
      const now = new Date();
      const currentDateTime = now.toISOString();

      const extractedEvent = await extractEvent(transcription, currentDateTime, timeZone);

      const startDate = new Date(extractedEvent.start.dateTime);
      const needsAdjustment = !isDateInFuture(startDate);
      const wasAdjusted = needsAdjustment && isDateInFuture(startDate);

      const newEventId = `event-${Date.now()}`;
      setEvents((prev) => [
        ...prev,
        {
          id: newEventId,
          data: extractedEvent,
          transcription: transcription,
          isScheduled: false,
          needsAdjustment: wasAdjusted,
        },
      ]);

      setTranscription("");
      setAudioBlob(null);

      toast({
        title: "ایونٹ کی معلومات نکال لی گئیں",
        description: wasAdjusted
          ? "ایونٹ کی تاریخ ماضی میں تھی، اسے مستقبل میں منتقل کر دیا گیا ہے۔"
          : "آپ کے ایونٹ کی تفصیلات کو کامیابی سے نکال لیا گیا ہے۔",
        variant: wasAdjusted ? "warning" : "default",
      });
    } catch (error: any) {
      console.error("Error processing audio:", error);
      toast({
        title: "پروسیسنگ میں خرابی",
        description: error.message || "آڈیو کو پروسیس کرنے میں خرابی ہوئی ہے۔ براہ کرم دوبارہ کوشش کریں۔",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
      setIsExtracting(false);
    }
  };

  const validateEventBeforeScheduling = (eventData: any) => {
    const startDate = new Date(eventData.start.dateTime);
    if (startDate.getFullYear() === 2023 && startDate.getMonth() === 9) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const oneHourLater = new Date(tomorrow);
      oneHourLater.setHours(10, 0, 0, 0);

      const adjustedEvent = {
        ...eventData,
        start: { ...eventData.start, dateTime: tomorrow.toISOString() },
        end: { ...eventData.end, dateTime: oneHourLater.toISOString() },
      };

      toast({
        title: "ایونٹ کی تاریخ ایڈجسٹ کی گئی",
        description: "ایونٹ کی تاریخ 2023 میں تھی، اسے کل کی تاریخ میں منتقل کر دیا گیا ہے۔",
        variant: "warning",
      });

      return adjustedEvent;
    }

    if (!isDateInFuture(startDate)) {
      const adjustedEvent = adjustEventDatesToFuture(eventData);

      toast({
        title: "ایونٹ کی تاریخ ایڈجسٹ کی گئی",
        description: "ایونٹ کی تاریخ ماضی میں تھی، اسے مستقبل میں منتقل کر دیا گیا ہے۔",
        variant: "warning",
      });

      return adjustedEvent;
    }

    return eventData;
  };

  const handleScheduleEvent = async (eventId: string) => {
    const eventToSchedule = events.find((e) => e.id === eventId);
    if (!eventToSchedule) return;

    const validatedEventData = validateEventBeforeScheduling(eventToSchedule.data);

    if (validatedEventData !== eventToSchedule.data) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, data: validatedEventData, needsAdjustment: true } : e)),
      );
    }

    setIsScheduling(true);
    try {
      const result = await scheduleEvent(validatedEventData);

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isScheduled: true, calendarEventId: result.id } : e)),
      );

      toast({
        title: "ایونٹ شیڈول ہو گیا",
        description: "آپ کا ایونٹ کامیابی سے گوگل کیلنڈر میں شامل کر دیا گیا ہے۔",
      });

      setActiveTab("calendar");
    } catch (error) {
      console.error("Error scheduling event:", error);
      toast({
        title: "شیڈولنگ میں خرابی",
        description: "ایونٹ کو شیڈول کرنے میں خرابی ہوئی ہے۔ براہ کرم دوبارہ کوشش کریں۔",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleScheduleAll = async () => {
    setIsScheduling(true);
    const unscheduledEvents = events.filter((e) => !e.isScheduled);

    if (unscheduledEvents.length === 0) {
      toast({
        title: "کوئی ایونٹ نہیں",
        description: "شیڈول کرنے کے لیے کوئی ایونٹ نہیں ہے۔",
      });
      setIsScheduling(false);
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;
      let adjustedCount = 0;

      for (const event of unscheduledEvents) {
        try {
          const validatedEventData = validateEventBeforeScheduling(event.data);
          const wasAdjusted = validatedEventData !== event.data;
          if (wasAdjusted) {
            adjustedCount++;
            setEvents((prev) =>
              prev.map((e) => (e.id === event.id ? { ...e, data: validatedEventData, needsAdjustment: true } : e)),
            );
          }

          const result = await scheduleEvent(validatedEventData);

          setEvents((prev) =>
            prev.map((e) => (e.id === event.id ? { ...e, isScheduled: true, calendarEventId: result.id } : e)),
          );
          successCount++;
        } catch (error) {
          console.error(`Error scheduling event ${event.id}:`, error);
          failCount++;
        }
      }

      let message = `${successCount} ایونٹس کامیابی سے شیڈول ہو گئے۔`;
      if (adjustedCount > 0) {
        message += ` ${adjustedCount} ایونٹس کی تاریخ ایڈجسٹ کی گئی۔`;
      }
      if (failCount > 0) {
        message += ` ${failCount} ایونٹس میں خرابی۔`;
      }

      toast({
        title: "ایونٹس شیڈول ہو گئے",
        description: message,
        variant: failCount > 0 ? "destructive" : adjustedCount > 0 ? "warning" : "default",
      });

      if (successCount > 0) {
        setActiveTab("calendar");
      }
    } catch (error) {
      console.error("Error in schedule all:", error);
      toast({
        title: "شیڈولنگ میں خرابی",
        description: "ایونٹس کو شیڈول کرنے میں خرابی ہوئی ہے۔",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const eventToDelete = events.find((e) => e.id === eventId);
    if (!eventToDelete) return;

    if (eventToDelete.isScheduled && eventToDelete.calendarEventId) {
      try {
        await deleteEvent(eventToDelete.calendarEventId);
        toast({
          title: "ایونٹ حذف ہو گیا",
          description: "آپ کا ایونٹ کامیابی سے گوگل کیلنڈر سے حذف کر دیا گیا ہے۔",
        });
      } catch (error) {
        console.error("Error deleting event from calendar:", error);
        toast({
          title: "حذف کرنے میں خرابی",
          description: "ایونٹ کو کیلنڈر سے حذف کرنے میں خرابی ہوئی ہے۔",
          variant: "destructive",
        });
        return;
      }
    }

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const toggleEditMode = (eventId: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, isEditing: !e.isEditing } : e)));
  };

  const updateEventData = (eventId: string, newData: any) => {
    const startDate = new Date(newData.start.dateTime);
    if (startDate.getFullYear() === 2023 && startDate.getMonth() === 9) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const oneHourLater = new Date(tomorrow);
      oneHourLater.setHours(10, 0, 0, 0);

      newData = {
        ...newData,
        start: { ...newData.start, dateTime: tomorrow.toISOString() },
        end: { ...newData.end, dateTime: oneHourLater.toISOString() },
      };

      toast({
        title: "ایونٹ کی تاریخ ایڈجسٹ کی گئی",
        description: "ایونٹ کی تاریخ 2023 میں تھی، اسے کل کی تاریخ میں منتقل کر دیا گیا ہے۔",
        variant: "warning",
      });
    }

    const needsAdjustment = !isDateInFuture(startDate);

    if (needsAdjustment) {
      newData = adjustEventDatesToFuture(newData);

      toast({
        title: "ایونٹ کی تاریخ ایڈجسٹ کی گئی",
        description: "ایونٹ کی تاریخ ماضی میں تھی، اسے مستقبل میں منتقل کر دیا گیا ہے۔",
        variant: "warning",
      });
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, data: newData, needsAdjustment: needsAdjustment } : e)),
    );
  };

  const resetAll = () => {
    setAudioBlob(null);
    setTranscription("");
    setEvents([]);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 text-white">
        <CardHeader>
          <CardTitle>اردو وائس شیڈیولر</CardTitle>
          <CardDescription className="text-gray-300">
            اپنے ایونٹس کو اردو میں بول کر شیڈول کریں یا چیٹ بوٹ سے اردو میں آواز یا متن کے ذریعے بات کریں
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <TimeZoneSelector value={timeZone} onChange={setTimeZone} />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "record" | "calendar" | "chat")}>
            <TabsList className="grid grid-cols-3 mb-4 bg-gray-700">
              <TabsTrigger value="record" className="text-gray-300">
                <Loader2 className="h-4 w-4 ml-2 rtl:mr-2" />
                ریکارڈنگ
              </TabsTrigger>
              <TabsTrigger value="calendar" className="text-gray-300">
                <Calendar className="h-4 w-4 ml-2 rtl:mr-2" />
                کیلنڈر
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-gray-300">
                <MessageSquare className="h-4 w-4 ml-2 rtl:mr-2" />
                چیٹ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record">
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

              {isTranscribing && (
                <div className="flex justify-center items-center py-4 text-gray-300">
                  <Loader2 className="h-6 w-6 animate-spin ml-2 rtl:mr-2" />
                  <span>آڈیو کو ٹرانسکرائب کیا جا رہا ہے...</span>
                </div>
              )}

              {transcription && <TranscriptionDisplay text={transcription} isLoading={isExtracting} />}

              {events.length > 0 && (
                <div className="mt-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-medium text-white">ایونٹس کی فہرست ({events.length})</h3>
                    <div className="space-x-2 rtl:space-x-reverse">
                      <Button
                        onClick={handleScheduleAll}
                        disabled={isScheduling || events.every((e) => e.isScheduled)}
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isScheduling ? <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" /> : null}
                        تمام شیڈول کریں
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                        <div className="mb-2">
                          <p className="text-sm text-gray-300">ٹرانسکرپشن: {event.transcription}</p>
                        </div>

                        {event.needsAdjustment && (
                          <Alert className="mb-4 bg-yellow-900 border-yellow-700 text-yellow-200">
                            <AlertTriangle className="h-4 w-4 text-yellow-200" />
                            <AlertTitle className="text-yellow-200">ایونٹ کی تاریخ ایڈجسٹ کی گئی</AlertTitle>
                            <AlertDescription className="text-yellow-300">
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
                            <Button
                              onClick={() => toggleEditMode(event.id)}
                              variant="outline"
                              size="sm"
                              className="bg-gray-600 text-white border-gray-500"
                            >
                              <Edit className="h-4 w-4 ml-2 rtl:mr-2" />
                              ترمیم کریں
                            </Button>
                          )}

                          {event.isEditing && (
                            <>
                              <Button
                                onClick={() => toggleEditMode(event.id)}
                                variant="outline"
                                size="sm"
                                className="bg-gray-600 text-white border-gray-500"
                              >
                                <Check className="h-4 w-4 ml-2 rtl:mr-2" />
                                محفوظ کریں
                              </Button>
                              <Button
                                onClick={() => toggleEditMode(event.id)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-300"
                              >
                                <X className="h-4 w-4 ml-2 rtl:mr-2" />
                                منسوخ کریں
                              </Button>
                            </>
                          )}

                          {!event.isScheduled && !event.isEditing && (
                            <Button
                              onClick={() => handleScheduleEvent(event.id)}
                              disabled={isScheduling}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {isScheduling ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                              ) : (
                                <CalendarPlus className="h-4 w-4 ml-2 rtl:mr-2" />
                              )}
                              شیڈول کریں
                            </Button>
                          )}

                          <Button
                            onClick={() => handleDeleteEvent(event.id)}
                            variant="destructive"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4 ml-2 rtl:mr-2" />
                            حذف کریں
                          </Button>
                        </div>

                        {event.isScheduled && (
                          <Alert className="mt-2 bg-green-900 text-green-200">
                            <Check className="h-4 w-4" />
                            <AlertTitle>شیڈول ہو گیا</AlertTitle>
                            <AlertDescription>
                              یہ ایونٹ آپ کے گوگل کیلنڈر میں شامل کر دیا گیا ہے۔
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>

                  {events.length > 0 && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={resetAll}
                        className="bg-gray-600 text-white border-gray-500"
                      >
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

            <TabsContent value="chat">
              <Card className="bg-gray-800 text-white">
                <CardHeader>
                  <CardTitle>چیٹ بوٹ</CardTitle>
                  <CardDescription className="text-gray-300">
                    اردو میں چیٹ بوٹ سے بات کریں یا اردو آواز کے ذریعے پیغام بھیجیں
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChatBot />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}