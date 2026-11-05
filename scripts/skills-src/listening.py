# Listening scripts (played with text-to-speech). `evidence` must appear verbatim in the script.
TASKS = [
{
"id": "listen-reply-01", "unit": 0, "taskFormat": "listen-reply", "title": "Mensajes y comentarios (1)", "voiceRate": 1,
"items": [
{"speaker": "F", "script": "Oye, ¿sabes qué? Al final me han dado el trabajo en la agencia de viajes. Empiezo el lunes y todavía no me lo creo.", "options": ["¡Qué pena! Otra vez será.", "¡Enhorabuena! Te lo mereces.", "¡Que aproveche!"], "answer": 1, "why": "Good news (a new job) → congratulate: ¡Enhorabuena!"},
{"speaker": "M", "script": "Perdona, es que llevo veinte minutos esperando y el camarero no me ha traído la cuenta. ¿Tú sabes si aquí se paga en la barra?", "options": ["Sí, creo que tienes que pagar dentro.", "No, gracias, ya he comido.", "Sí, la barra es de madera."], "answer": 0, "why": "He asks if you pay at the bar → answer about how to pay."},
{"speaker": "F", "script": "Mañana tengo el examen de conducir y estoy nerviosísima. Llevo toda la semana sin dormir bien.", "options": ["¡Que te mejores!", "Tranquila, seguro que te sale muy bien.", "Pues yo conduzco desde los dieciocho."], "answer": 1, "why": "She's nervous about an exam → reassure her."},
{"speaker": "M", "script": "¿Te importa si abro un poco la ventana? Es que aquí dentro hace un calor horrible.", "options": ["No, claro, ábrela.", "Sí, hace mucho frío.", "No, la ventana es nueva."], "answer": 0, "why": "¿Te importa si…? asks permission → No, claro (no me importa)."},
{"speaker": "F", "script": "Mi abuela ha estado en el hospital toda la semana, pero ya está en casa y se encuentra mucho mejor.", "options": ["¡Qué susto! Me alegro de que esté bien.", "¡Que lo pases bien en el hospital!", "Pues mi abuela vive en Málaga."], "answer": 0, "why": "Bad news with a good ending → show relief: Me alegro de que esté bien."},
{"speaker": "M", "script": "Este sábado celebro mi cumpleaños en casa. Si quieres venir, trae algo de beber y avísame antes del jueves.", "options": ["¡Feliz cumpleaños! ¿Cuántos cumples?", "¡Genial! Te confirmo mañana.", "No, el jueves no puedo trabajar."], "answer": 1, "why": "An invitation with a deadline → accept and say when you'll confirm."}
]
},
{
"id": "listen-reply-02", "unit": 0, "taskFormat": "listen-reply", "title": "Mensajes y comentarios (2)", "voiceRate": 1,
"items": [
{"speaker": "M", "script": "Hola, soy Pablo, tu vecino del tercero. Mañana vienen a arreglar las tuberías y tendremos que cortar el agua por la mañana. Lo siento mucho.", "options": ["No pasa nada, gracias por avisar.", "¡Qué bien! Me encanta el agua.", "Sí, vivo en el tercero."], "answer": 0, "why": "A neighbour apologises in advance → thank him for warning you."},
{"speaker": "F", "script": "He perdido el autobús y el siguiente tarda cuarenta minutos. Creo que voy a llegar tarde a la reunión.", "options": ["No te preocupes, empezamos sin ti y luego te lo cuento.", "¡Qué suerte has tenido!", "El autobús es muy cómodo."], "answer": 0, "why": "She'll be late → reassure and offer a solution."},
{"speaker": "M", "script": "¿Me puedes recomendar algún restaurante por aquí cerca? Busco algo tranquilo y que no sea muy caro.", "options": ["Sí, hay uno muy bueno en la esquina, y de precio está bien.", "No, no tengo hambre.", "Sí, cocino muy bien."], "answer": 0, "why": "He asks for a recommendation → recommend a place."},
{"speaker": "F", "script": "Ayer fui a ver la película que me recomendaste y, la verdad, me pareció un rollo. Me quedé dormida a la mitad.", "options": ["¿En serio? Pues a mí me encantó.", "¡Que duermas bien!", "Sí, mañana vamos al cine."], "answer": 0, "why": "She didn't like it → react with surprise and give your view."},
{"speaker": "M", "script": "Lo siento muchísimo, pero se me ha caído tu libro en la piscina. Te compro otro, ¿vale?", "options": ["Vale, no te preocupes, son cosas que pasan.", "¡Enhorabuena por la piscina!", "No, no sé nadar."], "answer": 0, "why": "He apologises → accept the apology."},
{"speaker": "F", "script": "Me voy de viaje a Japón tres semanas y no tengo a nadie que cuide de mis plantas. ¿Tú podrías pasarte de vez en cuando?", "options": ["Claro, dame las llaves y me paso un par de veces por semana.", "¡Qué envidia! Yo también quiero ir a Japón.", "No, no me gustan los viajes largos."], "answer": 0, "why": "A request for help → agree and say how."}
]
},
{
"id": "listen-speakers-01", "unit": 9, "taskFormat": "listen-speakers", "title": "Planes para el puente", "voiceRate": 1,
"context": "Vas a escuchar una conversación entre tres amigos, Ana, Bruno y Carla, que organizan un viaje para el puente de diciembre.",
"speakers": {"A": "Ana", "B": "Bruno", "C": "Carla"},
"script": [
{"speaker": "A", "line": "Bueno, chicos, tenemos que decidir ya adónde vamos en el puente, que si no, nos quedamos sin alojamiento."},
{"speaker": "B", "line": "Yo lo tengo clarísimo: a la sierra. Una casa rural, chimenea, rutas por el monte… Necesito desconectar del trabajo."},
{"speaker": "C", "line": "Ay, Bruno, la sierra en diciembre… Hace un frío que pela. Yo prefiero una ciudad, con museos y restaurantes."},
{"speaker": "A", "line": "A mí me da igual el sitio, pero el año pasado gastamos muchísimo. Esta vez tenemos que buscar algo barato."},
{"speaker": "B", "line": "Pues una casa rural entre los tres sale muy bien de precio. Además, podemos cocinar nosotros."},
{"speaker": "C", "line": "¿Cocinar en vacaciones? Ni hablar. Para eso me quedo en casa."},
{"speaker": "A", "line": "¿Y si vamos a Granada? Hay ciudad, hay sierra cerca y los bares ponen tapa gratis con la bebida."},
{"speaker": "C", "line": "¡Me encanta la idea! Nunca he visto la Alhambra, me da hasta vergüenza decirlo."},
{"speaker": "B", "line": "Bueno, vale, pero con una condición: un día subimos a Sierra Nevada a caminar."},
{"speaker": "A", "line": "Hecho. Yo me encargo de buscar un apartamento en el Albaicín."},
{"speaker": "C", "line": "Y yo reservo las entradas de la Alhambra, que se agotan enseguida."},
{"speaker": "B", "line": "Pues entonces yo llevo el coche. Eso sí, la gasolina la pagamos entre todos."},
{"speaker": "A", "line": "Claro. Oye, Carla, ¿tú no tenías que trabajar el viernes?"},
{"speaker": "C", "line": "Sí, pero he pedido el día libre. Mi jefa me ha dicho que no hay problema."}
],
"statements": [
{"s": "Quiere ir al campo para olvidarse del trabajo.", "answer": "B", "evidence": "Necesito desconectar del trabajo."},
{"s": "Le preocupa sobre todo el dinero.", "answer": "A", "evidence": "Esta vez tenemos que buscar algo barato."},
{"s": "No quiere cocinar durante el viaje.", "answer": "C", "evidence": "¿Cocinar en vacaciones? Ni hablar."},
{"s": "Propone el destino final.", "answer": "A", "evidence": "¿Y si vamos a Granada?"},
{"s": "Nunca ha estado en la Alhambra.", "answer": "C", "evidence": "Nunca he visto la Alhambra"},
{"s": "Va a reservar el hotel en Sierra Nevada.", "answer": "N", "evidence": "Yo me encargo de buscar un apartamento en el Albaicín."},
{"s": "Va a conducir.", "answer": "B", "evidence": "Pues entonces yo llevo el coche."}
]
},
{
"id": "listen-speakers-02", "unit": 1, "taskFormat": "listen-speakers", "title": "Normas del piso compartido", "voiceRate": 1,
"context": "Vas a escuchar una conversación entre tres compañeros de piso, Álvaro, Berta y Ciro, que hablan sobre las normas de la casa.",
"speakers": {"A": "Álvaro", "B": "Berta", "C": "Ciro"},
"script": [
{"speaker": "B", "line": "Chicos, tenemos que hablar. Llevo tres días sin poder usar la cocina porque el fregadero está lleno de platos."},
{"speaker": "A", "line": "Ya, perdona, esos son míos. Esta semana he tenido exámenes y no he tenido tiempo para nada."},
{"speaker": "C", "line": "Yo propongo hacer una lista de tareas y colgarla en la nevera. Cada semana, a cada uno le toca una cosa."},
{"speaker": "B", "line": "Me parece bien. Pero también tenemos que hablar del ruido. Ciro, el otro día pusiste música a las dos de la mañana."},
{"speaker": "C", "line": "¿Que puse música a las dos? Era la una, y era el cumpleaños de mi hermano…"},
{"speaker": "A", "line": "Bueno, bueno, no discutáis. Podemos decidir que entre semana no hay ruido después de las once."},
{"speaker": "B", "line": "Vale. Y los fines de semana, como mucho hasta la una."},
{"speaker": "C", "line": "De acuerdo. Otra cosa: ¿quién se ha comido mis yogures? Los compré el lunes y han desaparecido."},
{"speaker": "A", "line": "Uy, creo que fui yo. Pensaba que eran de todos. Mañana te compro otros."},
{"speaker": "B", "line": "Pues para eso, cada uno debería tener su balda en la nevera, con su nombre."},
{"speaker": "C", "line": "Buena idea. Y la compra común, aceite, sal, papel higiénico, la pagamos a medias entre los tres."},
{"speaker": "A", "line": "Perfecto. Yo me ofrezco a hacer la lista de tareas esta noche."},
{"speaker": "B", "line": "Genial. Y la semana que viene hablamos de las visitas, que eso también hay que organizarlo."}
],
"statements": [
{"s": "Se queja de no poder usar la cocina.", "answer": "B", "evidence": "Llevo tres días sin poder usar la cocina"},
{"s": "Explica que ha estado muy ocupado con los estudios.", "answer": "A", "evidence": "Esta semana he tenido exámenes"},
{"s": "Sugiere poner las tareas por escrito.", "answer": "C", "evidence": "Yo propongo hacer una lista de tareas"},
{"s": "Niega la hora que dice su compañera.", "answer": "C", "evidence": "¿Que puse música a las dos? Era la una"},
{"s": "Propone prohibir las fiestas en el piso.", "answer": "N", "evidence": "Podemos decidir que entre semana no hay ruido después de las once."},
{"s": "Reconoce que se comió algo de otro.", "answer": "A", "evidence": "Uy, creo que fui yo."},
{"s": "Quiere hablar de las visitas más adelante.", "answer": "B", "evidence": "la semana que viene hablamos de las visitas"}
]
},
{
"id": "listen-interview-01", "unit": 2, "taskFormat": "listen-interview", "title": "Entrevista: de abogada a panadera", "voiceRate": 1,
"context": "Vas a escuchar una entrevista de radio con Teresa Vidal, que dejó su trabajo de abogada para abrir una panadería.",
"script": [
{"speaker": "Entrevistador", "line": "Buenas tardes, Teresa, y bienvenida al programa."},
{"speaker": "Teresa", "line": "Buenas tardes, muchas gracias por invitarme."},
{"speaker": "Entrevistador", "line": "Usted trabajó durante doce años como abogada en un bufete muy conocido de Madrid. ¿Cuándo decidió cambiar de vida?"},
{"speaker": "Teresa", "line": "Pues fue poco a poco. Ganaba un buen sueldo, pero trabajaba once o doce horas al día y casi no veía a mi familia. Un día me di cuenta de que solo era feliz los domingos, cuando hacía pan en casa con mis hijos."},
{"speaker": "Entrevistador", "line": "¿Y cómo reaccionó su entorno cuando dijo que iba a dejar el derecho?"},
{"speaker": "Teresa", "line": "Mi marido me apoyó desde el primer momento. Mis padres, en cambio, pensaban que me había vuelto loca. Mi madre me decía: «Con lo que te costó estudiar la carrera…»."},
{"speaker": "Entrevistador", "line": "¿Tenía alguna formación como panadera?"},
{"speaker": "Teresa", "line": "Ninguna profesional. Por eso, antes de abrir, hice un curso de un año en una escuela de panadería de Barcelona y luego trabajé seis meses en un obrador de Valencia, levantándome a las tres de la mañana."},
{"speaker": "Entrevistador", "line": "Y en 2021 abrió su propio negocio en Sevilla. ¿Por qué Sevilla?"},
{"speaker": "Teresa", "line": "Mi marido es sevillano y siempre habíamos querido volver. Además, aquí los locales eran mucho más baratos que en Madrid."},
{"speaker": "Entrevistador", "line": "¿Cómo fueron los comienzos?"},
{"speaker": "Teresa", "line": "Muy duros. El primer año casi no tuvimos beneficios y pensé muchas veces en cerrar. Lo que nos salvó fue el boca a boca: los vecinos empezaron a recomendarnos y en dos años la clientela se triplicó."},
{"speaker": "Entrevistador", "line": "¿Echa de menos algo de su vida anterior?"},
{"speaker": "Teresa", "line": "Echo de menos a algunos compañeros, eso sí. Pero no echo de menos las reuniones interminables ni el estrés. Ahora también trabajo mucho, pero es un cansancio diferente, más sano."},
{"speaker": "Entrevistador", "line": "Para terminar, ¿qué le diría a alguien que está pensando en cambiar de profesión?"},
{"speaker": "Teresa", "line": "Que lo piense bien, que ahorre antes de dar el paso y que se forme. Los sueños están muy bien, pero hay que prepararlos."}
],
"questions": [
{"q": "¿Por qué decidió Teresa dejar la abogacía?", "options": ["Porque ganaba poco dinero.", "Porque tenía poco tiempo para su familia.", "Porque la despidieron del bufete."], "answer": 1, "evidence": "trabajaba once o doce horas al día y casi no veía a mi familia"},
{"q": "¿Cómo reaccionaron sus padres?", "options": ["La apoyaron desde el principio.", "No estaban de acuerdo con su decisión.", "Le ofrecieron dinero para el negocio."], "answer": 1, "evidence": "Mis padres, en cambio, pensaban que me había vuelto loca."},
{"q": "Antes de abrir la panadería, Teresa…", "options": ["no tenía ninguna experiencia práctica.", "estudió y trabajó en el sector.", "trabajó doce años en un obrador."], "answer": 1, "evidence": "hice un curso de un año en una escuela de panadería de Barcelona y luego trabajé seis meses en un obrador de Valencia"},
{"q": "Eligió Sevilla, entre otras razones, porque…", "options": ["los alquileres eran más bajos.", "allí vivían sus padres.", "había menos panaderías."], "answer": 0, "evidence": "aquí los locales eran mucho más baratos que en Madrid"},
{"q": "El primer año del negocio…", "options": ["fue un gran éxito.", "estuvo a punto de cerrarlo.", "tuvo el triple de clientes."], "answer": 1, "evidence": "pensé muchas veces en cerrar"},
{"q": "¿Qué ayudó a que el negocio creciera?", "options": ["La publicidad en las redes sociales.", "Las recomendaciones de los vecinos.", "Un premio de panadería."], "answer": 1, "evidence": "los vecinos empezaron a recomendarnos"},
{"q": "¿Qué consejo da Teresa a quien quiere cambiar de profesión?", "options": ["Que siga sus sueños sin pensarlo mucho.", "Que se prepare bien y ahorre antes.", "Que no deje nunca un trabajo seguro."], "answer": 1, "evidence": "que ahorre antes de dar el paso y que se forme"}
]
},
{
"id": "listen-interview-02", "unit": 8, "taskFormat": "listen-interview", "title": "Entrevista: un fotógrafo que da la vuelta al mundo", "voiceRate": 1,
"context": "Vas a escuchar una entrevista de radio con Marcos Peña, fotógrafo de viajes, que acaba de volver de un viaje de dos años por el mundo.",
"script": [
{"speaker": "Entrevistadora", "line": "Marcos, acabas de volver después de dos años viajando. ¿Cómo empezó todo?"},
{"speaker": "Marcos", "line": "Pues, curiosamente, empezó con un despido. Trabajaba como fotógrafo en un periódico que cerró en 2022, y en lugar de buscar otro trabajo, decidí cumplir el sueño que tenía desde niño."},
{"speaker": "Entrevistadora", "line": "¿Y cómo pagaste un viaje tan largo?"},
{"speaker": "Marcos", "line": "Con mis ahorros al principio, y después vendiendo fotos a revistas y dando talleres de fotografía en los países que visitaba. No me he hecho rico, pero no he tenido que volver antes de tiempo."},
{"speaker": "Entrevistadora", "line": "¿Cuál fue el momento más difícil?"},
{"speaker": "Marcos", "line": "En Bolivia me robaron la mochila con dos cámaras y el ordenador. Había perdido las fotos de tres meses porque no había hecho copias. Fue horrible, pensé en dejarlo todo."},
{"speaker": "Entrevistadora", "line": "Pero no lo dejaste."},
{"speaker": "Marcos", "line": "No. Una familia que conocí allí me acogió en su casa una semana y me prestó una cámara vieja. Con esa cámara hice algunas de mis mejores fotos. Desde entonces, hago copias de seguridad todas las noches."},
{"speaker": "Entrevistadora", "line": "¿Qué país te ha sorprendido más?"},
{"speaker": "Marcos", "line": "Vietnam. Esperaba playas y templos, y los encontré, pero lo que más me impresionó fue la gente. En el norte, una señora mayor me enseñó a cocinar sopa en su casa sin que habláramos el mismo idioma."},
{"speaker": "Entrevistadora", "line": "¿Y ahora qué? ¿Vas a quedarte en España?"},
{"speaker": "Marcos", "line": "De momento, sí. Estoy preparando un libro con las fotos del viaje y en primavera haré una exposición en Sevilla. Después, ya veremos. Me gustaría recorrer África, pero con más calma."},
{"speaker": "Entrevistadora", "line": "Una última pregunta: ¿qué has aprendido en estos dos años?"},
{"speaker": "Marcos", "line": "Que se necesitan muchas menos cosas de las que creemos. Viajé dos años con una mochila de cuarenta litros y nunca eché nada de menos."}
],
"questions": [
{"q": "¿Por qué empezó Marcos su viaje?", "options": ["Porque había ganado un premio.", "Porque se quedó sin trabajo.", "Porque un periódico le pagó el viaje."], "answer": 1, "evidence": "empezó con un despido"},
{"q": "¿Cómo consiguió dinero durante el viaje?", "options": ["Trabajando en hoteles.", "Con fotos y clases de fotografía.", "Con la ayuda de su familia."], "answer": 1, "evidence": "vendiendo fotos a revistas y dando talleres de fotografía"},
{"q": "En Bolivia, Marcos…", "options": ["perdió las fotos de varios meses.", "ganó un concurso de fotografía.", "se quedó un año con una familia."], "answer": 0, "evidence": "Había perdido las fotos de tres meses"},
{"q": "Después del robo, Marcos…", "options": ["volvió a España.", "siguió viajando con una cámara prestada.", "se compró una cámara nueva."], "answer": 1, "evidence": "me prestó una cámara vieja"},
{"q": "De Vietnam, lo que más le impresionó fue…", "options": ["las playas.", "los templos.", "las personas."], "answer": 2, "evidence": "lo que más me impresionó fue la gente"},
{"q": "En los próximos meses, Marcos va a…", "options": ["viajar por África.", "preparar un libro y una exposición.", "volver a trabajar en un periódico."], "answer": 1, "evidence": "Estoy preparando un libro con las fotos del viaje"},
{"q": "¿Qué ha aprendido Marcos en el viaje?", "options": ["Que viajar es muy caro.", "Que necesitamos menos de lo que pensamos.", "Que es mejor viajar acompañado."], "answer": 1, "evidence": "se necesitan muchas menos cosas de las que creemos"}
]
}
]
