"use client";

import Prism from "./PrismBackground";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
        <div style={{ width: '1182px', height: '598px', position: 'relative' }}>
            <Prism
                animationType="rotate"
                timeScale={0.5}
                height={3.5}
                baseWidth={5.5}
                scale={3.6}
                hueShift={0}
                colorFrequency={1}
                noise={0}
                glow={1}
            />
        </div>
    </section>
  );
}