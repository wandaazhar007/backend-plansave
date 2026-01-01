function pad2(n) {
  return String(n).padStart(2, "0");
}

export function getMonthRange(month) {
  // month: YYYY-MM
  const [yStr, mStr] = String(month).split("-");
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1; // 0-based

  // last day of month: new Date(year, monthIndex + 1, 0)
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  const from = `${year}-${pad2(monthIndex + 1)}-01`;
  const to = `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`;

  return { from, to };
}

export function budgetDocId(uid, month) {
  return `${uid}_${month}`;
}