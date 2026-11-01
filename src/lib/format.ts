const MONTHS = [
  "Mutarama",
  "Gashyantare",
  "Werurwe",
  "Mata",
  "Gicurasi",
  "Kamena",
  "Nyakanga",
  "Kanama",
  "Nzeli",
  "Ukwakira",
  "Ugushyingo",
  "Ukuboza",
];

const DAYS = [
  "Ku cyumweru",
  "Kuwa mbere",
  "Kuwa kabiri",
  "Kuwa gatatu",
  "Kuwa kane",
  "Kuwa gatanu",
  "Kuwa gatandatu",
];

export function todayLabel(d = new Date()) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function shortDate(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "nonaha";
  if (s < 3600) return `hashize iminota ${Math.floor(s / 60)}`;
  if (s < 86400) return `hashize amasaha ${Math.floor(s / 3600)}`;
  const d = Math.floor(s / 86400);
  if (d === 1) return "ejo hashize";
  if (d < 30) return `hashize iminsi ${d}`;
  return shortDate(ts);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return "Mwaramutse ☀️☀️";
  if (h < 16) return "Mwiriwe ☀️";
  return "Hello 👋🏻👋🏻";
}
