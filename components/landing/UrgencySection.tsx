import { TrendUp, Scales, Handshake } from "@phosphor-icons/react/ssr"
import { Card, CardContent } from "@/components/ui/card"

const urgencies = [
  {
    icon: TrendUp,
    color: "text-white",
    bg: "bg-blue-600",
    title: "Dari Reaktif ke Preventif",
    description:
      "Pergeseran paradigma penanganan masalah sekolah — dari menanggulangi insiden yang sudah terjadi menjadi mencegah sebelum terjadi melalui budaya dan sistem yang kuat.",
  },
  {
    icon: Scales,
    color: "text-white",
    bg: "bg-amber-500",
    title: "Penguatan Kerangka Hukum",
    description:
      "Dukungan regulasi yang komprehensif memberikan landasan hukum yang jelas bagi seluruh pemangku kepentingan dalam menciptakan sekolah yang aman dan nyaman.",
  },
  {
    icon: Handshake,
    color: "text-white",
    bg: "bg-emerald-600",
    title: "Partisipasi Pemangku Kepentingan",
    description:
      "Keterlibatan aktif seluruh pihak — guru, siswa, orang tua, dan komunitas — sebagai kunci keberhasilan program BSAN di setiap satuan pendidikan.",
  },
]

export function UrgencySection() {
  return (
    <section id="urgensi" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">
            Mengapa BSAN?
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">
            Urgensi Program BSAN
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto text-base">
            Kekerasan dan ketidaknyamanan di lingkungan sekolah berdampak langsung
            pada kualitas pendidikan dan tumbuh kembang peserta didik.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {urgencies.map(({ icon: Icon, color, bg, title, description }) => (
            <Card key={title} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className={`w-12 h-12 ${bg} rounded-[8px] flex items-center justify-center mb-4`}>
                  <Icon weight="fill" className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
