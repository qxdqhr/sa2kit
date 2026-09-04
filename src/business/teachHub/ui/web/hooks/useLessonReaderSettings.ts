'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getLessonReaderSettings,
  LESSON_READER_SETTINGS_EVENT,
  saveLessonReaderSettings,
  type LessonReaderBarPosition,
  type LessonReaderSettings,
} from '../utils/lessonReaderSettings';

export function useLessonReaderSettings() {
  const [settings, setSettings] = useState<LessonReaderSettings>(() => getLessonReaderSettings());

  const refresh = useCallback(() => {
    setSettings(getLessonReaderSettings());
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(LESSON_READER_SETTINGS_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(LESSON_READER_SETTINGS_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refresh]);

  const setBarPosition = useCallback((barPosition: LessonReaderBarPosition) => {
    setSettings(saveLessonReaderSettings({ barPosition }));
  }, []);

  const setBarExpanded = useCallback((barExpanded: boolean) => {
    setSettings(saveLessonReaderSettings({ barExpanded }));
  }, []);

  return {
    settings,
    setBarPosition,
    setBarExpanded,
  };
}
