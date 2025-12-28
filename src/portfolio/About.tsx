'use client';

import React from "react";

import { CollisionBalls, Timeline } from "../components";
import type { TimelineConfig, CollisionBallsConfig } from "../components";

interface AboutProps {
  timelineConfig: TimelineConfig;
  collisionBallsConfig: CollisionBallsConfig;
}

const About: React.FC<AboutProps> = ({
  timelineConfig,
  collisionBallsConfig,
}) => {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">关于我</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-semibold mb-6">个人经历</h3>
            <Timeline items={timelineConfig.items} />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-semibold mb-6">技能展示</h3>
            <div style={{ height: '400px', position: 'relative' }}>
              <CollisionBalls collisionBallsConfig={collisionBallsConfig} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
