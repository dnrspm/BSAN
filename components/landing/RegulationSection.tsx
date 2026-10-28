import { Download } from "lucide-react"
import { FileText } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const regulations = [
  {
    id: "prinsip",
    title: "Prinsip-Prinsip BSAN",
    content:
      "Program BSAN dilandaskan pada prinsip non-diskriminasi, kepentingan terbaik peserta didik, hak hidup dan tumbuh kembang, serta penghargaan terhadap pandangan anak. Seluruh kebijakan dan tindakan wajib mempertimbangkan kesejahteraan peserta didik sebagai prioritas utama.",
  },
  {
    id: "tujuan",
    title: "Tujuan Program",
    content:
      "Tujuan utama BSAN adalah: (1) Mewujudkan lingkungan belajar yang aman, nyaman, dan bebas kekerasan; (2) Meningkatkan kualitas interaksi antar warga sekolah; (3) Menguatkan sistem perlindungan peserta didik; (4) Membangun kapasitas pendidik dalam penanganan kasus; (5) Mendorong partisipasi aktif orang tua dan masyarakat.",
  },
  {
    id: "peran",
    title: "Peran Pemangku Kepentingan",
    content:
      "Kepala Sekolah bertanggung jawab atas implementasi kebijakan. Guru berperan sebagai fasilitator dan model perilaku positif. Orang tua mendukung penguatan karakter di rumah. Komite Sekolah mengawasi pelaksanaan program. Dinas Pendidikan melakukan pembinaan dan supervisi.",
  },
  {
    id: "prosedur",
    title: "Prosedur Implementasi",
    content:
      "Implementasi dilakukan melalui 4 tahap: (1) Sosialisasi dan penguatan kapasitas warga sekolah; (2) Penyusunan kebijakan dan SOP penanganan kasus; (3) Pembentukan Tim BSAN di tingkat sekolah; (4) Pemantauan, evaluasi, dan pelaporan berkala kepada Dinas Pendidikan.",
  },
]

export function RegulationSection() {
  return (
    <section id="regulasi" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">
              Landasan Hukum
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Ringkasan Regulasi BSAN
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              Program BSAN diatur dalam regulasi resmi Kementerian Pendidikan yang
              memberikan kerangka hukum yang kuat bagi implementasi di seluruh
              satuan pendidikan Indonesia.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center gap-4 p-4 rounded-[4px] border border-[#D9DBDD] bg-[#F9F9F9] hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 bg-blue-600 rounded-[8px] flex items-center justify-center shrink-0">
                  <FileText weight="fill" className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">Dokumen Regulasi BSAN</p>
                  <p className="text-slate-500 text-xs mt-0.5">Peraturan resmi & panduan implementasi</p>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold shadow-none shrink-0 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </Button>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-[4px] border border-[#D9DBDD] bg-[#F9F9F9] hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 bg-slate-700 rounded-[8px] flex items-center justify-center shrink-0">
                  <FileText weight="fill" className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">Slide Presentasi</p>
                  <p className="text-slate-500 text-xs mt-0.5">Materi sosialisasi untuk sekolah</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 border-[#808489]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </Button>
              </div>
            </div>
          </div>

          <div className="border border-[#D9DBDD] rounded-[4px] overflow-hidden shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {regulations.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="px-6">
                  <AccordionTrigger className="text-slate-900 font-semibold text-sm py-5 hover:no-underline hover:text-blue-600">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-500 text-sm leading-relaxed pb-5">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}
