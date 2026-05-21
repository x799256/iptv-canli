export default function handler(req, res) {
  // ÖZ REAL YOUTUBE M3U8 LİNKLƏRİNİZ
  const youtubeStreams = [
    "http://movies.yt-hls.workers.dev/0Y_aBF8CDzQ.m3u8",
    "http://movies.yt-hls.workers.dev/-JCIUhtLrlE.m3u8",
    "http://movies.yt-hls.workers.dev/AmgKXWUFNug.m3u8"
  ];

  const totalVideos = youtubeStreams.length;
  
  // Hər videonun neçə dəqiqə efirdə qalacağını təyin edin (məsələn: 10 dəqiqə)
  const videoDurationMinutes = 1; 
  
  const currentMinutes = Math.floor(Date.now() / 60000);
  const currentIndex = Math.floor(currentMinutes / videoDurationMinutes) % totalVideos;
  
  const targetUrl = youtubeStreams[currentIndex];

  // Bayaq işləyən o möcüzəvi sətir: Pleyeri birbaşa linkə yönləndiririk (302 Redirect)
  // Bu sayədə video sənin öz ev internetinlə yüklənir və YouTube qorumasına ilişmir!
  res.redirect(302, targetUrl);
}
