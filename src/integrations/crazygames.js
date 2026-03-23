/**
 * CrazyGames SDK integration wrapper.
 * Gracefully degrades when not running on CrazyGames (localhost / GitHub Pages / other hosts).
 *
 * Usage:
 *   import { CrazySDK } from '../integrations/crazygames.js';
 *   await CrazySDK.init();
 *   CrazySDK.gameplayStart();
 */

class CrazyGamesWrapper {
  constructor() {
    this._sdk = null;
    this._ready = false;
    this._env = 'disabled'; // 'local' | 'crazygames' | 'disabled'
  }

  /* ------------------------------------------------------------------ */
  /*  Initialisation                                                     */
  /* ------------------------------------------------------------------ */

  async init() {
    try {
      const sdk = window.CrazyGames?.SDK;
      if (!sdk) {
        console.log('[CrazySDK] SDK script not loaded — running standalone.');
        return;
      }
      await sdk.init();
      this._sdk = sdk;
      this._env = sdk.environment || 'disabled';
      this._ready = this._env === 'crazygames' || this._env === 'local';
      console.log(`[CrazySDK] Initialized — env: ${this._env}`);
    } catch (e) {
      console.warn('[CrazySDK] Init failed:', e);
    }
  }

  get isAvailable() {
    return this._ready;
  }

  get environment() {
    return this._env;
  }

  /* ------------------------------------------------------------------ */
  /*  Game events                                                        */
  /* ------------------------------------------------------------------ */

  gameplayStart() {
    if (!this._ready) return;
    try { this._sdk.game.gameplayStart(); } catch (_) { /* noop */ }
  }

  gameplayStop() {
    if (!this._ready) return;
    try { this._sdk.game.gameplayStop(); } catch (_) { /* noop */ }
  }

  loadingStart() {
    if (!this._ready) return;
    try { this._sdk.game.loadingStart(); } catch (_) { /* noop */ }
  }

  loadingStop() {
    if (!this._ready) return;
    try { this._sdk.game.loadingStop(); } catch (_) { /* noop */ }
  }

  happytime() {
    if (!this._ready) return;
    try { this._sdk.game.happytime(); } catch (_) { /* noop */ }
  }

  /* ------------------------------------------------------------------ */
  /*  Game settings (mute audio, disable chat)                           */
  /* ------------------------------------------------------------------ */

  getSettings() {
    if (!this._ready) return { muteAudio: false, disableChat: false };
    try { return this._sdk.game.settings || {}; } catch (_) { return {}; }
  }

  onSettingsChange(cb) {
    if (!this._ready) return;
    try { this._sdk.game.addSettingsChangeListener(cb); } catch (_) { /* noop */ }
  }

  /* ------------------------------------------------------------------ */
  /*  Video ads                                                          */
  /* ------------------------------------------------------------------ */

    requestMidgameAd(onAdStart, onAdEnd) {
        return this._requestAd('midgame', onAdStart, onAdEnd);
  }

    requestRewardedAd(onAdStart, onAdEnd) {
        return this._requestAd('rewarded', onAdStart, onAdEnd);
  }

    _requestAd(type, onAdStart, onAdEnd) {
    return new Promise((resolve) => {
      if (!this._ready) { resolve({ success: false, reason: 'sdk_unavailable' }); return; }
      try {
        this._sdk.ad.requestAd(type, {
            adStarted: () => { if (onAdStart) onAdStart(); },
            adFinished: () => { if (onAdEnd) onAdEnd(); resolve({ success: true }); },
            adError: (err) => { if (onAdEnd) onAdEnd(); resolve({ success: false, reason: err?.code || 'error' }); },
        });
      } catch (e) {
        resolve({ success: false, reason: 'exception' });
      }
    });
  }

  async hasAdblock() {
    if (!this._ready) return false;
    try { return await this._sdk.ad.hasAdblock(); } catch (_) { return false; }
  }

  /* ------------------------------------------------------------------ */
  /*  Banners                                                            */
  /* ------------------------------------------------------------------ */

  async requestBanner(containerId, width, height) {
    if (!this._ready) return;
    try {
      await this._sdk.banner.requestBanner({ id: containerId, width, height });
    } catch (e) {
      console.warn('[CrazySDK] Banner error:', e?.code || e);
    }
  }

  async requestResponsiveBanner(containerId) {
    if (!this._ready) return;
    try {
      await this._sdk.banner.requestResponsiveBanner(containerId);
    } catch (e) {
      console.warn('[CrazySDK] Responsive banner error:', e?.code || e);
    }
  }

  clearBanner(containerId) {
    if (!this._ready) return;
    try { this._sdk.banner.clearBanner(containerId); } catch (_) { /* noop */ }
  }

  clearAllBanners() {
    if (!this._ready) return;
    try { this._sdk.banner.clearAllBanners(); } catch (_) { /* noop */ }
  }

  /* ------------------------------------------------------------------ */
  /*  User                                                               */
  /* ------------------------------------------------------------------ */

  get isUserAccountAvailable() {
    if (!this._ready) return false;
    try { return this._sdk.user.isUserAccountAvailable; } catch (_) { return false; }
  }

  async getUser() {
    if (!this._ready) return null;
    try { return await this._sdk.user.getUser(); } catch (_) { return null; }
  }

  getSystemInfo() {
    if (!this._ready) return null;
    try { return this._sdk.user.systemInfo; } catch (_) { return null; }
  }

  async showAuthPrompt() {
    if (!this._ready) return null;
    try { return await this._sdk.user.showAuthPrompt(); } catch (_) { return null; }
  }

  /* ------------------------------------------------------------------ */
  /*  Data (cloud saves — mirrors localStorage API)                      */
  /* ------------------------------------------------------------------ */

  dataGetItem(key) {
    if (!this._ready) return localStorage.getItem(key);
    try { return this._sdk.data.getItem(key); } catch (_) { return localStorage.getItem(key); }
  }

  dataSetItem(key, value) {
    if (!this._ready) { localStorage.setItem(key, value); return; }
    try { this._sdk.data.setItem(key, value); } catch (_) { localStorage.setItem(key, value); }
  }

  dataRemoveItem(key) {
    if (!this._ready) { localStorage.removeItem(key); return; }
    try { this._sdk.data.removeItem(key); } catch (_) { localStorage.removeItem(key); }
  }

  dataClear() {
    if (!this._ready) { localStorage.clear(); return; }
    try { this._sdk.data.clear(); } catch (_) { localStorage.clear(); }
  }
}

export const CrazySDK = new CrazyGamesWrapper();
