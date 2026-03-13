import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

const steps = [
  "Use AI Consultant for first triage and structured summary.",
  "Track your medicines and expiry alerts in Medicine Cabinet.",
  "Use Symptom Tracker with adaptive fields (fever/headache).",
  "Find nearby care and outbreak signals on Map.",
  "Ask structured questions in Forum and review doctor answers.",
];

export default function Tutorial() {
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiFetch<{ data: { completed?: boolean } }>("/tutorial/status");
        setCompleted(Boolean(data?.completed));
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  const finish = async (skipped = false) => {
    try {
      await apiFetch("/tutorial/status", {
        method: "POST",
        body: { completed: !skipped, skipped },
      });
      setCompleted(!skipped);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-xl border border-border p-6">
            <h1 className="text-2xl font-display font-bold mb-2">Platform Tutorial</h1>
            {completed ? (
              <p className="text-sm text-success">Tutorial completed.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Step {index + 1} of {steps.length}</p>
            )}
            <div className="mt-6 p-4 rounded-lg bg-muted">
              <p>{steps[index]}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => setIndex((prev) => Math.max(0, prev - 1))} disabled={index === 0}>
                Back
              </Button>
              <Button onClick={() => setIndex((prev) => Math.min(steps.length - 1, prev + 1))} disabled={index === steps.length - 1}>
                Next
              </Button>
              <Button onClick={() => finish(false)} className="ml-auto">
                Mark Completed
              </Button>
              <Button variant="ghost" onClick={() => finish(true)}>
                Skip
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
