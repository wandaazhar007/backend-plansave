export function ok(res, data, meta) {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.status(200).json(payload);
}

export function created(res, data, meta) {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.status(201).json(payload);
}

export function fail(res, status, code, message, details) {
  const payload = {
    success: false,
    error: { code, message },
  };
  if (details !== undefined) payload.error.details = details;
  return res.status(status).json(payload);
}