import { supabase } from "@/lib/supabase"

type AnalyticsMetadata = Record<
  string,
  string | number | boolean | null | undefined
>

type TrackEventParams = {
  event_type: string
  page_path?: string
  section?: string
  slug?: string
  title?: string
  duration_seconds?: number

  content_id?: string
  content_type?: string

  success?: boolean
  value?: number

  metadata?: AnalyticsMetadata
}

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return null

  let id = localStorage.getItem("site_visitor_id")

  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("site_visitor_id", id)
  }

  return id
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return null

  let id = sessionStorage.getItem("site_session_id")

  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem("site_session_id", id)
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

  if (userAgent.includes("Edg/")) return "Edge"
  if (userAgent.includes("Firefox/")) return "Firefox"
  if (userAgent.includes("OPR/") || userAgent.includes("Opera")) {
    return "Opera"
  }
  if (userAgent.includes("Chrome/")) return "Chrome"

  if (
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/")
  ) {
    return "Safari"
  }

  return "Outro"
}

function getOS() {
  if (typeof navigator === "undefined") return "unknown"

  const userAgent = navigator.userAgent

  /*
   * A ordem é importante.
   * iPhone/iPad precisam ser verificados antes de Mac,
   * pois alguns dispositivos Apple podem compartilhar
   * partes semelhantes do user agent.
   */

  if (
    userAgent.includes("iPhone") ||
    userAgent.includes("iPad") ||
    userAgent.includes("iPod")
  ) {
    return "iOS"
  }

  if (userAgent.includes("Android")) {
    return "Android"
  }

  if (userAgent.includes("Windows")) {
    return "Windows"
  }

  if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS")) {
    return "MacOS"
  }

  if (userAgent.includes("Linux")) {
    return "Linux"
  }

  return "Outro"
}

function getReferrer() {
  if (typeof document === "undefined") return null

  if (!document.referrer) {
    return null
  }

  try {
    const referrerUrl = new URL(document.referrer)

    /*
     * Não consideramos navegação interna do próprio site
     * como origem externa.
     */
    if (referrerUrl.hostname === window.location.hostname) {
      return null
    }

    return document.referrer
  } catch {
    return document.referrer
  }
}

export async function trackEvent({
  event_type,
  page_path,
  section,
  slug,
  title,
  duration_seconds,
  content_id,
  content_type,
  success,
  value,
  metadata,
}: TrackEventParams) {
  if (typeof window === "undefined") return

  const visitor_id = getOrCreateVisitorId()
  const session_id = getOrCreateSessionId()

  try {
    const { error } = await supabase.from("site_analytics").insert([
      {
        event_type,

        page_path:
          page_path ||
          `${window.location.pathname}${window.location.search}`,

        section: section || null,
        slug: slug || null,
        title: title || null,

        visitor_id,
        session_id,

        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),

        referrer: getReferrer(),

        duration_seconds: duration_seconds ?? null,

        content_id: content_id || null,
        content_type: content_type || null,

        success:
          typeof success === "boolean"
            ? success
            : null,

        value:
          typeof value === "number"
            ? value
            : null,

        metadata: metadata || {},
      },
    ])

    if (error) {
      console.error(
        "Erro ao registrar analytics:",
        error
      )
    }
  } catch (error) {
    console.error(
      "Erro inesperado no analytics:",
      error
    )
  }
}
