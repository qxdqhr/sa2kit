'use client';

import React from 'react';
import About from './About';
import type { AboutProps } from './About';
import { CollisionBalls, Timeline } from './ui/defaultComponents';

/** 向后兼容：宿主未注入 UI 时使用 sa2kit 默认 primitives */
const AboutWithDefaults: React.FC<Omit<AboutProps, 'Timeline' | 'CollisionBalls'>> = props => (
  <About {...props} Timeline={Timeline} CollisionBalls={CollisionBalls} />
);

export default AboutWithDefaults;
