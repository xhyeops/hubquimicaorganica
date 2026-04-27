export const ADMIN_EMAILS = [
  "dre1@live.com",
  "anagege2001@gmail.com",
]

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email)
}