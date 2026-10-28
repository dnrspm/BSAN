import { Download, Quote } from "lucide-react"
import { MusicNotes } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"

const testimonials = [
  {
    quote:
      "Program BSAN telah mengubah iklim sekolah kami secara signifikan. Kasus perundungan menurun drastis dan siswa merasa lebih nyaman untuk belajar.",
    name: "Kepala Sekolah SMP",
    role: "Implementor BSAN, Banda Aceh",
  },
  {
    quote:
      "Sebagai orang tua, saya merasa lebih tenang mengantar anak ke sekolah. Ada sistem yang jelas untuk melindungi mereka.",
    name: "Orang Tua Siswa",
    role: "Komite Sekolah, Aceh Besar",
  },
]

export function CampaignSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 90% 80%, #fbbf24 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-amber-400 text-sm font-semibold uppercase tracking-widest">
            Kampanye BSAN
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-white">
            Materi Kampanye
          </h2>
          <p className="mt-4 text-blue-200 max-w-lg mx-auto">
            Unduh materi kampanye resmi dan dengarkan lagu kampanye BSAN untuk
            disebarluaskan di komunitas sekolah Anda.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="md:col-span-2 bg-white/10 backdrop-blur-sm rounded-[4px] border border-white/10 p-6">
            <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold mb-6">
              Testimoni
            </p>
            <div className="space-y-6">
              {testimonials.map((t) => (
                <div key={t.name} className="relative">
                  <Quote className="w-8 h-8 text-amber-400/30 absolute -top-1 -left-1" />
                  <p className="text-white/90 leading-relaxed pl-6 text-sm">{t.quote}</p>
                  <div className="mt-3 pl-6">
                    <p className="text-amber-400 font-semibold text-sm">{t.name}</p>
                    <p className="text-blue-300 text-xs">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-[4px] border border-white/10 p-6 flex-1">
              <div className="w-12 h-12 bg-amber-400 rounded-[8px] flex items-center justify-center mb-4">
                <MusicNotes weight="fill" className="w-6 h-6 text-blue-950" />
              </div>
              <h3 className="text-white font-semibold mb-1">Lagu Kampanye</h3>
              <p className="text-blue-200 text-sm mb-4">
                "Sekolah Aman, Sekolah Nyaman" — lagu resmi kampanye BSAN
              </p>
              <div className="w-full h-1 bg-white/20 rounded-full mb-2">
                <div className="h-1 bg-amber-400 rounded-full w-0" />
              </div>
              <p className="text-blue-300 text-xs mb-4">Tersedia untuk diunduh</p>
              <Button
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold shadow-none gap-2"
                size="sm"
              >
                <Download className="w-4 h-4" />
                Unduh Lagu
              </Button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-[4px] border border-white/10 p-5">
              <h3 className="text-white font-semibold text-sm mb-3">Materi Kampanye</h3>
              <div className="space-y-2">
                {["Poster Digital", "Infografis Program", "Buku Saku BSAN"].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <span className="text-blue-200 text-xs">{item}</span>
                    <button className="text-amber-400 text-xs font-medium hover:text-amber-300 transition-colors flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      Unduh
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
