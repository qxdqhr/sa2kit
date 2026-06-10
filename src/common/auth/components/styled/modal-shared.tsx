'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const overlayClass =
  'fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4';
const panelClass =
  'bg-white rounded-2xl shadow-xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto relative';
const closeBtnClass =
  'absolute top-5 right-5 bg-transparent border-none text-gray-500 cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-9 min-h-9 flex items-center justify-center';
const inputClass =
  'w-full py-3 px-4 pl-12 border-2 border-gray-200 rounded-lg text-base transition-all box-border min-h-12 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';
const submitClass =
  'w-full bg-blue-500 text-white border-none py-3.5 px-6 rounded-lg text-base font-medium cursor-pointer transition-all mt-2 min-h-[52px] hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2';
const errorClass =
  'text-red-500 text-sm my-4 p-3 bg-red-50 border border-red-200 rounded-lg leading-relaxed';
const linkBtnClass =
  'bg-transparent border-none text-blue-500 cursor-pointer text-sm font-medium underline px-1 py-0.5 rounded transition-all hover:text-blue-600 hover:bg-blue-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

export function useClientMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function AuthModalPortal({ children }: { children: React.ReactNode }) {
  const mounted = useClientMounted();
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export const authModalStyles = {
  overlayClass,
  panelClass,
  closeBtnClass,
  inputClass,
  submitClass,
  errorClass,
  linkBtnClass,
};
