# Una sorpresa para Amanda ✨

Una pequeña experiencia web de cumpleaños (HTML/CSS/JS puro, sin build): jardín de lirios,
matcha, luces flotantes, una carta y un final interactivo. Pensada para abrirse en el móvil.

## Verla en local

```bash
npm install      # solo hace falta para los tests
npm start        # → http://localhost:4173/?preview=1
```

## Personalizar

Todo está en **`config.js`**: nombre, textos, la carta (`letter`), colores, música (`music.src`),
fecha de desbloqueo (`birthday`) y orden de escenas (`scenes`). No hace falta tocar otros archivos.

## Bloqueo por fecha

Antes del 4 de noviembre de 2026 a las 00:00 (hora local del dispositivo) se muestra una cuenta
regresiva. Para verla antes añade **`?preview=1`** a la URL. Para quitar el bloqueo:
`birthday.enabled: false`.

## Música y derechos de autor

La canción va en `audio/i-see-the-light.mp3` (ver `audio/README.md`). Tiene derechos de autor,
así que **los `.mp3` están en `.gitignore`**. Si quieres publicarla con música:

- mantén el repositorio **privado** y despliega en **Vercel** desde ese repo privado; o
- en GitHub Pages gratis el repo debe ser público, y el mp3 quedaría público también.

Sin el archivo, la página funciona igual (sin música).

## Publicar

**GitHub Pages:** Settings → Pages → Source: *Deploy from a branch* → rama `master`, carpeta
`/ (root)`. El archivo `.nojekyll` ya está incluido.

**Vercel:** *Add New → Project* → importa el repo → Framework Preset: **Other**, sin comando de
build ni directorio de salida.

## Tests

```bash
npm test
```

Playwright (Chromium) en tres perfiles: iPhone 13, Pixel 7 y escritorio. Revisa el bloqueo por
fecha, el recorrido completo, la carta exacta, audio, postal, lirios, errores de consola,
overflow horizontal y tamaño táctil de los botones.

## Créditos

Basado en [github.com/ProgrammerGaurav/happy-birthday](https://github.com/ProgrammerGaurav/happy-birthday).
