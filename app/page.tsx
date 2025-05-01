import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import VoiceScheduler from "@/components/voice-scheduler"
import LoginButton from "@/components/login-button"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">اردو وائس شیڈیولر</h1>

      {session ? (
        <VoiceScheduler user={session.user} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">براہ کرم لاگ ان کریں</h2>
            <p className="text-muted-foreground">
              وائس شیڈیولنگ کی خصوصیات تک رسائی حاصل کرنے کے لیے گوگل اکاؤنٹ کے ساتھ لاگ ان کریں
            </p>
          </div>
          <LoginButton />
        </div>
      )}
    </main>
  )
}
