export function formatDateForDisplay(date: Date | string): string {
  return new Date(date).toLocaleDateString();
}

export function formatTimeForDisplay(time: Date | string): string {
  return new Date(time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
