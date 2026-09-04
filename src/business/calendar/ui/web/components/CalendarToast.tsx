'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toastClass } from '../calendarStyles';

export interface CalendarToastProps {
  message: string | null;
  variant?: 'success' | 'error';
}

export default function CalendarToast({
  message,
  variant = 'success',
}: CalendarToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className={toastClass(variant === 'error')}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
