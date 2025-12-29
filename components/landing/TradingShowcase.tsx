"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap } from "lucide-react";
import Image from "next/image";

export default function TradingShowcase() {
  return (
    <section className="relative w-full py-6">
      <div className="max-w-[1280px] mx-auto px-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "rgba(40, 37, 55, 0.5)",
            backdropFilter: "blur(24px)",
            border: "2px solid rgba(139, 92, 246, 0.3)",
            boxShadow: "0 0 60px rgba(139, 92, 246, 0.2), 0 8px 48px rgba(0, 0, 0, 0.6)",
            minHeight: "600px",
          }}
        >
          {/* Trading Platform Mockup */}
          <div className="absolute inset-0">
            <div className="relative w-full h-full flex items-center justify-center p-12">
              <div
                className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(26, 29, 46, 0.8)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  boxShadow: "0 4px 32px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Trading chart mockup background */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0" style={{
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(53, 127, 140, 0.05) 100%)",
                  }} />
                  {/* Grid pattern */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: "linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-16 flex flex-col items-center justify-center min-h-[600px]">
            {/* Top badges */}
            <div className="absolute top-8 right-8 flex gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="px-4 py-2 rounded-lg flex items-center gap-2"
                style={{
                  background: "rgba(139, 92, 246, 0.15)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: "#8B5CF6" }} />
                <span className="text-sm font-bold" style={{ color: "#8B5CF6" }}>
                  12mins
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="px-4 py-2 rounded-lg flex items-center gap-2"
                style={{
                  background: "rgba(53, 127, 140, 0.15)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(53, 127, 140, 0.4)",
                }}
              >
                <Zap className="w-4 h-4" style={{ color: "#357F8C" }} />
                <span className="text-sm font-bold" style={{ color: "#357F8C" }}>
                  15ms
                </span>
              </motion.div>
            </div>

            {/* Main text content */}
            <div className="text-center space-y-4 mt-auto mb-auto">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-5xl font-bold text-white mb-4"
              >
                Private Trading Platform
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="text-xl font-medium max-w-2xl mx-auto"
                style={{ color: "#94A3B8" }}
              >
                MEV-Resistant. Privacy-Preserving. Lightning-Fast.
              </motion.p>
            </div>

            {/* Bottom left badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="absolute bottom-8 left-8 px-5 py-3 rounded-lg"
              style={{
                background: "rgba(40, 37, 55, 0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
              }}
            >
              <span className="text-sm font-medium" style={{ color: "#8B5CF6" }}>
                Trading Platform Section
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
