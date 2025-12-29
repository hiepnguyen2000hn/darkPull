"use client";

import { motion } from "framer-motion";
import { Shield, LineChart, Target } from "lucide-react";

export default function ThreeCardSection() {
  const cards = [
    {
      icon: Shield,
      title: "Why It Matters",
      subtitle: "On-Chain Privacy",
      description: "Zero-knowledge proofs enable private transactions and identity verification without exposing sensitive information. Maintain complete privacy while proving validity of your credentials and transactions on-chain.",
      color: "#8B5CF6",
    },
    {
      icon: LineChart,
      title: "Hovate Trading Platform",
      subtitle: "Scalability at Scale",
      description: "Execute trades with complete privacy and MEV-resistance. Our ZK-powered platform ensures lightning-fast proof generation while maintaining security and protecting trader information from front-running.",
      color: "#357F8C",
    },
    {
      icon: Target,
      title: "Finalize",
      subtitle: "Scalability at Scale",
      description: "Production-ready cryptographic protocols battle-tested for enterprise deployment. Built with industry-standard security practices and optimized for real-world applications at scale.",
      color: "#10B981",
    },
  ];

  return (
    <section className="relative w-full py-8">
      <div className="max-w-[1280px] mx-auto px-12">
        <div className="grid grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: "rgba(40, 37, 55, 0.4)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${card.color}33`,
                boxShadow: `0 0 20px ${card.color}22`,
              }}
            >
              {/* Icon + Title ở trên cùng */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}, ${card.color}88)`,
                    boxShadow: `0 4px 20px ${card.color}44`,
                  }}
                >
                  <card.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <h3 className="text-[15px] font-semibold text-white">{card.title}</h3>
              </div>

              {/* Divider */}
              <div
                className="w-full h-[1px] mb-3"
                style={{
                  background: `linear-gradient(90deg, ${card.color}40, transparent)`,
                }}
              />

              {/* Content bên dưới */}
              <h4 className="text-[11px] font-medium mb-2 text-[#94A3B8]">
                {card.subtitle}
              </h4>
              <p className="text-[11px] leading-[1.6] text-[#94A3B8]">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
