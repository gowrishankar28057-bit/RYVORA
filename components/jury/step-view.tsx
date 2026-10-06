import { EmergencyStep } from "@/components/jury/steps/emergency-step";
import { FailsafeStep } from "@/components/jury/steps/failsafe-step";
import { FinaleStep } from "@/components/jury/steps/finale-step";
import { HelmetDropStep } from "@/components/jury/steps/helmet-drop-step";
import { PrecheckBlockedStep } from "@/components/jury/steps/precheck-blocked-step";
import { ReconstructionStep } from "@/components/jury/steps/reconstruction-step";
import { RideStep } from "@/components/jury/steps/ride-step";
import { RiderCheckStep } from "@/components/jury/steps/rider-check-step";
import { SevereCrashStep } from "@/components/jury/steps/severe-crash-step";
import { SystemReadyStep } from "@/components/jury/steps/system-ready-step";
import { currentStep, type DemoAction, type DemoState } from "@/lib/jury/demo-machine";
import { RIDER_CHECK_INDEX } from "@/lib/jury/demo-script";

/** Renders the current step as a pure function of the machine state. */
export function StepView({ state, dispatch }: { state: DemoState; dispatch: (a: DemoAction) => void }) {
  const ms = state.elapsed;
  switch (currentStep(state).id) {
    case "precheck-blocked":
      return <PrecheckBlockedStep ms={ms} />;
    case "system-ready":
      return <SystemReadyStep ms={ms} />;
    case "ride":
      return <RideStep ms={ms} />;
    case "helmet-drop":
      return <HelmetDropStep ms={ms} />;
    case "severe-crash":
      return <SevereCrashStep ms={ms} />;
    case "rider-check":
      return (
        <RiderCheckStep
          ms={ms}
          riderOk={state.riderOk}
          onOk={() => dispatch({ type: "riderOk" })}
          onHelp={() => dispatch({ type: "needHelp" })}
          onContinue={() => dispatch({ type: "resume" })}
          onReplay={() => dispatch({ type: "jumpTo", index: RIDER_CHECK_INDEX, play: true })}
        />
      );
    case "emergency":
      return <EmergencyStep ms={ms} />;
    case "failsafe":
      return <FailsafeStep ms={ms} />;
    case "reconstruction":
      return <ReconstructionStep ms={ms} playing={state.status === "playing"} />;
    case "finale":
      return <FinaleStep ms={ms} onReplay={() => dispatch({ type: "start" })} />;
  }
}
