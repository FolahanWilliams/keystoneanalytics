import { useState } from "react";
import { EducationPanel } from "@/components/education/EducationPanel";
import { useSearchParams } from "react-router-dom";

export default function Learn() {
  const [searchParams] = useSearchParams();
  const defaultTopic = searchParams.get("topic") || undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Trading Education</h1>
        <p className="text-muted-foreground">
          Master trading concepts with AI-powered explanations tailored to your skill level.
        </p>
      </div>

      <EducationPanel defaultTopic={defaultTopic} />
    </div>
  );
}
