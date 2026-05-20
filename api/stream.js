export default async function handler(req, res) {
  // ÖZ REAL YOUTUBE LİNKLƏRİNİZ
  const youtubeStreams = [
    "http://movies.yt-hls.workers.dev/ChS5CcxbXlc.m3u8",
    "http://movies.yt-hls.workers.dev/PWFKYZ9cbis.m3u8",
    "http://movies.yt-hls.workers.dev/c6-nkNe2W2I.m3u8"
  ];

  const totalVideos = youtubeStreams.length;
  
  // Hər videonun neçə dəqiqə efirdə qalacağını təyin edin (məsələn: 10 dəqiqə)
  const videoDurationMinutes = 10; 
  
  const currentMinutes = Math.floor(Date.now() / 60000);
  const currentIndex = Math.floor(currentMinutes / videoDurationMinutes) % totalVideos;
  
  const targetUrl = youtubeStreams[currentIndex];

  try {
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    let text = await response.text();
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
    let lines = text.split("\n");
    
    // Rəsmi Canlı TV başlığı (Pleyer videonun bitəcəyini əsla başa düşmür)
    let liveManifest = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n";
    liveManifest += `#EXT-X-MEDIA-SEQUENCE:${currentMinutes}\n`;
    liveManifest += "#EXT-X-DISCONTINUITY\n"; 

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("#EXTINF:")) {
        liveManifest += line + "\n";
      } else if (line && !line.startsWith("#")) {
        liveManifest += (line.startsWith("http") ? line : baseUrl + line) + "\n";
      }
    }

    // Videonun sonunu bildirən əmri silirik ki, pleyer dayanmasın
    liveManifest = liveManifest.replace("#EXT-X-ENDLIST", "");

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(liveManifest);

  } catch (err) {
    res.redirect(youtubeStreams[0]); // Xəta olarsa 1-ciyə yönləndir
  }
}
