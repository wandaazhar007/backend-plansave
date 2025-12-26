import { ApiError } from "../utils/errors.js";
import { uploadReceiptToStorage } from "../services/receipts.service.js";

export async function uploadReceipt(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(422, "VALIDATION_ERROR", "File is required.");
    }

    const { uid } = req.auth;
    const { originalname, mimetype, buffer, size } = req.file;

    const result = await uploadReceiptToStorage({
      uid,
      originalname,
      mimetype,
      buffer,
      size
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}