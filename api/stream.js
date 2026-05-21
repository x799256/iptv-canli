export default async function handler(req, res) {
  // 1. ÖZ REAL VİDEO LİNKLƏRİNİ BURA ARD-ARDA DÜZ (İstədiyin qədər artıra bilərsən)
  const youtubeStreams = [
    "http://movies.yt-hls.workers.dev/0Y_aBF8CDzQ.m3u8",
    "http://movies.yt-hls.workers.dev/-JCIUhtLrlE.m3u8",
    "http://movies.yt-hls.workers.dev/AmgKXWUFNug.m3u8"
  ];

  // Pleyerin hazırda neçənci videoda olduğunu linkdən oxuyuruq (?id=0, ?id=1...)
  let currentId = parseInt(req.query.id) || 0;

  // Əgər siyahıdakı bütün videolar bitibsə, avtomatik olaraq yenidən 1-ci videoya (0-a) qayıdır
  if (currentId >= youtubeStreams.length) {
    currentId = 0;
  }

  const targetUrl = youtubeStreams[currentId];

  try {
    // YouTube linkinə anlıq sorğu atıb təzə tokenli məlumatları alırıq
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    if (!response.ok) throw new Error("Video tapılmadı");
    
    let text = await response.text();
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
    
    let lines = text.split("\n");
    let cleanManifest = "";

    for (let line of lines) {
      line = line.trim();
      if (line && !line.startsWith("#") && !line.startsWith("http")) {
        // Video seqmentlərini tam link halına salırıq
        cleanManifest += baseUrl + line + "\n";
      } else {
        cleanManifest += line + "\n";
      }
    }

    // Növbəti videonun linkini hazırlayırıq
    const nextId = currentId + 1;
    const nextVideoUrl = `https://${req.headers.host}/api/stream?id=${nextId}`;

    // ƏN VACİB FNDRİK: Pleyerə videonun bitdiyini (#EXT-X-ENDLIST) demirik!
    // Onun yerinə pleyerə növbəti videonun linkini ötürürük ki, avtomatik ora keçsin
    if (cleanManifest.includes("#EXT-X-ENDLIST")) {
      cleanManifest = cleanManifest.replace(
        "#EXT-X-ENDLIST",
        `#EXT-X-DISCONTINUITY\n#EXT-X-STREAM-INF:BANDWIDTH=2000000\n${nextVideoUrl}\n`
      );
    } else {
      // Əgər endlist yoxdursa, manifestin sonuna daxili keçid əlavə edirik
      cleanManifest += `#EXT-X-DISCONTINUITY\n#EXT-X-STREAM-INF:BANDWIDTH=2000000\n${nextVideoUrl}\n`;
    }

    // Lazımi HLS başlıqları ilə pleyerə göndəririk
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(cleanManifest);

  } catch (err) {
    // Əgər hər hansı bir video xəta versə, pleyer donub qara ekranda qalmasın, dərhal növbətinə keçsin
    res.redirect(`https://${req.headers.host}/api/stream?id=${currentId + 1}`);
  }
}
