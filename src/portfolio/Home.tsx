'use client';

import React, { useEffect, useState } from "react";
import { cn } from '../utils';

export interface HomeConfig {
  title: string;
  subtitle: string;
  buttons: Array<{
    text: string;
    link: string;
  }>;
  imageSrc: string;
}

interface HomeProps {
  homeConfig: HomeConfig;
  className?: string;
}

export const Home: React.FC<HomeProps> = ({ homeConfig, className }) => {
  const { title, subtitle, buttons, imageSrc } = homeConfig;
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < title.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + title[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 150);

      return () => clearTimeout(timer);
    }
    return () => {
      setDisplayText("");
      setCurrentIndex(0);
    };
  }, [currentIndex, title]);

  return (
    <section 
      id="home" 
      className={cn("min-h-screen flex items-center justify-center py-16 bg-gradient-to-b from-white to-gray-50", className)}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              <span className="inline-block">{displayText}</span>
              <span className="animate-pulse ml-1 text-blue-500">|</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">{subtitle}</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {buttons.map((button) => (
                <a
                  key={button.link}
                  href={button.link}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                >
                  {button.text}
                </a>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img
                src={imageSrc}
                alt="Profile"
                className="relative w-full max-w-md mx-auto rounded-lg shadow-xl transform hover:scale-[1.02] transition-transform duration-300 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;

