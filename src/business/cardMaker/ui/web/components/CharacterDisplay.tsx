'use client';

import React from 'react';
import Image from 'next/image';
import type { CardData } from '../../../domain/types';

interface CharacterDisplayProps {
  card: CardData;
  className?: string;
}

export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
  card,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        height: '256px',
        borderRadius: '16px 16px 0 0',
        background: 'linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)',
      }}
    >
      {card.backgroundUrl && (
        <Image
          src={card.backgroundUrl}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      )}

      {card.avatarUrl && (
        <div
          className="absolute bg-white overflow-hidden"
          style={{
            top: '20px',
            left: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            borderWidth: '3px',
            borderColor: '#ffffff',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          }}
        >
          <Image src={card.avatarUrl} alt="Avatar" fill className="object-cover" />
        </div>
      )}

      <div
        className="absolute text-white"
        style={{
          bottom: '20px',
          left: '20px',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '700',
            lineHeight: '1.25',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {card.characterName}
        </h2>
        {card.characterDescription && (
          <p
            style={{
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '1.5',
              opacity: 0.95,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {card.characterDescription}
          </p>
        )}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)',
        }}
      />

      <div
        className="absolute rounded-full"
        style={{
          top: 0,
          right: 0,
          width: '128px',
          height: '128px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
    </div>
  );
};
