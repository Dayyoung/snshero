import React from 'react';
import { cn } from '../lib/utils';

interface ItemIconProps {
  imageIndex?: number;
  emoji?: string;
  size?: number; // size in pixels
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ imageIndex, emoji, size = 48, className }) => {
  // If emoji is provided, use it. Otherwise try to map imageIndex to a default emoji.
  let displayEmoji = emoji;
  
  if (!displayEmoji && imageIndex !== undefined) {
    if (imageIndex >= 1 && imageIndex <= 50) displayEmoji = '💍';
    else if (imageIndex >= 51 && imageIndex <= 80) displayEmoji = '📿';
    else if (imageIndex >= 81 && imageIndex <= 110) displayEmoji = '👢';
    else displayEmoji = '📦';
  }

  if (!displayEmoji) return null;

  return (
    <div 
      className={cn("shrink-0 flex items-center justify-center overflow-hidden font-sans", className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.9}px`,
        lineHeight: 1
      }}
    >
      {displayEmoji}
    </div>
  );
};
