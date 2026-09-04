import { useCallback } from 'react';
import { checkPopupConfigs } from './service';
import { useDeadlinePopupCore } from '../web/logic/shared/useDeadlinePopupCore';

export function useDeadlinePopup(
  businessModule: string,
  businessScene: string,
  baseUrl: string,
) {
  const fetchPopupConfigs = useCallback(
    async ({
      businessModule: moduleName,
      businessScene: sceneName,
      currentTime,
    }: {
      businessModule: string;
      businessScene: string;
      currentTime: string;
    }) =>
      checkPopupConfigs(
        {
          businessModule: moduleName,
          businessScene: sceneName,
          currentTime,
        },
        baseUrl,
      ),
    [baseUrl],
  );

  return useDeadlinePopupCore({
    businessModule,
    businessScene,
    fetchPopupConfigs,
  });
}

export default useDeadlinePopup;
