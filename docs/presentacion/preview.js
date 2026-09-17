const fs = require('fs'); const path = require('path'); const sharp = require('sharp');
const dir = __dirname;
const src = fs.readFileSync(path.join(dir,'presentacion-entrylink-remotelink.html'),'utf8');
const patched = src.replace('</style>', '.slide{margin:0 !important;border-radius:0 !important;box-shadow:none !important}body{padding:0 !important;background:#fff}</style>');
fs.writeFileSync(path.join(dir,'.preview.html'), patched);
console.log('preview written');
