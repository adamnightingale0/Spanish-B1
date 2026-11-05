"""One-off: adds error / order / match items to the unit packs (idempotent)."""
import json, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
def err(id,unit,gp,diff,marked,answers,feedback,contrast=None):
    toks=marked.split(' '); idx=[i for i,t in enumerate(toks) if '*' in t]; assert len(idx)==1,marked
    i=idx[0]; toks[i]=toks[i].replace('*','')
    d={"id":id,"type":"error","unit":unit,"grammarPoint":gp,"difficulty":diff,"prompt":' '.join(toks),"errorIndex":i,"answers":answers,"feedback":feedback}
    if contrast: d["contrast"]=contrast
    return d
def order(id,unit,gp,diff,answers,feedback,instruction="Ordena las palabras para formar una frase.",contrast=None):
    d={"id":id,"type":"order","unit":unit,"grammarPoint":gp,"difficulty":diff,"instruction":instruction,"answers":answers,"feedback":feedback}
    if contrast: d["contrast"]=contrast
    return d
def match(id,unit,gp,diff,pairs,feedback,instruction="Relaciona cada principio con su final."):
    return {"id":id,"type":"match","unit":unit,"grammarPoint":gp,"difficulty":diff,"instruction":instruction,"pairs":[{"left":l,"right":r} for l,r in pairs],"feedback":feedback}
A={
1:[err("u01-err-001",1,"soler-inf",1,"Los sábados *suelemos* desayunar churros.",["solemos"],"soler only changes o→ue in stressed forms: solemos, soléis.","Suelo desayunar churros."),
   err("u01-err-002",1,"esta-prohibido",2,"En este parque están *prohibido* las bicicletas.",["prohibidas"],"With a noun subject, the participle agrees: las bicicletas → prohibidas."),
   order("u01-ord-001",1,"se-impersonal",2,["En España se cena muy tarde"],"se + 3rd person singular for general habits.")],
2:[err("u02-err-001",2,"llevar-seguir-gerundio",2,"Llevo dos años *vivir* en Sevilla.",["viviendo"],"llevar + time + gerund.","Vivo aquí desde hace dos años."),
   err("u02-err-002",2,"past-review",2,"Ayer *he* comido con mis padres en Triana.",["comí"],"ayer is a closed period → indefinido: comí (tap he, then write the whole verb).","Hoy he comido con mis padres."),
   match("u02-match-001",2,"desde-hace",2,[("Vivo en Sevilla desde","2023."),("No veo a Pablo desde hace","tres meses."),("Hace un año","que estudio español."),("Empecé a trabajar aquí hace","dos años.")],"desde + date; desde hace + period; hace + period + que; hace + period = ago.")],
3:[err("u03-err-001",3,"si-presente",1,"Si *lloverá* mañana, nos quedaremos en casa.",["llueve"],"Never the future after si: si + present.","Si llueve, nos quedaremos en casa."),
   err("u03-err-002",3,"futuro-simple",2,"Mañana te lo *deciré* sin falta.",["diré"],"decir → dir- + é.","Te lo digo mañana."),
   match("u03-match-001",3,"si-presente",2,[("Si estudias todos los días,","aprobarás el examen."),("Si tienes tiempo esta tarde,","llámame."),("Si me ofrecen el puesto,","me voy a Madrid."),("Si no reducimos el consumo,","no habrá agua suficiente.")],"si + present + future / imperative / present.")],
4:[order("u04-ord-001",4,"pronombres-od-oi",2,["Se lo regalé a mi hermana","A mi hermana se lo regalé"],"Indirect before direct; le + lo → se lo.",contrast="Le regalé el libro a mi hermana."),
   order("u04-ord-002",4,"pronombres-od-oi",3,["Voy a contárselo mañana","Mañana voy a contárselo"],"Pronouns attached to the infinitive (with an accent) or before ir: se lo voy a contar."),
   match("u04-match-001",4,"causa-contraste",2,[("Como no había entradas,","nos fuimos a cenar."),("No vi el final","porque me quedé dormido."),("Aunque el guion es flojo,","los actores son muy buenos."),("La novela es larga.","Sin embargo, se lee rápido.")],"como + cause first; porque + cause second; aunque / sin embargo for contrast.")],
5:[order("u05-ord-001",5,"pronombres-posicion",2,["No se lo digas a nadie"],"Negative command: no + pronouns + subjunctive.",contrast="Díselo a todos."),
   order("u05-ord-002",5,"pronombres-posicion",2,["Pruébalo gratis durante un mes","Durante un mes pruébalo gratis"],"Affirmative command: pronoun attached (pruébalo)."),
   err("u05-err-001",5,"imperativo-negativo",1,"No *dejad* la compra para el último día.",["dejéis"],"Negative commands use the subjunctive: no dejéis.","Dejad la compra preparada.")],
6:[err("u06-err-001",6,"cuando-subjuntivo",1,"Cuando *terminaré* el curso, buscaré trabajo.",["termine"],"cuando + subjunctive for the future.","Cuando terminé el curso, busqué trabajo."),
   err("u06-err-002",6,"querer-pedir-que",2,"Exigimos que el ayuntamiento *limpia* el parque.",["limpie"],"exigir que + subjunctive."),
   match("u06-match-001",6,"deberian-habria-que",2,[("Habría que","bajar el precio del transporte."),("El Gobierno debería","invertir en vivienda."),("Es necesario que","todos usemos menos plástico."),("Exigimos que","se cierre la central térmica.")],"habría que / debería + infinitive; es necesario que / exigir que + subjunctive.")],
7:[err("u07-err-001",7,"estilo-indirecto",2,"Mi jefa me ha pedido que le *envío* el informe.",["envíe"],"pedir que + subjunctive.","Me ha dicho que el informe está bien."),
   err("u07-err-002",7,"estilo-indirecto",2,"Luis me ha preguntado *qué* voy a la cena.",["si"],"Yes/no questions are reported with si.","Me ha preguntado qué llevo a la cena."),
   match("u07-match-001",7,"estilo-indirecto",2,[("«¿Vienes?» →","Me ha preguntado si voy."),("«Llámame.» →","Me ha pedido que le llame."),("«Llego tarde.» →","Me ha dicho que llega tarde."),("«¿Dónde vives?» →","Me ha preguntado dónde vivo.")],"Statement → decir que; yes/no → preguntar si; wh- → preguntar dónde…; request → pedir que + subj.","Relaciona cada mensaje con su transmisión.")],
8:[err("u08-err-001",8,"pluscuamperfecto",2,"Cuando llegamos, el tren ya *salió*.",["había salido"],"Earlier than another past event → pluscuamperfecto.","Cuando llegamos, el tren salió (just then)."),
   match("u08-match-001",8,"conectores-causa-consecuencia",2,[("Cancelaron el vuelo,","así que dormimos en el aeropuerto."),("Como ya conocíamos la ciudad,","no contratamos guía."),("El hotel estaba completo.","Por eso buscamos un apartamento."),("Ya que estás en Sevilla,","ve a ver el Alcázar.")],"así que / por eso = consequence; como / ya que = cause."),
   order("u08-ord-001",8,"past-combined",2,["Estaba haciendo fotos cuando me robaron la cartera","Cuando me robaron la cartera estaba haciendo fotos"],"Action in progress (estaba haciendo) + interrupting event (robaron).")],
9:[err("u09-err-001",9,"me-fascina-que",2,"Me molesta que mi compañero *pone* la música tan alta.",["ponga"],"Different subjects → que + subjunctive."),
   err("u09-err-002",9,"verbos-sentimiento",2,"Me *pone* muy nerviosa las colas del supermercado.",["ponen"],"poner nervioso agrees with what causes the feeling: las colas → ponen."),
   order("u09-ord-001",9,"me-fascina-que",2,["Me encanta que me escribas"],"me encanta que + subjunctive.")],
10:[err("u10-err-001",10,"relativas-ind-subj",2,"Busco una mochila que *es* impermeable.",["sea"],"Something you're looking for (unknown) → subjunctive.","Tengo una mochila que es impermeable."),
    err("u10-err-002",10,"superlativo-isimo",2,"La tarta estaba *ricísima*.",["riquísima"],"c → qu before i: rico → riquísimo."),
    match("u10-match-001",10,"relativas-preposicion",2,[("Es el cuchillo con","el que corto el pan."),("Esta es la caja en","la que guardo las fotos."),("Son las tijeras con","las que corto el papel."),("Es el material del","que está hecha la bolsa.")],"preposition + article + que; the article agrees with the noun.")],
11:[err("u11-err-001",11,"valorar-inf-subj",1,"Me parece fatal que los supermercados *tiran* tanta comida.",["tiren"],"Value judgment + que → subjunctive."),
    err("u11-err-002",11,"condicional",2,"Yo que tú, *hablaré* con el casero.",["hablaría"],"Advice with yo que tú → condicional."),
    order("u11-ord-001",11,"lo-neutro",2,["Lo que necesitamos es más transporte público"],"lo que + verb + es + what you emphasise.")],
12:[err("u12-err-001",12,"hipotesis-ind-subj",2,"Puede que *hay* una explicación científica.",["haya"],"puede que + subjunctive."),
    err("u12-err-002",12,"creer-creerse",1,"¿Tú crees *a* los extraterrestres?",["en"],"creer en = believe in."),
    order("u12-ord-001",12,"futuro-compuesto",2,["Se habrá quedado sin batería"],"Guess about the recent past → futuro compuesto.")],
0:[err("prog-err-001",0,"cual-vs-que",1,"¿*Qué* es tu número de teléfono?",["¿Cuál","Cuál"],"¿Cuál es…? for data (number, address)."),
   err("prog-err-002",0,"para-inf",2,"Te lo explico para que lo *entiendes*.",["entiendas"],"para que + subjunctive."),
   order("prog-ord-001",0,"sugerir-recomendar-quejarse-proponer",2,["Te recomiendo que vayas en tren"],"recomendar que + subjunctive."),
   match("prog-match-001",0,"que-subj-deseos",1,[("Tu amiga está enferma:","¡Que te mejores!"),("Antes de comer:","¡Que aproveche!"),("Mañana tienes un examen:","¡Que te vaya bien!"),("Es su cumpleaños:","¡Que cumplas muchos más!")],"¡Que + subjuntivo! for wishes in set situations.","¿Qué dices en cada situación?")],
}
for u,items in A.items():
    p='content/units/programa.json' if u==0 else f'content/units/u{u:02d}.json'
    d=json.load(open(p)); have={i['id'] for i in d['items']}
    d['items']+=[i for i in items if i['id'] not in have]
    json.dump(d,open(p,'w'),ensure_ascii=False,indent=1)
print('ok')
