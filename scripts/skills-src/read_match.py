# Reading task 2 (read-match): 8 short texts matched to 10 profiles (2 distractors). `evidence` is in the text.
TASKS = [
{
"id": "read-match-01", "unit": 4, "taskFormat": "read-match", "topic": "libros",
"title": "Novedades de la librería",
"instruction": "Lee las reseñas de ocho libros y los perfiles de diez personas. Elige el libro más adecuado para cada persona. Hay dos personas que no tienen libro.",
"profiles": [
{"id": "A", "text": "Marta tiene 9 años, le encantan los animales y está empezando a leer libros sin dibujos."},
{"id": "B", "text": "Javier es cocinero y quiere conocer la historia de los platos tradicionales de España."},
{"id": "C", "text": "Rosa acaba de jubilarse y busca una novela larga y tranquila para leer en la playa."},
{"id": "D", "text": "Andrés viaja mucho por trabajo y prefiere libros de relatos cortos que pueda leer en el avión."},
{"id": "E", "text": "Lucía estudia Psicología y le interesa entender por qué tomamos malas decisiones."},
{"id": "F", "text": "Pablo es aficionado a las novelas policíacas, sobre todo si están ambientadas en ciudades que conoce."},
{"id": "G", "text": "Elena quiere empezar a correr y necesita consejos prácticos para no lesionarse."},
{"id": "H", "text": "Tomás tiene 16 años y odia leer, pero le gustan los cómics y las historias de ciencia ficción."},
{"id": "I", "text": "Carmen va a mudarse a un piso pequeño y quiere ideas para organizar mejor su casa."},
{"id": "J", "text": "Luis está aprendiendo inglés y busca un libro bilingüe con historias sencillas."}
],
"texts": [
{"title": "El misterio de la calle Feria", "text": "Una inspectora recién llegada a Sevilla investiga la desaparición de un anticuario en el barrio de la Macarena. Los lectores reconocerán bares, mercados y plazas reales de la ciudad.", "answer": "F", "evidence": "Los lectores reconocerán bares, mercados y plazas reales de la ciudad."},
{"title": "La perrita que no sabía ladrar", "text": "Lola es una perrita muy especial: en lugar de ladrar, canta. Una historia divertida en capítulos cortos, con letra grande, pensada para los primeros lectores que ya no necesitan ilustraciones.", "answer": "A", "evidence": "pensada para los primeros lectores que ya no necesitan ilustraciones"},
{"title": "Planeta Rojo", "text": "Una novela gráfica llena de acción: en el año 2190, un grupo de adolescentes intenta sobrevivir en la primera colonia de Marte. Ideal para quienes dicen que «los libros son un rollo».", "answer": "H", "evidence": "Una novela gráfica llena de acción"},
{"title": "Diez minutos de viaje", "text": "Veinte cuentos breves de autores jóvenes, ninguno de más de diez páginas. Se pueden leer en cualquier orden, en un tren o en una sala de espera.", "answer": "D", "evidence": "ninguno de más de diez páginas"},
{"title": "Del cocido al gazpacho", "text": "Un recorrido por el origen de la cocina española: de dónde viene cada ingrediente, cómo cambiaron las recetas con los siglos y qué comían nuestros abuelos.", "answer": "B", "evidence": "Un recorrido por el origen de la cocina española"},
{"title": "La casa de los cuatro veranos", "text": "Más de setecientas páginas para seguir a una familia que se reúne cada agosto en una casa junto al mar. Una lectura sin prisas, perfecta para las vacaciones.", "answer": "C", "evidence": "Una lectura sin prisas, perfecta para las vacaciones."},
{"title": "Menos es más", "text": "Cómo ganar espacio en casa: muebles que sirven para dos cosas, trucos para guardar la ropa y consejos para deshacerse de lo que no necesitamos.", "answer": "I", "evidence": "Cómo ganar espacio en casa"},
{"title": "El cerebro tramposo", "text": "Un ensayo ameno, escrito por una investigadora, sobre los errores que comete nuestra mente al decidir: por qué compramos cosas que no necesitamos o por qué confiamos en la primera impresión.", "answer": "E", "evidence": "sobre los errores que comete nuestra mente al decidir"}
]
},
{
"id": "read-match-02", "unit": 1, "taskFormat": "read-match", "topic": "tiempo libre en la ciudad",
"title": "Cursos de otoño en el centro cívico",
"instruction": "Lee los anuncios de ocho cursos y los perfiles de diez personas. Elige el curso más adecuado para cada persona. Hay dos personas que no tienen curso.",
"profiles": [
{"id": "A", "text": "Inés trabaja de lunes a viernes hasta las ocho de la tarde y solo tiene libres los sábados por la mañana."},
{"id": "B", "text": "Rafael se ha mudado a Sevilla y quiere conocer gente del barrio mientras hace algo con las manos."},
{"id": "C", "text": "Nuria tiene un bebé de seis meses y busca una actividad a la que pueda ir con él."},
{"id": "D", "text": "Óscar quiere aprender a hacer fotos mejores con su móvil para su blog de viajes."},
{"id": "E", "text": "Pilar tiene 72 años y nunca ha usado un ordenador, pero quiere hacer videollamadas con sus nietos."},
{"id": "F", "text": "Samuel es estudiante, no tiene mucho dinero y quiere mejorar su inglés hablando."},
{"id": "G", "text": "Alicia tiene problemas de espalda por pasar muchas horas sentada en la oficina."},
{"id": "H", "text": "Marcos quiere aprender a tocar un instrumento, pero no sabe leer música."},
{"id": "I", "text": "Beatriz quiere aprender a preparar platos sin carne para toda su familia."},
{"id": "J", "text": "Hugo busca una actividad al aire libre para hacer deporte en grupo los domingos."}
],
"texts": [
{"title": "Cerámica para principiantes", "text": "Aprende a hacer tus propios platos y tazas mientras compartes mesa con otros vecinos. Grupos pequeños y muy buen ambiente. Martes y jueves, de 18:00 a 20:00.", "answer": "B", "evidence": "mientras compartes mesa con otros vecinos"},
{"title": "Ordenador sin miedo", "text": "Curso para mayores de 65 que empiezan desde cero: encender el ordenador, usar el correo y hablar con la familia por vídeo. Profesores con mucha paciencia.", "answer": "E", "evidence": "hablar con la familia por vídeo"},
{"title": "Intercambio de idiomas", "text": "Cada miércoles, estudiantes extranjeros y vecinos se reúnen para conversar media hora en español y media hora en inglés. Actividad gratuita, sin inscripción.", "answer": "F", "evidence": "Actividad gratuita, sin inscripción."},
{"title": "Guitarra de oído", "text": "¿Nunca has tocado? Aprenderás tus primeras canciones sin partituras, solo escuchando y repitiendo. Trae tu guitarra o usa una de las nuestras.", "answer": "H", "evidence": "sin partituras, solo escuchando y repitiendo"},
{"title": "Espalda sana", "text": "Ejercicios suaves para corregir la postura y aliviar los dolores de espalda, especialmente pensados para personas que trabajan sentadas.", "answer": "G", "evidence": "especialmente pensados para personas que trabajan sentadas"},
{"title": "Masaje y canciones", "text": "Un espacio para madres y padres con bebés de 3 a 12 meses: masaje infantil, canciones y juegos. Ven con tu bebé y una toalla.", "answer": "C", "evidence": "Ven con tu bebé y una toalla."},
{"title": "Fotografía con el móvil", "text": "Luz, encuadre y edición sin aplicaciones caras: consigue fotos de viaje dignas de una revista. Sábados de 10:00 a 13:00.", "answer": "D", "evidence": "consigue fotos de viaje dignas de una revista"},
{"title": "Cocina vegetariana en familia", "text": "Recetas sencillas y nutritivas sin carne ni pescado que gustan a niños y adultos. Cada semana cocinamos y comemos juntos.", "answer": "I", "evidence": "Recetas sencillas y nutritivas sin carne ni pescado que gustan a niños y adultos."}
]
},
{
"id": "read-match-03", "unit": 6, "taskFormat": "read-match", "topic": "voluntariado",
"title": "Ofertas de voluntariado",
"instruction": "Lee ocho ofertas de voluntariado y los perfiles de diez personas. Elige la oferta más adecuada para cada persona. Hay dos personas que no tienen oferta.",
"profiles": [
{"id": "A", "text": "Iván es enfermero jubilado y quiere seguir ayudando a personas enfermas."},
{"id": "B", "text": "Clara habla francés y árabe y quiere ayudar a personas que acaban de llegar a España."},
{"id": "C", "text": "Mario es estudiante de Biología y le preocupa la contaminación de los ríos."},
{"id": "D", "text": "Sofía tiene coche y dispone de dos mañanas libres a la semana."},
{"id": "E", "text": "Antonio fue profesor de matemáticas y quiere ayudar a niños con dificultades en el colegio."},
{"id": "F", "text": "Laura adora los animales, pero vive en un piso donde no puede tener mascotas."},
{"id": "G", "text": "Raúl es informático y solo puede colaborar desde casa, a través de internet."},
{"id": "H", "text": "Eva quiere hacer voluntariado en el extranjero durante el verano."},
{"id": "I", "text": "Jorge es muy sociable y quiere hacer compañía a personas mayores que viven solas."},
{"id": "J", "text": "Paula es cocinera y quiere ayudar a preparar comida para personas sin recursos."}
],
"texts": [
{"title": "Comedor social San Juan", "text": "Buscamos personas con experiencia en cocina para preparar unos doscientos menús diarios. Turnos de mañana, de 9:00 a 13:00.", "answer": "J", "evidence": "Buscamos personas con experiencia en cocina"},
{"title": "Refugio Cuatro Patas", "text": "Necesitamos voluntarios para pasear a los perros, limpiar las instalaciones y dar cariño a los animales que esperan una familia.", "answer": "F", "evidence": "para pasear a los perros"},
{"title": "Acogida sin fronteras", "text": "Acompaña a personas migrantes en sus primeros trámites: médico, empadronamiento, colegio de los niños. Se valora el conocimiento de idiomas.", "answer": "B", "evidence": "Se valora el conocimiento de idiomas."},
{"title": "Ríos limpios", "text": "Proyecto de seguimiento de la calidad del agua del Guadalquivir. Tomamos muestras una vez al mes. Ideal para estudiantes de ciencias.", "answer": "C", "evidence": "Ideal para estudiantes de ciencias."},
{"title": "Deberes en compañía", "text": "Apoyo escolar por las tardes para alumnos de primaria con dificultades en lengua y matemáticas. Imprescindible tener paciencia.", "answer": "E", "evidence": "Apoyo escolar por las tardes para alumnos de primaria con dificultades en lengua y matemáticas."},
{"title": "Conductores solidarios", "text": "Llevamos a personas mayores al médico y al hospital. Si tienes vehículo propio y algunas mañanas libres, te necesitamos.", "answer": "D", "evidence": "Si tienes vehículo propio y algunas mañanas libres, te necesitamos."},
{"title": "Webs para ONG", "text": "Pequeñas asociaciones necesitan ayuda con su página web y sus redes sociales. Colaboración cien por cien en línea, a tu ritmo.", "answer": "G", "evidence": "Colaboración cien por cien en línea, a tu ritmo."},
{"title": "Charlas de café", "text": "Visita una vez a la semana a una persona mayor que vive sola: conversar, dar un paseo, tomar un café. Pequeños gestos que cambian el día.", "answer": "I", "evidence": "Visita una vez a la semana a una persona mayor que vive sola"}
]
}
]
