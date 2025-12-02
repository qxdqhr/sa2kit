'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MMDPlayerEnhanced } from './MMDPlayerEnhanced';
import type { MMDPlaylistProps, MMDPlaylistNode, MMDResources } from '../types';

export const MMDPlaylist: React.FC<MMDPlaylistProps> = ({
  playlist,
  stage,
  defaultNodeIndex = 0,
  className,
  style,
  worker,
  onLoad,
  onError,
  onNodeChange,
  onPlaylistComplete,
}) => {
  const [currentNodeIndex, setCurrentNodeIndex] = useState<number>(defaultNodeIndex);
  const [editableNodes, setEditableNodes] = useState<MMDPlaylistNode[]>(playlist.nodes);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentNodeIndexRef = useRef<number>(defaultNodeIndex);
  const [resourceCache, setResourceCache] = useState<Map<string, MMDResources>>(new Map());

  useEffect(() => {
    if (!worker) return;
    worker.onmessage = (event: MessageEvent<{ nodeId: string; cachedResources?: MMDResources; error?: any }>) => {
      const { nodeId, cachedResources, error } = event.data;
      if (cachedResources) {
        setResourceCache(prevCache => new Map(prevCache).set(nodeId, cachedResources));
      } else if (error) {
        console.error(`[MMDPlaylist] Worker failed to pre-fetch for ${nodeId}:`, error);
      }
    };
  }, [worker]);

  useEffect(() => {
    currentNodeIndexRef.current = currentNodeIndex;
    setIsLoading(true);
  }, [currentNodeIndex]);

  const currentNode = editableNodes[currentNodeIndex];

  useEffect(() => {
    if (currentNode) {
      onNodeChange?.(currentNodeIndex, currentNode);
    }
  }, [currentNodeIndex, currentNode, onNodeChange]);

  useEffect(() => {
    if (!currentNode || editableNodes.length <= 1 || !worker) return;

    const nextIndex = (currentNodeIndex + 1) % editableNodes.length;
    const nextNode = editableNodes[nextIndex];

    if (nextNode && !resourceCache.has(nextNode.id)) {
      worker.postMessage({ nodeId: nextNode.id, resources: nextNode.resources });
    }
  }, [currentNodeIndex, editableNodes, resourceCache, currentNode, worker]);


  const handlePlaybackEnded = useCallback(() => {
    const currentIndex = currentNodeIndexRef.current;
    const isLastNode = currentIndex === editableNodes.length - 1;
    if (editableNodes[currentIndex]?.loop) return;

    if (!isLastNode) {
      setCurrentNodeIndex(currentIndex + 1);
    } else if (playlist.loop) {
      setCurrentNodeIndex(0);
    } else {
      onPlaylistComplete?.();
    }
  }, [editableNodes, playlist.loop, onPlaylistComplete]);
  
  if (!currentNode) {
    return <div>Invalid node index</div>;
  }
  
  const resourcesToPlayer = resourceCache.get(currentNode.id) || currentNode.resources;

  return (
    <div className={`relative ${className || ''}`} style={style}>
      {isLoading && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"><div className="text-white text-lg">Loading...</div></div>}
      <MMDPlayerEnhanced
        key={currentNode.id}
        resources={resourcesToPlayer}
        stage={stage}
        autoPlay={playlist.autoPlay}
        loop={currentNode.loop || false}
        className="h-full w-full"
        onLoad={() => { setIsLoading(false); onLoad?.(); }}
        onError={onError}
        onAudioEnded={handlePlaybackEnded}
        onAnimationEnded={handlePlaybackEnded}
      />
    </div>
  );
};