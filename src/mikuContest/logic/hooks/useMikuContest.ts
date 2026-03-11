import { useMemo, useState } from 'react';
import { createMikuContestService, type MikuContestServiceOptions } from '../../server';

export const useMikuContest = (options?: MikuContestServiceOptions) => {
  const [service] = useState(() => createMikuContestService(options));
  const [version, setVersion] = useState(0);

  const refresh = () => setVersion((value) => value + 1);

  const snapshot = useMemo(() => {
    void version;
    return service.getSnapshot();
  }, [service, version]);

  return {
    service,
    snapshot,
    refresh,
  };
};
