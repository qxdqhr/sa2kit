'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MMDPlayerEnhanced } from './MMDPlayerEnhanced';
import type { MMDPlaylistProps, MMDPlaylistNode } from '../types';

export const MMDPlaylist: React.FC<MMDPlaylistProps> = ({
  playlist,
  stage,
  defaultNodeIndex = 0,
  className,
  style,
  onLoad,
  onError,
  onNodeChange,
  onPlaylistComplete,
}) => {
  const [currentNodeIndex, setCurrentNodeIndex] = useState<number>(defaultNodeIndex);
  const [editableNodes, setEditableNodes] = useState<MMDPlaylistNode[]>(playlist.nodes);
  const [showSettings, setShowSettings] = useState(false);
  const currentNodeIndexRef = useRef<number>(defaultNodeIndex);

  useEffect(() => {
    currentNodeIndexRef.current = currentNodeIndex;
    console.log(`[MMDPlaylist] currentNodeIndex updated to: ${currentNodeIndex}`);
  }, [currentNodeIndex]);

  const currentNode = editableNodes[currentNodeIndex];

  useEffect(() => {
    if (currentNode) {
      console.log(`[MMDPlaylist] Node changed. Firing onNodeChange for index ${currentNodeIndex}.`);
      onNodeChange?.(currentNodeIndex, currentNode);
    }
  }, [currentNodeIndex, currentNode, onNodeChange]);

  const handlePlaybackEnded = useCallback(() => {
    console.log(`[MMDPlaylist] handlePlaybackEnded called for node index: ${currentNodeIndexRef.current}`);
    const currentIndex = currentNodeIndexRef.current;
    const currentNodes = editableNodes; // Use a stable reference inside the callback
    const isLastNode = currentIndex === currentNodes.length - 1;
    const node = currentNodes[currentIndex];

    if (node?.loop) {
      console.log('[MMDPlaylist] Current node is set to loop. Not advancing.');
      return;
    }

    if (!isLastNode) {
      console.log('[MMDPlaylist] Not the last node. Advancing to next node.');
      setCurrentNodeIndex(currentIndex + 1);
    } else if (playlist.loop) {
      console.log('[MMDPlaylist] Last node reached and playlist is set to loop. Returning to start.');
      setCurrentNodeIndex(0);
    } else {
      console.log('[MMDPlaylist] Playlist finished.');
      onPlaylistComplete?.();
    }
  }, [editableNodes, playlist.loop, onPlaylistComplete]);

  const playlistPrevious = () => {
    const newIndex = currentNodeIndex > 0 ? currentNodeIndex - 1 : editableNodes.length - 1;
    setCurrentNodeIndex(newIndex);
  };

  const playlistNext = () => {
    const newIndex = currentNodeIndex < editableNodes.length - 1 ? currentNodeIndex + 1 : 0;
    setCurrentNodeIndex(newIndex);
  };
  
  const playlistJumpTo = (index: number) => {
    if (index >= 0 && index < editableNodes.length) {
      setCurrentNodeIndex(index);
    }
  };

  const handleDeleteNode = (index: number) => {
    if (editableNodes.length <= 1) {
      alert('Playlist must have at least one node.');
      return;
    }

    const newNodes = editableNodes.filter((_, i) => i !== index);
    setEditableNodes(newNodes);

    if (index < currentNodeIndex) {
      setCurrentNodeIndex(currentNodeIndex - 1);
    } else if (index === currentNodeIndex) {
      setCurrentNodeIndex(Math.max(0, currentNodeIndex - 1));
    }
  };

  const handleMoveNodeUp = (index: number) => {
    if (index === 0) return;
    
    const newNodes = [...editableNodes];
    const temp = newNodes[index - 1]!;
    newNodes[index - 1] = newNodes[index]!;
    newNodes[index] = temp;
    setEditableNodes(newNodes);
    
    if (currentNodeIndex === index) {
      setCurrentNodeIndex(index - 1);
    } else if (currentNodeIndex === index - 1) {
      setCurrentNodeIndex(index);
    }
  };

  const handleMoveNodeDown = (index: number) => {
    if (index === editableNodes.length - 1) return;
    
    const newNodes = [...editableNodes];
    const temp = newNodes[index]!;
    newNodes[index] = newNodes[index + 1]!;
    newNodes[index + 1] = temp;
    setEditableNodes(newNodes);
    
    if (currentNodeIndex === index) {
      setCurrentNodeIndex(index + 1);
    } else if (currentNodeIndex === index + 1) {
      setCurrentNodeIndex(index);
    }
  };
  
  if (!currentNode) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <p>Invalid playlist node index.</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ''}`} style={style}>
      <MMDPlayerEnhanced
        key={currentNode.id} // Key ensures component re-mounts on node change
        resources={currentNode.resources}
        stage={stage}
        autoPlay={playlist.autoPlay}
        loop={currentNode.loop || false}
        className="h-full w-full"
        onLoad={onLoad}
        onError={onError}
        onAudioEnded={() => {
          console.log(`[MMDPlaylist] onAudioEnded event received for node ${currentNodeIndex}`);
          handlePlaybackEnded();
        }}
        onAnimationEnded={() => {
          console.log(`[MMDPlaylist] onAnimationEnded event received for node ${currentNodeIndex}`);
          handlePlaybackEnded();
        }}
      />
      
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          {editableNodes.length > 1 && (
            <button
              onClick={playlistPrevious}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-blue-600 hover:scale-110"
              title="Previous Node"
            >
              ⏮️
            </button>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-purple-600 hover:scale-110"
            title="Playlist Settings"
          >
            ⚙️
          </button>

          {editableNodes.length > 1 && (
            <button
              onClick={playlistNext}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/90 text-xl text-white shadow-lg backdrop-blur-md transition-all hover:bg-blue-600 hover:scale-110"
              title="Next Node"
            >
              ⏭️
            </button>
          )}
        </div>

      {showSettings && (
        <div 
          className="absolute inset-0 z-[100] flex items-start justify-end bg-black/40" 
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="relative m-4 flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-white/20"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-4 py-3 flex-shrink-0">
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                ⚙️ Playlist Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xl text-white/60 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                <div className="rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  📝 Node Management
                </h4>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                  {editableNodes.map((node, index) => (
                    <div
                      key={`${node.id}-${index}`}
                      className={`rounded-md p-2 transition-all text-xs ${
                        currentNodeIndex === index
                          ? 'bg-gradient-to-r from-purple-600/50 to-blue-600/50 border border-purple-400/50'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-bold text-white/40">#{index + 1}</span>
                            <h5 className="font-semibold text-white text-xs truncate">{node.name}</h5>
                            {currentNodeIndex === index && (
                              <span className="rounded bg-green-500/30 px-1 py-0.5 text-[10px] text-green-300 flex-shrink-0">
                                ▶️
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          {index > 0 && (
                            <button
                              onClick={() => handleMoveNodeUp(index)}
                              className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] transition-colors"
                              title="Move Up"
                            >
                              ⬆️
                            </button>
                          )}
                          {index < editableNodes.length - 1 && (
                            <button
                              onClick={() => handleMoveNodeDown(index)}
                              className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] transition-colors"
                              title="Move Down"
                            >
                              ⬇️
                            </button>
                          )}
                          <button
                            onClick={() => playlistJumpTo(index)}
                            className="p-0.5 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white text-[10px] transition-colors"
                            title="Jump"
                          >
                            ▶️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
                                handleDeleteNode(index);
                              }
                            }}
                            className="p-0.5 rounded bg-red-500/30 hover:bg-red-500/50 text-white text-[10px] transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};