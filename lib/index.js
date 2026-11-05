/**
 * Host half of the pixel-dancer plugin.
 *
 * The plugin is presentation-only: the browser bundle registered through the
 * package's `./client` export paints the dancer, so the Node side has nothing
 * to do beyond giving the Loader a valid row to mount.
 */
export function apply() {}
