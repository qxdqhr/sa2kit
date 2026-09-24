'use client';

import React, { useCallback, useState } from 'react';
import CardGachaViewer from '../components/CardGachaViewer';
import { CARD_BACK_URL } from '../data/cardManifest';
import type { CardDef, GachaPhase, MikuGachaPageProps } from '../types';
import { pickCard } from '../utils/pickCard';
import { playCardMusic, stopMusic } from '../utils/musicHooks';

function formatCardId(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

export const MikuGachaPage: React.FC<MikuGachaPageProps> = ({ className }) => {
  const [phase, setPhase] = useState<GachaPhase>('idle');
  const [targetCard, setTargetCard] = useState<CardDef | null>(null);
  const [revealedCard, setRevealedCard] = useState<CardDef | null>(null);
  const [flipToken, setFlipToken] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const busy = phase === 'drawing' || phase === 'loadingFace' || phase === 'flipping';

  const startDraw = useCallback(() => {
    setErrorMsg(null);
    stopMusic();
    setRevealedCard(null);
    setPhase('drawing');
    const card = pickCard();
    setTargetCard(card);
    setFlipToken((n) => n + 1);
  }, []);

  const handlePrimary = useCallback(() => {
    if (busy) return;
    startDraw();
  }, [busy, startDraw]);

  const handleFlipComplete = useCallback((card: CardDef) => {
    setRevealedCard(card);
    setPhase('revealed');
    playCardMusic(card);
  }, []);

  const handleLoadError = useCallback((err: Error) => {
    console.error('[mikuGacha]', err);
    setErrorMsg(err.message || '卡面加载失败');
    setTargetCard(null);
    setPhase('idle');
  }, []);

  const primaryLabel =
    phase === 'revealed' ? '再抽一次' : busy ? '抽卡中…' : '开始抽卡';

  return (
    <div
      className={`flex min-h-screen flex-col bg-slate-950 text-slate-100 ${className ?? ''}`}
    >
      <header className="shrink-0 px-4 py-4 text-center md:py-6">
        <h1 className="text-2xl font-bold tracking-wide text-cyan-300 md:text-3xl">
          初音抽卡
        </h1>
        <p className="mt-1 text-sm text-slate-400 md:text-base">
          点击开始，卡片翻转揭晓 — 等概率随机 145 张
        </p>
      </header>

      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-4 md:px-6">
        <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg md:min-h-[60vh]">
          <CardGachaViewer
            className="absolute inset-0"
            backUrl={CARD_BACK_URL}
            targetCard={targetCard}
            flipToken={flipToken}
            onFlipComplete={handleFlipComplete}
            onLoadError={handleLoadError}
            onPhaseChange={setPhase}
          />
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          {revealedCard && phase === 'revealed' && (
            <p className="text-lg font-semibold tabular-nums text-cyan-200 md:text-xl">
              {formatCardId(revealedCard.id)}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {revealedCard.name}
              </span>
            </p>
          )}

          {errorMsg && (
            <p className="text-sm text-rose-400" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={handlePrimary}
            className="w-full max-w-xs rounded-xl bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition enabled:hover:bg-cyan-400 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:text-lg"
          >
            {primaryLabel}
          </button>
        </div>
      </main>
    </div>
  );
};

export default MikuGachaPage;
