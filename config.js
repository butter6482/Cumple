/*
 * ✨ Personalización — todo lo editable está aquí.
 * Cambia textos, colores, música, fecha u orden de escenas sin tocar otros archivos.
 */
window.BIRTHDAY_CONFIG = {
  name: "Amanda",
  fullName: "Amanda Bernard",

  // La sorpresa se desbloquea a las 00:00 (hora local del teléfono) de este día.
  // Para verla antes: añade ?preview=1 a la URL. Pon `enabled: false` para quitar el bloqueo.
  birthday: { enabled: true, year: 2026, month: 11, day: 4 },

  music: {
    // Archivo local proporcionado por ti. Si no existe, la página funciona sin música.
    src: "audio/i-see-the-light.mp3",
    title: "I See the Light",
    volume: 0.45 // 0–1 (en iPhone el volumen lo controlan los botones físicos)
  },

  colors: {
    pink: "#f7c6d3",
    pearl: "#f8e8ec",
    rose: "#e07a9b",
    matcha: "#9dbf8e",
    matchaDeep: "#5e7f52",
    ivory: "#fff8ee",
    gold: "#e8c27a",
    lavender: "#b9a7e0",
    night: "#2e2547"
  },

  // Orden de escenas (puedes reordenar o quitar alguna).
  scenes: ["intro", "garden", "birthday", "matcha", "lights", "letter", "finale"],

  text: {
    gateTitle: "Todavía no es tu día, Amanda...",
    gateSubtitle: "Tu sorpresa se abre en",
    introTitle: "Una pequeña sorpresa para ti, Amanda...",
    introButton: "Descubre tu sorpresa",
    garden1: "Hoy es un día especial...",
    garden2: "Y merece una sorpresa especial.",
    birthdayTitle: "Happy Birthday, Amanda!",
    birthdaySubtitle: "Una pequeña sorpresa hecha especialmente para ti.",
    matchaHint: "Toca el matcha",
    matchaMessage: "Obviamente, el matcha no podía faltar aquí.",
    matchaSips: ["Un sorbito ✨", "Otro sorbito...", "Casi se acaba...", "¡Rellenado! 🍵"],
    lightsTitle: "Que este año esté lleno de luz",
    wishButton: "Pide un deseo",
    wishSent: "Tu deseo va en camino ✨",
    envelopeLabel: "Para Amanda",
    envelopeHint: "Toca el sobre para abrirlo",
    finaleTitle: "Feliz cumpleaños, Amanda Bernard.",
    finaleHint: "Toca la pantalla para plantar lirios",
    replayButton: "Volver a ver la sorpresa",
    postcardButton: "Guardar recuerdo",
    next: "Continuar"
  },

  // Mensaje EXACTO de la carta (se muestra tal cual, con sus saltos de línea).
  letter:
`¡Feliz cumpleaños, Amanda!

Felicidades a una persona muy especial. Espero que la pases súper en tu día, que disfrutes muchísimo y que este nuevo año te traiga muchas cosas bonitas, bendiciones.

Te deseo lo mejor siempre y espero que puedas cumplir todo lo que te propongas. Quise hacerte este detallito para que tu cumpleaños fuera más especial.

¡Disfruta mucho tu día, Amanda!`,

  particles: { mobile: 1, desktop: 1.6 } // multiplicador de cantidad de partículas
};
