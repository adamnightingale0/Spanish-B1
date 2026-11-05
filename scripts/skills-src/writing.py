# Writing prompts in the Seville B1 format: Task 1 compulsory, Task 2 choose 1 of 2; 120-150 words.
# Targets reference the reusable patterns in T (regex, case-insensitive, unicode). Model answers are original.
L = r"\p{L}"
NB = r"(?![\p{L}])"   # end of word that works with accented letters
SB = r"(?:^|[^\p{L}])" # start of word
T = {
 "indefinido": ("Pretérito indefinido (2 veces)", SB + r"(?:fui|fue|fuimos|fueron|estuve|estuvo|estuvimos|tuve|tuvo|tuvimos|hice|hizo|hicimos|pude|pudo|dije|dijo|vine|vino|vi|vio|di|dio|" + L + r"{2,}(?:é|ó|aron|ieron|aste|iste|asteis|isteis))" + NB, 2, False),
 "imperfecto": ("Pretérito imperfecto (2 veces)", SB + r"(?:era|eran|éramos|iba|iban|íbamos|había|" + L + r"{2,}(?:aba|abas|ábamos|aban|ía|ías|íamos|ían))" + NB, 2, False),
 "perfecto": ("Pretérito perfecto", SB + r"(?:he|has|ha|hemos|habéis|han) " + L + r"+(?:ado|ido|to|cho|so)" + NB, 1, False),
 "pluscuamperfecto": ("Pluscuamperfecto (había + participio)", SB + r"(?:había|habías|habíamos|habíais|habían) " + L + r"+(?:ado|ido|to|cho|so)" + NB, 1, False),
 "consejo": ("Dar un consejo (te aconsejo que…, yo que tú…, deberías…)", SB + r"(?:(?:te|os|le|les) (?:aconsejo|recomiendo|sugiero|propongo) que|yo que tú|yo en tu lugar|deberías|deberíais|es mejor que|no te olvides de)" + NB, 1, False),
 "subjuntivo": ("Que + subjuntivo (te aconsejo que vayas, espero que…)", SB + r"(?:(?:que|ojalá|cuando|para que) (?:te |os |le |no |me |se |lo |la )?(?:sea|seas|sean|vaya|vayas|vayáis|tenga|tengas|haga|hagas|pueda|puedas|esté|estés|" + L + r"{2,}(?:es|éis|en|as|áis|an))" + NB + r"|(?:exij[oa]|exigimos|pedimos|quiero|queremos|espero|esperamos|es necesario|es importante|es injusto|me parece fatal) que)", 1, False),
 "opinion": ("Expresar opinión (creo que, en mi opinión…)", SB + r"(?:creo que|pienso que|en mi opinión|me parece que|desde mi punto de vista|para mí|no creo que)" + NB, 1, False),
 "conectores": ("Tres conectores distintos (además, sin embargo, por eso…)", SB + r"(?:además|sin embargo|por eso|así que|aunque|en primer lugar|por último|por un lado|por otro lado|en cambio|de hecho|al final|de repente|entonces|porque|como|también|por lo tanto|ya que)" + NB, 3, True),
 "relato": ("Conectores de relato (de repente, al final, entonces…)", SB + r"(?:de repente|de pronto|al final|al principio|entonces|un día|al día siguiente|en ese momento|por fin)" + NB, 2, True),
 "saludo-informal": ("Saludo y despedida informales", r"(?:hola|querid[oa]s?)[\s\S]*(?:un abrazo|besos|un beso|hasta pronto|escríbeme|nos vemos)", 1, False),
 "saludo-formal": ("Saludo y despedida formales", r"(?:estimad[oa]s?|distinguid[oa]s?)[\s\S]*(?:atentamente|un cordial saludo|saludos cordiales|reciba un saludo)", 1, False),
 "condicional": ("Condicional (me gustaría, podría…)", SB + L + r"{2,}(?:ría|rías|ríamos|ríais|rían)" + NB, 1, False),
 "valorar": ("Valorar (es increíble que…, me parece fatal que…)", SB + r"(?:es (?:injusto|increíble|una vergüenza|importante|necesario|normal|lógico|una pena) que|me (?:parece|pareció|parecía) (?:bien|mal|fatal|increíble|genial|injusto) que|está (?:bien|mal) que)" + NB, 1, False),
 "peticion": ("Petición formal (les pido que…, me gustaría que…)", SB + r"(?:(?:les|le) (?:pido|pedimos|ruego|rogamos|agradecería|agradeceríamos)|solicito|solicitamos|me gustaría que|quisiera)" + NB, 1, False),
}
def targets(*ids):
    return [{"label": T[i][0], "pattern": T[i][1], "min": T[i][2], "distinct": T[i][3]} for i in ids]

PH_INFORMAL = ["¡Hola, …! ¿Qué tal todo?", "Perdona por no escribirte antes, es que…", "Me alegro mucho de que…", "Te aconsejo que + subjuntivo", "Yo que tú, + condicional", "Bueno, te dejo, que…", "¡Escríbeme pronto! Un abrazo,"]
PH_FORMAL = ["Estimados señores:", "Me dirijo a ustedes para…", "Les escribo para informarles de que…", "Me gustaría que + subjuntivo", "Les agradecería que + subjuntivo", "Quedo a la espera de su respuesta.", "Atentamente,"]
PH_STORY = ["Todo empezó cuando…", "Recuerdo que aquel día…", "De repente, …", "En ese momento me di cuenta de que…", "Al final, …", "Desde entonces, …", "Nunca olvidaré…"]
PH_OPINION = ["En mi opinión, …", "Por un lado, … Por otro lado, …", "Es verdad que…, pero…", "Lo que más me preocupa es…", "Por eso, creo que…", "En conclusión, …"]

TASKS = [
# ---------- Set 1 ----------
{"id": "write-t1-01", "set": 1, "examTask": 1, "genre": "testimonio para una web", "register": "neutro", "title": "Un voluntariado en el extranjero",
 "prompt": "La web de una ONG que organiza voluntariados internacionales busca testimonios de personas que han participado en sus programas. Escribe tu testimonio.",
 "contentPoints": ["Dónde estuviste, cuándo y durante cuánto tiempo.", "Qué hacías un día normal.", "Una experiencia concreta que recuerdas especialmente.", "Qué aprendiste.", "Consejos para futuros voluntarios."],
 "targets": targets("indefinido", "imperfecto", "consejo", "conectores"),
 "usefulPhrases": PH_STORY[:4] + ["Os recomiendo que + subjuntivo", "Si tenéis la oportunidad, no lo dudéis."],
 "modelAnswer": "Hace dos años pasé tres meses en un pueblo de Guatemala con vuestro programa de educación. Por las mañanas ayudaba al maestro en la escuela y por las tardes organizábamos juegos y talleres de lectura para los niños. Al principio todo era difícil: no entendía bien el acento y echaba de menos a mi familia. Sin embargo, nunca olvidaré el último día. Los niños prepararon una pequeña fiesta y me regalaron un cuaderno con dibujos y mensajes. Me puse a llorar delante de todos. Aprendí muchísimo: a tener paciencia, a adaptarme y a valorar las cosas pequeñas. Además, mi español mejoró mucho. A los futuros voluntarios les aconsejo que vayan con la mente abierta y que no tengan miedo de equivocarse. Y, sobre todo, que disfruten de cada momento, porque pasa muy rápido."},
{"id": "write-t2-01a", "set": 1, "examTask": 2, "genre": "correo informal con consejos", "register": "informal", "title": "Una amiga quiere vivir en Sevilla",
 "prompt": "Has recibido este correo de tu amiga Clara: «¡Hola! Me han ofrecido un trabajo en Sevilla y estoy pensando en aceptarlo, pero tengo un poco de miedo. Tú llevas un tiempo viviendo allí. ¿Qué tal es la vida en la ciudad? ¿Qué me recomiendas?». Responde a Clara.",
 "contentPoints": ["Salúdala y reacciona a su noticia.", "Cuéntale cómo fueron tus primeras semanas en Sevilla.", "Explícale lo mejor y lo peor de vivir allí.", "Dale consejos para buscar piso y conocer gente.", "Despídete."],
 "targets": targets("saludo-informal", "indefinido", "consejo", "subjuntivo"),
 "usefulPhrases": PH_INFORMAL,
 "modelAnswer": "¡Hola, Clara! ¡Qué noticia tan buena! Me alegro muchísimo de que te hayan ofrecido ese trabajo. Mis primeras semanas aquí fueron un poco raras: no conocía a nadie y me costó acostumbrarme a cenar a las diez. Pero enseguida me enamoré de la ciudad. Lo mejor es el ambiente: la gente es muy abierta y siempre hay algo que hacer. Lo peor, sin duda, es el calor de julio y agosto. Para buscar piso, te aconsejo que mires en barrios como Triana o la Macarena, que son bonitos y no tan caros como el centro. Y para conocer gente, yo que tú me apuntaría a un intercambio de idiomas o a un club de deporte. Así conocí yo a mis mejores amigos aquí. ¡Acepta el trabajo, que te va a encantar! Escríbeme pronto. Un abrazo,\nAdam"},
{"id": "write-t2-01b", "set": 1, "examTask": 2, "genre": "relato para una revista", "register": "neutro", "title": "Una persona que cambió mi vida",
 "prompt": "Una revista ha convocado un concurso de relatos con el título «La persona que cambió mi vida». Escribe tu historia para participar.",
 "contentPoints": ["Quién es esa persona y cómo la conociste.", "Cómo era tu vida en aquel momento.", "Qué pasó y qué hizo esa persona por ti.", "Cómo ha cambiado tu vida desde entonces."],
 "targets": targets("indefinido", "imperfecto", "relato", "perfecto"),
 "usefulPhrases": PH_STORY,
 "modelAnswer": "Conocí a Rosa en 2019, cuando empecé a trabajar en una librería de Londres. Yo tenía veintitrés años, vivía solo y no sabía qué quería hacer con mi vida. Rosa era la encargada: una mujer de sesenta años, sevillana, que hablaba muy rápido y se reía muchísimo. Un día me vio leyendo un libro en español y me preguntó si me gustaba el idioma. Le dije que sí, pero que nunca lo había estudiado en serio. Entonces me propuso un trato: ella me enseñaba español en la hora de la comida y yo la ayudaba con el ordenador. Durante dos años comimos juntos casi todos los días. Al final, me animó a solicitar un trabajo en Sevilla. Desde entonces vivo aquí, nunca he dejado de estudiar y, cada vez que paso por una librería, me acuerdo de ella."},
# ---------- Set 2 ----------
{"id": "write-t1-02", "set": 2, "examTask": 1, "genre": "correo formal de reclamación", "register": "formal", "title": "Una reclamación a un hotel",
 "prompt": "Pasaste un fin de semana en un hotel de Granada y la estancia fue un desastre. Escribe un correo electrónico al director del hotel.",
 "contentPoints": ["Preséntate y explica cuándo estuviste en el hotel.", "Describe cómo era la habitación.", "Cuenta qué problemas tuviste y cómo reaccionó el personal.", "Explica qué esperabas de un hotel de esa categoría.", "Di qué solución pides."],
 "targets": targets("saludo-formal", "indefinido", "imperfecto", "peticion"),
 "usefulPhrases": PH_FORMAL,
 "modelAnswer": "Estimado señor director:\nMe dirijo a usted para quejarme de mi estancia en su hotel el fin de semana del 8 de noviembre. Había reservado una habitación doble con vistas a la Alhambra, pero me dieron una habitación interior, pequeña y bastante sucia. Además, el aire acondicionado no funcionaba y por la noche había mucho ruido en la calle. Cuando bajé a recepción para explicar el problema, el recepcionista me dijo que el hotel estaba completo y que no podía hacer nada. Su actitud me pareció muy poco profesional. Elegí su hotel porque en su web dice que es un hotel de cuatro estrellas, con un servicio excelente, y desde luego no fue así. Por todo ello, le agradecería que me devolviera el cincuenta por ciento del precio de la reserva. Quedo a la espera de su respuesta.\nAtentamente,\nAdam Nightingale"},
{"id": "write-t2-02a", "set": 2, "examTask": 2, "genre": "artículo de opinión", "register": "neutro", "title": "¿Teletrabajo para todos?",
 "prompt": "Un periódico local ha abierto un debate: «¿Debería el teletrabajo ser un derecho para todos los trabajadores?». Escribe un artículo de opinión para la sección de los lectores.",
 "contentPoints": ["Tu experiencia con el teletrabajo o la de alguien que conoces.", "Las ventajas del teletrabajo.", "Los inconvenientes.", "Tu opinión final y una propuesta."],
 "targets": targets("opinion", "conectores", "perfecto", "condicional"),
 "usefulPhrases": PH_OPINION,
 "modelAnswer": "Durante la pandemia trabajé desde casa casi un año, y la experiencia me hizo cambiar de opinión sobre muchas cosas. En mi opinión, el teletrabajo tiene ventajas muy claras. Por un lado, ahorramos tiempo y dinero en transporte, y las ciudades tienen menos tráfico y contaminación. Por otro lado, podemos organizar mejor el día y pasar más tiempo con la familia. Sin embargo, no todo es positivo. Muchas personas se sienten solas y les cuesta separar el trabajo de la vida personal. Yo mismo he contestado correos a las once de la noche más de una vez. Además, no todos los trabajos se pueden hacer a distancia. Por eso, creo que el teletrabajo no debería ser obligatorio, pero sí un derecho para quien pueda y quiera hacerlo. Lo ideal sería un modelo mixto: dos o tres días en casa y el resto en la oficina."},
{"id": "write-t2-02b", "set": 2, "examTask": 2, "genre": "reseña", "register": "neutro", "title": "Reseña de un restaurante",
 "prompt": "Una web de viajeros busca reseñas de restaurantes. Escribe una reseña sobre un restaurante en el que comiste recientemente.",
 "contentPoints": ["Dónde está el restaurante y cuándo fuiste.", "Cómo era el local y el ambiente.", "Qué comiste y qué te pareció.", "El servicio y el precio.", "Si lo recomiendas y a quién."],
 "targets": targets("indefinido", "imperfecto", "opinion", "consejo"),
 "usefulPhrases": ["Fuimos a cenar a…", "El local era…", "Lo que más me gustó fue…", "La relación calidad-precio es…", "Lo recomiendo a…", "Os aconsejo que reservéis antes."],
 "modelAnswer": "El sábado pasado fui a cenar con unos amigos a La Alacena, un pequeño restaurante en el barrio de Triana. El local era sencillo pero muy acogedor, con mesas de madera y fotos antiguas de Sevilla en las paredes. Como era sábado, había muchísimo ambiente y bastante ruido. Pedimos varios platos para compartir: salmorejo, croquetas caseras y un pescado a la plancha buenísimo. Lo que más me gustó fueron las croquetas; creo que son las mejores que he probado en la ciudad. El postre, en cambio, me pareció un poco flojo. Los camareros fueron muy amables y nos explicaron todos los platos con paciencia. Pagamos unos veinticinco euros por persona, un precio muy razonable. Lo recomiendo a quien quiera probar cocina andaluza tradicional sin gastar demasiado. Eso sí, os aconsejo que reservéis antes, porque se llena enseguida."},
# ---------- Set 3 ----------
{"id": "write-t1-03", "set": 3, "examTask": 1, "genre": "entrada de foro", "register": "informal", "title": "Mi primer trabajo",
 "prompt": "En un foro de jóvenes que buscan su primer empleo, la gente cuenta cómo fue su primera experiencia laboral. Escribe tu mensaje para el foro.",
 "contentPoints": ["Qué trabajo era, dónde y a qué edad lo conseguiste.", "Cómo eran tus compañeros y tu jefe.", "Una anécdota de aquel trabajo.", "Qué te enseñó esa experiencia.", "Un consejo para quien busca su primer trabajo."],
 "targets": targets("indefinido", "imperfecto", "relato", "consejo"),
 "usefulPhrases": ["Mi primer trabajo fue…", "Lo conseguí gracias a…", "Me acuerdo de que una vez…", "Aprendí que…", "Si estáis buscando trabajo, os aconsejo que…"],
 "modelAnswer": "¡Hola a todos! Mi primer trabajo fue de camarero en una cafetería de Brighton, cuando tenía diecisiete años. Lo conseguí porque el dueño era amigo de mi padre. Mis compañeros eran mayores que yo, pero me ayudaron muchísimo desde el primer día. El jefe, en cambio, era bastante serio y no le gustaba nada que llegáramos tarde. Recuerdo que un día, el primer mes, se me cayó una bandeja con seis cafés encima de un cliente. Me quería morir de vergüenza. Pero el señor se rio, me dijo que a él le había pasado lo mismo de joven y al final me dejó una buena propina. Aquel trabajo me enseñó a ser responsable y a mantener la calma. A quienes buscáis vuestro primer empleo os aconsejo que no tengáis miedo de empezar por algo sencillo: todo trabajo enseña algo."},
{"id": "write-t2-03a", "set": 3, "examTask": 2, "genre": "correo informal con consejos", "register": "informal", "title": "Un amigo quiere aprender español",
 "prompt": "Tu amigo Tom te escribe: «Quiero aprender español para mi trabajo, pero no tengo mucho tiempo. Tú lo has aprendido bastante rápido. ¿Cómo lo hiciste? ¿Qué me aconsejas?». Responde a Tom.",
 "contentPoints": ["Salúdalo y reacciona a su idea.", "Explícale cómo aprendiste tú.", "Cuéntale qué fue lo más difícil para ti.", "Dale al menos dos consejos prácticos.", "Despídete."],
 "targets": targets("saludo-informal", "indefinido", "consejo", "subjuntivo"),
 "usefulPhrases": PH_INFORMAL,
 "modelAnswer": "¡Hola, Tom! ¡Qué buena idea! Seguro que el español te va a ser muy útil en el trabajo. Yo empecé con una aplicación en el móvil, diez minutos al día, pero lo que más me ayudó fue mudarme a Sevilla y apuntarme a una academia. También veía series en español con subtítulos y, poco a poco, empecé a entender sin ellos. Lo más difícil para mí fueron los tiempos del pasado: todavía me equivoco a veces entre el indefinido y el imperfecto. Como tienes poco tiempo, te aconsejo que estudies un poco cada día en lugar de muchas horas el fin de semana. Además, yo que tú buscaría un intercambio de idiomas: es gratis y practicas la conversación, que es lo más importante. ¡Ánimo, que tú puedes! Ya me contarás qué tal. Un abrazo,\nAdam"},
{"id": "write-t2-03b", "set": 3, "examTask": 2, "genre": "relato de una experiencia", "register": "neutro", "title": "Un viaje que salió mal",
 "prompt": "Una revista de viajes publica historias de lectores con el título «El viaje que salió mal (pero acabó bien)». Escribe tu historia.",
 "contentPoints": ["Adónde ibas, con quién y por qué.", "Qué salió mal.", "Cómo os sentisteis y qué hicisteis.", "Cómo terminó la historia y qué aprendiste."],
 "targets": targets("indefinido", "imperfecto", "pluscuamperfecto", "relato"),
 "usefulPhrases": PH_STORY,
 "modelAnswer": "El verano pasado mi pareja y yo íbamos a pasar una semana en Lisboa para celebrar nuestro aniversario. Lo habíamos organizado todo con meses de antelación. Sin embargo, al llegar al aeropuerto nos dijeron que el vuelo estaba cancelado por una huelga. No había más vuelos hasta tres días después. Estábamos enfadadísimos y muy decepcionados. Entonces, en la cafetería del aeropuerto, una señora portuguesa nos oyó hablar y nos dio una idea: ir en tren y autobús. Al principio nos pareció una locura, pero aceptamos. El viaje duró casi doce horas, pero vimos paisajes preciosos y conocimos a gente encantadora. Al final llegamos a Lisboa de noche, cansados pero felices. Aprendí que a veces los planes que salen mal se convierten en los mejores recuerdos."},
# ---------- Set 4 ----------
{"id": "write-t1-04", "set": 4, "examTask": 1, "genre": "carta formal de petición", "register": "formal", "title": "Una carta al ayuntamiento",
 "prompt": "En tu barrio hay un parque abandonado. Escribe una carta al ayuntamiento para pedir que lo arreglen.",
 "contentPoints": ["Preséntate y explica dónde vives.", "Explica cómo era el parque antes y cómo está ahora.", "Cuenta un problema concreto que ha ocurrido.", "Propón al menos dos mejoras.", "Despídete de forma adecuada."],
 "targets": targets("saludo-formal", "imperfecto", "perfecto", "peticion"),
 "usefulPhrases": PH_FORMAL + ["Es una vergüenza que…", "Habría que…"],
 "modelAnswer": "Estimados señores:\nMe llamo Adam Nightingale y vivo en la calle Feria, junto al parque de los Naranjos. Les escribo en nombre de varios vecinos del barrio. Hace unos años, el parque era un lugar muy agradable: había bancos nuevos, una fuente y los niños jugaban allí todas las tardes. Ahora, en cambio, se ha convertido en un lugar casi abandonado. Los columpios están rotos, no hay luz por la noche y la basura se acumula en las esquinas. La semana pasada, una vecina mayor se cayó porque el suelo está lleno de agujeros. Nos parece una vergüenza que un espacio público esté en estas condiciones. Por eso, les pedimos que arreglen el suelo y los columpios y que instalen farolas. Además, les agradeceríamos que pusieran más papeleras. Quedamos a la espera de su respuesta.\nAtentamente,\nAdam Nightingale"},
{"id": "write-t2-04a", "set": 4, "examTask": 2, "genre": "correo informal con consejos", "register": "informal", "title": "Problemas con un compañero de piso",
 "prompt": "Tu amiga Marta te escribe: «Estoy harta de mi compañero de piso: nunca limpia, pone la música muy alta y se come mi comida. No sé qué hacer. ¿Tú qué harías?». Responde a Marta.",
 "contentPoints": ["Salúdala y muestra que entiendes el problema.", "Cuéntale una experiencia parecida que tuviste.", "Dale consejos para solucionar la situación.", "Despídete y ofrécele tu ayuda."],
 "targets": targets("saludo-informal", "indefinido", "consejo", "condicional"),
 "usefulPhrases": PH_INFORMAL + ["Te entiendo perfectamente.", "A mí me pasó algo parecido…"],
 "modelAnswer": "¡Hola, Marta! Te entiendo perfectamente. Vivir con alguien que no respeta las normas es agotador. A mí me pasó algo parecido hace dos años, cuando compartía piso con un chico de Valencia. Nunca fregaba los platos y siempre invitaba a amigos sin avisar. Al final, un día nos sentamos a hablar tranquilamente y descubrí que él no se daba cuenta de que me molestaba. Por eso, te aconsejo que hables con tu compañero antes de enfadarte más. Yo que tú propondría una lista de tareas y la pegaría en la nevera. También podríais decidir un horario para la música. Y para la comida, ¿por qué no pones tu nombre en tus cosas? Si nada funciona, quizá sea mejor buscar otro piso. Si necesitas ayuda para buscarlo, cuenta conmigo. ¡Mucho ánimo! Un beso,\nAdam"},
{"id": "write-t2-04b", "set": 4, "examTask": 2, "genre": "entrada de blog", "register": "neutro", "title": "Una fiesta que no olvidaré",
 "prompt": "Tienes un blog sobre tu vida en España. Escribe una entrada sobre una fiesta o celebración a la que fuiste.",
 "contentPoints": ["Qué fiesta era, dónde y con quién fuiste.", "Cómo era el ambiente.", "Algo que te sorprendió o te pasó.", "Tu opinión sobre la fiesta y si volverías."],
 "targets": targets("indefinido", "imperfecto", "opinion", "valorar"),
 "usefulPhrases": PH_STORY[:5] + ["Me pareció increíble que…", "Sin duda, volveré."],
 "modelAnswer": "Este año, por fin, fui a la Feria de Abril con mis compañeros de clase. Una amiga sevillana nos invitó a la caseta de su familia y nos prestó trajes de flamenca y chaquetas cortas. El ambiente era increíble: había farolillos de colores por todas partes, música en cada caseta y gente bailando sevillanas a todas horas. Lo que más me sorprendió fue que personas de todas las edades bailaban juntas, desde niños de cinco años hasta abuelos de ochenta. Intenté aprender a bailar, pero me equivoqué tantas veces que al final todos se reían conmigo. Me pareció increíble que la fiesta durara hasta las seis de la mañana durante una semana entera. En mi opinión, es una experiencia que todo el mundo debería vivir al menos una vez. Sin duda, volveré el año que viene."},
]
for t in TASKS:
    t.setdefault("unit", 0)
    t["taskFormat"] = "write-compulsory" if t["examTask"] == 1 else "write-choice"
    t["wordRange"] = [120, 150]
