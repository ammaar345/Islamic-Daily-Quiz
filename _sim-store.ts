/**
 * Simulates the EXACT store flow: signIn -> startQuiz -> answer x5 -> finishQuiz.
 * Replicates zustand persist in Node (localStorage absent -> no-op persistence).
 */
import { useQuizStore } from "./src/lib/store";
import { isQuizDone } from "./src/lib/progress";

async function main() {
  const store = useQuizStore;

  await store.getState().signIn("T", "t@t.com", "testpass");

  // hydrate state from getState() directly (simulating a fresh page)
  let started = store.getState().startQuiz();
  console.log("startQuiz:", started);

  const s0 = store.getState();
  console.log("after start: currentSession?", !!s0.currentSession, "| sessions len:", s0.progress?.sessions.length);

  const questions = s0.currentSession!.questions;
  // answer all 5 correctly
  let qcount = 0;
  for (const q of questions) {
    store.getState().answer(q.id, q.answerIndex);
    qcount++;
  }
  const s1 = store.getState();
  console.log(
    `after ${qcount} answer(): xp=${s1.progress?.xp} | session.answers=${s1.currentSession?.answers.length} | progress.sessions=${s1.progress?.sessions.length}`,
  );

  store.getState().finishQuiz();
  const s2 = store.getState();
  console.log("after finishQuiz():");
  console.log("  currentSession:", s2.currentSession);
  console.log("  progress.sessions.length:", s2.progress?.sessions.length);
  console.log("  progress.xp:", s2.progress?.xp);
  console.log("  progress.streak:", s2.progress?.streak);
  console.log("  progress.lastQuizDate:", s2.progress?.lastQuizDate);
  console.log("  isQuizDone(progress):", isQuizDone(s2.progress!));
  console.log("  canPlayToday(progress):", !isQuizDone(s2.progress!));

  // Replay exploit: start a second quiz same day
  const again = store.getState().startQuiz();
  console.log("  startQuiz again same day (should be blocked if gate works):", again);
}

main().catch((e) => {
  console.error("SIM ERROR", e);
  process.exit(1);
});
