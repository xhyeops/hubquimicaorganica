import { supabase } from "@/lib/supabase"

function getOrCreateId(key: string) {
  if (typeof window === "undefined") return null

  let id = localStorage.getItem(key)

  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }

  return id
}

function getDeviceType() {
  if (typeof window === "undefined") return "unknown"

  const width = window.innerWidth

  if (width < 768) return "mobile"
  if (width < 1024) return "tablet"
  return "desktop"
}

function getBrowser() {
  if (typeof navigator === "undefined") return "unknown"

  const userAgent = navigator.userAgent

  if (userAgent.includes("Chrome")) return "Chrome"
  if (userAgent.includes("Firefox")) return "Firefox"
  if (userAgent.includes("Safari")) return "Safari"
  if (userAgent.includes("Edg")) return "Edge"

  return "Outro"
}

function getOS() {
  if (typeof navigator === "undefined") return "unknown"

  const userAgent = navigator.userAgent

  if (userAgent.includes("Windows")) return "Windows"
  if (userAgent.includes("Mac")) return "MacOS"
  if (userAgent.includes("Android")) return "Android"
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS"
  if (userAgent.includes("Linux")) return "Linux"

  return "Outro"
}

type TrackEventParams = {
  event_type: string
  page_path?: string
  section?: string
  slug?: string
  title?: string
  duration_seconds?: number
}

export async function trackEvent({
  event_type,
  page_path,
  section,
  slug,
  title,
  duration_seconds,
}: TrackEventParams) {
  if (typeof window === "undefined") return

  const visitor_id = getOrCreateId("site_visitor_id")
  const session_id = getOrCreateId("site_session_id")

  const { error } = await supabase.from("site_analytics").insert([
    {
      event_type,
      page_path: page_path || window.location.pathname,
      section,
      slug,
      title,
      visitor_id,
      session_id,
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      referrer: document.referrer || null,
      duration_seconds: duration_seconds ?? null,
    },
  ])

  if (error) {
    console.error("Erro ao registrar analytics:", error)
  }
}