import React from 'react';
import type { BubbleShooterConfig } from '../../../types';
import BubbleShooterBoard from '../components/BubbleShooterBoard';

export interface BubbleShooterGamePageProps {
  config?: Partial<BubbleShooterConfig>;
  title?: string;
  description?: string;
}

const BubbleShooterGamePage: React.FC<BubbleShooterGamePageProps> = ({
  config,
  title = '泡泡龙',
  description = '基础版：瞄准、发射、连消、悬空掉落。',
}) => {
  return (
    <section>
      <h2>{title}</h2>
      <p style={{ color: '#64748b' }}>{description}</p>
      <BubbleShooterBoard config={config} />
    </section>
  );
};

export default BubbleShooterGamePage;
