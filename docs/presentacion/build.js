/**
 * Ensambla el deck comercial EntryLink + RemoteLink.
 *
 *   node docs/presentacion/build.js
 *
 * Entradas:  deck.template.html (estilos + sprite de iconos), slides-a.html,
 *            slides-b.html, logos.json (data URIs), contacto.json.
 * Salida:    presentacion-entrylink-remotelink.html — un solo archivo autocontenido.
 *
 * Los datos de contacto se editan en contacto.json; no hay que tocar el HTML.
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');

const logos = JSON.parse(read('logos.json'));
const contacto = JSON.parse(read('contacto.json'));
const slides = read('slides-a.html') + '\n' + read('slides-b.html');

const html = read('deck.template.html')
  .replace('<!--SLIDES-->', slides)
  .replaceAll('__LOGO_ENTRYLINK__', logos.entry)
  .replaceAll('__LOGO_REMOTELINK__', logos.remote)
  .replaceAll('__EMAIL__', contacto.email)
  .replaceAll('__WHATSAPP__', contacto.whatsapp)
  .replaceAll('__WEB__', contacto.web);

const out = path.join(dir, 'presentacion-entrylink-remotelink.html');
fs.writeFileSync(out, html, 'utf8');

const pendientes = Object.entries(contacto).filter(([, v]) => /0000|ejemplo/i.test(v));
console.log('OK →', out, `(${Math.round(html.length / 1024)}KB)`);
console.log('Slides:', (html.match(/class="slide/g) || []).length);
if (pendientes.length) {
  console.log('AVISO · datos de contacto de ejemplo:', pendientes.map(([k]) => k).join(', '));
}
