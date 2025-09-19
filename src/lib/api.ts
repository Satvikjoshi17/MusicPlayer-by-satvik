import type { SearchResponse, StreamResponse, Track } from './types';

const API_BASE_URL = 'https://musicplayerbackend-us5o.onrender.com/api';

const sampleTrack: Track = {
  "id": "XsZZQPKLChY",
  "title": "Cartoon, Jéja - On & On (Lyrics) feat. Daniel Levi",
  "duration": 208,
  "thumbnail": "https://i.ytimg.com/vi/XsZZQPKLChY/hq720.jpg?sqp=-oaymwEcCNAFEJQDSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLB_IbCdr0nMkmwIy6FvWT0nC-dTKw",
  "artist": "7clouds",
  "url": "https://www.youtube.com/watch?v=XsZZQPKLChY",
  "viewCount": 103695961
};

const sampleStreamData: StreamResponse = {
  "streamUrl":"https://rr2---sn-nx57ynze.googlevideo.com/videoplayback?expire=1758301431&ei=lzjNaN2LKJKRsfIPg9-OgQ8&ip=34.211.200.85&id=o-AIkLahwu9FG2MPfT5qQN2edGtq4UYloi568Rmk3lKREl&itag=251&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&met=1758279831%2C&mh=6Q&mm=31%2C26&mn=sn-nx57ynze%2Csn-a5msen7z&ms=au%2Conr&mv=u&mvi=2&pl=21&rms=au%2Cau&siu=1&bui=ATw7iSWzFbUA8NAQxmxamAhNlZmv0-10ONo6k7IMs9HVmWqt5SycEeGqkeIfJ9y5CUnOlqxmIA&spc=hcYD5R-ewDbu&vprv=1&svpuc=1&mime=audio%2Fwebm&ns=ROGa2RUDCuqyecG-8cB-ZhcQ&rqh=1&gir=yes&clen=3561278&dur=207.181&lmt=1726277275857597&mt=1758279003&fvip=1&keepalive=yes&lmw=1&fexp=51557447%2C51565116%2C51565681%2C51580970&c=TVHTML5&sefc=1&txp=4532434&n=q9cswAj2giASSg&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Csiu%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&lsparams=met%2Cmh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Crms&lsig=APaTxxMwRAIgT3KvNZ-sCT5Ma5YG3vyxZu_liZFI-EOc0nqNG2U5zfQCICXZ1s698KnArn94--pH9QARYjhjl_vvNMtC9FNVlUWC&sig=AJfQdSswRQIhAIu91_LJY3tB2ofUkq348CSLj_oTTv2MGZPX6-DskcYPAiA-NhuwjZJ84XfT6GCe0fW12Wozc2J_qJGVP36vFFkCRQ%3D%3D",
  "cached":true,
  "message": "sample"
};


export async function searchTracks(query: string): Promise<Track[]> {
  if (!query) return [];
  console.log(`Searching for: ${query}`);
  // Returning sample data to bypass API issues for testing
  return [sampleTrack];
}

export async function getStreamUrl(youtubeUrl: string): Promise<StreamResponse> {
  console.log(`Getting stream for: ${youtubeUrl}`);
  // Returning sample data to bypass API issues for testing
  return sampleStreamData;
}
