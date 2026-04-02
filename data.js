window.APP_DATA = {
  channels: {
    ERB: {
      label: "El Refugio Bizarro",
      color: "#e74c3c",
      schedule: { days: [2, 4], time: "19:30" } // martes, jueves
    },
    ISM: {
      label: "Inglés Sin Miedo",
      color: "#2e86de",
      schedule: { days: [1, 3, 5, 6], time: "18:00" } // lunes, miércoles, viernes, sábado
    }
  },

  statuses: [
    { id: "idea", label: "Idea" },
    { id: "research", label: "Research" },
    { id: "script", label: "Guion" },
    { id: "visual", label: "Visual" },
    { id: "edit", label: "Edición" },
    { id: "ready", label: "Listo" },
    { id: "scheduled", label: "Programado" },
    { id: "published", label: "Publicado" }
  ],

  erbIdeas: [
    "Revisé la cámara del vecino. Alguien entró en mi casa y nunca salió",
    "Mi hermana murió hace una semana. Su teléfono sin batería sigue llamando",
    "Me sigo viendo en lugares donde nunca he estado",
    "La habitación 204 no aparece en el plano del hotel",
    "Hay una luz en el sótano que nadie enciende",
    "Mi sombra no coincide con mi cuerpo desde hace semanas",
    "Enconté mi diario. No reconozco la letra pero es mi vida",
    "El doctor me dijo que llevo muerto seis meses. Estoy escribiendo esto ahora",
    "La mujer del piso 6 llevaba semanas muerta. Yo hablé con ella anoche",
    "Mi ciudad desapareció de los mapas. Yo sigo aquí"
  ],

  ismIdeas: [
    "No digas I have a doubt, di I have a question",
    "3 frases para cuando no entiendes en una reunión",
    "No digas I am agree, di I agree",
    "Qué significa Let's table this?",
    "Cómo interrumpir educadamente en una reunión",
    "No digas make a reunion, di schedule a meeting",
    "Qué decir cuando llegas tarde a una videollamada",
    "At the end o In the end?",
    "No digas I am exciting, di I am excited",
    "5 formas de decir I don't understand sin sonar tonto"
  ],

  checklists: {
    ERB: [
      "Elegir idea y ángulo",
      "Generar hooks",
      "Elegir hook final",
      "Crear outline",
      "Generar guion",
      "Generar títulos",
      "Generar descripción y hashtags",
      "Generar prompts visuales",
      "Definir thumbnail",
      "Reunir loops/SFX/B-roll",
      "Editar video",
      "Crear shorts derivados",
      "Programar publicación"
    ],
    ISM: [
      "Elegir error o situación",
      "Generar hooks",
      "Elegir hook final",
      "Crear guion short",
      "Texto en pantalla",
      "Fonética si aplica",
      "B-roll sugerido",
      "CTA final",
      "Títulos",
      "Descripción y hashtags",
      "Editar short",
      "Programar publicación",
      "Reutilizar en Reels/TikTok/LinkedIn"
    ]
  },

  prompts: {
    main(channel, item) {
      if (channel === "ERB") {
        return `Eres un guionista senior de YouTube especializado en horror psicológico en español para el canal "El Refugio Bizarro".

IDEA:
${item.idea || item.title || ""}

TONO:
${item.tone || "sobrio, inquietante, íntimo, cinematográfico"}

DURACIÓN OBJETIVO:
${item.duration || "6-8 minutos"}

OBJETIVO:
${item.objective || "Generar un video altamente retenible y memorable"}

GENERA EXACTAMENTE EN ESTE ORDEN:

1. 10 hooks iniciales
2. top 3 hooks
3. outline del video
4. guion final completo
5. 3 títulos SEO
6. descripción SEO
7. 10 hashtags
8. prompt thumbnail en inglés
9. 8 prompts visuales en inglés por escenas

REGLAS:
- abrir en frío
- sin "hola", sin "bienvenidos"
- voz sobria, tensa, humana
- sin clichés baratos
- alta retención`;
      }

      return `Eres un creador senior de shorts de YouTube especializado en inglés laboral para hispanohablantes del canal "Inglés Sin Miedo".

TEMA:
${item.idea || item.title || ""}

TONO:
${item.tone || "claro, rápido, útil, directo"}

DURACIÓN OBJETIVO:
${item.duration || "30-45 segundos"}

OBJETIVO:
${item.objective || "Generar un short útil, retenible y fácil de entender"}

GENERA EXACTAMENTE EN ESTE ORDEN:

1. 10 hooks
2. top 3 hooks
3. guion short final
4. texto en pantalla línea por línea
5. CTA final
6. 3 títulos SEO
7. descripción
8. hashtags
9. 5 ideas de B-roll
10. variación para Reels/TikTok
11. variación para LinkedIn

REGLAS:
- sin intro
- lenguaje simple
- utilidad inmediata
- máxima claridad`;
    },

    titles(channel, topic) {
      return `Genera 15 títulos para YouTube sobre este tema:

${topic}

Canal:
${channel}

Reglas:
- máximo 60 caracteres
- 5 títulos emocionales
- 5 títulos curiosidad/pregunta
- 5 títulos promesa clara
- deben sonar humanos y atractivos`;
    },

    visuals(channel, topic) {
      return `Genera un paquete visual para este contenido:

CANAL:
${channel}

TEMA:
${topic}

Devuelve:
1. 1 prompt de thumbnail en inglés
2. 8 prompts visuales en inglés
3. 5 ideas de texto en pantalla
4. 5 ideas de B-roll
5. 3 estilos visuales sugeridos`;
    },

    description(channel, item) {
      return `Crea una descripción SEO para YouTube.

CANAL:
${channel}

TEMA:
${item.title || item.idea || ""}

CONTENIDO BASE:
${item.script || item.idea || ""}

Devuelve solo la descripción final lista para pegar.`;
    },

    hashtags(channel, topic) {
      return `Genera entre 10 y 20 hashtags relevantes para este contenido:

CANAL:
${channel}

TEMA:
${topic}

Devuelve solo hashtags listos para copiar.`;
    },

    repurpose(channel, item) {
      return `Convierte este contenido en piezas derivadas.

CANAL:
${channel}

BASE:
${item.script || item.title || item.idea || ""}

Devuelve:
1. 3 shorts derivados
2. 1 post de comunidad
3. 1 caption Instagram
4. 1 hilo para X
5. 1 versión para LinkedIn`;
    }
  }
};
