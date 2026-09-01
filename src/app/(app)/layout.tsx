"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { TopNav } from "@/components/TopNav";
import { DevPanel } from "@/components/DevPanel";
import { DailyReminder } from "@/components/DailyReminder";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const progress = useQuizStore((s) => s.progress);
  const hydrateProgress = useQuizStore((s) => s.hydrateProgress);
  const router = useRouter();
  const [booted, setBooted] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let mounted = true;

    // Initial: restore a logged-in session on fresh load (localStorage may
    // have been cleared while the server session is still valid).
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await hydrateProgress();
      if (mounted) setBooted(true);
    });

    // Live: sign-in / sign-out on this device.
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await hydrateProgress();
      } else if (event === "SIGNED_OUT") {
        useQuizStore.setState({
          progress: null,
          currentSession: null,
          practiceSession: null,
        });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrateProgress]);

  // booted = auth/session state resolved (true immediately in demo mode).
  // Only then is it safe to send a progress-less user to onboarding.
  useEffect(() => {
    if (booted && !progress) {
      router.replace("/onboarding");
    }
  }, [booted, progress, router]);

  if (!progress) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/10 border-t-primary" />
      </div>
    );
  }

  return (
    <>
      <BackgroundPattern />
      <TopNav />
      <DailyReminder />
      <DevPanel />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 md:pb-12">
        {children}
      </main>
    </>
  );
}
