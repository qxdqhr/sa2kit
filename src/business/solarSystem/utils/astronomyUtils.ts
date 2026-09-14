/**
 * 天文计算工具函数（纯数值，不依赖 three）。
 * 实现开普勒轨道力学计算，用于确定行星在指定时间的位置。
 */

import type { Planet, OrbitalElements } from '../types';

export type Vec3 = { x: number; y: number; z: number };

function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

function scaleVec(v: Vec3, scale: number): Vec3 {
  return vec3(v.x * scale, v.y * scale, v.z * scale);
}

/** 将角度转换为弧度 */
export function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/** 将弧度转换为角度 */
export function radiansToDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

/** 计算儒略日期 */
export function julianDate(date: Date): number {
  const a = Math.floor((14 - date.getMonth() - 1) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = date.getMonth() + 1 + 12 * a - 3;

  return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y +
         Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 +
         (date.getHours() - 12) / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400;
}

/** 计算平近点角 */
export function meanAnomaly(time: Date, elements: OrbitalElements): number {
  const jd = julianDate(time);
  const daysSinceEpoch = jd - elements.epoch;
  const meanAnomalyDegrees = elements.meanAnomalyAtEpoch + elements.meanMotion * daysSinceEpoch;

  return ((meanAnomalyDegrees % 360) + 360) % 360;
}

/** 求解开普勒方程，计算偏近点角 */
export function eccentricAnomaly(meanAnomalyDeg: number, eccentricity: number): number {
  const M = degreesToRadians(meanAnomalyDeg);
  let E = M;

  for (let i = 0; i < 10; i++) {
    const deltaE = (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
    E = E - deltaE;

    if (Math.abs(deltaE) < 1e-12) break;
  }

  return E;
}

/** 计算真近点角 */
export function trueAnomaly(meanAnomalyDeg: number, eccentricity: number): number {
  const E = eccentricAnomaly(meanAnomalyDeg, eccentricity);

  const x = Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E);
  const y = Math.cos(E) - eccentricity;

  return Math.atan2(x, y);
}

/** 计算轨道半径 */
export function orbitalRadius(trueAnomalyRad: number, semiMajorAxis: number, eccentricity: number): number {
  return semiMajorAxis * (1 - eccentricity * eccentricity) /
         (1 + eccentricity * Math.cos(trueAnomalyRad));
}

/** 将轨道坐标转换为日心直角坐标 */
export function orbitalToHeliocentric(
  radius: number,
  trueAnomalyRad: number,
  elements: OrbitalElements
): Vec3 {
  const i = degreesToRadians(elements.inclination);
  const omega = degreesToRadians(elements.longitudeOfAscendingNode);
  const w = degreesToRadians(elements.argumentOfPeriapsis);

  const x_orb = radius * Math.cos(trueAnomalyRad);
  const y_orb = radius * Math.sin(trueAnomalyRad);

  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);

  const x = x_orb * (cosOmega * cosW - sinOmega * sinW * cosI) -
            y_orb * (cosOmega * sinW + sinOmega * cosW * cosI);

  const y = x_orb * (sinOmega * cosW + cosOmega * sinW * cosI) -
            y_orb * (sinOmega * sinW - cosOmega * cosW * cosI);

  const z = x_orb * sinW * sinI + y_orb * cosW * sinI;

  return vec3(x, y, z);
}

/** 计算行星在指定时间的位置 */
export function calculatePlanetPosition(planet: Planet, time: Date, scale: number = 1): Vec3 {
  try {
    const elements = planet.orbitalElements;
    const M = meanAnomaly(time, elements);
    const nu = trueAnomaly(M, elements.eccentricity);
    const r = orbitalRadius(nu, elements.semiMajorAxis, elements.eccentricity);
    return scaleVec(orbitalToHeliocentric(r, nu, elements), scale);
  } catch (error) {
    console.error(`计算行星位置失败 (${planet.name}):`, error);
    const angle = (Date.now() / 1000 / planet.orbitalPeriod) * 2 * Math.PI;
    return vec3(
      Math.cos(angle) * planet.distanceFromSun * scale,
      0,
      Math.sin(angle) * planet.distanceFromSun * scale,
    );
  }
}

/** 计算轨道周期（根据开普勒第三定律） */
export function calculateOrbitalPeriod(semiMajorAxisAU: number): number {
  return Math.sqrt(Math.pow(semiMajorAxisAU, 3)) * 365.25;
}

/** 生成椭圆轨道路径点 */
export function generateOrbitPath(
  elements: OrbitalElements,
  segments: number = 128,
  scale: number = 1
): Vec3[] {
  const points: Vec3[] = [];

  for (let i = 0; i <= segments; i++) {
    const meanAnomalyDeg = (i / segments) * 360;
    const nu = trueAnomaly(meanAnomalyDeg, elements.eccentricity);
    const r = orbitalRadius(nu, elements.semiMajorAxis, elements.eccentricity);
    points.push(scaleVec(orbitalToHeliocentric(r, nu, elements), scale));
  }

  return points;
}

/** 计算两个天体之间的距离 */
export function calculateDistance(pos1: Vec3, pos2: Vec3): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** 根据当前时间计算行星的轨道相位（0-1） */
export function calculateOrbitalPhase(planet: Planet, time: Date): number {
  const M = meanAnomaly(time, planet.orbitalElements);
  return (M / 360) % 1;
}

/** 预测行星在未来某个时间的位置 */
export function predictPlanetPosition(
  planet: Planet,
  currentTime: Date,
  futureDays: number,
  scale: number = 1
): Vec3 {
  const futureTime = new Date(currentTime.getTime() + futureDays * 24 * 60 * 60 * 1000);
  return calculatePlanetPosition(planet, futureTime, scale);
}

/** 计算视觉大小（基于距离的角度大小） */
export function calculateAngularSize(realRadius: number, distance: number): number {
  return 2 * Math.atan(realRadius / distance);
}

/** 简化的光照计算（距离太阳的影响） */
export function calculateIllumination(distanceFromSun: number): number {
  const earthDistance = 1.0;
  return Math.max(0.1, Math.pow(earthDistance / distanceFromSun, 2));
}

export default {
  degreesToRadians,
  radiansToDegrees,
  julianDate,
  meanAnomaly,
  trueAnomaly,
  calculatePlanetPosition,
  calculateOrbitalPeriod,
  generateOrbitPath,
  calculateDistance,
  calculateOrbitalPhase,
  predictPlanetPosition,
  calculateAngularSize,
  calculateIllumination,
};
