export default async function handler(req, res) {
  // 1. İSTƏDİYİN YOUTUBE M3U8 LİNKLƏRİNİ BURA ARD-ARDA DÜZ
  const youtubeStreams = [
    "http://movies.yt-hls.workers.dev/ChS5CcxbXlc.m3u8",
    "http://movies.yt-hls.workers.dev/PWFKYZ9cbis.m3u8",
    "http://movies.yt-hls.workers.dev/c6-nkNe2W2I.m3u8"
  ];

  // Pleyerdən gələn sorğunun neçənci videonu istədiyini yoxlayırıq (?index=0, ?index=1...)
  let currentIndex = parseInt(req.query.index) || 0;

  // Əgər siyahı bitibsə, avtomatik olaraq yenidən 1-ci videoya (0-cı indeksə) qaytarırıq
  if (currentIndex >= youtubeStreams.length) {
    currentIndex = 0;
  }

  const targetUrl = youtubeStreams[currentIndex];

  try {
    // Həmin saniyədə YouTube linkinə canlı sorğu atırıq (Təzə token almaq üçün)
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    if (!response.ok) throw new Error("Yayın tapılmadı");
    
    let text = await response.text();
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
    
    // M3U8 daxilindəki nisbi linkləri tam linkə çeviririk
    let lines = text.split("\n");
    let formattedManifest = "";

    for (let line of lines) {
      line = line.trim();
      if (line && !line.startsWith("#") && !line.startsWith("http")) {
        formattedManifest += baseUrl + line + "\n";
      } else {
        formattedManifest += line + "\n";
      }
    }

    // ƏN VACİB HİSSƏ: Video bitməyə 10 saniyə qalmış pleyerə növbəti videonun linkini göndəririk
    // Bu sayədə pleyer donmur və növbəti videoya təmiz keçid edir
    const nextIndex = currentIndex + 1;
    const nextRedirectUrl = `https://${req.headers.host}/api/stream?index=${nextIndex}`;
    
    // Əgər videonun sonudursa, pleyerə növbəti videonun bizim serverdəki ünvanını pleyerə pıçıldayırıq
    formattedManifest = formattedManifest.replace(
      "#EXT-X-ENDLIST", 
      `#EXT-X-DISCONTINUITY\n#EXT-X-STREAM-INF:BANDWIDTH=2000000\n${nextRedirectUrl}`
    );

    // Düzgün HLS başlıqları ilə pleyerə ötürürük
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(formattedManifest);

  } catch (err) {
    // Əgər hansısa video silinibsə və ya xəta veribsə, dayanma, dərhal növbəti videoya keç
    res.redirect(`https://${req.headers.host}/api/stream?index=${currentIndex + 1}`);
  }
}
