import React from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'indigo',
  'purple',
  'pink',
  'gray',
];

const COLOR_CLASSES = {
  red: 'bg-red-500 hover:bg-red-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
  yellow: 'bg-yellow-500 hover:bg-yellow-600',
  green: 'bg-green-500 hover:bg-green-600',
  teal: 'bg-teal-500 hover:bg-teal-600',
  blue: 'bg-blue-500 hover:bg-blue-600',
  indigo: 'bg-indigo-500 hover:bg-indigo-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
  pink: 'bg-pink-500 hover:bg-pink-600',
  gray: 'bg-gray-500 hover:bg-gray-600',
};

export function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onColorSelect(color)}
          className={`
            h-8 w-8 rounded-full transition-transform
            ${COLOR_CLASSES[color as keyof typeof COLOR_CLASSES]}
            ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}
          `}
          aria-label={`选择${color}颜色`}
        />
      ))}
    </div>
  );
} 