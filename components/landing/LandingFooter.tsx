import { GraduationCap, Mail, Phone, MapPin, ExternalLink } from "lucide-react"

const quickLinks = [
  { label: "Tentang BSAN", href: "https://cerdasberkarakter.kemendikdasmen.go.id/budayasekolahamannyaman/" },
  { label: "Panduan Membuat Kelompok Kerja", href: "https://www.youtube.com/watch?v=1YfsiZxJw4A" },
]

export function LandingFooter() {
  const handleClick = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer")
    } else {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Portal BSAN</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sistem Informasi Budaya Sekolah Aman dan Nyaman — Platform pengelolaan
              Kelompok Kerja dan pemantauan program perlindungan peserta didik.
            </p>
          </div>

          <div>
            <p className="font-semibold text-sm text-slate-200 mb-4">Tautan Cepat</p>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => handleClick(link.href)}
                    className="text-slate-400 text-sm hover:text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-sm text-slate-200 mb-4">Kontak</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
                <span className="text-slate-400 text-sm">
                  Pusat Penguatan Karakter, Kementerian Pendidikan, Kebudayaan, Riset dan Teknologi
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="text-slate-400 text-sm">bsan@kemdikbud.go.id</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="text-slate-400 text-sm">(021) 5703303</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-500 text-xs">
            © 2025 BSAN — Kementerian Pendidikan, Kebudayaan, Riset dan Teknologi
          </p>
          <p className="text-slate-600 text-xs">
            Sistem Informasi Kelompok Kerja Sekolah Aceh
          </p>
        </div>
      </div>
    </footer>
  )
}
