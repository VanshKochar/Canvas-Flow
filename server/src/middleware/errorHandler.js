/**
 * ============================================================================
 * GLOBAL CENTRALIZED ERROR HANDLER
 * ============================================================================
 * Intercepts uncaught exceptions and rejected promises, outputting structured
 * JSON error envelopes without leaking server stack traces in production.
 */

export function errorHandler(err, req, res, next) {
  console.error('💥 Server Error:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      name: err.name || 'Error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

