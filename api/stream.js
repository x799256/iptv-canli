export default function handler(req, res) {
  // ÖZ REAL M3U8 LİNKLƏRİNİZ
  const streams = [
    "http://movies.yt-hls.workers.dev/ChS5CcxbXlc.m3u8",
    "http://movies.yt-hls.workers.dev/PWFKYZ9cbis.m3u8",
    "http://movies.yt-hls.workers.dev/c6-nkNe2W2I.m3u8"
  ];

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  // HLS Master Playlist formatı formalaşdırırıq
  let masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n";

  streams.forEach((link, index) => {
    // Pleyerə bunları eyni kanalın fərqli ötürmə sürətləri (Bandwidth) kimi göstəririk
    // Pleyer birinci link qırılan kimi avtomatik növbəti BANDWIDTH-ə keçid edəcək
    masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${1000000 + (index * 500000)},RESOLUTION=1280x720,NAME="Yayım ${index + 1}"\n`;
    masterPlaylist += `${link}\n`;
  });

  res.status(200).send(masterPlaylist);
}
