let Parser = require('rss-parser');
let parser = new Parser();

class YTNotifyClient {
  checkInterval = 1000 * 60;
  itemLimit = 10;
  lastDatas = {};
  #intervals = new Set();
  #urlSet = new Set();
  #listeners = new Set();
  /** @type {{ get: (string) => Promise<string[]> | string[], set: (string, string[]) => any }} */
  #store = new Map();
  /**
   * @param {Object} param0 
   * @param {Number} param0.checkInterval
   * @param {Number} param0.itemLimit
   * @param {{ get: (string) => Promise<string[]> | string[], set: (string, string[]) => any }} param0.store
   */
  constructor({ checkInterval, itemLimit, store, primaryFill = true } = {}) {
    this.checkInterval = checkInterval ?? this.checkInterval;
    this.itemLimit = itemLimit ?? this.itemLimit;
    this.#store = store ?? this.#store;
  }

  /**
   * 
   * @param {string} youtubeURL 
   * @returns {() => void} unsubscribe function
   */
  subscribe(youtubeURL) {
    if (this.#urlSet.has(youtubeURL)) return;
    this.#urlSet.add(youtubeURL);
    this.#lastId++;
    const interval = setInterval(async () => {
      /** @type {Array<{title: String,link: String,pubDate:String,author: "Cri", id: String,isoDate: String}>} */
      let data = await parser.parseURL(youtubeURL).then((x) => x?.items?.slice(0, this.itemLimit)).catch(() => { });
      if (!data) return;
      let videoIds = await this.#store.get(youtubeURL);
      if (!videoIds) videoIds = [];
      let notPostedVideos = data.filter(video => !videoIds.includes(video.id));
      if (this.#store.get(youtubeURL)?.length > 1 || !primaryFill) notPostedVideos.forEach(video => {
        this.#listeners.forEach(listener => listener(video, youtubeURL));
      });
      await this.#store.set(youtubeURL, data.map(x => x.id));
    }, this.checkInterval);

    this.#intervals.add(interval);

    return () => {
      this.#urlSet.delete(youtubeURL);
      clearInterval(interval);
      this.#intervals.delete(interval);

    }
  };

  /**
   * @param {"video"} event 
   * @param {(video: {title: String,link: String,pubDate:String,author: string, id: String,isoDate: String}, youtubeURL: string) => any} listener 
   * @returns {() => void} unsubscribe function
   */
  on(event, listener) {
    if (event !== "video") return;
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    }
  }

};

module.exports = YTNotifyClient;