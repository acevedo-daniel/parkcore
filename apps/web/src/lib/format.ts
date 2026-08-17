export function formatMoney(cents: number, currency: 'USD' = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDuration(startTime: string, endTime = new Date().toISOString()) {
  const milliseconds = Math.max(0, new Date(endTime).getTime() - new Date(startTime).getTime());
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function checkoutPreview(startTime: string, hourlyRateCents: number) {
  const elapsedHours = (Date.now() - new Date(startTime).getTime()) / 3_600_000;
  const chargedHours = Math.max(1, Math.ceil(elapsedHours));
  return { chargedHours, totalAmountCents: chargedHours * hourlyRateCents };
}
