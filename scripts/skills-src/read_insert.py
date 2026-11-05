# Reading task 3 (read-insert): ~400-word article with 7 gaps and 10 fragments (3 unused).
# `clue` is the cohesion clue (connector, pronoun, repeated word) and must appear in the paragraph or the fragment.
TASKS = [
{
"id": "read-insert-01", "unit": 2, "taskFormat": "read-insert", "topic": "trabajo",
"title": "Teletrabajar desde el pueblo",
"text": [
"Hace solo unos años, trabajar para una empresa de Madrid viviendo en un pueblo de cuatrocientos habitantes era impensable. {{1}} Hoy, gracias a la fibra óptica y a la generalización del teletrabajo, cada vez más profesionales están haciendo las maletas para irse al campo.",
"Es el caso de Sara Molina, diseñadora gráfica de 34 años, que en 2022 dejó su piso de Barcelona para instalarse en un pueblo de Teruel. {{2}} «Pagaba casi mil euros por un piso de cuarenta metros. Aquí, por la mitad, tengo una casa con jardín», explica.",
"Los ayuntamientos de muchas zonas despobladas han visto en este fenómeno una oportunidad. {{3}} Algunos ofrecen casas a precios muy bajos; otros han abierto espacios de trabajo compartido con buena conexión a internet, donde los recién llegados pueden trabajar y conocer a otros vecinos.",
"Sin embargo, la vida rural también tiene sus inconvenientes. {{4}} En muchos pueblos no hay farmacia, el médico pasa consulta solo dos días a la semana y el colegio más cercano está a veinte kilómetros. Para las familias con hijos, esto puede ser decisivo. Y aunque la conexión a internet ha mejorado mucho, todavía hay zonas donde falla cuando hace mal tiempo.",
"Además, no todos los trabajos se pueden hacer a distancia. {{5}} Por eso, la mayoría de los nuevos vecinos se dedica a sectores como la informática, el diseño, la traducción o la consultoría.",
"Tampoco es fácil adaptarse al ritmo del pueblo. {{6}} Sara reconoce que el primer invierno fue duro: «A las seis ya era de noche y no había nadie por la calle. Echaba de menos los cines, los conciertos, el ruido».",
"Aun así, ella no se arrepiente. {{7}} «He cambiado un poco de vida social por mucha calidad de vida. Y cuando necesito ciudad, cojo el tren y me voy un fin de semana»."
],
"fragments": [
{"id": "A", "text": "Para atraer a estas personas, ponen en marcha distintas iniciativas."},
{"id": "B", "text": "Lo que más le pesaba en la ciudad era el precio de la vivienda."},
{"id": "C", "text": "Un enfermero o un camarero, por ejemplo, necesitan estar físicamente en su lugar de trabajo."},
{"id": "D", "text": "La conexión a internet era lenta y las reuniones por vídeo, casi imposibles."},
{"id": "E", "text": "El principal es la falta de servicios básicos."},
{"id": "F", "text": "Al contrario, cree que ha sido la mejor decisión de su vida."},
{"id": "G", "text": "La tranquilidad que muchos buscan puede convertirse, a veces, en soledad."},
{"id": "H", "text": "Por eso, la población de los pueblos no ha dejado de crecer desde los años sesenta."},
{"id": "I", "text": "Los vecinos, en cambio, prefieren que no lleguen personas de fuera."},
{"id": "J", "text": "Además, el sueldo de los teletrabajadores suele ser más bajo."}
],
"gaps": [
{"n": 1, "answer": "D", "clue": "era impensable", "why": "The fragment explains why it was unthinkable (slow internet), and «Hoy» then contrasts with the past."},
{"n": 2, "answer": "B", "clue": "le pesaba en la ciudad", "why": "«le» refers to Sara, and the quote about rent develops «el precio de la vivienda»."},
{"n": 3, "answer": "A", "clue": "estas personas", "why": "«estas personas» refers back to the professionals; «distintas iniciativas» is developed by «Algunos… otros…»."},
{"n": 4, "answer": "E", "clue": "El principal", "why": "«El principal» (inconveniente) picks up «inconvenientes», then the paragraph lists missing services."},
{"n": 5, "answer": "C", "clue": "por ejemplo", "why": "It gives examples of jobs that can't be done remotely; «Por eso» then introduces the jobs that can."},
{"n": 6, "answer": "G", "clue": "soledad", "why": "The idea of loneliness is illustrated by the empty streets in winter."},
{"n": 7, "answer": "F", "clue": "Al contrario", "why": "«Al contrario» follows «no se arrepiente»: she thinks it was her best decision."}
]
},
{
"id": "read-insert-02", "unit": 3, "taskFormat": "read-insert", "topic": "deporte",
"title": "Correr: de moda pasajera a hábito",
"text": [
"Hace veinte años, ver a alguien corriendo por la calle llamaba la atención. Hoy es difícil pasear por un parque de cualquier ciudad española sin cruzarse con decenas de corredores. {{1}} Hay quien sale a primera hora de la mañana, antes de ir a la oficina, y quien prefiere correr de noche, cuando las calles están más tranquilas y hace menos calor.",
"Las razones de este éxito son sencillas. {{2}} No hace falta pagar un gimnasio ni comprar un equipo caro: con unas buenas zapatillas es suficiente. Además, se puede practicar a cualquier hora y en cualquier lugar, solo o en compañía. Muchas personas aprovechan los viajes de trabajo para conocer las ciudades corriendo.",
"Las carreras populares también han contribuido a esta fiebre. {{3}} En ellas participan desde atletas profesionales hasta personas que corren por primera vez, y muchas tienen un fin solidario. Lo que se recauda con las inscripciones suele destinarse a asociaciones de enfermos o a proyectos sociales del barrio.",
"Sin embargo, los médicos advierten de que correr no es tan inofensivo como parece. {{4}} Las lesiones de rodilla y de tobillo son muy frecuentes, sobre todo entre quienes empiezan con demasiado entusiasmo.",
"Los expertos recomiendan empezar poco a poco, alternando minutos de carrera y de caminata. {{5}} También es importante calentar antes de salir, estirar al terminar y descansar al menos un día entre entrenamientos.",
"Otro error frecuente es obsesionarse con los números. {{6}} Hay corredores que dejan de disfrutar porque solo piensan en bajar su tiempo o en correr más kilómetros que la semana anterior. Otros se comparan constantemente con sus amigos en las aplicaciones y se sienten mal si no están entre los mejores.",
"Para la psicóloga deportiva Ana Torres, la clave está en no perder de vista el motivo por el que empezamos. {{7}} «Si corres para sentirte bien, no tiene sentido terminar cada entrenamiento enfadado contigo mismo», concluye."
],
"fragments": [
{"id": "A", "text": "Según algunas estimaciones, en España corren con regularidad más de tres millones de personas."},
{"id": "B", "text": "Correr es, probablemente, el deporte más barato y accesible que existe."},
{"id": "C", "text": "Cada fin de semana se celebran decenas de ellas por todo el país."},
{"id": "D", "text": "Hacer demasiados kilómetros sin preparación puede causar problemas."},
{"id": "E", "text": "De este modo, el cuerpo se acostumbra al esfuerzo sin sufrir."},
{"id": "F", "text": "Los relojes inteligentes miden la velocidad, la distancia y hasta el ritmo del corazón."},
{"id": "G", "text": "En su opinión, la salud y el placer deberían ir siempre por delante de las marcas."},
{"id": "H", "text": "Por eso, la mayoría de los corredores prefiere entrenar en el gimnasio."},
{"id": "I", "text": "Ninguna de ellas, sin embargo, está abierta a corredores aficionados."},
{"id": "J", "text": "Antes de los cuarenta años, en cambio, no hay ningún riesgo."}
],
"gaps": [
{"n": 1, "answer": "A", "clue": "decenas de corredores", "why": "The figure (three million) develops the idea of how many people run today."},
{"n": 2, "answer": "B", "clue": "barato y accesible", "why": "The next sentences explain why it is cheap (no gym) and accessible (any time, any place)."},
{"n": 3, "answer": "C", "clue": "ellas", "why": "«ellas» refers to «las carreras populares», and «En ellas» in the next sentence continues the reference."},
{"n": 4, "answer": "D", "clue": "puede causar problemas", "why": "It explains why running isn't harmless; the next sentence names the problems (injuries)."},
{"n": 5, "answer": "E", "clue": "De este modo", "why": "«De este modo» refers to starting gradually, alternating running and walking."},
{"n": 6, "answer": "F", "clue": "los números", "why": "Smart watches produce the numbers that some runners become obsessed with."},
{"n": 7, "answer": "G", "clue": "En su opinión", "why": "«su» refers to Ana Torres; her opinion is then developed in the quote."}
]
},
{
"id": "read-insert-03", "unit": 8, "taskFormat": "read-insert", "topic": "viajes",
"title": "Vuelve el tren nocturno",
"text": [
"Durante años parecía que los trenes nocturnos estaban condenados a desaparecer. Los vuelos baratos y la alta velocidad los dejaron sin pasajeros, y muchas compañías cerraron sus líneas. En España, el último tren nocturno dejó de circular en 2020. {{1}} Hoy es posible dormir en un tren entre ciudades como París y Berlín, Viena y Roma o Bruselas y Praga.",
"Detrás de este regreso está, sobre todo, la preocupación por el medioambiente. {{2}} Por eso, cada vez más viajeros eligen el tren aunque el viaje dure más horas. Algunas empresas incluso lo recomiendan a sus empleados para los viajes de negocios.",
"La comodidad es otro argumento a favor. {{3}} Además, al llegar no hay que desplazarse desde un aeropuerto lejano, porque las estaciones suelen estar en el centro de las ciudades.",
"Las compañías han modernizado los vagones para atraer a nuevos clientes. {{4}} Hay compartimentos privados con baño, conexión wifi y desayuno incluido en el precio. Para quienes viajan con poco dinero, existen también literas en compartimentos de seis personas, mucho más económicas.",
"No todo es perfecto, claro. {{5}} En temporada alta, un billete en cama individual puede costar más que un vuelo con hotel incluido.",
"También hay quejas sobre la puntualidad. {{6}} Algunos pasajeros cuentan que han llegado a su destino con tres o cuatro horas de retraso por problemas en las vías. Para quien tiene una reunión a primera hora, un retraso así puede ser un problema serio.",
"Aun así, quienes lo prueban suelen repetir. {{7}} Mirar el paisaje por la ventana, leer sin prisa o charlar con desconocidos en el vagón restaurante son placeres que el avión no ofrece. Como dice una viajera alemana que hace cada año la ruta de Viena a Venecia: «En el avión solo llegas. En el tren, viajas»."
],
"fragments": [
{"id": "A", "text": "Sin embargo, en los últimos años han vuelto con fuerza a las vías europeas."},
{"id": "B", "text": "Un avión contamina mucho más por pasajero que un tren en un trayecto de la misma distancia."},
{"id": "C", "text": "El viajero se acuesta en una ciudad y se despierta en otra, sin perder un día de vacaciones."},
{"id": "D", "text": "Atrás quedan los asientos incómodos y los vagones viejos de los años ochenta."},
{"id": "E", "text": "El principal inconveniente es el precio, que a veces resulta muy elevado."},
{"id": "F", "text": "Los trenes nocturnos, al compartir las vías con los de mercancías, sufren a menudo retrasos."},
{"id": "G", "text": "Para muchos, la experiencia forma ya parte del propio viaje."},
{"id": "H", "text": "Por eso, los gobiernos han decidido prohibir los vuelos de menos de dos horas."},
{"id": "I", "text": "Ninguna compañía, en cambio, ofrece todavía servicio de comida."},
{"id": "J", "text": "Además, los aeropuertos están cada vez más cerca del centro."}
],
"gaps": [
{"n": 1, "answer": "A", "clue": "Sin embargo", "why": "«Sin embargo» contrasts with the trains seeming condemned to disappear; the next paragraph mentions «este regreso»."},
{"n": 2, "answer": "B", "clue": "contamina", "why": "It develops the environmental concern; «Por eso» then explains why travellers choose the train."},
{"n": 3, "answer": "C", "clue": "se despierta en otra", "why": "Sleeping on the move is the comfort argument; «Además» adds a second advantage."},
{"n": 4, "answer": "D", "clue": "Atrás quedan", "why": "It contrasts the old carriages with the modern features described next."},
{"n": 5, "answer": "E", "clue": "inconveniente", "why": "«No todo es perfecto» introduces a drawback; the next sentence gives an example of the price."},
{"n": 6, "answer": "F", "clue": "retrasos", "why": "It explains the complaints about punctuality, illustrated by passengers' delays."},
{"n": 7, "answer": "G", "clue": "forma ya parte del propio viaje", "why": "The idea that the journey is part of the trip is echoed in the final quote."}
]
}
]
