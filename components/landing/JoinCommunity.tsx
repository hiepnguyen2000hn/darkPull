"use client";

import { motion } from "framer-motion";
import { Github, Twitter, MessageCircle, Youtube, Send } from "lucide-react";

export default function JoinCommunity() {
  const socialLinks = [
    { icon: Github, label: "Github", color: "#8B5CF6" },
    { icon: Twitter, label: "Twitter", color: "#357F8C" },
    { icon: MessageCircle, label: "Discord", color: "#8B5CF6" },
    { icon: Youtube, label: "YouTube", color: "#357F8C" },
    { icon: Send, label: "Telegram", color: "#8B5CF6" },
  ];

  return (
    <section className="relative w-full py-6">
      <div className="max-w-[1280px] mx-auto px-12">
        {/* Tech Stack label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748B" }}>
            TECH STACK & SECTION
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-white text-center mb-16"
        >
          Join the ZK Community
        </motion.h2>

        {/* Social icons */}
        <div className="flex items-center justify-center gap-6 mb-16">
          {socialLinks.map((social, i) => (
            <motion.a
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{
                scale: 1.1,
                boxShadow: `0 0 24px ${social.color}66`,
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: "rgba(40, 37, 55, 0.6)",
                backdropFilter: "blur(12px)",
                border: `1.5px solid ${social.color}44`,
                boxShadow: `0 0 16px ${social.color}22`,
              }}
            >
              <social.icon className="w-5 h-5" style={{ color: social.color }} />
            </motion.a>
          ))}
        </div>

        {/* Community stats or additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-12"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">10K+</div>
            <div className="text-sm" style={{ color: "#64748B" }}>
              Developers
            </div>
          </div>
          <div className="w-px h-12" style={{ background: "rgba(255, 255, 255, 0.1)" }} />
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">50M+</div>
            <div className="text-sm" style={{ color: "#64748B" }}>
              Proofs Generated
            </div>
          </div>
          <div className="w-px h-12" style={{ background: "rgba(255, 255, 255, 0.1)" }} />
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">99.99%</div>
            <div className="text-sm" style={{ color: "#64748B" }}>
              Uptime
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
