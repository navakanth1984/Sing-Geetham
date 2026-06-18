import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  color?: string;
  speed?: number;
}

export function AudioVisualizer({ isPlaying, color = "#6366f1", speed = 1 }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 300;
    canvas.height = 80;

    let bars: { x: number; targetHeight: number; currentHeight: number; speed: number }[] = [];
    const barWidth = 6;
    const gap = 3;
    const barCount = Math.floor(canvas.width / (barWidth + gap));

    for (let i = 0; i < barCount; i++) {
      bars.push({
        x: i * (barWidth + gap),
        targetHeight: 5,
        currentHeight: 5,
        speed: 0.1 + Math.random() * 0.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bars.forEach((bar) => {
        if (isPlaying) {
          // Dynamic heights on wave
          if (Math.abs(bar.currentHeight - bar.targetHeight) < 2) {
            bar.targetHeight = 5 + Math.random() * (canvas.height - 10);
            bar.speed = (0.05 + Math.random() * 0.1) * speed;
          }
        } else {
          bar.targetHeight = 4;
          bar.speed = 0.2;
        }

        // Interpolate current height for smooth visual physics
        bar.currentHeight += (bar.targetHeight - bar.currentHeight) * bar.speed;

        // Draw double-sided audio equalizer bars
        ctx.fillStyle = color;
        const y = (canvas.height - bar.currentHeight) / 2;
        ctx.beginPath();
        ctx.roundRect(bar.x, y, barWidth, bar.currentHeight, 3);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, color, speed]);

  return (
    <canvas 
      ref={canvasRef} 
      id="sing_geetham_canvas_visualizer" 
      className="w-full bg-black/40 rounded-xl border border-white/5 overflow-hidden shadow-inner cursor-pointer"
    />
  );
}
