'use client';

import React, { useState } from 'react';
import { AuthGuard } from 'sa2kit/common/auth/components';
import { CharacterDisplay } from '../components/CharacterDisplay';
import { ActionButtons } from '../components/ActionButtons';
import { TabNavigation } from '../components/TabNavigation';
import { AssetGrid } from '../components/AssetGrid';
import { useCardMaker } from '../hooks/useCardMaker';
import type { TabData } from '../../../domain/types';

const TABS: TabData[] = [
  { id: 'base', text: 'ベース', active: false },
  { id: 'parts', text: 'パーツ', active: false },
  { id: 'idol', text: 'Pアイドル', active: false },
  { id: 'support', text: 'サポート', active: false },
  { id: 'photo', text: 'フォト', active: false },
  { id: 'other', text: 'その他', active: false },
];

const CardMakerPageContent: React.FC = () => {
  const { state, actions } = useCardMaker();
  const [showNameModal, setShowNameModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [tempName, setTempName] = useState(state.currentCard.characterName);
  const [tempComment, setTempComment] = useState(state.currentCard.characterDescription || '');

  const handleTabChange = (tabId: string) => {
    actions.setActiveTab(tabId);
    if (tabId === 'base') {
      actions.loadAssets('base', 'avatar');
    } else if (tabId === 'parts') {
      actions.loadAssets('parts', 'avatar');
    } else {
      actions.loadAssets(tabId, 'background');
    }
  };

  const handleAssetUpload = async (file: File) => {
    try {
      const type = state.activeTab === 'base' ? 'avatar' : 'background';
      await actions.uploadAsset(file, type, state.activeTab);
    } catch {
      alert('上传失败，请重试');
    }
  };

  const handleSave = async () => {
    try {
      await actions.saveCard();
      alert('保存成功！');
    } catch {
      alert('保存失败，请重试');
    }
  };

  const handleNameUpdate = () => {
    actions.updateCard({ characterName: tempName });
    setShowNameModal(false);
  };

  const handleCommentUpdate = () => {
    actions.updateCard({ characterDescription: tempComment });
    setShowCommentModal(false);
  };

  const currentTabs = TABS.map((tab) => ({
    ...tab,
    active: tab.id === state.activeTab,
  }));

  return (
    <div className="min-h-screen bg-gray-100 relative max-w-72">
      <div className="bg-white shadow-lg min-h-screen">
        <CharacterDisplay card={state.currentCard} />

        <ActionButtons
          onConfigChange={() => {}}
          onNameChange={() => setShowNameModal(true)}
          onCommentEdit={() => setShowCommentModal(true)}
          onSave={handleSave}
          isSaving={state.isSaving}
        />

        <TabNavigation
          tabs={currentTabs}
          activeTab={state.activeTab}
          onTabChange={handleTabChange}
          className="sticky top-0 z-10"
        />

        <AssetGrid
          assets={state.assets}
          onSelect={actions.selectAsset}
          onUpload={handleAssetUpload}
          type={state.activeTab === 'base' || state.activeTab === 'parts' ? 'avatar' : 'background'}
          category={state.activeTab}
          className="pb-20"
        />
      </div>

      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">名前変更</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
              placeholder="角色名称"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                キャンセル
              </button>
              <button
                onClick={handleNameUpdate}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">コメント編集</h3>
            <textarea
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 h-24 resize-none"
              placeholder="角色描述"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCommentModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                キャンセル
              </button>
              <button
                onClick={handleCommentUpdate}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-between px-5 shadow-lg"
        style={{
          maxWidth: '448px',
          height: '80px',
        }}
      >
        <button
          onClick={() => window.history.back()}
          className="bg-black/70 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg hover:bg-black/80 transition-colors"
          style={{
            width: '48px',
            height: '48px',
          }}
        >
          ‹‹
        </button>

        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500 mr-2">ベース</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-purple-200 to-pink-200 rounded-md filter blur-[2px] opacity-60"
                style={{
                  width: '48px',
                  height: '32px',
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">パーツ</span>
        </div>
      </div>
    </div>
  );
};

export default function CardMakerPage() {
  return (
    <AuthGuard requireAuth>
      <CardMakerPageContent />
    </AuthGuard>
  );
}
