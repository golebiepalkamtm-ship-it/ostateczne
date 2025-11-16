/**
 * Stub dla require-in-the-middle w development
 * Eliminuje webpack warnings związane z dynamicznymi require
 * 
 * require-in-the-middle ma API:
 * module.exports = function(moduleName, options, onrequire)
 */
export default function requireInTheMiddle(
  moduleName?: string | string[],
  options?: unknown,
  onrequire?: (exports: unknown, name: string, basedir: string) => unknown
) {
  // W development nie robimy nic - zwracamy noop
  return {
    unhook: () => {},
  };
}

// Export jako CommonJS dla kompatybilności
module.exports = requireInTheMiddle;
module.exports.default = requireInTheMiddle;

