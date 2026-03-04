"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useBookingStore } from "@/stores/booking-store";
import { ProgressBar } from "./progress-bar";
import { StepService } from "./step-service";
import { StepStaff } from "./step-staff";
import { StepDatetime } from "./step-datetime";
import { StepInfo } from "./step-info";
import { StepConfirm } from "./step-confirm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BookingWizardProps {
  businessId: string;
  slug: string;
}

export function BookingWizard({ businessId, slug }: BookingWizardProps) {
  const { step, setStep, setBusiness } = useBookingStore();
  const stepRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(step);

  // Set business in store on mount
  useEffect(() => {
    setBusiness(businessId, slug);
  }, [businessId, slug, setBusiness]);

  // Animate step transitions
  useEffect(() => {
    if (!stepRef.current) return;
    const direction = step > prevStepRef.current ? 1 : -1;
    prevStepRef.current = step;

    gsap.fromTo(
      stepRef.current,
      { opacity: 0, x: direction * 40 },
      { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }
    );
  }, [step]);

  const handleBack = () => {
    if (step === 0) return;

    // Reset relevant fields when going back
    const store = useBookingStore.getState();
    if (step === 1) {
      // Going back from staff -> service: clear staff selection
      store.setStaff("", "");
    } else if (step === 2) {
      // Going back from datetime -> staff: clear date/time
      store.setDateTime("", "");
    }

    setStep(step - 1);
  };

  const steps = [
    <StepService key="service" slug={slug} />,
    <StepStaff key="staff" slug={slug} />,
    <StepDatetime key="datetime" slug={slug} />,
    <StepInfo key="info" slug={slug} />,
    <StepConfirm key="confirm" slug={slug} />,
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <ProgressBar currentStep={step} />

      {/* Back button */}
      {step > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      )}

      {/* Step content */}
      <div ref={stepRef}>
        {steps[step]}
      </div>
    </div>
  );
}
