import { Steps } from "@/types";
import { createContext, useContext } from "react";

export const ConvertWizardContext = createContext<{
  steps: Steps;
} | null>(null);

export const useConvertWizardContext = () => {
  const value = useContext(ConvertWizardContext);
  if (!value) {
    throw new Error(
      "useConvertWizardContext must be used within a ConvertWizardProvider"
    );
  }
  return value;
};
