"use client";

import { useEffect, useState, type CSSProperties } from "react";

function Tree({ style }: { style?: CSSProperties }) {
  return (
    <div
      className="absolute select-none text-4xl"
      style={{
        ...style,
        animation: "sway 4s ease-in-out infinite",
        transformOrigin: "bottom center",
      }}
    >
      🌲
    </div>
  );
}

function Squirrel() {
  const [pos, setPos] = useState({ top: 20, left: 10 });

  useEffect(() => {
    const interval = setInterval(() => {
      setPos({
        top: Math.random() * 70 + 5,
        left: Math.random() * 80 + 5,
      });
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute select-none text-2xl transition-all duration-[1500ms] ease-in-out"
      style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
    >
      🐿️
    </div>
  );
}

export function AnimatedBackground() {
  return (
    <>
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <Tree style={{ bottom: "8%", left: "5%" }} />
        <Tree style={{ bottom: "6%", right: "8%", animationDelay: "1.2s", fontSize: "3rem" }} />
        <Tree style={{ bottom: "10%", left: "30%", animationDelay: "0.6s", fontSize: "2rem" }} />
        <Squirrel />
      </div>
    </>
  );
}
