"use client";

export default function Footer() {
  return (
    <footer
      className="relative w-full py-12"
      style={{
        borderTop: "1px solid rgba(36, 70, 99, 0.2)",
        background: "rgba(10, 14, 39, 0.5)",
      }}
    >
      <div className="max-w-[1440px] mx-auto px-12 text-center">
        <div className="text-xl font-bold text-white mb-3">ZK Proof</div>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Built with privacy in mind. © 2025 ZK Proof
        </p>
      </div>
    </footer>
  );
}
