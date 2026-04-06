import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";

const CONFIRM_MESSAGE =
  "Thank you, sweetheart. There's a little link headed to your inbox so I can remember you by name. Now, where were we?";

interface UseEmailGateReturn {
  /** Try to extract an email from user text. Returns true if captured. */
  tryCapture: (text: string) => Promise<boolean>;
  /** Confirmation message to show after email captured */
  confirmMessage: string;
  /** Whether an email was successfully captured */
  emailCaptured: boolean;
}

function extractEmail(text: string): string | null {
  const match = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  return match ? match[0] : null;
}

/**
 * Email gate — capture only. Donna handles the asking via her system
 * prompt (see [EMAIL_CONTEXT] in prompt-assembler.ts). This hook
 * only extracts emails from user input and triggers auth.
 */
export function useEmailGate(): UseEmailGateReturn {
  const { login, user } = useAuth();
  const [emailCaptured, setEmailCaptured] = useState(false);

  const tryCapture = useCallback(
    async (text: string): Promise<boolean> => {
      // Option B: skip email gate entirely if user is already authenticated
      if (user) return false;

      const email = extractEmail(text);
      if (!email) return false;

      try {
        const result = await login(email);
        if (result.success) {
          setEmailCaptured(true);
          return true;
        }
      } catch (err) {
        console.error("Email capture failed:", err);
      }
      return false;
    },
    [login, user],
  );

  return {
    tryCapture,
    confirmMessage: CONFIRM_MESSAGE,
    emailCaptured,
  };
}
