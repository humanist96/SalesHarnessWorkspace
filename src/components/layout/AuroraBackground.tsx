'use client'

export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #0f172a 0%, #0a0e1a 100%)',
        }}
      />

      {/* Aurora orb 1 - blue */}
      <div
        className="absolute -left-[20%] -top-[30%] h-[700px] w-[700px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
          animation: 'aurora-shift 20s ease-in-out infinite',
          filter: 'blur(80px)',
        }}
      />

      {/* Aurora orb 2 - gold */}
      <div
        className="absolute -right-[10%] top-[10%] h-[500px] w-[500px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
          animation: 'aurora-shift 25s ease-in-out infinite reverse',
          filter: 'blur(100px)',
        }}
      />

      {/* Aurora orb 3 - violet */}
      <div
        className="absolute bottom-[10%] left-[30%] h-[600px] w-[600px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          animation: 'aurora-shift 30s ease-in-out infinite',
          filter: 'blur(120px)',
        }}
      />

      {/* Mesh grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}
