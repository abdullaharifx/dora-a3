"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { transcribeAudio } from "@/lib/transcribe";
import { chatWithBot } from "@/lib/chatWithBot";
import VoiceRecorder from "./voice-recorder";
import { Mic } from "lucide-react";


interface Message {
  role: "user" | "bot";
  content: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!inputText || inputText.trim() === "") {
      toast({
        title: "پیغام درکار ہے",
        description: "براہ کرم چیٹ کرنے کے لیے کچھ متن درج کریں۔",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Add user message to chat
      setMessages((prev) => [...prev, { role: "user", content: inputText }]);

      // Call server action
      const { response } = await chatWithBot(inputText);

      // Add bot response to chat
      setMessages((prev) => [...prev, { role: "bot", content: response }]);

      toast({
        title: "پیغام کامیاب",
        description: "بوٹ نے کامیابی سے جواب دیا۔",
      });

      // Clear input
      setInputText("");
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "چیٹ میں خرابی",
        description: error.message || "بوٹ سے جواب حاصل کرنے میں ناکامی۔",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = async (blob: Blob) => {
    setIsLoading(true);
    setIsRecording(false);
    try {
      // Transcribe audio in Urdu
      const { transcription } = await transcribeAudio(blob);
      if (!transcription || transcription.trim() === "") {
        throw new Error("کوئی ٹرانسکریپشن حاصل نہیں ہوئی");
      }

      // Add transcribed message to chat
      setMessages((prev) => [...prev, { role: "user", content: transcription }]);

      // Call chatbot with transcription
      const { response } = await chatWithBot(transcription);

      // Add bot response to chat
      setMessages((prev) => [...prev, { role: "bot", content: response }]);

      toast({
        title: "آڈیو پیغام کامیاب",
        description: "آپ کی اردو آواز ٹرانسکرائب ہوئی اور بوٹ نے جواب دیا۔",
      });
    } catch (error: any) {
      console.error("Voice chat error:", error);
      toast({
        title: "آڈیو میں خرابی",
        description: error.message || "آواز ٹرانسکرائب کرنے یا بوٹ سے جواب حاصل کرنے میں ناکامی۔",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-gray-800 p-4 rounded-md">
      {/* Chat messages */}
      <div className="h-96 overflow-y-auto space-y-4 bg-gray-700 p-4 rounded-md">
        {messages.length === 0 && (
          <p className="text-center text-gray-300">
            کوئی پیغامات نہیں۔ اردو میں متن درج کریں یا آواز ریکارڈ کریں۔
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded-md text-white ${
              message.role === "user" ? "bg-blue-600 text-right" : "bg-gray-600 text-left"
            }`}
          >
            <p className="font-medium">{message.role === "user" ? "آپ" : "بوٹ"}:</p>
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اردو میں پیغام درج کریں یا آواز ریکارڈ کریں۔ مثال: کل کا موسم کیسا ہوگا؟"
          rows={4}
          disabled={isLoading || isRecording}
          className="bg-gray-600 text-white placeholder-gray-300"
        />
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button
            onClick={handleSend}
            disabled={isLoading || isRecording}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "بھیج رہا ہے..." : "پیغام بھیجیں"}
          </Button>
          <Button
            onClick={() => setIsRecording(true)}
            disabled={isLoading || isRecording}
            variant="outline"
            className="bg-gray-600 text-white border-gray-500"
          >
            <Mic className="h-4 w-4 ml-2 rtl:mr-2" />
            {isRecording ? "ریکارڈنگ..." : "اردو میں آواز ریکارڈ کریں"}
          </Button>
        </div>
      </div>

      {/* Voice Recorder */}
      {isRecording && (
        <VoiceRecorder onRecordingComplete={handleRecordingComplete} autoStart={true} />
      )}
    </div>
  );
}