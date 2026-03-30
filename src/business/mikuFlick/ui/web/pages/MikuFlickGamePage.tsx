import React from 'react';
import type { MikuFlickConfig } from '../../../types';
import MikuFlickGame from '../components/MikuFlickGame';

export interface MikuFlickGamePageProps {
  title?: string;
  description?: string;
  phrase?: string;
  config?: Partial<MikuFlickConfig>;
}

const MikuFlickGamePage: React.FC<MikuFlickGamePageProps> = ({
  title = 'Miku Flick Web（基础版）',
  description = '实现基础功能：节奏音符、假名+方向判定、得分连击与重开。',
  phrase,
  config,
}) => {
  return (
    <section>
      <h2>{title}</h2>
      <p style={{ color: '#64748b' }}>{description}</p>
      <MikuFlickGame phrase={phrase} config={config} />
    </section>
  );
};

export default MikuFlickGamePage;
