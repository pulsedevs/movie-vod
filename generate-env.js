// generate-env.js
// Utility script to generate encrypted environment variables for streaming sources

function xorCipher(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += charCode.toString(16).padStart(2, '0');
  }
  return result;
}

const key = 'movie-app-2024-secure-key'; // Same key used in the app

const sources = [
  {
    movie: 'https://player.vidsrc.co/embed/movie/',
    tv: 'https://player.vidsrc.co/embed/tv/'
  },
  {
    movie: 'https://spencerdevs.xyz/movie/',
    tv: 'https://spencerdevs.xyz/tv/'
  },
  {
    movie: 'https://vidora.su/movie/',
    tv: 'https://vidora.su/tv/'
  },
  {
    movie: 'https://player.videasy.net/movie/',
    tv: 'https://player.videasy.net/tv/'
  },
  {
    movie: 'https://vidsrc.cc/v2/embed/movie/',
    tv: 'https://vidsrc.cc/v2/embed/tv/'
  },
  {
    movie: 'https://vidsrc.su/embed/movie/',
    tv: 'https://vidsrc.su/embed/tv/'
  }
];

console.log('# Client-side obfuscated streaming source URLs (XOR encrypted)');
console.log(`NEXT_PUBLIC_URL_KEY=${key}`);

sources.forEach((source, index) => {
  const sourceNum = (index + 1).toString().padStart(2, '0');
  const encryptedMovie = xorCipher(source.movie, key);
  const encryptedTv = xorCipher(source.tv, key);
  
  console.log(`NEXT_PUBLIC_MOVIE_${sourceNum}=${encryptedMovie}`);
  console.log(`NEXT_PUBLIC_TV_${sourceNum}=${encryptedTv}`);
});
