import ExcelJS from "exceljs";
import { fail } from "../utils/apiResponse.js";
import { exportTransactionsQuerySchema } from "../validators/export.schema.js";
import { diffDaysInclusive } from "../utils/date.js";
import { iterateTransactionsByDateRange } from "../services/export.service.js";
import { env } from "../config/env.js";

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function makeFileName({ from, to, format }) {
  return `plansave-transactions-${from}-to-${to}.${format}`;
}

export async function exportTransactions(req, res, next) {
  try {
    const parsed = exportTransactionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 422, "VALIDATION_ERROR", "Input tidak valid.", parsed.error.flatten());
    }

    const { from, to, format } = parsed.data;

    const maxDays = Number(process.env.EXPORT_MAX_DAYS || 366);
    const days = diffDaysInclusive(from, to);
    if (days > maxDays) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        `Range tanggal terlalu besar. Maksimal ${maxDays} hari.`,
        { from, to, maxDays }
      );
    }

    const batchSize = Number(process.env.EXPORT_BATCH_SIZE || 1000);

    const uid = req.auth.uid;
    const filename = makeFileName({ from, to, format });

    if (format === "csv") {
      res.status(200);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      // BOM untuk Excel compatibility
      res.write("\ufeff");

      const headers = [
        "id",
        "date",
        "type",
        "amountCents",
        "currency",
        "category",
        "isDialysisRelated",
        "note",
        "createdAt",
        "updatedAt",
      ];
      res.write(headers.join(",") + "\n");

      for await (const tx of iterateTransactionsByDateRange(uid, { from, to, batchSize })) {
        const row = [
          tx.id,
          tx.date,
          tx.type,
          tx.amountCents,
          tx.currency,
          tx.category,
          tx.isDialysisRelated,
          tx.note,
          tx.createdAt,
          tx.updatedAt,
        ].map(csvEscape);

        res.write(row.join(",") + "\n");
      }

      return res.end();
    }

    // XLSX
    res.status(200);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Streaming workbook ke response
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const sheet = workbook.addWorksheet("Transactions");

    sheet.addRow([
      "id",
      "date",
      "type",
      "amountCents",
      "currency",
      "category",
      "isDialysisRelated",
      "note",
      "createdAt",
      "updatedAt",
    ]).commit();

    for await (const tx of iterateTransactionsByDateRange(uid, { from, to, batchSize })) {
      sheet.addRow([
        tx.id,
        tx.date,
        tx.type,
        tx.amountCents,
        tx.currency,
        tx.category,
        tx.isDialysisRelated,
        tx.note,
        tx.createdAt,
        tx.updatedAt,
      ]).commit();
    }

    sheet.commit();
    await workbook.commit();
    // jangan res.end() manual; workbook.commit() akan menutup stream
  } catch (err) {
    return next(err);
  }
}