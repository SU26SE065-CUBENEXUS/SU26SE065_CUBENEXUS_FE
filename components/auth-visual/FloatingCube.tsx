// ─── Floating Background Cube ───────────────────────────────────
// Decorative cube that floats in the background of the visual panel.
// Pure CSS animation, no interactivity. Each instance has its own
// size, position, timing and color passed via props.

interface FloatingCubeProps {
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  color: string;
}

export default function FloatingCube({ size, x, y, delay, duration, color }: FloatingCubeProps) {
  return (
    <div
      className="animate-float-cube absolute rounded-lg backdrop-blur-[1px] border border-white/5 pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        background: color,
      }}
    />
  );
}
