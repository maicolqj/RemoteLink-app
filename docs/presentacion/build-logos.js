const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'logos.json');

async function prep(file, width, opts = {}) {
  let img = sharp(file);
  if (opts.trim) img = img.trim({ threshold: 20 });
  const buf = await img
    .resize({ width, withoutEnlargement: true })
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer();
  console.log(path.basename(file), '->', Math.round(buf.length / 1024) + 'KB');
  return 'data:image/png;base64,' + buf.toString('base64');
}

(async () => {
  const entry = await prep(
    'C:/Users/maico/Apps/FRONTEND/nextjs/entrylink-web/app/opengraph-image.png',
    760,
    { trim: true },
  );
  const remote = await prep(
    'C:/Users/maico/Apps/FRONTEND/react-native/remotelink/android/app/src/main/ic_launcher-playstore.png',
    420,
    { trim: true },
  );
  fs.writeFileSync(OUT, JSON.stringify({ entry, remote }));
  console.log('written', OUT);
})();
