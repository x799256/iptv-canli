export default async function handler(req, res) {
  // 1. VİDEOLARINIZI VƏ ONLARIN SƏNİYƏ OLARAQ TAM MÜDDƏTİNİ BURA YAZIN
  // (Müddətləri dəqiq yazmaq rəvan keçid üçün çox vacibdir!)
  const playlist = [
    { 
      url: "http://movies.yt-hls.workers.dev/ChS5CcxbXlc.m3u8", 
      duration: 350 // Nümunə: Video 5 dəqiqə 50 saniyədir (Cəmi 350 saniyə)
    },
    { 
      url: "http://movies.yt-hls.workers.dev/PWFKYZ9cbis.m3u8", 
      duration: 240 // Nümunə: 4 dəqiqə (Cəmi 240 saniyə)
    },
    { 
      url: "http://movies.yt-hls.workers.dev/c6-nkNe2W2I.m3u8", 
      duration: 600 // Nümunə: 10 dəqiqə (Cəmi 600 saniyə)
    }
  ];

  // Siyahıdakı bütün videoların ümumi müddətini hesablayırıq
  const totalDuration = playlist.reduce((sum, item) => sum + item.duration, 0);
  
  // Hazırkı zamanı saniyəyə çeviririk (24/7 dövr etməsi üçün əsas şərtdir)
  const currentSeconds = Math.floor(Date.now() / 1000);
  const currentPlaylistTime = currentSeconds % totalDuration;

  // Hazırkı saniyəyə əsasən siyahıda hansı videonun hansı saniyəsində olduğumuzu tapırıq
  let elapsedTime = 0;
  let targetVideo = playlist[0];

  for (const video of playlist) {
    if (currentPlaylistTime >= elapsedTime && currentPlaylistTime < elapsedTime + video.duration) {
      targetVideo = video;
      break;
    }
    elapsedTime += video.duration;
  }

  try {
    // YouTube linkinə anlıq sorğu atıb ən təzə tokenli m3u8 manifestini çəkirik
    const response = await fetch(targetVideo.url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    if (!response.ok) throw new Error("Yayın tapılmadı");
    
    let text = await response.text();
    const baseUrl = targetVideo.url.substring(0, targetVideo.url.lastIndexOf("/") + 1);
    
    let lines = text.split("\n");
    
    // Pleyerə bunun rəsmi və sonsuz bir CANLI yayım olduğunu deyirik
    let liveBody = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n";
    
    // Hər dəqiqə yenilənən unikal media ardıcıllığı nömrəsi (Pleyerin keşləməməsi üçün)
    const sequenceNumber = Math.floor(currentSeconds / 10);
    liveBody += `#EXT-X-MEDIA-SEQUENCE:${sequenceNumber}\n`;
    liveBody += "#EXT-X-DISCONTINUITY\n"; // Keçidlərdə sıfır donma təmin edir

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("#EXTINF:")) {
        liveBody += line + "\n";
      } else if (line && !line.startsWith("#")) {
        // Nisbi linkləri tam link halına gətiririk
        liveBody += (line.startsWith("http") ? line : baseUrl + line) + "\n";
      }
    }

    // ƏN VACİB DETAL: Videonun sonunu göstərən əmri silirik. 
    // Pleyer elə biləcək ki, yayım heç vaxt bitmir və sadəcə canlı axın gəlir.
    liveBody = liveBody.replace("#EXT-X-ENDLIST", "");

    // Başlıqları göndərib kanalı işə salırıq
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(liveBody);

  } catch (err) {
    // Əgər anlıq olaraq YouTube token xətası olarsa, pleyer yayımı kəsməsin deyə boş canlı siqnal ötürürük
    res.status(200).send("#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:-1,\n");
  }
}
