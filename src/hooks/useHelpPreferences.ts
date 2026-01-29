import { useLocalStorage } from "./useLocalStorage";

type HelpPreferences = {
  showContextualHelp: boolean;
  showEmptyStateHelp: boolean;
  dismissedHints: string[];
};

const defaultPreferences: HelpPreferences = {
  showContextualHelp: true,
  showEmptyStateHelp: true,
  dismissedHints: [],
};

export function useHelpPreferences() {
  const [preferences, setPreferences] = useLocalStorage<HelpPreferences>(
    "cap-finanzas-help-preferences",
    defaultPreferences
  );

  const toggleContextualHelp = () => {
    setPreferences((prev) => ({
      ...prev,
      showContextualHelp: !prev.showContextualHelp,
    }));
  };

  const toggleEmptyStateHelp = () => {
    setPreferences((prev) => ({
      ...prev,
      showEmptyStateHelp: !prev.showEmptyStateHelp,
    }));
  };

  const dismissHint = (hintId: string) => {
    setPreferences((prev) => ({
      ...prev,
      dismissedHints: prev.dismissedHints.includes(hintId)
        ? prev.dismissedHints
        : [...prev.dismissedHints, hintId],
    }));
  };

  const isHintDismissed = (hintId: string) => {
    return preferences.dismissedHints.includes(hintId);
  };

  const resetAllHelp = () => {
    setPreferences(defaultPreferences);
  };

  const disableAllHelp = () => {
    setPreferences({
      showContextualHelp: false,
      showEmptyStateHelp: false,
      dismissedHints: [],
    });
  };

  return {
    showContextualHelp: preferences.showContextualHelp,
    showEmptyStateHelp: preferences.showEmptyStateHelp,
    toggleContextualHelp,
    toggleEmptyStateHelp,
    dismissHint,
    isHintDismissed,
    resetAllHelp,
    disableAllHelp,
  };
}
