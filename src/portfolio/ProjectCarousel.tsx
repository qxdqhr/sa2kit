'use client';

import React, { useState } from 'react';
import { ExperimentCard } from './ExperimentCard';
import { cn } from '../utils';

// Project相关的类型定义
export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  tags: string[];
}

export interface ProjectsConfig {
  projects: Project[];
}

interface ProjectCarouselProps {
  projects: Project[];
  className?: string;
}

export const ProjectCarousel: React.FC<ProjectCarouselProps> = ({ projects, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === projects.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? projects.length - 1 : prevIndex - 1
    );
  };

  return (
    <section id="projects" className={cn("py-16 bg-gray-50", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">项目展示</h2>
        
        <div className="relative max-w-4xl mx-auto">
          {/* 项目卡片 */}
          <div className="relative h-[400px] overflow-hidden rounded-lg shadow-xl">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={cn(
                  "absolute w-full h-full transition-all duration-500 transform",
                  index === currentIndex
                    ? "translate-x-0 opacity-100"
                    : index < currentIndex
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
                )}
              >
                <ExperimentCard
                  href={project.link || '#'}
                  title={project.title}
                  description={project.description}
                  tags={project.tags}
                  category="utility"
                />
              </div>
            ))}
          </div>

          {/* 导航按钮 */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all z-10"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all z-10"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* 指示器 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {projects.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex ? "bg-blue-500 w-4" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectCarousel;

