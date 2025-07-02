export function successResponse(res, message, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

export function errorResponse(res, error, status = 400) {
  return res.status(status).json({
    success: false,
    error: typeof error === 'string' ? { message: error } : error
  });
}
