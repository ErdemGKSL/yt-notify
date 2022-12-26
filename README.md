# yt-notify
It will emit stuff on new video.

## Example

```js
const YTNotifyClient = require("yt-notify");
const client = new YTNotifyClient({
  checkInterval: 1000 * 30,
  itemLimit: 10,
  preFill: false
});
const untrigger = client.on("video", (video, url) => {
  console.log({ video, url });
})
const unsub = client.subscribe("https://www.youtube.com/feeds/videos.xml?channel_id=UCaZGQt419Ptsdk_lh2mz9lQ");
setTimeout(() => {
  unsub();
  untrigger();
}, 10000)
```