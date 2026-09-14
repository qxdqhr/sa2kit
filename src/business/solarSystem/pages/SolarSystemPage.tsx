'use client';

import React, { useState } from 'react';
import SolarSystemViewer from '../components/SolarSystemViewer/SolarSystemViewer';
import type { Planet } from '../types';

const SolarSystemPage: React.FC = () => {
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const handlePlanetClick = (planet: Planet) => {
    setSelectedPlanet(planet);
  };

  const handleTimeChange = (time: Date) => {
    setCurrentTime(time);
  };

  const handleError = (error: Error) => {
    console.error('太阳系页面错误:', error);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 页面标题 */}
      <div className="bg-black bg-opacity-50 text-white p-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          🌌 实时太阳系
        </h1>
        <p className="text-center text-gray-300 mt-2">
          基于真实天文数据的太阳系可视化 - {currentTime.toLocaleDateString('zh-CN')}
        </p>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-col lg:flex-row h-screen">
        {/* 太阳系查看器 */}
        <div className="flex-1">
          <SolarSystemViewer
            className="w-full h-full"
            onPlanetClick={handlePlanetClick}
            onTimeChange={handleTimeChange}
            onError={handleError}
          />
        </div>

        {/* 侧边栏信息面板 */}
        {selectedPlanet && (
          <div className="lg:w-80 bg-gray-800 text-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedPlanet.name}</h2>
              <button
                onClick={() => setSelectedPlanet(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-blue-400">基本信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">英文名:</span>
                    <span>{selectedPlanet.nameEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">类型:</span>
                    <span>行星</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">半径:</span>
                    <span>{selectedPlanet.radius.toFixed(3)} 地球半径</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">质量:</span>
                    <span>{selectedPlanet.mass.toFixed(3)} 地球质量</span>
                  </div>
                </div>
              </div>

              {/* 轨道信息 */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-green-400">轨道信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">距太阳距离:</span>
                    <span>{selectedPlanet.distanceFromSun.toFixed(3)} AU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">公转周期:</span>
                    <span>{selectedPlanet.orbitalPeriod.toFixed(1)} 天</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">轨道偏心率:</span>
                    <span>{selectedPlanet.orbitalElements.eccentricity.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">轨道倾角:</span>
                    <span>{selectedPlanet.orbitalElements.inclination.toFixed(2)}°</span>
                  </div>
                </div>
              </div>

              {/* 自转信息 */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-purple-400">自转信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">自转周期:</span>
                    <span>{selectedPlanet.rotationPeriod.toFixed(1)} 小时</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">一天长度:</span>
                    <span>
                      {selectedPlanet.rotationPeriod < 48 
                        ? `${selectedPlanet.rotationPeriod.toFixed(1)} 小时`
                        : `${(selectedPlanet.rotationPeriod / 24).toFixed(1)} 地球日`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* 卫星信息 */}
              {selectedPlanet.moons && selectedPlanet.moons.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">卫星</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">卫星数量:</span>
                      <span>{selectedPlanet.moons.length} 个</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-400">主要卫星:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedPlanet.moons.slice(0, 4).map((moon: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 rounded text-xs"
                          >
                            {moon}
                          </span>
                        ))}
                        {selectedPlanet.moons.length > 4 && (
                          <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                            +{selectedPlanet.moons.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 物理特性 */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-red-400">物理特性</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">主要颜色:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: selectedPlanet.color }}
                      />
                      <span>{selectedPlanet.color}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">表面重力:</span>
                    <span>
                      {(selectedPlanet.mass / (selectedPlanet.radius * selectedPlanet.radius)).toFixed(2)} g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">逃逸速度:</span>
                    <span>
                      {(Math.sqrt(2 * selectedPlanet.mass / selectedPlanet.radius) * 11.2).toFixed(1)} km/s
                    </span>
                  </div>
                </div>
              </div>

              {/* 趣味事实 */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-cyan-400">趣味事实</h3>
                <div className="text-sm text-gray-300 space-y-2">
                  {getPlanetFacts(selectedPlanet).map((fact, index) => (
                    <div key={index} className="p-2 bg-gray-700 rounded">
                      {fact}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 移动端提示 */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-sm">
        <div className="text-center">
          💡 提示: 点击行星查看详细信息，使用手势缩放和旋转视角
        </div>
      </div>
    </div>
  );
};

// 获取行星趣味事实
function getPlanetFacts(planet: Planet): string[] {
  const facts: Record<string, string[]> = {
    mercury: [
      "水星是距离太阳最近的行星，表面温度变化极大",
      "一个水星年（公转一周）只有88个地球日",
      "水星没有大气层，所以看不到日出日落的颜色变化"
    ],
    venus: [
      "金星是太阳系中最热的行星，表面温度约460°C",
      "金星自转方向与其他行星相反（逆向自转）",
      "金星被称为'地球的姐妹星'，大小相近但环境截然不同"
    ],
    earth: [
      "地球是目前已知唯一有生命的行星",
      "地球71%的表面被海洋覆盖",
      "地球的磁场保护我们免受太阳风的伤害"
    ],
    mars: [
      "火星有太阳系最大的火山——奥林匹斯山",
      "火星的一天约24小时37分钟，与地球很相似",
      "火星有两个小卫星：火卫一（Phobos）和火卫二（Deimos）"
    ],
    jupiter: [
      "木星是太阳系最大的行星，质量超过其他所有行星总和",
      "木星的大红斑是一个持续了数百年的巨型风暴",
      "木星有79个已知卫星，包括四个伽利略卫星"
    ],
    saturn: [
      "土星的密度比水还小，如果有足够大的海洋，它会浮起来",
      "土星环主要由冰块和岩石碎片组成",
      "土星有82个已知卫星，其中泰坦（Titan）最大"
    ],
    uranus: [
      "天王星侧躺着自转，自转轴倾斜约98度",
      "天王星有微弱的环系统，1977年才被发现",
      "天王星的大气主要由氢、氦和甲烷组成"
    ],
    neptune: [
      "海王星有太阳系最强的风，风速可达2100公里/小时",
      "海王星是第一个通过数学计算预测位置后发现的行星",
      "海王星的一年相当于165个地球年"
    ]
  };

  return facts[planet.id] || ["这是一个神秘的行星，等待我们去探索！"];
}

export default SolarSystemPage; 