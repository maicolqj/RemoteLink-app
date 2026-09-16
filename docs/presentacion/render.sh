#!/bin/sh
# Regenera HTML, PDF y capturas de revision del deck.
set -e
DIR="C:/Users/maico/Apps/FRONTEND/react-native/remotelink/docs/presentacion"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
SP="$1"
node "$DIR/build.js"
node "$DIR/preview.js"
cp "$DIR/.preview.html" "$DIR/preview.html"
"$EDGE" --headless=new --disable-gpu --user-data-dir="$TEMP/edge-deck" --no-pdf-header-footer \
  --run-all-compositor-stages-before-draw --virtual-time-budget=9000 \
  --print-to-pdf="$DIR/EntryLink-RemoteLink-Presentacion.pdf" "file:///$DIR/presentacion-entrylink-remotelink.html" 2>/dev/null || true
if [ -n "$SP" ]; then
  "$EDGE" --headless=new --disable-gpu --user-data-dir="$TEMP/edge-shot" --window-size=1280,10080 \
    --virtual-time-budget=9000 --screenshot="$SP/full.png" "file:///$DIR/preview.html" 2>/dev/null || true
  node -e "const sharp=require('sharp');const SP=process.argv[1];(async()=>{for(let i=0;i<14;i++){await sharp(SP+'/full.png').extract({left:0,top:i*720,width:1280,height:720}).resize({width:820}).png().toFile(SP+'/s'+(i+1)+'.png');}})();" "$SP"
fi
ls -la "$DIR/EntryLink-RemoteLink-Presentacion.pdf"
