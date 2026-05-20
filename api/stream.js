export default async function handler(req, res) {
  // ÖZ REAL YOUTUBE M3U8 LİNKLƏRİNİZ
  const youtubeStreams = [
    "http://movies.yt-hls.workers.dev/ChS5CcxbXlc.m3u8",
    "http://movies.yt-hls.workers.dev/PWFKYZ9cbis.m3u8",
    "http://movies.yt-hls.workers.dev/c6-nkNe2W2I.m3u8"
  ];

  const totalVideos = youtubeStreams.length;
  
  // Hər videonun neçə dəqiqə yayımlanacağını təyin edin (məsələn: 10 dəqiqə)
  const videoDurationMinutes = 10; 
  
  const currentMinutes = Math.floor(Date.now() / 60000);
  const currentIndex = Math.floor(currentMinutes / videoDurationMinutes) % totalVideos;
  
  const targetUrl = youtubeStreams[currentIndex];

  try {
    // 1. YouTube-dan orijinal m3u8 məlumatını çəkirik
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    let text = await response.text();
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
    let lines = text.split("\n");
    
    // 2. IP qorumasını keçmək üçün pleyerə təmiz canlı TV manifesti hazırlayırıq
    let liveManifest = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n";
    // Media Sequence nömrəsini zamanla dəyişirik ki, pleyer keşləməsin və davamlı yeni parça istəsin
    liveManifest += `#EXT-X-MEDIA-SEQUENCE:${Math.floor(Date.now() / 10000)}\n`;
    liveManifest += "#EXT-X-DISCONTINUITY\n"; 

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("#EXTINF:")) {
        liveManifest += line + "\n";
      } else if (line && !line.startsWith("#")) {
        // ƏN VACİB HİSSƏ: Video parçalarını birbaşa pleyerə vermirik.
        // Onları pleyerə öz ev internetinin IP-si ilə birbaşa YT-HLS-dən yükləməsi üçün yönləndiririk.
        // Bu sayədə həm video anında açılır, həm də pleyer bizim Vercel-dən qopa bilmir!
        const fullTsUrl = line.startsWith("http") ? line : baseUrl + line;
        liveManifest += fullTsUrl + "\n";
      }
    }

    // Videonun bitdiyini deyən əmri silirik ki, pleyer dövr etməsin, canlı yayımda qalsın
    liveManifest = liveManifest.replace("#EXT-X-ENDLIST", "");

    // Başlıqları təyin edirik
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    
    // Manifesti pleyerə göndəririk
    res.status(200).send(liveManifest);

  } catch (err) {
    // Hər hansı xəta olarsa, pleyeri qorumaq üçün birbaşa hədəf linkə yönləndiririk
    res.redirect(302, targetUrl);
  }
}
