import { CheckCircle2 } from "lucide-react"
import { GraduationCap, BookOpen, Globe, Medal } from "@phosphor-icons/react/ssr"

const points = [
  {
    icon: GraduationCap,
    title: "Pendidikan Karakter Terintegrasi",
    desc: "Menanamkan nilai-nilai perlindungan dan rasa aman sebagai bagian dari kurikulum.",
  },
  {
    icon: BookOpen,
    title: "Panduan Implementasi Jelas",
    desc: "Prosedur dan mekanisme yang terstruktur untuk diterapkan di setiap sekolah.",
  },
  {
    icon: Globe,
    title: "Cakupan Nasional",
    desc: "Program yang dirancang untuk diterapkan di seluruh satuan pendidikan Indonesia.",
  },
  {
    icon: Medal,
    title: "Verifikasi dan Akuntabilitas",
    desc: "Sistem pemantauan dan pelaporan yang transparan untuk memastikan kepatuhan.",
  },
]

export function AboutSection() {
  return (
    <section id="tentang" className="py-24 bg-[#F9F9F9]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">
              Tentang Program
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Apa itu Budaya Sekolah Aman dan Nyaman?
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              BSAN adalah inisiatif Kementerian Pendidikan untuk menciptakan ekosistem
              sekolah yang bebas dari kekerasan fisik, psikologis, dan diskriminasi,
              sehingga setiap peserta didik dapat belajar dan berkembang secara optimal.
            </p>
            <p className="mt-3 text-slate-500 leading-relaxed">
              Program ini berfokus pada penguatan sistem, budaya, dan kapasitas
              seluruh warga sekolah melalui pendekatan yang komprehensif dan terukur.
            </p>

            <div className="mt-8 space-y-3">
              {["Mencegah kekerasan dan perundungan", "Membangun lingkungan inklusif", "Mendorong partisipasi aktif warga sekolah", "Melindungi hak-hak peserta didik"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-slate-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {points.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-[4px] p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-[8px] flex items-center justify-center mb-3">
                  <Icon weight="fill" className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1">{title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
