/*!
 *  @eatsjobs/howler-es v3.0.0-alpha.1
 *  https://github.com/eatsjobs/howler.es
 *  (c) 2013-2025, James Simpson of GoldFire Studios
 *  MIT License
 */
// Core library exports
export { Howl, Howler, Sound } from "./howler.core";
export type { PluginHooks } from "./plugins";

// Plugin system exports
export { globalPluginManager, HowlerPlugin, PluginManager } from "./plugins";
export type { HowlOptions } from "./types";

// Type guards and utilities
export { isSpatialAudio } from "./types";
