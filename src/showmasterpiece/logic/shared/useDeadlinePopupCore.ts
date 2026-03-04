import { useCallback, useState } from 'react';
import type { PopupConfig } from '../../types/popup';

interface PopupDisplayState {
  configs: PopupConfig[];
  loading: boolean;
  error: string | null;
  hasPopup: boolean;
}

interface CheckPopupParams {
  businessModule: string;
  businessScene: string;
  currentTime: string;
}

type FetchPopupConfigs = (params: CheckPopupParams) => Promise<PopupConfig[]>;

interface UseDeadlinePopupCoreOptions {
  businessModule: string;
  businessScene: string;
  fetchPopupConfigs: FetchPopupConfigs;
}

export function useDeadlinePopupCore(options: UseDeadlinePopupCoreOptions) {
  const { businessModule, businessScene, fetchPopupConfigs } = options;

  const [state, setState] = useState<PopupDisplayState>({
    configs: [],
    loading: false,
    error: null,
    hasPopup: false,
  });
  const [dismissedPopups, setDismissedPopups] = useState<Set<string>>(new Set());

  const runCheck = useCallback(
    async (ignoreDismissed: boolean, currentTime?: Date) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const configs = await fetchPopupConfigs({
          businessModule,
          businessScene,
          currentTime: (currentTime || new Date()).toISOString(),
        });

        const activeConfigs = configs.filter((config) => {
          if (ignoreDismissed && config.blockProcess) return true;
          return !dismissedPopups.has(config.id);
        });

        setState((prev) => ({
          ...prev,
          configs: activeConfigs,
          loading: false,
          hasPopup: activeConfigs.length > 0,
        }));

        return activeConfigs;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : '检查弹窗失败',
          configs: [],
          hasPopup: false,
        }));
        return [];
      }
    },
    [businessModule, businessScene, dismissedPopups, fetchPopupConfigs],
  );

  const checkPopups = useCallback((currentTime?: Date) => runCheck(false, currentTime), [runCheck]);
  const triggerCheck = useCallback((currentTime?: Date) => runCheck(true, currentTime), [runCheck]);

  const closePopup = useCallback((configId: string) => {
    setDismissedPopups((prev) => new Set([...prev, configId]));
    setState((prev) => {
      const next = prev.configs.filter((config) => config.id !== configId);
      return {
        ...prev,
        configs: next,
        hasPopup: next.length > 0,
      };
    });
  }, []);

  const confirmPopup = useCallback((configId: string) => closePopup(configId), [closePopup]);
  const cancelPopup = useCallback((configId: string) => closePopup(configId), [closePopup]);

  const temporaryClosePopup = useCallback((configId: string) => {
    setState((prev) => {
      const next = prev.configs.filter((config) => config.id !== configId);
      return {
        ...prev,
        configs: next,
        hasPopup: next.length > 0,
      };
    });
  }, []);

  const resetDismissedPopups = useCallback(() => {
    setDismissedPopups(new Set());
  }, []);

  return {
    ...state,
    checkPopups,
    triggerCheck,
    closePopup,
    confirmPopup,
    cancelPopup,
    temporaryClosePopup,
    resetDismissedPopups,
  };
}

