// Minimal stub to satisfy runtime require of @opentelemetry/instrumentation-http
// Exports a noop instrumentation class compatible with instrumentation API
class HttpInstrumentation {
  constructor() {}
  setConfig() {}
  enable() {}
  disable() {}
}

module.exports = {
  HttpInstrumentation,
  default: HttpInstrumentation,
};
