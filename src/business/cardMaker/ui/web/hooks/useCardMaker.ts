'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CardData, AssetItem, CardMakerState } from '../../../domain/types';
import { CardMakerService } from '../services/cardMakerService';

export const useCardMaker = (initialCard?: CardData) => {
  const [state, setState] = useState<CardMakerState>({
    currentCard: initialCard || {
      characterName: '昴月朔星',
      characterDescription: 'よろしくお願いします！',
    },
    activeTab: 'base',
    assets: [],
    isLoading: false,
    isSaving: false,
  });

  const loadAssets = useCallback(async (category?: string, type?: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const assets = await CardMakerService.getAssets(category, type);
      setState((prev) => ({ ...prev, assets, isLoading: false }));
    } catch (error) {
      console.error('Failed to load assets:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const saveCard = useCallback(async () => {
    setState((prev) => ({ ...prev, isSaving: true }));
    try {
      const savedCard = state.currentCard.id
        ? await CardMakerService.updateCard(state.currentCard.id, state.currentCard)
        : await CardMakerService.saveCard(state.currentCard);

      setState((prev) => ({
        ...prev,
        currentCard: savedCard,
        isSaving: false,
      }));
      return savedCard;
    } catch (error) {
      console.error('Failed to save card:', error);
      setState((prev) => ({ ...prev, isSaving: false }));
      throw error;
    }
  }, [state.currentCard]);

  const updateCard = useCallback((updates: Partial<CardData>) => {
    setState((prev) => ({
      ...prev,
      currentCard: { ...prev.currentCard, ...updates },
    }));
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setState((prev) => ({ ...prev, activeTab: tabId }));
  }, []);

  const selectAsset = useCallback(
    (asset: AssetItem) => {
      const updates: Partial<CardData> = {};

      if (asset.type === 'avatar') {
        updates.avatarUrl = asset.fileUrl;
      } else if (asset.type === 'background') {
        updates.backgroundUrl = asset.fileUrl;
      }

      updateCard(updates);
    },
    [updateCard],
  );

  const uploadAsset = useCallback(async (file: File, type: string, category: string) => {
    try {
      const asset = await CardMakerService.uploadAsset(file, type, category, file.name);
      setState((prev) => ({
        ...prev,
        assets: [asset, ...prev.assets],
      }));
      return asset;
    } catch (error) {
      console.error('Failed to upload asset:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadAssets('base', 'avatar');
  }, [loadAssets]);

  return {
    state,
    actions: {
      loadAssets,
      saveCard,
      updateCard,
      setActiveTab,
      selectAsset,
      uploadAsset,
    },
  };
};
