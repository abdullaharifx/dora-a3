export function formatDate(date: Date): string {
  // Format date in Urdu style
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  return date.toLocaleDateString("ur-PK", options)
}

export function formatTime(date: Date): string {
  // Format time in Urdu style
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }

  return date.toLocaleTimeString("ur-PK", options)
}
