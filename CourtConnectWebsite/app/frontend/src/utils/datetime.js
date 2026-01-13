// src/utils/datetime.js

/**
 * Valid Australian timezones
 * We only operate within Australia, so limit to these zones
 */
export const AUSTRALIAN_TIMEZONES = [
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Adelaide',
  'Australia/Perth',
  'Australia/Hobart',
  'Australia/Darwin',
  'Australia/Canberra',
  'Australia/Lord_Howe',
  'Australia/Eucla',
  'Australia/Broken_Hill',
  'Australia/Lindeman',
];

/**
 * Default timezone for the application
 */
export const DEFAULT_TIMEZONE = 'Australia/Sydney';

/**
 * Detect user's timezone from browser
 * Returns Australian timezone if detected, otherwise defaults to Sydney
 */
export function detectUserTimezone() {
  try {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Check if detected timezone is in Australian list
    if (AUSTRALIAN_TIMEZONES.includes(browserTz)) {
      return browserTz;
    }

    // User is outside Australia or timezone not recognized - use default
    return DEFAULT_TIMEZONE;
  } catch (error) {
    // Detection failed - use default
    console.warn('Timezone detection failed, using default:', DEFAULT_TIMEZONE, error);
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Validate and sanitize timezone input
 * @param {string} tz - Timezone to validate
 * @returns {string} Valid Australian timezone or default
 */
export function validateTimezone(tz) {
  if (!tz || !AUSTRALIAN_TIMEZONES.includes(tz)) {
    return DEFAULT_TIMEZONE;
  }
  return tz;
}

// 仅负责"显示"——把 ISO 时间渲染成指定时区下的本地文案
// Now uses detected timezone by default instead of hardcoded Sydney
export function formatDateInTz(
  isoString,
  {
    tz = null, // null = auto-detect
    withSeconds = false,
    withDate = true,
    hour12 = false, // 24h 制：false；12h 制（AM/PM）：true
    locale = 'en-AU',
  } = {}
) {
  if (!isoString) return '';

  // Use provided timezone, or detect if not provided
  const timezone = tz ? validateTimezone(tz) : detectUserTimezone();

  const opts = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12,
  };
  if (withDate) {
    Object.assign(opts, { year: 'numeric', month: 'short', day: '2-digit' });
  }
  return new Intl.DateTimeFormat(locale, opts).format(new Date(isoString));
}

export function isCancellable(startIso, nowMs = Date.now()) {
  const twoHours = 2 * 60 * 60 * 1000;
  return new Date(startIso).getTime() - nowMs >= twoHours;
}

export function partitionBookings(list, nowMs = Date.now()) {
  const upcoming = [];
  const past = [];
  for (const b of list) {
    const end = new Date(b.end_datetime).getTime();
    (end > nowMs ? upcoming : past).push(b);
  }
  upcoming.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
  past.sort((a, b) => new Date(b.end_datetime) - new Date(a.end_datetime));
  return { upcoming, past };
}
