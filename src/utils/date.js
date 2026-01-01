// function pad2(n) {
//   return String(n).padStart(2, "0");
// }

// export function getMonthRange(month) {
//   // month: YYYY-MM
//   const [yStr, mStr] = String(month).split("-");
//   const year = Number(yStr);
//   const monthIndex = Number(mStr) - 1; // 0-based

//   // last day of month: new Date(year, monthIndex + 1, 0)
//   const lastDay = new Date(year, monthIndex + 1, 0).getDate();

//   const from = `${year}-${pad2(monthIndex + 1)}-01`;
//   const to = `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`;

//   return { from, to };
// }

// export function budgetDocId(uid, month) {
//   return `${uid}_${month}`;
// }











// function pad2(n) {
//   return String(n).padStart(2, "0");
// }

// export function getMonthRange(month) {
//   // month: YYYY-MM
//   const [yStr, mStr] = String(month).split("-");
//   const year = Number(yStr);
//   const monthIndex = Number(mStr) - 1; // 0-based

//   const lastDay = new Date(year, monthIndex + 1, 0).getDate();

//   const from = `${year}-${pad2(monthIndex + 1)}-01`;
//   const to = `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`;

//   return { from, to };
// }

// export function budgetDocId(uid, month) {
//   return `${uid}_${month}`;
// }

// export function getCurrentMonth() {
//   // YYYY-MM (UTC-based)
//   return new Date().toISOString().slice(0, 7);
// }

// export function shiftMonth(month, delta) {
//   // month: YYYY-MM, delta: integer (+/-)
//   const [yStr, mStr] = String(month).split("-");
//   const year = Number(yStr);
//   const m = Number(mStr);

//   // gunakan Date supaya aman untuk overflow bulan
//   const d = new Date(Date.UTC(year, m - 1, 1));
//   d.setUTCMonth(d.getUTCMonth() + Number(delta));

//   const yy = d.getUTCFullYear();
//   const mm = pad2(d.getUTCMonth() + 1);
//   return `${yy}-${mm}`;
// }

// export function getRecentMonths(count, endMonth = getCurrentMonth()) {
//   const n = Number(count);
//   const months = [];
//   for (let i = n - 1; i >= 0; i--) {
//     months.push(shiftMonth(endMonth, -i));
//   }
//   return months; // oldest -> newest
// }







function pad2(n) {
  return String(n).padStart(2, "0");
}

export function getMonthRange(month) {
  const [yStr, mStr] = String(month).split("-");
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1;

  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  const from = `${year}-${pad2(monthIndex + 1)}-01`;
  const to = `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`;

  return { from, to };
}

export function budgetDocId(uid, month) {
  return `${uid}_${month}`;
}

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function shiftMonth(month, delta) {
  const [yStr, mStr] = String(month).split("-");
  const year = Number(yStr);
  const m = Number(mStr);

  const d = new Date(Date.UTC(year, m - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + Number(delta));

  const yy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  return `${yy}-${mm}`;
}

export function getRecentMonths(count, endMonth = getCurrentMonth()) {
  const n = Number(count);
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    months.push(shiftMonth(endMonth, -i));
  }
  return months;
}

// ======================
// Export helpers
// ======================
export function parseIsoDateYYYYMMDD(s) {
  // s: YYYY-MM-DD
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0));
}

export function diffDaysInclusive(from, to) {
  const a = parseIsoDateYYYYMMDD(from);
  const b = parseIsoDateYYYYMMDD(to);
  const ms = b.getTime() - a.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1; // inclusive
  return days;
}