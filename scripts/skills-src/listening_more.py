TASKS = [
{
"id": "listen-reply-03", "unit": 0, "taskFormat": "listen-reply", "title": "Mensajes y comentarios (3)", "voiceRate": 1,
"items": [
{"speaker": "F", "script": "¡Por fin he terminado la tesis! Después de cuatro años, mañana la entrego en la universidad.", "options": ["¡Qué bien! Hay que celebrarlo.", "¡Que te mejores pronto!", "No pasa nada, otra vez será."], "answer": 0, "why": "Great news after a long effort → celebrate it."},
{"speaker": "M", "script": "Perdona, ¿sabes si esta línea de autobús va a la estación de Santa Justa? Es que no veo el mapa por ningún lado.", "options": ["Sí, pero tienes que bajarte en la tercera parada.", "No, gracias, prefiero ir andando.", "Sí, el autobús es muy nuevo."], "answer": 0, "why": "He asks for directions → give useful information."},
{"speaker": "F", "script": "Me han robado la cartera en el metro. Tenía el carné de identidad, las tarjetas y un poco de dinero.", "options": ["¡Qué rabia! ¿Ya has llamado al banco para cancelar las tarjetas?", "¡Qué suerte has tenido!", "Yo también tengo una cartera nueva."], "answer": 0, "why": "Bad news → show sympathy and help with a practical question."},
{"speaker": "M", "script": "Estoy pensando en apuntarme al gimnasio, pero no sé si al de la esquina o al del centro comercial. ¿Tú qué harías?", "options": ["Yo que tú elegiría el de la esquina, así no tienes excusa para no ir.", "Sí, el centro comercial abre a las diez.", "No, no hago deporte desde ayer."], "answer": 0, "why": "He asks for advice → give a recommendation (yo que tú + condicional)."},
{"speaker": "F", "script": "Siento no haber ido a tu cena el sábado. Mi hijo se puso enfermo y no pude salir de casa.", "options": ["No te preocupes, lo importante es que tu hijo esté bien.", "¡Que aproveche!", "Sí, la cena estuvo muy buena, gracias por venir."], "answer": 0, "why": "An apology with a good reason → accept it and show concern."},
{"speaker": "M", "script": "El viernes que viene me caso. Bueno, ya lo sabes, pero quería recordarte que la ceremonia empieza a las doce en punto.", "options": ["Gracias por recordármelo, allí estaré.", "¡Enhorabuena por el nuevo trabajo!", "No, no me gustan las bodas."], "answer": 0, "why": "A reminder → thank him and confirm."}
]
},
{
"id": "listen-reply-04", "unit": 0, "taskFormat": "listen-reply", "title": "Mensajes y comentarios (4)", "voiceRate": 1,
"items": [
{"speaker": "M", "script": "Hola, soy el fontanero. Llego un poco tarde porque hay muchísimo tráfico. Estaré en su casa en unos veinte minutos.", "options": ["De acuerdo, no se preocupe, aquí le espero.", "¡Feliz viaje!", "No, gracias, no necesito un fontanero."], "answer": 0, "why": "A professional says he's late → accept politely (usted)."},
{"speaker": "F", "script": "Mañana es el cumpleaños de Lucía y todavía no tengo regalo. ¿Se te ocurre algo?", "options": ["¿Por qué no le regalas unas entradas para un concierto?", "Sí, ayer fue mi cumpleaños.", "¡Que cumplas muchos más!"], "answer": 0, "why": "She asks for ideas → suggest something (¿por qué no…?)."},
{"speaker": "M", "script": "No me puedo creer que el Betis haya perdido otra vez. Es el tercer partido seguido.", "options": ["Bueno, hombre, ya ganarán el próximo.", "¡Enhorabuena por la victoria!", "Sí, mañana juego al tenis."], "answer": 0, "why": "He's disappointed → console him."},
{"speaker": "F", "script": "¿Te importaría bajar un poco la música? Es que mañana tengo un examen a las ocho y necesito dormir.", "options": ["Claro, perdona, la bajo ahora mismo.", "Sí, me importa mucho el examen.", "No, la música es de un grupo inglés."], "answer": 0, "why": "A polite request → agree and apologise."},
{"speaker": "M", "script": "Al final me han dado la beca para estudiar en Alemania. Me voy en septiembre para un año entero.", "options": ["¡Qué alegría! Te voy a echar de menos.", "¡Qué pena! Otra vez será.", "No, yo prefiero Italia."], "answer": 0, "why": "Good news that means goodbye → be happy for him and say you'll miss him."},
{"speaker": "F", "script": "He probado tu receta de tortilla y me ha salido fatal: se me ha roto al darle la vuelta.", "options": ["No pasa nada, al principio a todo el mundo le pasa. Usa un plato grande.", "¡Que aproveche!", "Sí, yo también he comprado huevos."], "answer": 0, "why": "She's disappointed → reassure her and give a tip."}
]
},
{
"id": "listen-speakers-03", "unit": 4, "taskFormat": "listen-speakers", "title": "¿Qué vemos esta noche?", "voiceRate": 1,
"context": "Vas a escuchar una conversación entre tres amigos, Andrés, Bea y Carmen, que deciden qué ver en el cine esta noche.",
"speakers": {"A": "Andrés", "B": "Bea", "C": "Carmen"},
"script": [
{"speaker": "A", "line": "Venga, chicas, ¿qué película vemos? Yo voto por la nueva de ciencia ficción, la de la nave que se pierde en el espacio."},
{"speaker": "B", "line": "Uf, otra vez naves espaciales… La semana pasada ya vimos una de esas y me aburrí muchísimo."},
{"speaker": "C", "line": "Pues yo he leído que la nueva de Almodóvar está muy bien. Dicen que la actriz principal está increíble."},
{"speaker": "A", "line": "¿Almodóvar? Es que sus películas me parecen un poco raras, la verdad."},
{"speaker": "B", "line": "A mí me encanta Almodóvar, pero hoy me apetece algo más ligero. ¿No hay ninguna comedia?"},
{"speaker": "C", "line": "Hay una comedia francesa, pero es en versión original con subtítulos."},
{"speaker": "A", "line": "Por mí no hay problema, así practico el francés. Lo estudié en el instituto."},
{"speaker": "B", "line": "Vale, pero ¿a qué hora es? Porque mañana empiezo a trabajar muy temprano."},
{"speaker": "C", "line": "Hay una sesión a las ocho y otra a las diez y media."},
{"speaker": "B", "line": "La de las ocho, por favor. Si no, mañana no hay quien me levante."},
{"speaker": "A", "line": "Perfecto. Yo compro las entradas por internet, que así nos sale más barato."},
{"speaker": "C", "line": "Y después, si queréis, cenamos algo rápido en el bar de al lado. Invito yo, que el otro día pagasteis vosotros."},
{"speaker": "B", "line": "¡Genial! Pero algo ligero, ¿eh?"}
],
"statements": [
{"s": "Propone una película de ciencia ficción.", "answer": "A", "evidence": "Yo voto por la nueva de ciencia ficción"},
{"s": "Se aburrió con una película reciente.", "answer": "B", "evidence": "me aburrí muchísimo"},
{"s": "Ha leído buenas críticas de una película.", "answer": "C", "evidence": "Pues yo he leído que la nueva de Almodóvar está muy bien."},
{"s": "Estudió francés en el colegio o instituto.", "answer": "A", "evidence": "Lo estudié en el instituto."},
{"s": "Prefiere la primera sesión porque madruga.", "answer": "B", "evidence": "La de las ocho, por favor."},
{"s": "Ya ha comprado las entradas.", "answer": "N", "evidence": "Yo compro las entradas por internet"},
{"s": "Va a pagar la cena.", "answer": "C", "evidence": "Invito yo"}
]
},
{
"id": "listen-speakers-04", "unit": 11, "taskFormat": "listen-speakers", "title": "Un regalo para Pilar", "voiceRate": 1,
"context": "Vas a escuchar una conversación entre tres compañeros de trabajo, Alba, Bernardo y César, que organizan un regalo para una compañera que se jubila.",
"speakers": {"A": "Alba", "B": "Bernardo", "C": "César"},
"script": [
{"speaker": "A", "line": "Bueno, Pilar se jubila el viernes y todavía no tenemos regalo. Tenemos que decidirlo hoy."},
{"speaker": "B", "line": "Yo había pensado en un reloj bonito, algo para que se acuerde de nosotros."},
{"speaker": "C", "line": "¿Un reloj? ¿Para una persona que se jubila? ¡Si precisamente ya no va a tener horarios!"},
{"speaker": "A", "line": "Ja, ja, tiene razón César. Además, Pilar nunca lleva reloj, mira la hora en el móvil."},
{"speaker": "B", "line": "Vale, vale. ¿Y qué le gusta? Yo la conozco poco, solo llevo un año en la empresa."},
{"speaker": "C", "line": "Le encanta viajar. Siempre nos enseña fotos de sus viajes con su marido."},
{"speaker": "A", "line": "¡Pues ya está! Le regalamos un fin de semana en un hotel con encanto. Entre todos los del departamento, sale a unos veinte euros por persona."},
{"speaker": "B", "line": "Me parece estupendo. Yo puedo encargarme de buscar el hotel, que tengo tiempo esta tarde."},
{"speaker": "C", "line": "Y yo recojo el dinero. Mañana paso por todas las mesas."},
{"speaker": "A", "line": "Perfecto. Yo escribo la tarjeta y le pido a todo el mundo que firme."},
{"speaker": "B", "line": "Oye, ¿y si además organizamos una comida el viernes? Así nos despedimos de ella como se merece."},
{"speaker": "C", "line": "Buena idea, pero que no sea muy cara, que este mes vamos todos justos."}
],
"statements": [
{"s": "Quería regalarle un reloj.", "answer": "B", "evidence": "Yo había pensado en un reloj bonito"},
{"s": "Piensa que un reloj no es buena idea para alguien que se jubila.", "answer": "C", "evidence": "¿Un reloj? ¿Para una persona que se jubila?"},
{"s": "Lleva poco tiempo trabajando en la empresa.", "answer": "B", "evidence": "solo llevo un año en la empresa"},
{"s": "Propone el regalo final.", "answer": "A", "evidence": "Le regalamos un fin de semana en un hotel con encanto."},
{"s": "Va a reservar los billetes de avión.", "answer": "N", "evidence": "Yo puedo encargarme de buscar el hotel"},
{"s": "Va a recoger el dinero de los compañeros.", "answer": "C", "evidence": "Y yo recojo el dinero."},
{"s": "Sugiere una comida de despedida.", "answer": "B", "evidence": "¿y si además organizamos una comida el viernes?"}
]
},
{
"id": "listen-interview-03", "unit": 3, "taskFormat": "listen-interview", "title": "Entrevista: una ingeniera que diseña robots", "voiceRate": 1,
"context": "Vas a escuchar una entrevista de radio con Nuria Campos, ingeniera que diseña robots para ayudar a personas mayores.",
"script": [
{"speaker": "Entrevistador", "line": "Nuria, buenos días. ¿Cuándo empezó su interés por los robots?"},
{"speaker": "Nuria", "line": "Buenos días. Pues desde muy pequeña. Con ocho años desmonté la radio de mi abuelo para ver qué había dentro. No supe volver a montarla, y mi abuelo se enfadó muchísimo."},
{"speaker": "Entrevistador", "line": "¿Siempre tuvo claro que quería ser ingeniera?"},
{"speaker": "Nuria", "line": "No, la verdad es que no. En el instituto me gustaban mucho la biología y la música. Elegí ingeniería casi por casualidad, porque una profesora me animó a presentarme a un concurso de robótica."},
{"speaker": "Entrevistador", "line": "¿Y qué hacen exactamente los robots que diseña su empresa?"},
{"speaker": "Nuria", "line": "Ayudan a personas mayores que viven solas. Les recuerdan cuándo tienen que tomar las medicinas, avisan a la familia si se caen y pueden hacer videollamadas con solo decir un nombre."},
{"speaker": "Entrevistador", "line": "Hay gente que piensa que los robots pueden aumentar la soledad de los mayores. ¿Qué opina?"},
{"speaker": "Nuria", "line": "Entiendo esa preocupación, pero nuestros robots no sustituyen a las personas. Al contrario, su objetivo es que los mayores estén más conectados con su familia y con sus amigos."},
{"speaker": "Entrevistador", "line": "¿Cuál ha sido el momento más emocionante de su carrera?"},
{"speaker": "Nuria", "line": "Una señora de noventa años de un pueblo de Jaén nos escribió una carta. Gracias al robot, había podido ver por vídeo a su nieta recién nacida, que vive en Canadá. La tengo colgada en mi oficina."},
{"speaker": "Entrevistador", "line": "¿Qué le diría a una chica joven que duda si estudiar una carrera técnica?"},
{"speaker": "Nuria", "line": "Que no tenga miedo. Todavía somos pocas mujeres en ingeniería, pero eso está cambiando. Y que no piense que tiene que ser un genio de las matemáticas: lo más importante es la curiosidad."}
],
"questions": [
{"q": "De pequeña, Nuria…", "options": ["arregló la radio de su abuelo.", "rompió la radio de su abuelo por curiosidad.", "construyó su primer robot."], "answer": 1, "evidence": "No supe volver a montarla"},
{"q": "¿Por qué eligió estudiar ingeniería?", "options": ["Porque siempre lo había tenido claro.", "Porque una profesora la animó a participar en un concurso.", "Porque no le gustaban la biología ni la música."], "answer": 1, "evidence": "una profesora me animó a presentarme a un concurso de robótica"},
{"q": "Los robots de su empresa…", "options": ["hacen la limpieza de la casa.", "ayudan a personas mayores que viven solas.", "sustituyen a los médicos."], "answer": 1, "evidence": "Ayudan a personas mayores que viven solas."},
{"q": "¿Qué hacen los robots si una persona se cae?", "options": ["Llaman a la familia.", "La ayudan a levantarse.", "Llaman a una ambulancia."], "answer": 0, "evidence": "avisan a la familia si se caen"},
{"q": "Según Nuria, el objetivo de los robots es…", "options": ["que los mayores necesiten menos a su familia.", "que los mayores estén más conectados con los demás.", "reducir los gastos de las residencias."], "answer": 1, "evidence": "su objetivo es que los mayores estén más conectados con su familia y con sus amigos"},
{"q": "La carta de la señora de Jaén…", "options": ["era una queja sobre el robot.", "contaba que había visto a su nieta gracias al robot.", "pedía un robot para su nieta."], "answer": 1, "evidence": "había podido ver por vídeo a su nieta recién nacida"},
{"q": "Para estudiar una carrera técnica, según Nuria, lo más importante es…", "options": ["ser muy bueno en matemáticas.", "la curiosidad.", "estudiar en el extranjero."], "answer": 1, "evidence": "lo más importante es la curiosidad"}
]
},
{
"id": "listen-interview-04", "unit": 6, "taskFormat": "listen-interview", "title": "Entrevista: un maestro rural", "voiceRate": 1,
"context": "Vas a escuchar una entrevista de radio con Ramón Gil, maestro en una escuela de un pueblo pequeño de la sierra de Huelva.",
"script": [
{"speaker": "Entrevistadora", "line": "Ramón, usted da clase en una escuela con solo once alumnos. ¿Cómo es un día normal?"},
{"speaker": "Ramón", "line": "Pues muy variado. Tengo niños de tres a doce años en la misma aula. Mientras los mayores hacen problemas de matemáticas, yo leo un cuento con los pequeños. Y muchas veces son los mayores los que ayudan a los pequeños."},
{"speaker": "Entrevistadora", "line": "¿Llegó al pueblo por elección o por obligación?"},
{"speaker": "Ramón", "line": "Por obligación, la verdad. Era mi primer destino, hace quince años, y pensaba quedarme solo un curso. Pero me enamoré del pueblo y de la gente, y aquí sigo."},
{"speaker": "Entrevistadora", "line": "¿Cuáles son las ventajas de una escuela tan pequeña?"},
{"speaker": "Ramón", "line": "Conozco a cada niño perfectamente: sé qué le cuesta, qué le gusta, cómo está su familia. Además, salimos mucho al campo. La naturaleza es nuestro mejor laboratorio."},
{"speaker": "Entrevistadora", "line": "¿Y los inconvenientes?"},
{"speaker": "Ramón", "line": "El mayor problema es que cada año hay menos niños. Las familias jóvenes se van a la ciudad porque aquí no hay trabajo. Si bajamos de cinco alumnos, la Junta puede cerrar la escuela."},
{"speaker": "Entrevistadora", "line": "Han hecho una campaña para atraer familias, ¿verdad?"},
{"speaker": "Ramón", "line": "Sí. El ayuntamiento ofrece casas a un precio muy bajo a familias con hijos que quieran venir a vivir aquí. El año pasado llegaron dos familias, una de Madrid y otra de Argentina, y gracias a ellas tenemos cuatro alumnos más."},
{"speaker": "Entrevistadora", "line": "¿Qué pediría usted a las administraciones?"},
{"speaker": "Ramón", "line": "Que no miren solo los números. Una escuela en un pueblo es mucho más que un edificio: si se cierra la escuela, el pueblo muere. Necesitamos buena conexión a internet y transporte para que la gente pueda quedarse."}
],
"questions": [
{"q": "En la escuela de Ramón…", "options": ["cada edad tiene su propia clase.", "niños de distintas edades estudian juntos.", "solo hay alumnos de primaria."], "answer": 1, "evidence": "Tengo niños de tres a doce años en la misma aula."},
{"q": "¿Por qué llegó Ramón al pueblo?", "options": ["Porque era su primer destino como maestro.", "Porque su familia vivía allí.", "Porque buscaba una vida tranquila."], "answer": 0, "evidence": "Era mi primer destino"},
{"q": "Al principio, Ramón pensaba…", "options": ["quedarse para siempre.", "quedarse solo un año.", "abrir una escuela nueva."], "answer": 1, "evidence": "pensaba quedarme solo un curso"},
{"q": "Una ventaja de la escuela pequeña es que…", "options": ["tiene un laboratorio muy moderno.", "el maestro conoce muy bien a cada alumno.", "los niños no tienen deberes."], "answer": 1, "evidence": "Conozco a cada niño perfectamente"},
{"q": "La escuela podría cerrar si…", "options": ["tiene menos de cinco alumnos.", "Ramón se va del pueblo.", "no hay internet."], "answer": 0, "evidence": "Si bajamos de cinco alumnos, la Junta puede cerrar la escuela."},
{"q": "Gracias a la campaña del ayuntamiento…", "options": ["la escuela tiene más alumnos.", "se ha construido una escuela nueva.", "Ramón ha conseguido una casa."], "answer": 0, "evidence": "gracias a ellas tenemos cuatro alumnos más"},
{"q": "Ramón pide a las administraciones que…", "options": ["cierren las escuelas pequeñas.", "tengan en cuenta algo más que las cifras.", "paguen más a los maestros rurales."], "answer": 1, "evidence": "Que no miren solo los números."}
]
}
]
