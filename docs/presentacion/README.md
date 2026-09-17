# Presentación comercial — EntryLink + RemoteLink

Deck de 14 láminas (16:9) para enviar por correo a conjuntos residenciales.

**Entregable:** `EntryLink-RemoteLink-Presentacion.pdf`

## Regenerar

```sh
sh docs/presentacion/render.sh            # HTML + PDF
sh docs/presentacion/render.sh <dir_png>  # además exporta 14 PNG de revisión
```

Requiere Microsoft Edge (se usa en modo headless para imprimir el PDF) y `sharp`
(ya está en `node_modules` del proyecto) solo para las capturas de revisión.

## Archivos

| Archivo | Qué es |
|---|---|
| `deck.template.html` | Estilos y sprite de iconos SVG. Marcador `<!--SLIDES-->`. |
| `slides-a.html` | Láminas 1–7. |
| `slides-b.html` | Láminas 8–14. |
| `contacto.json` | Correo, WhatsApp y web del cierre. **Editar aquí**, no en el HTML. |
| `logos.json` | Logos de EntryLink y RemoteLink como data URI. |
| `build-logos.js` | Regenera `logos.json` desde los PNG originales de cada app. |
| `build.js` | Ensambla el HTML final autocontenido. |
| `preview.js` | Versión del HTML sin márgenes, para las capturas. |
| `render.sh` | Todo el pipeline. |

## Notas de contenido

- La lámina 12 separa lo que está en producción de la hoja de ruta. Si cambia el
  estado real de un módulo, actualizar esa lámina antes de volver a enviar el PDF.
- El deck no incluye precios: el cierre invita a una demostración.
