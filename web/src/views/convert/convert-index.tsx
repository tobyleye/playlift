import { useEffect } from "react";
import { useConvertWizardContext } from "./context";
import { useNavigate } from "react-router-dom";

export default function ConvertIndex() {
  const value = useConvertWizardContext();
  const navigate = useNavigate();
  useEffect(() => {
    // find the first step that is not completed and redirect to it
    const firstIncompleteStep = value.steps.find((step) => !step.completed);
    if (firstIncompleteStep) {
      navigate(`/convert/${firstIncompleteStep.path}`, { replace: true });
    } else {
      navigate(`/convert/connect-youtube`, { replace: true });
    }
  }, [value.steps, navigate]);

  return null;
}
