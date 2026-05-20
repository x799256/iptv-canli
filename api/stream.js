export default async function handler(req, res) {
  // 1. ÖZ REAL M3U8 LİNKLƏRİNİZİ BU MASSİVƏ ARD-ARDA YAZIN
  const streams = [
    "https://cdn.jsdelivr.net/gh/umitm0d/Liveinlive@main/catcast/umitmod-comedyxana.m3u8",
    "http://movies.yt-hls.workers.dev/ChS5CcxbXlc.m3u8",
    "https://cdn.jsdelivr.net/gh/umitm0d/Liveinlive@main/catcast/umitmod-comedyxana.m3u8"
  ];

  // IPTV pleyerlərin və brauzerlərin bloklamaması üçün lazımi başlıqlar
  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  let combinedManifest = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n";

  for (let i = 0; i < streams.length; i++) {
    const url = streams[i];
    try {
      const response = await fetch(url, { 
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } 
      });
      const text = await response.text();
      
      // Nisbi .ts linklərini tam linkə çevirmək üçün əsas URL-i tapırıq
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
      const lines = text.split("\n");
      
      // Hər fərqli m3u8 keçidində pleyerin qara ekranda donmaması üçün:
      combinedManifest += "#EXT-X-DISCONTINUITY\n"; 

      for (let line of lines) {
        line = line.trim();
        if (line.startsWith("#EXTINF:")) {
          combinedManifest += line + "\n";
        } else if (line && !line.startsWith("#")) {
          if (line.startsWith("http")) {
            combinedManifest += line + "\n";
          } else {
            combinedManifest += baseUrl + line + "\n";
          }
        }
      }
    } catch (err) {
      // Əgər linklərdən biri müvəqqəti işləmirsə, yayım qırılmasın, növbətinə keçsin
      continue;
    }
  }

  // Bütün daxili .ts seqmentləri tək bir axın kimi pleyerə göndərilir
     res.setHeader("Content-Disposition", "attachment; filename=\"live.m3u8\"");
   res.status(200).send(combinedManifest);

}
