'use client';

import React from 'react';

import { BookOpen, LogIn, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Button, Footer } from 'sa2kit/common/ui';
import {
  thGuestBrand,
  thGuestFeatureIcon,
  thGuestFeatureItem,
  thGuestFeatureList,
  thGuestFeatureText,
  thGuestFeatureTitle,
  thGuestHint,
  thGuestHintLink,
  thGuestIntro,
  thGuestMain,
  thGuestPage,
  thGuestPanel,
  thGuestTopbar,
} from '../styles/tw';

const FEATURES = [
  {
    icon: Target,
    title: 'Mission 驱动',
    description: '定义学习目标与约束，Mimo 备课始终对齐你的动机。',
  },
  {
    icon: BookOpen,
    title: '原生 HTML 课时',
    description: 'teach skill 格式原样播放，内容保存在你的专属工作区。',
  },
  {
    icon: Sparkles,
    title: '按需续课',
    description: '完成当前课后，由你触发 Mimo 生成下一节与学习记录。',
  },
  {
    icon: TrendingUp,
    title: '进度与资源',
    description: '追踪完成状态，管理 Mission、学习记录与延伸阅读资源。',
  },
] as const;

type TeachHubGuestLandingProps = {
  onLogin: () => void;
  onRegister: () => void;
};

export function TeachHubGuestLanding({ onLogin, onRegister }: TeachHubGuestLandingProps) {
  return (
    <div className={thGuestPage}>
      <header className={thGuestTopbar}>
        <p className={thGuestBrand}>Teach 学习工作区</p>
        <Button type="primary" size="small" onClick={onLogin}>
          <LogIn className="h-4 w-4" strokeWidth={2} />
          登录
        </Button>
      </header>

      <main className={thGuestMain}>
        <section className={thGuestPanel}>
          <p className={thGuestIntro}>
            登录后为每位用户创建独立的学习工作区：填写 Mission、学习 HTML 课时、追踪进度，并在完成每课后让
            Mimo 为你备下一节。工作区文件按用户 ID 隔离存储，仅你本人可访问。
          </p>

          <ul className={thGuestFeatureList}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className={thGuestFeatureItem}>
                  <span className={thGuestFeatureIcon} aria-hidden>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className={thGuestFeatureTitle}>{feature.title}</p>
                    <p className={thGuestFeatureText}>{feature.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className={thGuestHint}>
            使用右上角登录以创建工作区。
            <button type="button" className={thGuestHintLink} onClick={onRegister}>
              还没有账号？注册
            </button>
          </p>
        </section>
      </main>

      <Footer type="tree" />
    </div>
  );
}
