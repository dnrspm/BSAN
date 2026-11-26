"use client"

import { useCallback, useSyncExternalStore } from "react"

/** "mvp": Unggah Data tanpa metadata (CSV skor). "ideal": Metadata & Unggah Data (template Excel dari metadata). */
export type ModeUnggah = "mvp" | "ideal"

const KUNCI = "mode-unggah-indeks-bsan"
const PERISTIWA = "mode-unggah-berubah"

/** Nama menu sidebar mengikuti mode. */
export const labelMenuUnggah = (m: ModeUnggah) => (m === "ideal" ? "Metadata & Unggah Data" : "Unggah Data")

function baca(): ModeUnggah {
  try {
    return localStorage.getItem(KUNCI) === "ideal" ? "ideal" : "mvp"
  } catch {
    return "mvp"
  }
}
function langgan(cb: () => void) {
  window.addEventListener(PERISTIWA, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(PERISTIWA, cb)
    window.removeEventListener("storage", cb)
  }
}

/** Mode unggah yang dipilih (disimpan di localStorage, demo) dan dibagikan antara sidebar dan halaman. Bawaan: MVP. */
export function useModeUnggah() {
  const mode = useSyncExternalStore(langgan, baca, () => "mvp" as ModeUnggah)
  const setMode = useCallback((m: ModeUnggah) => {
    try { localStorage.setItem(KUNCI, m) } catch {}
    window.dispatchEvent(new Event(PERISTIWA))
  }, [])
  return { mode, setMode }
}
