# Prueba con usuarios (beta)

**Objetivo:** que entre 15 y 20 personas reales usen Talkride durante 3 semanas, para:

1. Saber si les sirve y si vuelven a practicar.
2. Corregir lo que no se entiende antes del lanzamiento.
3. Cumplir el requisito de Google Play para cuentas personales: 12 testers durante 14 días seguidos en una prueba cerrada.

La prueba se puede empezar **hoy en la versión web** (https://voxa-kfg6.onrender.com, y luego https://talkride.app). Las mismas personas pasan a la prueba cerrada de Android cuando la cuenta de Google Play esté aprobada.

## 1. A quién invitar

- **Entre 15 y 20 personas,** para que nunca bajen de 12 en Google Play.
- **Mezcla de perfiles:**
  - personas buscando trabajo (entrevistas);
  - personas que presentan en el trabajo o en la universidad;
  - líderes de equipo (feedback y conversaciones difíciles);
  - alguien que practique en inglés.
- **Dispositivos:** al menos 12 con **Android** y cuenta **Gmail**. Las demás pueden usar iPhone o computador con la versión web.

## 2. Mensajes para invitar

**WhatsApp (personal):**
> Hola [nombre]: estoy lanzando Talkride, una app que te entrena para hablar con seguridad (entrevistas, presentaciones, conversaciones difíciles). Te practica en voz alta y te da un consejo concreto cada vez. ¿Me ayudas a probarla 3 semanas? Son unos minutos al día y es gratis. Si tienes Android, te mando la invitación de Google Play; si no, la usas desde el navegador. Todo lo que hay que hacer está aquí: https://voxa-kfg6.onrender.com/prueba.html

**LinkedIn (publicación):**
> Busco 15 personas para probar gratis Talkride, una app que te entrena para entrevistas, presentaciones y conversaciones difíciles. Practicas en voz alta con tu teléfono y recibes lo que hiciste bien y un solo foco para mejorar, con un método basado en evidencia.
> Son 3 semanas, unos minutos al día, y tu opinión decide qué mejoramos antes del lanzamiento. Si te interesa, comenta «quiero probar» o escríbeme.

**Correo de bienvenida (cuando acepten):**
> Asunto: Tu acceso a la prueba de Talkride
>
> Gracias por sumarte. Así empiezas:
> 1. Android: abre este enlace e instala la app desde Google Play: [enlace de la prueba cerrada]. iPhone o computador: https://voxa-kfg6.onrender.com
> 2. Haz el diagnóstico (6 minutos) y la práctica de hoy.
> 3. Cuéntanos qué te pareció en Hoy → Ajustes → «Darte mi opinión».
>
> La guía de cada semana está en https://voxa-kfg6.onrender.com/prueba.html
> **Importante:** si estás en Android, mantén la app instalada durante las 3 semanas.

**Recordatorios** (días 4, 9 y 15):
> ¿Cómo vas con Talkride? Esta semana prueba [el roleplay / mejorar un correo real / repetir tu primera práctica]. Si algo no te funcionó, cuéntame: eso es lo más valioso para nosotros.

## 3. Cómo medir si funciona

El panel está en https://voxa-kfg6.onrender.com/panel.html. Se entra con la clave `VOXA_ADMIN_TOKEN`, que se ve en Render, en Environment.

| Métrica | Qué mide | Meta de la prueba |
|---|---|---|
| Volvieron otro día | Personas que practicaron en al menos 2 días distintos | 60% o más |
| Días promedio por persona | Hábito | 5 o más en 3 semanas |
| Estrellas | Satisfacción, en la misma escala de las tiendas | 4,5 o más |
| NPS | ¿La recomendarían? | 30 o más |
| Lo que más sirve | Qué destacar en la tienda y en el marketing | — |
| Comentarios | Qué arreglar antes del lanzamiento | Leerlos todos cada semana |

**Qué se guarda:** sólo el tipo de práctica y el día, con el identificador anónimo del dispositivo. Nunca lo que la persona dijo o escribió. Está explicado en la privacidad y en la página de la prueba.

## 4. Calendario

| Semana | Qué hacen los testers | Qué hacemos nosotros |
|---|---|---|
| 0 | — | Invitar; crear la prueba cerrada en Play Console cuando la cuenta esté aprobada |
| 1 | Diagnóstico, metas, primera práctica, gimnasio | Revisar el panel cada 2 días; arreglar lo que bloquee |
| 2 | Evaluación con cámara, roleplay, escritura, evento | Primer resumen de comentarios; publicar arreglos |
| 3 | Repetir la práctica del día 1 y mirar Progreso | Pedir la opinión final; preparar la solicitud de producción |

## 5. Respuestas para la solicitud de acceso a producción de Google Play

Google pregunta cómo se hizo la prueba. Este es el borrador; antes de enviarlo, se completa con los números reales del panel:

- **¿Cómo reclutaste a los testers?** Invitación directa a [N] personas de nuestro público objetivo (profesionales que preparan entrevistas y presentaciones, estudiantes y líderes de equipo) por WhatsApp, correo y LinkedIn.
- **¿Qué tan fácil fue reclutarlos?** [Fácil / moderado]: [N] aceptaron de [M] invitaciones.
- **¿Cómo usaron la app?** [N] personas practicaron en promedio [X] días durante la prueba. Usaron sobre todo [las 3 funciones más usadas según el panel].
- **¿Qué opinaron?** Calificación promedio de [X] sobre 5 y NPS de [Y]. Lo que más valoraron fue [...]. Lo que pidieron mejorar fue [...].
- **¿Qué cambiaste a partir de la prueba?** [Lista de cambios publicados durante la prueba, con su fecha.]
- **¿Por qué está lista para producción?** Las funciones principales se probaron con usuarios reales en Android; se corrigieron los problemas reportados; la app tiene política de privacidad, borrado de datos desde la app y compras gestionadas por Google Play.
