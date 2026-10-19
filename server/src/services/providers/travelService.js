const localProvider = require('./localProvider');
const mockExternalProvider = require('./mockExternalProvider');

class TravelService {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTTL = 60 * 1000; // 60 seconds
    this.timeoutLimit = 2500; // 2.5 second timeout
    this.useExternalByDefault = false; // Local is default
  }

  _getCacheKey(prefix, params) {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  _setCache(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTTL
    });
  }

  async _withTimeout(promise, ms, operationName) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        const err = new Error(`${operationName} timed out after ${ms}ms`);
        err.code = 'TIMEOUT';
        reject(err);
      }, ms);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  getSimulationStatus() {
    return {
      simulateFailure: mockExternalProvider.simulateFailure,
      providerName: mockExternalProvider.name,
      cachedItemsCount: this.cache.size
    };
  }

  setSimulateFailure(state) {
    mockExternalProvider.setSimulateFailure(state);
    return this.getSimulationStatus();
  }

  /**
   * Search hotels with provider fallback and caching
   */
  async searchHotels(query = {}, preferExternal = false) {
    const cacheKey = this._getCacheKey('hotels', { ...query, preferExternal });
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      return { ...cached, isFromCache: true };
    }

    if (preferExternal) {
      try {
        console.log('[TravelService] Calling MockExternalProvider for hotels...');
        const externalResult = await this._withTimeout(
          mockExternalProvider.searchHotels(query),
          this.timeoutLimit,
          'External Hotels Provider'
        );
        this._setCache(cacheKey, externalResult);
        return externalResult;
      } catch (err) {
        console.warn(`[TravelService Warning] External provider failed: ${err.message}. Falling back to LocalProvider.`);
        // Graceful fallback to local MongoDB provider
        const localResult = await localProvider.searchHotels(query);
        const fallbackResponse = {
          provider: localResult.provider,
          fallbackUsed: true,
          fallbackNotice: `Notice: Third-party travel provider is temporarily unavailable (${err.message}). Showing verified local inventory.`,
          count: localResult.count,
          data: localResult.data
        };
        // Cache fallback briefly
        this._setCache(cacheKey, fallbackResponse);
        return fallbackResponse;
      }
    }

    // Default to local provider
    const result = await localProvider.searchHotels(query);
    this._setCache(cacheKey, result);
    return result;
  }

  /**
   * Search transport with provider fallback and caching
   */
  async searchTransport(query = {}, preferExternal = false) {
    const cacheKey = this._getCacheKey('transport', { ...query, preferExternal });
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      return { ...cached, isFromCache: true };
    }

    if (preferExternal) {
      try {
        console.log('[TravelService] Calling MockExternalProvider for transport...');
        const externalResult = await this._withTimeout(
          mockExternalProvider.searchTransport(query),
          this.timeoutLimit,
          'External Transport Provider'
        );
        this._setCache(cacheKey, externalResult);
        return externalResult;
      } catch (err) {
        console.warn(`[TravelService Warning] External transport failed: ${err.message}. Falling back to LocalProvider.`);
        const localResult = await localProvider.searchTransport(query);
        const fallbackResponse = {
          provider: localResult.provider,
          fallbackUsed: true,
          fallbackNotice: `Notice: Third-party transport partner is temporarily unavailable (${err.message}). Showing verified local scheduled services.`,
          count: localResult.count,
          data: localResult.data
        };
        this._setCache(cacheKey, fallbackResponse);
        return fallbackResponse;
      }
    }

    const result = await localProvider.searchTransport(query);
    this._setCache(cacheKey, result);
    return result;
  }
}

module.exports = new TravelService();
