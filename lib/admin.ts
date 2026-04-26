export const ADMIN_EMAILS = [
  "dre1@live.com",
  "camillealves190@gmail.com",
]

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email)
}