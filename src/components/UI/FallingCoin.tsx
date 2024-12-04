import React, { useEffect, useState } from 'react';

interface FallingCoinProps {
  left: number;
}

const FallingCoin: React.FC<FallingCoinProps> = ({ left }) => {
  const [top, setTop] = useState(-20);

  useEffect(() => {
    const interval = setInterval(() => {
      setTop((prevTop) => {
        if (prevTop > window.innerHeight) {
          clearInterval(interval);
          return -20;
        }
        return prevTop + 5;
      });
    }, 17);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute"
      style={{ left: `${left}px`, top: `${top}px`, width: '40px', height: '40px' }}
    >
      <svg viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(0 -540.36)">
          <path fill="#FFB61C" d="M240 540.36c-132.531 0-240 107.469-240 240s107.469 240 240 240 240-107.469 240-240c0-132.531-107.469-240-240-240z"/>
          <path fill="#FCD116" d="M240 543.36c130.909 0 237 106.091 237 237s-106.091 237-237 237-237-106.091-237-237 106.091-237 237-237z"/>
          <path fill="#F39C12" d="M240 611.382c-93.321 0-168.98 75.658-168.98 168.979s75.66 168.98 168.98 168.98 168.98-75.659 168.98-168.98-75.659-168.979-168.98-168.979z"/>
          <path fill="#FFB61C" d="M240 612.096c92.934 0 168.266 75.33 168.266 168.264S332.934 948.626 240 948.626s-168.264-75.332-168.264-168.266S147.066 612.096 240 612.096z"/>
          <path fill="#E6A419" d="M226.577 677.438v29.497c-20.967 8.621-33.389 31.201-29.559 54.014 4.042 24.073 25.359 41.912 49.6 40.927 6.008.75 11.033 5.391 12.207 12.382 1.353 8.057-3.347 15.326
      </svg>
    </div>
  );
};

export default FallingCoin;
