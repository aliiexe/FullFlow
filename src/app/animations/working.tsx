'use client';
import gsap from 'gsap';
import '../styles/line.css';
import { useRef, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const AnimatedLine = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  
    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll('path');
    if (!paths.length) return;
  
    paths.forEach((path) => {
      const pathLength = path.getTotalLength();
      gsap.set(path, { strokeDasharray: pathLength });
      gsap.fromTo(
        path,
        { strokeDashoffset: pathLength },
        {
          strokeDashoffset: 0,
          duration: 10,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            end: "bottom bottom",
            scrub: 1,
            markers: true,
          },
        }
      );
    });
  
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <div className="svg-container" ref={containerRef}>
        <svg className="gradient-line" ref={svgRef} width="1898" height="8827" viewBox="0 0 1898 8827" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFCC00" />
              <stop offset="25%" stopColor="#FF7600" />
              <stop offset="50%" stopColor="#EA8221" />
              <stop offset="75%" stopColor="#F352F0" />
              <stop offset="100%" stopColor="#FF0080" />
            </linearGradient>
          </defs>

          <path 
            d="M-97.5005 68C-49.0005 40.5 75.7999 -11 187 3.00001C326 20.5 408.551 112.003 441 143.5C481.812 183.116 457.877 236.955 424.5 252.5C391.123 268.045 335 262.5 324 203C313 143.5 417 37.5 458.5 29C500 20.5 849.5 -66.5 1030 196.5C1174.4 406.9 1549.5 469.5 1719 474.5C1965 468.667 2383.2 557.4 2088 959C1792.8 1360.6 1643.67 1455.33 1606 1452.5C1459.67 1509.17 1115.3 1618.5 908.5 1602.5C701.7 1586.5 679.667 1517.5 694.5 1485C704.833 1442.83 757.5 1377.3 885.5 1452.5C1045.5 1546.5 878.5 1689 786.5 1733.5C694.5 1778 -212.567 1992.46 -306.5 2024.5C-1238.09 2342.28 31.9999 3583 -306.5 3712C-645 3841 -325.101 3329.8 -97.5005 3185C186.999 3004 845 2810 1466.5 3185C1963.7 3485 1842 4014 1719 4241C1590.83 4528.17 1191.3 5085.8 618.5 5019C45.7 4952.2 64.833 4671.17 146 4539C228.5 4446 474.3 4335.9 797.5 4639.5C1201.5 5019 930 5216 797.5 5248C665 5280 -256.5 5310.5 -215 5991.5C-173.5 6672.5 224.5 6783.5 421.5 6783.5C618.5 6783.5 1591 6172 1883 6575C2175 6978 1625 7116.5 1327.5 6950C1030 6783.5 638 6853 343.5 7047.5C48.9998 7242 -332.5 7839 -215 8200.5C-97.5005 8562 -77.5 8798 694.5 8826" 
            stroke="url(#lineGradient)" 
            strokeWidth="60" 
            strokeLinecap="round"
            fill="none"
          />

          <path 
            d="M-97.5005 68C-49.0005 40.5 75.7999 -11 187 3.00001C326 20.5 408.551 112.003 441 143.5C481.812 183.116 457.877 236.955 424.5 252.5C391.123 268.045 335 262.5 324 203C313 143.5 417 37.5 458.5 29C500 20.5 849.5 -66.5 1030 196.5C1174.4 406.9 1549.5 469.5 1719 474.5C1965 468.667 2383.2 557.4 2088 959C1792.8 1360.6 1643.67 1455.33 1606 1452.5C1459.67 1509.17 1115.3 1618.5 908.5 1602.5C701.7 1586.5 679.667 1517.5 694.5 1485C704.833 1442.83 757.5 1377.3 885.5 1452.5C1045.5 1546.5 878.5 1689 786.5 1733.5C694.5 1778 -212.567 1992.46 -306.5 2024.5C-1238.09 2342.28 31.9999 3583 -306.5 3712C-645 3841 -325.101 3329.8 -97.5005 3185C186.999 3004 845 2810 1466.5 3185C1963.7 3485 1842 4014 1719 4241C1590.83 4528.17 1191.3 5085.8 618.5 5019C45.7 4952.2 64.833 4671.17 146 4539C228.5 4446 474.3 4335.9 797.5 4639.5C1201.5 5019 930 5216 797.5 5248C665 5280 -256.5 5310.5 -215 5991.5C-173.5 6672.5 224.5 6783.5 421.5 6783.5C618.5 6783.5 1591 6172 1883 6575C2175 6978 1625 7116.5 1327.5 6950C1030 6783.5 638 6853 343.5 7047.5C48.9998 7242 -332.5 7839 -215 8200.5C-97.5005 8562 -77.5 8798 694.5 8826" 
            stroke="white" 
            strokeWidth="50" 
            strokeLinecap="round"
            fill="none"
          />
          
        </svg>
      </div>
    </>
  );
};

export default AnimatedLine;