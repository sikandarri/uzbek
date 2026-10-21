export function formatUZS(minorUnits: bigint | string, locale = 'uz-Latn') {
  // UZS minor units are tiyin. Payment adapters must convert provider units explicitly.
  const amount = BigInt(minorUnits);
  if (amount > BigInt(Number.MAX_SAFE_INTEGER) || amount < BigInt(Number.MIN_SAFE_INTEGER))
    throw new RangeError('Amount exceeds UI precision');
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) / 100);
}
export function formatDate(utc: string, locale = 'uz-Latn') {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(utc));
}
