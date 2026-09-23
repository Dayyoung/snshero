/**
 * GyroscopeWorldPanorama.tsx - SCR-01-23
 * 기기 기울임(DeviceOrientation)에 반응하는 자이로스코프 파노라마 패닝 뷰
 */

import React, { useState, useEffect } from 'react';

interface GyroscopeWorldPanoramaProps {
  children: React.ReactNode;
}

export const GyroscopeWorldPanorama: React.FC<GyroscopeWorldPanoramaProps> = ({
  children,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma || 0; // [-90, 90]
      const beta = e.beta || 0;   // [-180, 180]

      const clampX = Math.max(-20, Math.min(20, gamma));
      const clampY = Math.max(-15, Math.min(15, beta - 45)); // assume holding at 45 deg

      setOffset({ x: clampX * 0.8, y: clampY * 0.5 });
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden transition-transform duration-100 ease-out"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
    >
      {children}
    </div>
  );
};
