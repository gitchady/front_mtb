import { motion } from "framer-motion";

export function PlanetVisual({
  hue,
  size = 180,
  glow = 0.5,
}: {
  hue: string;
  size?: number;
  glow?: number;
}) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-60 blur-3xl"
        style={{ background: hue, transform: `scale(${1 + glow})` }}
      />
      <div
        className="absolute inset-0 rounded-full border border-white/15"
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), transparent 28%), ${hue}`,
          boxShadow: "inset -24px -24px 40px rgba(0, 0, 0, 0.35)",
        }}
      />
      <div className="absolute inset-[-18px] rounded-full border border-dashed border-white/20" />
    </motion.div>
  );
}
