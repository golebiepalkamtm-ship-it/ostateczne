// Small startup diagnostic to check OpenTelemetry module availability
const fs = require('fs')
function log(...args){ console.log('[startup-diagnostic]', ...args) }
try{
  try{
    const resolved = require.resolve('@opentelemetry/instrumentation-http')
    log('resolve:', resolved)
  }catch(e){
    log('resolve-error:', e && e.code ? e.code : String(e))
  }
  try{
    const mod = require('@opentelemetry/instrumentation-http')
    log('require-type:', typeof mod)
    // if module exports a class named HttpInstrumentation, note it
    if(mod && (mod.HttpInstrumentation || mod.default)){
      log('exports:', Object.keys(mod).join(','))
    }
  }catch(e){
    log('require-error:', e && e.code ? e.code : String(e))
  }
  try{
    const paths = [
      './node_modules/@opentelemetry/instrumentation-http',
      '/app/node_modules/@opentelemetry/instrumentation-http',
    ]
    paths.forEach(p => log('exists', p, fs.existsSync(p)))
  }catch(e){
    log('fs-check-error', String(e))
  }
}catch(e){
  console.error('[startup-diagnostic] unexpected error', e)
}
