/**
 * 太阳系天体数据
 * 包含太阳和八大行星的轨道参数、物理特性等
 */

import type { Planet, Star, OrbitalElements } from '../types';

/** 太阳数据 */
export const SUN: Star = {
  id: 'sun',
  name: '太阳',
  nameEn: 'Sun',
  type: 'star',
  radius: 109.2, // 相对地球半径
  mass: 333000, // 相对地球质量
  color: '#FDB813',
  temperature: 5778, // 表面温度（K）
  luminosity: 1.0, // 相对太阳光度
};

/** 八大行星轨道参数（J2000.0历元） */
const PLANETARY_ORBITAL_ELEMENTS: Record<string, OrbitalElements> = {
  mercury: {
    semiMajorAxis: 0.38709843,
    eccentricity: 0.20563661,
    inclination: 7.00559432,
    longitudeOfAscendingNode: 48.33961819,
    argumentOfPeriapsis: 77.45771895,
    meanAnomalyAtEpoch: 252.25166724,
    meanMotion: 4.09233445,
    epoch: 2451545.0, // J2000.0
  },
  venus: {
    semiMajorAxis: 0.72332102,
    eccentricity: 0.00676399,
    inclination: 3.39777545,
    longitudeOfAscendingNode: 76.67261496,
    argumentOfPeriapsis: 131.76755713,
    meanAnomalyAtEpoch: 181.97970850,
    meanMotion: 1.60213034,
    epoch: 2451545.0,
  },
  earth: {
    semiMajorAxis: 1.00000018,
    eccentricity: 0.01673163,
    inclination: -0.00054346,
    longitudeOfAscendingNode: -11.26064000,
    argumentOfPeriapsis: 102.94719383,
    meanAnomalyAtEpoch: 100.46691572,
    meanMotion: 0.98560028,
    epoch: 2451545.0,
  },
  mars: {
    semiMajorAxis: 1.52371243,
    eccentricity: 0.09336511,
    inclination: 1.85181869,
    longitudeOfAscendingNode: 49.71320984,
    argumentOfPeriapsis: 336.04084630,
    meanAnomalyAtEpoch: 355.45332669,
    meanMotion: 0.52403840,
    epoch: 2451545.0,
  },
  jupiter: {
    semiMajorAxis: 5.20248019,
    eccentricity: 0.04853590,
    inclination: 1.29861416,
    longitudeOfAscendingNode: 100.29282654,
    argumentOfPeriapsis: 14.27495244,
    meanAnomalyAtEpoch: 34.33479152,
    meanMotion: 0.08308529,
    epoch: 2451545.0,
  },
  saturn: {
    semiMajorAxis: 9.54149883,
    eccentricity: 0.05550825,
    inclination: 2.49424102,
    longitudeOfAscendingNode: 113.63998702,
    argumentOfPeriapsis: 92.86136063,
    meanAnomalyAtEpoch: 50.07571329,
    meanMotion: 0.03338414,
    epoch: 2451545.0,
  },
  uranus: {
    semiMajorAxis: 19.18797948,
    eccentricity: 0.04685740,
    inclination: 0.77298127,
    longitudeOfAscendingNode: 73.96250215,
    argumentOfPeriapsis: 172.43404441,
    meanAnomalyAtEpoch: 142.27771777,
    meanMotion: 0.01172834,
    epoch: 2451545.0,
  },
  neptune: {
    semiMajorAxis: 30.06952752,
    eccentricity: 0.00895439,
    inclination: 1.77005520,
    longitudeOfAscendingNode: 131.78635853,
    argumentOfPeriapsis: 9.96476630,
    meanAnomalyAtEpoch: 267.76773249,
    meanMotion: 0.00598103,
    epoch: 2451545.0,
  },
};

/** 八大行星数据 */
export const PLANETS: Planet[] = [
  {
    id: 'mercury',
    name: '水星',
    nameEn: 'Mercury',
    type: 'planet',
    radius: 0.383, // 相对地球半径
    mass: 0.055, // 相对地球质量
    color: '#8C7853',
    orbitalElements: PLANETARY_ORBITAL_ELEMENTS.mercury,
    rotationPeriod: 1407.6, // 小时
    orbitalPeriod: 87.97, // 天
    distanceFromSun: 0.387, // AU
    moons: [],
  },
  {
    id: 'venus',
    name: '金星',
    nameEn: 'Venus',
    type: 'planet',
    radius: 0.949,
    mass: 0.815,
    color: '#FF7F00',
    orbitalElements: PLANETARY_ORBITAL_ELEMENTS.venus,
    rotationPeriod: 5832.5,
    orbitalPeriod: 224.70,
    distanceFromSun: 0.723,
    moons: [],
  },
  {
    id: 'earth',
    name: '地球',
    nameEn: 'Earth',
    type: 'planet',
    radius: 1.0,
    mass: 1.0,
    color: '#6B93D6',
    orbitalElements: PLANETARY_ORBITAL_ELEMENTS.earth,
    rotationPeriod: 24.0,
    orbitalPeriod: 365.26,
    distanceFromSun: 1.0,
    moons: ['Moon'],
  },
  {
    id: 'mars',
    name: '火星',
    nameEn: 'Mars',
    type: 'planet',
    radius: 0.532,
    mass: 0.107,
    color: '#CD5C5C',
    orbitalElements: PLANETARY_ORBITAL_ELEMENTS.mars,
    rotationPeriod: 24.6,
    orbitalPeriod: 686.98,
    distanceFromSun: 1.524,
    moons: ['Phobos', 'Deimos'],
  },
  {
    id: 'jupiter',
    name: '木星',
    nameEn: 'Jupiter',
    type: 'planet',
    radius: 11.21,
    mass: 317.8,
    color: '#D8CA9D',
    orbitalElements: PLANETARY_ORBITAL_ELEMENTS.jupiter,
    rotationPeriod: 9.9,
    orbitalPeriod: 4332.59,
    distanceFromSun: 5.204,
    moons: ['Io', 'Europa', 'Ganymede', 'Callisto'],
  },
  {
    id: 'saturn',
    name: '土星',
    nameEn: 'Saturn',
    type: 'planet',
    radius: 9.45,
    mass: 95.2,
    color: '#FAD5A5',
    orbitalElements: PLANETARY_ORBITAL_ELEMENTS.saturn,
    rotationPeriod: 10.7,
    orbitalPeriod: 10759.22,
    distanceFromSun: 9.582,
    moons: ['Titan', 'Enceladus', 'Mimas', 'Rhea'],
  },
  {
    id: 'uranus',
    name: '天王星',
    nameEn: 'Uranus',
    type: 'planet',
    radius: 4.01,
    mass: 14.5,
    color: '#4FD0E7',
    orbitalElements: PLANETARY_ORBITAL_ELEMENTS.uranus,
    rotationPeriod: 17.2,
    orbitalPeriod: 30688.5,
    distanceFromSun: 19.201,
    moons: ['Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon'],
  },
  {
    id: 'neptune',
    name: '海王星',
    nameEn: 'Neptune',
    type: 'planet',
    radius: 3.88,
    mass: 17.1,
    color: '#4B70DD',
    orbitalElements: PLANETARY_ORBITAL_ELEMENTS.neptune,
    rotationPeriod: 16.1,
    orbitalPeriod: 60182.0,
    distanceFromSun: 30.047,
    moons: ['Triton'],
  },
];

/** 根据ID获取行星数据 */
export function getPlanetById(id: string): Planet | undefined {
  return PLANETS.find(planet => planet.id === id);
}

/** 获取所有内行星（水星、金星、地球、火星） */
export function getInnerPlanets(): Planet[] {
  return PLANETS.filter(planet => planet.distanceFromSun <= 2.0);
}

/** 获取所有外行星（木星、土星、天王星、海王星） */
export function getOuterPlanets(): Planet[] {
  return PLANETS.filter(planet => planet.distanceFromSun > 2.0);
}

/** 获取有卫星的行星 */
export function getPlanetsWithMoons(): Planet[] {
  return PLANETS.filter(planet => planet.moons && planet.moons.length > 0);
}

/** 天文常量 */
export const ASTRONOMICAL_CONSTANTS = {
  AU: 149597870.7, // 天文单位（公里）
  EARTH_RADIUS: 6371.0, // 地球半径（公里）
  SOLAR_RADIUS: 695700.0, // 太阳半径（公里）
  JULIAN_CENTURY: 36525.0, // 儒略世纪（天）
  SIDEREAL_YEAR: 365.25636, // 恒星年（天）
  SPEED_OF_LIGHT: 299792458, // 光速（米/秒）
};

export default {
  SUN,
  PLANETS,
  ASTRONOMICAL_CONSTANTS,
  getPlanetById,
  getInnerPlanets,
  getOuterPlanets,
  getPlanetsWithMoons,
}; 