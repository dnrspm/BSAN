import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    id: "apa-itu",
    question: "Apa itu program Budaya Sekolah Aman dan Nyaman (BSAN)?",
    answer:
      "BSAN adalah program Kementerian Pendidikan, Kebudayaan, Riset dan Teknologi yang bertujuan menciptakan lingkungan sekolah yang aman, nyaman, dan bebas dari kekerasan. Program ini mencakup aspek fisik, psikologis, spiritual, dan sosiokultural seluruh warga sekolah.",
  },
  {
    id: "siapa-sasaran",
    question: "Siapa sasaran program BSAN?",
    answer:
      "Program BSAN menyasar seluruh satuan pendidikan dari jenjang SD hingga SMA/SMK di Indonesia. Seluruh warga sekolah — peserta didik, pendidik, tenaga kependidikan, dan orang tua — adalah bagian dari program ini.",
  },
  {
    id: "cara-daftar",
    question: "Bagaimana cara sekolah bergabung dalam program BSAN?",
    answer:
      "Sekolah dapat bergabung melalui Dinas Pendidikan setempat. Proses pendaftaran meliputi sosialisasi, pembentukan Tim BSAN sekolah, penyusunan kebijakan internal, dan pelaporan kepada Dinas Pendidikan. Panduan lengkap tersedia dalam dokumen regulasi.",
  },
  {
    id: "pokja",
    question: "Apa itu Kelompok Kerja BSAN dan apa fungsinya?",
    answer:
      "Kelompok Kerja BSAN adalah tim yang dibentuk di tingkat dinas pendidikan untuk mengkoordinasikan, memantau, dan mengevaluasi implementasi program BSAN di wilayahnya. Kelompok Kerja bertugas memastikan setiap sekolah menjalankan program sesuai regulasi.",
  },
  {
    id: "pelaporan",
    question: "Bagaimana mekanisme pelaporan kasus di lingkungan sekolah?",
    answer:
      "Pelaporan kasus dilakukan secara berjenjang: (1) Laporan ke wali kelas atau guru BK, (2) Eskalasi ke kepala sekolah jika diperlukan, (3) Koordinasi dengan komite sekolah dan orang tua, (4) Pelaporan ke Dinas Pendidikan untuk kasus yang memerlukan intervensi lebih lanjut.",
  },
  {
    id: "sistem",
    question: "Apa fungsi sistem informasi BSAN ini?",
    answer:
      "Sistem informasi BSAN memfasilitasi pengelolaan data Kelompok Kerja, pemantauan implementasi program, pelaporan kasus, dan koordinasi antar pemangku kepentingan secara digital. Sistem ini diakses oleh Dinas Pendidikan, sekolah, dan Pusat Kemendikbud.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-[#F9F9F9]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-4 text-slate-500">
            Temukan jawaban atas pertanyaan umum seputar program BSAN.
          </p>
        </div>

        <div className="bg-white rounded-[4px] border border-slate-100 shadow-sm overflow-hidden">
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="px-6">
                <AccordionTrigger className="text-slate-900 font-semibold text-sm py-5 hover:no-underline hover:text-blue-600 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 text-sm leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
