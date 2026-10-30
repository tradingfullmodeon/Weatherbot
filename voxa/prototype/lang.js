// Idiomas de práctica de Talkride: en qué idioma habla y escribe la persona. Cada idioma trae su reconocimiento de voz,
// sus muletillas y atenuadores, los marcadores de estructura (PREP, STAR, BLUF, SBI) y las reglas de escritura.
// El español tiene además las reglas finas de shared.js y structure.js; los demás usan las listas de este archivo.
// Elegidos por demanda (los idiomas más estudiados y los mercados de habla y entrevistas) y porque el reconocimiento
// de voz de Chrome, Safari, iOS y Android los soporta bien.

export const PRACTICE_LANGS = [
  { id: 'es', label: 'Español (Latinoamérica)', name: 'español', speech: 'es-MX' },
  { id: 'en', label: 'English', name: 'inglés', speech: 'en-US' },
  { id: 'pt', label: 'Português (Brasil)', name: 'portugués de Brasil', speech: 'pt-BR' },
  { id: 'fr', label: 'Français', name: 'francés', speech: 'fr-FR' },
  { id: 'de', label: 'Deutsch', name: 'alemán', speech: 'de-DE' },
  { id: 'it', label: 'Italiano', name: 'italiano', speech: 'it-IT' },
];
export const langInfo = (id) => PRACTICE_LANGS.find(l => l.id === id) || PRACTICE_LANGS[0];

// Español latinoamericano: el reconocimiento usa el país del dispositivo cuando es de la región (mejor precisión con
// modismos locales); si no, México, la variante con más soporte. El código «es-419» no lo aceptan todos los motores.
const LATAM = ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'US', 'UY', 'VE'];

// Idioma de práctica guardado; los perfiles anteriores sólo tenían la variante de español («es-CL»).
export function practiceLangOf(profile = {}) {
  if (PRACTICE_LANGS.some(l => l.id === profile.lang)) return profile.lang;
  return 'es';
}

// Código para el reconocimiento de voz del idioma elegido, según el dispositivo.
export function speechLocaleFor(lang, deviceLangs = (typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [])) {
  const info = langInfo(lang);
  for (const d of deviceLangs || []) {
    const [l, region] = String(d || '').split('-');
    if (l?.toLowerCase() !== info.id || !region) continue;
    const r = region.toUpperCase();
    if (info.id === 'es' && !LATAM.includes(r)) continue;
    if (info.id === 'pt' && r !== 'BR') continue;
    return `${info.id}-${r}`;
  }
  return info.speech;
}

// ---------------------------------------------------------------- muletillas y atenuadores (fuera del español)
// Patrones (fuentes de RegExp). Las palabras que también son normales sólo cuentan junto a una pausa (coma).
const LANG_PAUSE = String.raw`(?=\s*[,.…?!]|\s*$)`;
export const FILLERS_BY_LANG = {
  en: ['u+m+', 'u+h+', 'e+r+m*', 'h?m{2,}', String.raw`like(?=\s*,)`, String.raw`(?<=,\s)like`, 'you know', 'i mean', 'basically', 'literally',
    String.raw`actually(?=\s*,)`, String.raw`(?<=(?:^|[.!?]\s*))so(?=\s*,)`, String.raw`(?<=(?:^|[.!?]\s*))well(?=\s*,)`, String.raw`right(?=\s*\?)`, 'kind of like', 'sort of like'],
  pt: ['é{2,}', 'a+h+n+', 'h?u+m+', String.raw`tipo(?=\s*,)`, 'tipo assim', String.raw`né${LANG_PAUSE}`, String.raw`(?<=(?:^|[.!?]\s*))então(?=\s*,)`,
    String.raw`assim(?=\s*,)`, String.raw`sabe(?=\s*[?,])`, 'basicamente', 'literalmente', 'meio que', String.raw`tá${LANG_PAUSE}`],
  fr: ['eu+h+', String.raw`(?<=(?:^|[.!?]\s*))(?:bah|ben)`, String.raw`genre(?=\s*,)`, 'en fait', 'du coup', String.raw`voilà${LANG_PAUSE}`, String.raw`quoi${LANG_PAUSE}`,
    'tu vois', String.raw`bref(?=\s*,)`, String.raw`(?<=(?:^|[.!?]\s*))enfin(?=\s*,)`, 'tu sais'],
  de: ['ä+h+m*', 'ö+h+m*', 'h?m{2,}', String.raw`(?<=(?:^|[.!?]\s*))also(?=\s*,)`, 'halt', 'quasi', 'sozusagen', 'irgendwie', String.raw`ne(?=\s*\?)`, 'weißt du',
    String.raw`(?<=(?:^|[.!?]\s*))naja`],
  it: ['e+h+m+', String.raw`e{2,}h*`, String.raw`cioè(?=\s*,)`, String.raw`tipo(?=\s*,)`, 'praticamente', 'diciamo', String.raw`insomma(?=\s*,)`,
    String.raw`(?<=(?:^|[.!?]\s*))allora(?=\s*,)`, String.raw`niente(?=\s*,)`, 'boh', String.raw`sai(?=\s*[?,])`],
};
export const HEDGES_BY_LANG = {
  en: ['i think', 'maybe', 'perhaps', 'kind of', 'sort of', 'a little bit', 'just wanted', 'i just wanted', 'i guess', 'sorry to bother',
    'not sure if', 'i was wondering if', "if it's not too much trouble", 'whenever you can', 'i feel like'],
  pt: ['acho que', 'talvez', 'um pouquinho', 'desculpa incomodar', 'desculpe incomodar', 'não sei se', 'mais ou menos', 'de certa forma',
    'só queria', 'quando puder', 'se não for incômodo', 'queria saber se'],
  fr: ['je pense que', 'peut-être', 'un peu', 'désolé de vous déranger', 'désolée de vous déranger', 'je ne sais pas si', 'plus ou moins',
    'en quelque sorte', 'je voulais juste', 'quand vous pourrez', 'je me demandais si', 'si ce n’est pas trop demander'],
  de: ['ich glaube', 'vielleicht', 'ein bisschen', 'eigentlich', 'sorry für die störung', 'ich weiß nicht ob', 'mehr oder weniger',
    'ich wollte nur', 'wenn du zeit hast', 'wenn sie zeit haben', 'ich wollte fragen ob'],
  it: ['penso che', 'credo che', 'forse', 'un pochino', 'scusa il disturbo', 'scusi il disturbo', 'non so se', 'più o meno', 'in qualche modo',
    'volevo solo', 'quando puoi', 'volevo sapere se'],
};
// Ejemplos para las etiquetas de los reportes.
export const FILLER_EXAMPLES = { es: '«este», «o sea»', en: '«um», «you know»', pt: '«tipo», «né»', fr: '«euh», «du coup»', de: '«äh», «halt»', it: '«ehm», «cioè»' };

// ---------------------------------------------------------------- marcadores de estructura (fuera del español)
export const STRUCTURE_BY_LANG = {
  en: {
    fillerStart: '(so|well|um+|uh+|like)', reason: "because|since|the reason|that's why|due to|so that",
    example: 'for example|for instance|once|last year|in my (job|role|experience|case)|when i', close: "in summary|that's why|in conclusion|to wrap up|bottom line|so that's",
    result: 'achieved|increased|reduced|grew|improved|saved|won|cut|resulted|went from|delivered|doubled|halved',
    situation: 'when|at my (job|company|previous|last)|in my (team|last role|previous role|internship)|during|last (year|semester)|in \\d{4}|once|at university|on a project',
    task: 'i had to|we had to|my (goal|task|role|responsibility) was|i was asked|the challenge was|the problem was',
    action: "i \\p{L}{2,}ed|i (led|built|made|wrote|ran|took|spoke|met|set|chose|found|began|drove|brought|gave|sent|did|proposed|created)", we: 'we \\p{L}{2,}ed|we (led|built|made|did)',
    ask: 'i propose|i need|i am asking|i recommend|i suggest|we decided|my proposal|can you|could you|could we|would you',
    impact: 'impact|affected|caused|led to|resulted in|which meant|that made', behavior: 'you said|you did|you sent|you arrived|you presented|you interrupted|you delivered|i noticed|i saw that',
    situationTime: 'yesterday|today|in the meeting|on monday|on tuesday|on wednesday|on thursday|on friday',
    stop: ['because', 'really', 'think', 'would', 'could', 'there', 'about', 'thanks', 'which'],
  },
  pt: {
    fillerStart: '(então|bom|tipo|ahn+|é{2,})', reason: 'porque|já que|a razão|por isso|devido a|uma vez que',
    example: 'por exemplo|uma vez|quando|no ano passado|no meu (trabalho|caso)', close: 'em resumo|por isso|em conclusão|para fechar|resumindo|então',
    result: 'consegui|conseguimos|aumentei|aumentamos|reduzi|reduzimos|melhorei|melhoramos|economizei|ganhei|resultado|passou de|cresceu|cresceram|dobrou',
    situation: 'quando|no meu (trabalho|emprego|time|último|estágio)|na (empresa|faculdade|universidade)|durante|no ano passado|em \\d{4}|num projeto|em um projeto',
    task: 'eu tinha que|tínhamos que|meu (objetivo|papel|desafio)|minha (tarefa|função)|me pediram|o desafio era|o problema era',
    action: '\\p{L}{3,}ei|fiz|disse|tive|pus|trouxe|soube|quis|pude|fui|dei|estive|propus', we: '\\p{L}{3,}(amos|emos|imos)',
    ask: 'proponho|preciso|peço|recomendo|sugiro|decidimos|minha proposta|você pode|podemos|poderia', impact: 'impacto|afetou|fez com que|causou|gerou|o resultado foi',
    behavior: 'você disse|você fez|você enviou|você chegou|você interrompeu|você entregou|percebi que|notei que',
    situationTime: 'ontem|hoje|na reunião|na segunda|na terça|na quarta|na quinta|na sexta',
    stop: ['porque', 'quando', 'também', 'quero', 'tenho', 'posso', 'estou', 'obrigado', 'obrigada'],
  },
  fr: {
    fillerStart: '(euh+|bon|ben|alors|bah)', reason: "parce que|puisque|la raison|c'est pourquoi|grâce à|car",
    example: "par exemple|une fois|quand|l'année dernière|dans mon (travail|poste|cas)", close: "en résumé|c'est pourquoi|en conclusion|pour conclure|bref|donc",
    result: "j'ai (réussi|augmenté|réduit|amélioré|gagné|économisé|obtenu)|nous avons (réussi|augmenté|réduit|amélioré)|résultat|est passé de|a augmenté|ont augmenté|a doublé",
    situation: "quand|lorsque|dans mon (travail|poste|équipe|ancien)|chez|pendant|l'année dernière|en \\d{4}|sur un projet|à l'université",
    task: "je devais|nous devions|mon (objectif|rôle|défi)|ma (mission|tâche)|on m'a demandé|le défi était|le problème était",
    action: "j'ai \\p{L}{3,}|je suis \\p{L}{3,}", we: 'nous avons \\p{L}{3,}|on a \\p{L}{3,}',
    ask: "je propose|j'ai besoin|je vous demande|je recommande|je suggère|nous avons décidé|ma proposition|pouvez-vous|pourriez-vous|peux-tu",
    impact: 'impact|a affecté|a fait que|a provoqué|a entraîné|le résultat a été', behavior: "tu as dit|vous avez dit|tu as fait|tu as envoyé|tu es arrivé|tu as interrompu|j'ai remarqué que|j'ai vu que",
    situationTime: 'hier|aujourd’hui|en réunion|lundi|mardi|mercredi|jeudi|vendredi',
    stop: ['parce', 'quand', 'aussi', 'merci', 'comme', 'alors', 'cette'],
  },
  de: {
    fillerStart: '(also|äh+m*|ja|naja)', reason: 'weil|da|der grund|deshalb|deswegen|aufgrund',
    example: 'zum beispiel|beispielsweise|einmal|als ich|letztes jahr|in meinem (job|team|fall)', close: 'zusammenfassend|deshalb|abschließend|kurz gesagt|fazit|unterm strich',
    result: 'erreicht|gesteigert|erhöht|reduziert|gesenkt|verbessert|gespart|gewonnen|ergebnis|verdoppelt|halbiert',
    situation: 'als|in meinem (job|team|letzten|früheren|praktikum)|bei meinem|während|letztes jahr|im jahr \\d{4}|in einem projekt|an der uni',
    task: 'ich musste|wir mussten|mein (ziel|auftrag)|meine (aufgabe|rolle)|ich sollte|die herausforderung war|das problem war',
    action: 'ich habe|ich (hatte|machte|führte|baute|schrieb|sprach|entschied|organisierte|schlug)', we: 'wir haben',
    ask: 'ich schlage vor|ich brauche|ich bitte|ich empfehle|wir haben entschieden|mein vorschlag|kannst du|können sie|könnten wir',
    impact: 'auswirkung|hat dazu geführt|führte dazu|hat bewirkt|das ergebnis war', behavior: 'du hast gesagt|sie haben gesagt|du hast|du bist zu spät|mir ist aufgefallen|ich habe bemerkt',
    situationTime: 'gestern|heute|im meeting|am montag|am dienstag|am mittwoch|am donnerstag|am freitag',
    stop: ['weil', 'wirklich', 'denke', 'würde', 'könnte', 'danke', 'haben'],
  },
  it: {
    fillerStart: '(allora|ehm+|eh+|cioè|dunque)', reason: 'perché|poiché|il motivo|per questo|dato che|grazie a',
    example: "per esempio|ad esempio|una volta|quando|l'anno scorso|nel mio (lavoro|caso)", close: 'in sintesi|per questo|in conclusione|per chiudere|insomma|quindi',
    result: 'ho (ottenuto|aumentato|ridotto|migliorato|risparmiato|vinto)|abbiamo (ottenuto|aumentato|ridotto|migliorato)|risultato|è passato da|sono aumentat\\p{L}|raddoppiato',
    situation: "quando|nel mio (lavoro|team|precedente|tirocinio)|in azienda|durante|l'anno scorso|nel \\d{4}|in un progetto|all'università",
    task: 'dovevo|dovevamo|il mio (obiettivo|ruolo|compito)|mi hanno chiesto|la sfida era|il problema era',
    action: 'ho \\p{L}{3,}|sono \\p{L}{3,}(ato|ata)', we: 'abbiamo \\p{L}{3,}',
    ask: 'propongo|ho bisogno|ti chiedo|vi chiedo|raccomando|suggerisco|abbiamo deciso|la mia proposta|puoi|potresti|possiamo',
    impact: 'impatto|ha causato|ha fatto sì che|ha portato a|il risultato è stato', behavior: 'hai detto|hai fatto|hai inviato|sei arrivato|hai interrotto|ho notato che|ho visto che',
    situationTime: 'ieri|oggi|in riunione|lunedì|martedì|mercoledì|giovedì|venerdì',
    stop: ['perché', 'quando', 'anche', 'voglio', 'grazie', 'questo', 'questa'],
  },
};

// ---------------------------------------------------------------- escritura (fuera del español)
export const WRITING_BY_LANG = {
  en: {
    ask: "\\?|\\b(can you|could you|would you|i need|we need|please|i'm asking|i request|i'd appreciate|let me know|confirm|send|i propose)\\b",
    indirect: "\\b(could|would it be possible|i was wondering if|i wanted to (see|ask|know) if|i'd like to (know|ask))\\b",
    apology: "\\b(sorry to bother( you)?|sorry for the (bother|trouble)|i hate to bother you|not sure if (this|it) is possible)\\b",
    vague: "^(hi[,!.]?\\s*)?(do you have a (minute|second)\\??|hope you('re| are) (well|doing well)[.!]?|hope this finds you well[.!]?)\\s*$",
    deadline: '\\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|this week|next week|by|before|deadline|due|eod|\\d{1,2}(:\\d{2})?\\s?(am|pm|h)|\\d{1,2}\\/\\d{1,2}|(january|february|march|april|may|june|july|august|september|october|november|december) \\d{1,2})\\b',
    vowels: 'aeiouy', read: (asl, asw) => 206.835 - 1.015 * asl - 84.6 * asw,    // Flesch Reading Ease
  },
  pt: {
    ask: '\\?|\\b(você pode|pode|poderia|preciso|precisamos|por favor|peço|solicito|agradeceria|me confirma|confirme|envie|proponho)\\b',
    indirect: '\\b(poderia|seria possível|queria (saber|ver|perguntar) se|gostaria de (saber|pedir))\\b',
    apology: '\\b(desculpa(e)? (incomodar|o incômodo)|perdão pelo incômodo|não sei se é possível)\\b',
    vague: '^(oi|olá)?[,!.]?\\s*(tem um minuto\\??|tem um minutinho\\??|espero que esteja bem[.!]?)\\s*$',
    deadline: '\\b(hoje|amanhã|segunda|terça|quarta|quinta|sexta|sábado|domingo|esta semana|próxima semana|até|antes de|prazo|data|\\d{1,2}(:\\d{2})?\\s?h|\\d{1,2}\\/\\d{1,2}|\\d{1,2} de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro))\\b',
    vowels: 'aeiouáéíóúâêôãõà', read: (asl, asw) => 248.835 - 1.015 * asl - 84.6 * asw,   // Flesch adaptado (Martins et al.)
  },
  fr: {
    ask: "\\?|\\b(pouvez-vous|pourriez-vous|peux-tu|pourrais-tu|j'ai besoin|nous avons besoin|merci de|s'il vous plaît|s'il te plaît|je vous demande|confirmez|envoyez|je propose)\\b",
    indirect: "\\b(serait-il possible|je voulais (savoir|voir|demander) si|j'aimerais (savoir|demander))\\b",
    apology: '\\b(désolée? de (vous|te) déranger|pardon pour le dérangement|je ne sais pas si c.est possible)\\b',
    vague: "^(bonjour|salut)?[,!.]?\\s*(tu as une minute\\s?\\??|vous avez une minute\\s?\\??|j'espère que (tu vas|vous allez) bien[.!]?)\\s*$",
    deadline: "\\b(aujourd'hui|demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|cette semaine|la semaine prochaine|avant|d'ici|date limite|échéance|\\d{1,2}\\s?h(\\d{2})?|\\d{1,2}\\/\\d{1,2}|\\d{1,2} (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))\\b",
    vowels: 'aeiouyàâéèêëîïôûùü', read: (asl, asw) => 207 - 1.015 * asl - 73.6 * asw,   // Kandel y Moles
  },
  de: {
    ask: '\\?|\\b(kannst du|können sie|könnten sie|könntest du|ich brauche|wir brauchen|bitte|ich bitte|ich wäre dankbar|bestätige|schick|ich schlage vor)\\b',
    indirect: '\\b(wäre es möglich|ich wollte (fragen|wissen) ob|ich würde gern (wissen|fragen))\\b',
    apology: '\\b(entschuldige(n sie)? die störung|sorry für die störung|ich weiß nicht ob das möglich ist)\\b',
    vague: '^(hallo|hi)?[,!.]?\\s*(hast du (kurz )?(eine minute|zeit)\\??|haben sie (kurz )?(eine minute|zeit)\\??|ich hoffe, (es geht dir|es geht ihnen) gut[.!]?)\\s*$',
    deadline: '\\b(heute|morgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|diese woche|nächste woche|bis|vor|frist|termin|deadline|\\d{1,2}(:\\d{2})?\\s?uhr|\\d{1,2}\\.\\d{1,2}\\.)\\b',
    vowels: 'aeiouyäöü', read: (asl, asw) => 180 - asl - 58.5 * asw,   // Amstad
  },
  it: {
    ask: '\\?|\\b(puoi|potresti|può|potrebbe|ho bisogno|abbiamo bisogno|per favore|ti chiedo|le chiedo|ti sarei grato|confermi|invia|propongo)\\b',
    indirect: '\\b(sarebbe possibile|volevo (sapere|vedere|chiedere) se|vorrei (sapere|chiedere))\\b',
    apology: '\\b(scusa(mi)? il disturbo|scusi il disturbo|non so se è possibile)\\b',
    vague: '^(ciao|salve)?[,!.]?\\s*(hai un minuto\\??|ha un minuto\\??|spero (tu stia|che tu stia|stia) bene[.!]?)\\s*$',
    deadline: '\\b(oggi|domani|lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica|questa settimana|la prossima settimana|entro|prima di|scadenza|\\d{1,2}:\\d{2}|\\d{1,2}\\/\\d{1,2}|\\d{1,2} (gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre))\\b',
    vowels: 'aeiouàèéìòù', read: (asl, asw) => 217 - 1.3 * asl - 60 * asw,   // Flesch-Vacca
  },
};

// Frases de ejemplo para los consejos de estructura, en el idioma de práctica (la explicación queda en español).
export const STRUCTURE_EXAMPLES = {
  es: { fillers: '«bueno» ni «este»', reason: '«porque…», «la razón es…»', close: '«por eso…»', situation: '«En mi trabajo anterior, cuando…» o «En un proyecto de la universidad, cuando…»',
    task: '«Tenía que…», «Mi objetivo era…»', action: '«Armé», «Propuse», «Hablé con…»', result: '«Las ventas subieron un 30%»', when: '«En la reunión del lunes…»',
    behavior: '«Interrumpiste dos veces», no «eres irrespetuoso»', impact: '«Eso hizo que el cliente no pudiera terminar»' },
  en: { fillers: '«so» or «um»', reason: '«because…», «the reason is…»', close: '«that’s why…»', situation: '«In my last job, when…» or «On a university project, when…»',
    task: '«I had to…», «My goal was…»', action: '«I built», «I proposed», «I spoke with…»', result: '«Sales grew 30%»', when: '«In Monday’s meeting…»',
    behavior: '«You interrupted twice», not «you are rude»', impact: '«That meant the client couldn’t finish»' },
  pt: { fillers: '«então» ou «tipo»', reason: '«porque…», «a razão é…»', close: '«por isso…»', situation: '«No meu último emprego, quando…» ou «Num projeto da faculdade, quando…»',
    task: '«Eu tinha que…», «Meu objetivo era…»', action: '«Criei», «Propus», «Falei com…»', result: '«As vendas cresceram 30%»', when: '«Na reunião de segunda…»',
    behavior: '«Você interrompeu duas vezes», não «você é grosseiro»', impact: '«Isso fez com que o cliente não terminasse»' },
  fr: { fillers: '«euh» ou «bon»', reason: '«parce que…», «la raison est…»', close: '«c’est pourquoi…»', situation: '«Dans mon ancien poste, quand…» ou «Sur un projet à l’université, quand…»',
    task: '«Je devais…», «Mon objectif était…»', action: '«J’ai créé», «J’ai proposé», «J’ai parlé avec…»', result: '«Les ventes ont augmenté de 30 %»', when: '«À la réunion de lundi…»',
    behavior: '«Tu as interrompu deux fois», pas «tu es impoli»', impact: '«Le client n’a pas pu terminer»' },
  de: { fillers: '«also» oder «äh»', reason: '«weil…», «der Grund ist…»', close: '«deshalb…»', situation: '«In meinem letzten Job, als…» oder «In einem Uni-Projekt, als…»',
    task: '«Ich musste…», «Mein Ziel war…»', action: '«Ich habe aufgebaut», «Ich habe vorgeschlagen», «Ich habe mit … gesprochen»', result: '«Der Umsatz stieg um 30 %»',
    when: '«Im Meeting am Montag…»', behavior: '«Du hast zweimal unterbrochen», nicht «du bist unhöflich»', impact: '«Dadurch konnte der Kunde nicht fertig werden»' },
  it: { fillers: '«allora» o «ehm»', reason: '«perché…», «il motivo è…»', close: '«per questo…»', situation: '«Nel mio lavoro precedente, quando…» o «In un progetto all’università, quando…»',
    task: '«Dovevo…», «Il mio obiettivo era…»', action: '«Ho creato», «Ho proposto», «Ho parlato con…»', result: '«Le vendite sono aumentate del 30%»', when: '«Nella riunione di lunedì…»',
    behavior: '«Hai interrotto due volte», non «sei maleducato»', impact: '«Il cliente non ha potuto finire»' },
};
