import { useState, useCallback } from "react";
import { ILoanTree } from "../../interfaces/loandocument";

export interface NavigationState {
  navigationStack: ILoanTree[];
  currentPath: string[];
}

export interface NavigationActions {
  navigateTo: (record: ILoanTree) => void;
  navigateBack: () => void;
  navigateToIndex: (index: number) => void;
  resetNavigation: () => void;
  navigateToPath: (stack: ILoanTree[], path: string[]) => void;
}

/**
 * Manages the folder-navigation stack and breadcrumb path for the Loan Dashboard.
 *
 * Extracted from LoanDashboard so the component itself only handles rendering.
 */
export const useNavigation = (): NavigationState & NavigationActions => {
  const [navigationStack, setNavigationStack] = useState<ILoanTree[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const navigateTo = useCallback((record: ILoanTree) => {
    setNavigationStack((prev) => [...prev, record]);
    setCurrentPath((prev) => [...prev, record.name]);
  }, []);

  const navigateBack = useCallback(() => {
    setNavigationStack((prev) => prev.slice(0, -1));
    setCurrentPath((prev) => prev.slice(0, -1));
  }, []);

  /** Jump to a specific breadcrumb by index (0-based). */
  const navigateToIndex = useCallback((index: number) => {
    setNavigationStack((prev) => prev.slice(0, index + 1));
    setCurrentPath((prev) => prev.slice(0, index + 1));
  }, []);

  const resetNavigation = useCallback(() => {
    setNavigationStack([]);
    setCurrentPath([]);
  }, []);

  /** Direct stack replacement – used by shortcut links like "Underwriting". */
  const navigateToPath = useCallback((stack: ILoanTree[], path: string[]) => {
    setNavigationStack(stack);
    setCurrentPath(path);
  }, []);

  return {
    navigationStack,
    currentPath,
    navigateTo,
    navigateBack,
    navigateToIndex,
    resetNavigation,
    navigateToPath,
  };
};
