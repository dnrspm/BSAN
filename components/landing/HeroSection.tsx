"use client"

import { useRouter } from "next/navigation"
import { Shield, Heart, Brain, Users, ArrowRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const pillars = [
  { icon: Heart, label: "Kebutuhan Spiritual" },
  { icon: Shield, label: "Perlindungan Fisik" },
  { icon: Brain, label: "Kesejahteraan Psikologis" },
  { icon: Users, label: "Keamanan Sosiokultural" },
]

export function HeroSection() {
  const router = useRouter()

  const scrollToNext = () => {
    const el = document.querySelector("#urgensi")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      id="beranda"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800"
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #fbbf24 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 40%)`,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <Badge className="mb-6 bg-amber-400/20 text-amber-300 border-amber-400/30 hover:bg-amber-400/20 text-xs font-medium tracking-wider uppercase px-4 py-1.5">
          Kementerian Pendidikan, Kebudayaan, Riset & Teknologi
        </Badge>

        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
          Selamat Datang di <span className="text-amber-400">Portal BSAN</span>
        </h1>

        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed mb-10">
          Portal Informasi Pembentukan Kelompok Kerja (Pokja) Budaya Sekolah Aman dan Nyaman di Seluruh Indonesia
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            onClick={() => {
              const el = document.querySelector("#tentang")
              if (el) el.scrollIntoView({ behavior: "smooth" })
            }}
            variant="outline"
            size="lg"
            className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white px-8 h-12 text-base"
          >
            Pelajari Program
          </Button>
          <Button
            onClick={() => router.push("/login")}
            size="lg"
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-8 h-12 text-base shadow-lg shadow-amber-400/20 gap-2"
          >
            Masuk Sistem
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {pillars.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm rounded-[4px] px-4 py-4 border border-white/10"
            >
              <Icon className="w-6 h-6 text-amber-400" />
              <span className="text-white/90 text-xs font-medium text-center leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors animate-bounce"
        aria-label="Scroll ke bawah"
      >
        <ChevronDown className="w-7 h-7" />
      </button>
    </section>
  )
}
