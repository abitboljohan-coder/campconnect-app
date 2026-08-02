import { useSyncExternalStore } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Internationalisation — FR (défaut) · EN · ES · NL
//
// La langue est détectée depuis le téléphone au premier lancement, puis
// mémorisée si le vacancier la change (écran Profil).
//
// Usage :   import { t } from '../i18n'
//           t('groupes.creer')                    → "Créer un groupe"
//           t('groupes.membres', { n: 3 })        → "3 membres"
// ─────────────────────────────────────────────────────────────────────────────

export const LANGUES = [
  { code: 'fr', label: 'Français',  drapeau: '🇫🇷' },
  { code: 'en', label: 'English',   drapeau: '🇬🇧' },
  { code: 'es', label: 'Español',   drapeau: '🇪🇸' },
  { code: 'nl', label: 'Nederlands', drapeau: '🇳🇱' },
]

const STRINGS = {
  // ── Navigation ──────────────────────────────────────────────────────────
  'nav.accueil':  { fr: 'Accueil',  en: 'Home',    es: 'Inicio',   nl: 'Start' },
  'nav.groupes':  { fr: 'Groupes',  en: 'Groups',  es: 'Grupos',   nl: 'Groepen' },
  'nav.carte':    { fr: 'Carte',    en: 'Map',     es: 'Mapa',     nl: 'Kaart' },
  'nav.agenda':   { fr: 'Agenda',   en: 'Events',  es: 'Agenda',   nl: 'Agenda' },
  'nav.infos':    { fr: 'Infos',    en: 'Info',    es: 'Info',     nl: 'Info' },
  'nav.profil':   { fr: 'Profil',   en: 'Profile', es: 'Perfil',   nl: 'Profiel' },

  // ── Commun ──────────────────────────────────────────────────────────────
  'commun.annuler':     { fr: 'Annuler',     en: 'Cancel',     es: 'Cancelar',  nl: 'Annuleren' },
  'commun.enregistrer': { fr: 'Enregistrer', en: 'Save',       es: 'Guardar',   nl: 'Opslaan' },
  'commun.modifier':    { fr: 'Modifier',    en: 'Edit',       es: 'Editar',    nl: 'Wijzigen' },
  'commun.fermer':      { fr: 'Fermer',      en: 'Close',      es: 'Cerrar',    nl: 'Sluiten' },
  'commun.chargement':  { fr: 'Chargement…',  en: 'Loading…',   es: 'Cargando…', nl: 'Laden…' },
  'commun.erreur':      { fr: 'Une erreur est survenue. Réessayez.', en: 'Something went wrong. Please try again.', es: 'Se produjo un error. Inténtalo de nuevo.', nl: 'Er is iets misgegaan. Probeer opnieuw.' },
  'commun.reseau':      { fr: 'Vérifiez votre connexion.', en: 'Check your connection.', es: 'Comprueba tu conexión.', nl: 'Controleer je verbinding.' },
  'commun.places':      { fr: '{n} places',   en: '{n} spots',  es: '{n} plazas', nl: '{n} plaatsen' },
  'commun.membres':     { fr: '{n} membres',  en: '{n} members', es: '{n} miembros', nl: '{n} leden' },
  'commun.membre':      { fr: '{n} membre',   en: '{n} member', es: '{n} miembro', nl: '{n} lid' },
  'commun.complet':     { fr: 'Complet',      en: 'Full',       es: 'Completo',  nl: 'Vol' },
  'commun.maintenant':  { fr: "à l'instant",  en: 'just now',   es: 'ahora mismo', nl: 'zojuist' },
  'commun.ilya_min':    { fr: 'il y a {n} min', en: '{n} min ago', es: 'hace {n} min', nl: '{n} min geleden' },
  'commun.ilya_h':      { fr: 'il y a {n}h',  en: '{n}h ago',   es: 'hace {n}h', nl: '{n}u geleden' },

  // ── Accueil ─────────────────────────────────────────────────────────────
  'accueil.bonjour':      { fr: 'Bonjour',     en: 'Good morning', es: 'Buenos días', nl: 'Goedemorgen' },
  'accueil.bonapresmidi': { fr: 'Bon après-midi', en: 'Good afternoon', es: 'Buenas tardes', nl: 'Goedemiddag' },
  'accueil.bonsoiree':    { fr: 'Bonne soirée', en: 'Good evening', es: 'Buenas noches', nl: 'Goedenavond' },
  'accueil.vacanciers_ici': { fr: '{n} vacanciers ici', en: '{n} campers here', es: '{n} campistas aquí', nl: '{n} kampeerders hier' },
  'accueil.groupes_actifs': { fr: '{n} groupes actifs', en: '{n} active groups', es: '{n} grupos activos', nl: '{n} actieve groepen' },
  'accueil.animations_venir': { fr: '{n} animations à venir', en: '{n} upcoming events', es: '{n} próximas actividades', nl: '{n} komende activiteiten' },
  'accueil.explorer_carte': { fr: 'Explorer la carte', en: 'Explore the map', es: 'Explorar el mapa', nl: 'Kaart verkennen' },
  'accueil.programme':    { fr: 'Programme',   en: 'Programme',  es: 'Programa',  nl: 'Programma' },
  'accueil.quoi_de_neuf': { fr: 'Quoi de neuf ?', en: "What's new?", es: '¿Qué hay de nuevo?', nl: 'Wat is er nieuw?' },
  'accueil.groupes_maintenant': { fr: 'Groupes actifs maintenant', en: 'Active groups right now', es: 'Grupos activos ahora', nl: 'Nu actieve groepen' },
  'accueil.voir_tout':    { fr: 'Voir tout',   en: 'See all',    es: 'Ver todo',  nl: 'Alles bekijken' },
  'accueil.publier_statut': { fr: 'Publier',   en: 'Post',       es: 'Publicar',  nl: 'Plaatsen' },
  'accueil.statut_place':  { fr: 'Partagez quelque chose…', en: 'Share something…', es: 'Comparte algo…', nl: 'Deel iets…' },

  'accueil.mot_vacanciers': { fr: 'vacanciers ici', en: 'campers here', es: 'campistas aquí', nl: 'kampeerders hier' },
  'accueil.mot_groupes':    { fr: 'groupes actifs', en: 'active groups', es: 'grupos activos', nl: 'actieve groepen' },
  'accueil.mot_animations': { fr: 'animations à venir', en: 'upcoming events', es: 'próximas actividades', nl: 'komende activiteiten' },

  'accueil.aucun_groupe':  { fr: "Aucun groupe actif pour l'instant.", en: 'No active groups right now.', es: 'No hay grupos activos ahora.', nl: 'Nu geen actieve groepen.' },
  'accueil.premier_creer': { fr: 'Soyez le premier à en créer un !', en: 'Be the first to create one!', es: '¡Sé el primero en crear uno!', nl: 'Wees de eerste die er een aanmaakt!' },
  'accueil.creer_groupe':  { fr: '+ Créer un groupe', en: '+ Create a group', es: '+ Crear un grupo', nl: '+ Groep aanmaken' },
  'accueil.visible24':     { fr: '(visible 24h)', en: '(visible for 24h)', es: '(visible 24h)', nl: '(24u zichtbaar)' },

  'accueil.err_statut': { fr: 'Impossible de publier votre statut pour le moment.', en: "Couldn't post your update right now.", es: 'No se pudo publicar tu estado ahora.', nl: 'Kon je update nu niet plaatsen.' },

  'accueil.en_ligne': { fr: 'en ligne', en: 'online', es: 'en línea', nl: 'online' },

  // ── Groupes ─────────────────────────────────────────────────────────────
  'groupes.mes_groupes':   { fr: 'Mes groupes', en: 'My groups', es: 'Mis grupos', nl: 'Mijn groepen' },
  'groupes.autres':        { fr: 'Autres groupes', en: 'Other groups', es: 'Otros grupos', nl: 'Andere groepen' },
  'groupes.tous':          { fr: 'Tous les groupes', en: 'All groups', es: 'Todos los grupos', nl: 'Alle groepen' },
  'groupes.aucun':         { fr: 'Aucun groupe pour ce camping. Soyez le premier !', en: 'No groups yet at this campsite. Be the first!', es: '¡Aún no hay grupos en este camping. Sé el primero!', nl: 'Nog geen groepen op deze camping. Wees de eerste!' },
  'groupes.tous_rejoints': { fr: 'Vous êtes dans tous les groupes disponibles 🎉', en: "You've joined every available group 🎉", es: 'Ya estás en todos los grupos disponibles 🎉', nl: 'Je zit in alle beschikbare groepen 🎉' },
  'groupes.creer':         { fr: 'Créer un groupe', en: 'Create a group', es: 'Crear un grupo', nl: 'Groep aanmaken' },
  'groupes.creer_btn':     { fr: 'Créer le groupe', en: 'Create group', es: 'Crear grupo', nl: 'Groep aanmaken' },
  'groupes.creation':      { fr: 'Création…', en: 'Creating…', es: 'Creando…', nl: 'Aanmaken…' },
  'groupes.titre':         { fr: 'TITRE DU GROUPE *', en: 'GROUP NAME *', es: 'NOMBRE DEL GRUPO *', nl: 'GROEPSNAAM *' },
  'groupes.titre_place':   { fr: 'ex : Randonnée du matin', en: 'e.g. Morning hike', es: 'ej.: Excursión matinal', nl: 'bijv. Ochtendwandeling' },
  'groupes.lieu':          { fr: 'LIEU', en: 'PLACE', es: 'LUGAR', nl: 'PLAATS' },
  'groupes.lieu_place':    { fr: 'ex : Piscine', en: 'e.g. Pool', es: 'ej.: Piscina', nl: 'bijv. Zwembad' },
  'groupes.heure':         { fr: 'HEURE', en: 'TIME', es: 'HORA', nl: 'TIJD' },
  'groupes.max':           { fr: 'NB MAX MEMBRES', en: 'MAX MEMBERS', es: 'MÁX. MIEMBROS', nl: 'MAX. LEDEN' },
  'groupes.emoji':         { fr: 'EMOJI', en: 'EMOJI', es: 'EMOJI', nl: 'EMOJI' },
  'groupes.rejoindre':     { fr: 'Rejoindre', en: 'Join', es: 'Unirse', nl: 'Deelnemen' },
  'groupes.ouvrir':        { fr: 'Ouvrir', en: 'Open', es: 'Abrir', nl: 'Openen' },
  'groupes.ouvrir_chat':   { fr: '💬 Ouvrir le chat', en: '💬 Open chat', es: '💬 Abrir chat', nl: '💬 Chat openen' },
  'groupes.err_creation':  { fr: 'Impossible de créer le groupe. Réessayez dans un instant.', en: "Couldn't create the group. Please try again shortly.", es: 'No se pudo crear el grupo. Inténtalo de nuevo.', nl: 'Kon de groep niet aanmaken. Probeer het zo nog eens.' },
  'groupes.err_rejoindre': { fr: 'Impossible de rejoindre le groupe pour le moment.', en: "Can't join this group right now.", es: 'No se puede unir al grupo en este momento.', nl: 'Kan nu niet deelnemen aan deze groep.' },

  // ── Chat ────────────────────────────────────────────────────────────────
  'chat.ecrire':      { fr: 'Écrire un message…', en: 'Write a message…', es: 'Escribe un mensaje…', nl: 'Schrijf een bericht…' },
  'chat.non_envoye':  { fr: 'Message non envoyé. Vérifiez votre connexion.', en: 'Message not sent. Check your connection.', es: 'Mensaje no enviado. Comprueba tu conexión.', nl: 'Bericht niet verzonden. Controleer je verbinding.' },
  'chat.aujourdhui':  { fr: "Aujourd'hui", en: 'Today', es: 'Hoy', nl: 'Vandaag' },
  'chat.hier':        { fr: 'Hier', en: 'Yesterday', es: 'Ayer', nl: 'Gisteren' },
  'chat.parti':       { fr: 'Vacancier parti', en: 'Camper has left', es: 'Campista que se fue', nl: 'Vertrokken kampeerder' },

  // ── Agenda ──────────────────────────────────────────────────────────────
  'agenda.titre':       { fr: 'Agenda', en: 'Events', es: 'Agenda', nl: 'Agenda' },
  'agenda.tout':        { fr: 'Tout', en: 'All', es: 'Todo', nl: 'Alles' },
  'agenda.mes_inscr':   { fr: 'Mes inscrip.', en: 'My bookings', es: 'Mis inscrip.', nl: 'Mijn inschr.' },
  'agenda.matin':       { fr: 'CE MATIN', en: 'THIS MORNING', es: 'ESTA MAÑANA', nl: 'VANOCHTEND' },
  'agenda.apresmidi':   { fr: 'CET APRÈS-MIDI', en: 'THIS AFTERNOON', es: 'ESTA TARDE', nl: 'VANMIDDAG' },
  'agenda.soir':        { fr: 'CE SOIR', en: 'TONIGHT', es: 'ESTA NOCHE', nl: 'VANAVOND' },
  'agenda.inscrire':    { fr: "S'inscrire", en: 'Sign up', es: 'Apuntarse', nl: 'Inschrijven' },
  'agenda.inscrit':     { fr: '✓ Inscrit', en: '✓ Booked', es: '✓ Apuntado', nl: '✓ Ingeschreven' },
  'agenda.desinscrire': { fr: '✓ Inscrit — Se désinscrire', en: '✓ Booked — Cancel', es: '✓ Apuntado — Cancelar', nl: '✓ Ingeschreven — Afmelden' },
  'agenda.aucune':      { fr: 'Aucune animation prévue pour le moment.', en: 'No events scheduled yet.', es: 'No hay actividades programadas.', nl: 'Nog geen activiteiten gepland.' },
  'agenda.err_inscr':   { fr: 'Impossible de vous inscrire pour le moment.', en: "Can't sign you up right now.", es: 'No se puede inscribir en este momento.', nl: 'Inschrijven lukt nu niet.' },
  'agenda.err_desinscr':{ fr: 'Impossible de vous désinscrire pour le moment.', en: "Can't cancel right now.", es: 'No se puede cancelar en este momento.', nl: 'Afmelden lukt nu niet.' },

  'agenda.aucune_mine': { fr: "Vous n'êtes inscrit à aucune animation.", en: "You haven't signed up for any event.", es: 'No estás apuntado a ninguna actividad.', nl: 'Je bent voor geen enkele activiteit ingeschreven.' },
  'agenda.places_mot':  { fr: 'places', en: 'spots', es: 'plazas', nl: 'plaatsen' },
  'agenda.demain':      { fr: 'Demain', en: 'Tomorrow', es: 'Mañana', nl: 'Morgen' },
  'agenda.slot_matin':  { fr: 'Ce matin', en: 'This morning', es: 'Esta mañana', nl: 'Vanochtend' },
  'agenda.slot_apresmidi': { fr: 'Cet après-midi', en: 'This afternoon', es: 'Esta tarde', nl: 'Vanmiddag' },
  'agenda.slot_soir':   { fr: 'Ce soir', en: 'Tonight', es: 'Esta noche', nl: 'Vanavond' },
  'agenda.slot_nuit':   { fr: 'Cette nuit', en: 'Tonight (late)', es: 'Esta madrugada', nl: 'Vannacht' },
  'chat.aucun_msg':     { fr: "Aucun message pour l'instant.", en: 'No messages yet.', es: 'Aún no hay mensajes.', nl: 'Nog geen berichten.' },
  'chat.premier':       { fr: 'Soyez le premier à écrire ! 👋', en: 'Be the first to write! 👋', es: '¡Sé el primero en escribir! 👋', nl: 'Wees de eerste die schrijft! 👋' },
  'chat.participants':  { fr: '{n} participants', en: '{n} participants', es: '{n} participantes', nl: '{n} deelnemers' },
  'chat.participant':   { fr: '{n} participant', en: '{n} participant', es: '{n} participante', nl: '{n} deelnemer' },

  // ── Carte ───────────────────────────────────────────────────────────────
  'carte.ou_aller':     { fr: 'Où aller ?', en: 'Where to?', es: '¿A dónde?', nl: 'Waarheen?' },
  'carte.vous':         { fr: 'Vous', en: 'You', es: 'Tú', nl: 'Jij' },
  'carte.animations':   { fr: 'Animations', en: 'Events', es: 'Actividades', nl: 'Activiteiten' },
  'carte.groupes':      { fr: 'Groupes', en: 'Groups', es: 'Grupos', nl: 'Groepen' },
  'carte.guider':       { fr: "🧭 M'y guider", en: '🧭 Guide me there', es: '🧭 Guíame allí', nl: '🧭 Breng me erheen' },
  'carte.arrive':       { fr: 'Vous y êtes ! 🎉', en: "You've arrived! 🎉", es: '¡Has llegado! 🎉', nl: 'Je bent er! 🎉' },
  'carte.tout_droit':   { fr: '{d} · tout droit dans le sens de la flèche', en: '{d} · straight on, follow the arrow', es: '{d} · recto, sigue la flecha', nl: '{d} · rechtdoor, volg de pijl' },
  'carte.hors_site':    { fr: 'Vous n\'êtes pas encore sur le camping', en: 'You are not at the campsite yet', es: 'Todavía no estás en el camping', nl: 'Je bent nog niet op de camping' },
  'carte.guidage_sur_place': { fr: 'Le guidage démarrera à votre arrivée', en: 'Guidance starts once you arrive', es: 'La guía empezará al llegar', nl: 'De navigatie start bij aankomst' },
  'carte.activez_pos':  { fr: 'Activez votre position pour être guidé vers « {lieu} »', en: 'Turn on location to be guided to "{lieu}"', es: 'Activa tu ubicación para ir hacia «{lieu}»', nl: 'Zet locatie aan om naar "{lieu}" te navigeren' },
  'carte.satellite':    { fr: 'Satellite', en: 'Satellite', es: 'Satélite', nl: 'Satelliet' },
  'carte.plan':         { fr: 'Plan', en: 'Plan', es: 'Plano', nl: 'Plattegrond' },

  'carte.rejoindre_grp': { fr: 'Rejoindre le groupe', en: 'Join the group', es: 'Unirse al grupo', nl: 'Deelnemen aan groep' },

  // ── Infos ───────────────────────────────────────────────────────────────
  'infos.titre':   { fr: 'Infos pratiques', en: 'Practical info', es: 'Información práctica', nl: 'Praktische info' },
  'infos.aucune':  { fr: 'Aucune information pour le moment.', en: 'No information yet.', es: 'Aún no hay información.', nl: 'Nog geen informatie.' },

  'infos.livret':  { fr: "Livret d'accueil", en: 'Welcome guide', es: 'Guía de bienvenida', nl: 'Welkomstgids' },
  'infos.utiles':  { fr: 'Infos utiles', en: 'Useful info', es: 'Información útil', nl: 'Nuttige info' },
  'infos.tout_sur':{ fr: "Tout ce qu'il faut savoir sur {camping}", en: 'Everything you need to know about {camping}', es: 'Todo lo que necesitas saber sobre {camping}', nl: 'Alles wat je moet weten over {camping}' },

  'carte.pincez':   { fr: 'Pincez pour zoomer', en: 'Pinch to zoom', es: 'Pellizca para ampliar', nl: 'Knijp om te zoomen' },
  'infos.question': { fr: 'Une question ?', en: 'A question?', es: '¿Una pregunta?', nl: 'Een vraag?' },

  // ── Profil ──────────────────────────────────────────────────────────────
  'profil.mes_infos':    { fr: 'Mes informations', en: 'My details', es: 'Mis datos', nl: 'Mijn gegevens' },
  'profil.pseudo':       { fr: 'Pseudo', en: 'Nickname', es: 'Apodo', nl: 'Bijnaam' },
  'profil.emplacement':  { fr: 'Emplacement', en: 'Pitch', es: 'Parcela', nl: 'Standplaats' },
  'profil.tranche_age':  { fr: "Tranche d'âge", en: 'Age range', es: 'Rango de edad', nl: 'Leeftijdsgroep' },
  'profil.avec':         { fr: 'Je voyage', en: 'I travel', es: 'Viajo', nl: 'Ik reis' },
  'profil.interets':     { fr: 'Centres d\'intérêt', en: 'Interests', es: 'Intereses', nl: 'Interesses' },
  'profil.depart':       { fr: 'Date de départ', en: 'Departure date', es: 'Fecha de salida', nl: 'Vertrekdatum' },
  'profil.langue':       { fr: 'Langue', en: 'Language', es: 'Idioma', nl: 'Taal' },
  'profil.deconnexion':  { fr: 'Se déconnecter', en: 'Log out', es: 'Cerrar sesión', nl: 'Uitloggen' },
  'profil.enregistre':   { fr: 'Profil enregistré ✓', en: 'Profile saved ✓', es: 'Perfil guardado ✓', nl: 'Profiel opgeslagen ✓' },
  'profil.err_save':     { fr: "Impossible d'enregistrer votre profil pour le moment.", en: "Couldn't save your profile right now.", es: 'No se pudo guardar tu perfil ahora.', nl: 'Kon je profiel nu niet opslaan.' },

  // ── Onboarding ──────────────────────────────────────────────────────────
  'onb.rechercher':   { fr: 'Recherchez votre camping pour commencer', en: 'Search for your campsite to get started', es: 'Busca tu camping para empezar', nl: 'Zoek je camping om te beginnen' },
  'onb.recherche_ph': { fr: 'Nom de votre camping…', en: 'Your campsite name…', es: 'Nombre de tu camping…', nl: 'Naam van je camping…' },
  'onb.bienvenue':    { fr: 'Bienvenue', en: 'Welcome', es: 'Bienvenido', nl: 'Welkom' },
  'onb.pseudo_ph':    { fr: 'Votre pseudo', en: 'Your nickname', es: 'Tu apodo', nl: 'Je bijnaam' },
  'onb.commencer':    { fr: "C'est parti !", en: "Let's go!", es: '¡Vamos!', nl: 'Aan de slag!' },
  'onb.code_erreur':  { fr: 'Code incorrect. Demandez le code du jour à la réception.', en: 'Wrong code. Ask reception for today\'s code.', es: 'Código incorrecto. Pide el código de hoy en recepción.', nl: 'Onjuiste code. Vraag de code van vandaag bij de receptie.' },
  'onb.pseudo_oblig': { fr: 'Le pseudo est obligatoire.', en: 'A nickname is required.', es: 'El apodo es obligatorio.', nl: 'Een bijnaam is verplicht.' },
  'onb.gerant':       { fr: 'Je suis gérant de camping', en: "I'm a campsite manager", es: 'Soy gerente de camping', nl: 'Ik ben campingbeheerder' },

  'onb.votre_camping': { fr: 'VOTRE CAMPING', en: 'YOUR CAMPSITE', es: 'TU CAMPING', nl: 'JOUW CAMPING' },
  'onb.appuyer':       { fr: 'Appuyer pour rejoindre', en: 'Tap to join', es: 'Toca para unirte', nl: 'Tik om deel te nemen' },
  'onb.enregistrement':{ fr: 'Enregistrement…', en: 'Saving…', es: 'Guardando…', nl: 'Opslaan…' },
  'onb.cest_parti':    { fr: "C'est parti ! 🌿", en: "Let's go! 🌿", es: '¡Vamos! 🌿', nl: 'Aan de slag! 🌿' },

  // ── Météo ───────────────────────────────────────────────────────────────
  'meteo.ciel_clair':  { fr: 'Ciel dégagé', en: 'Clear sky', es: 'Cielo despejado', nl: 'Heldere hemel' },
  'meteo.peu_nuageux': { fr: 'Peu nuageux', en: 'Mostly sunny', es: 'Poco nuboso', nl: 'Licht bewolkt' },
  'meteo.nuageux':     { fr: 'Nuageux', en: 'Cloudy', es: 'Nuboso', nl: 'Bewolkt' },
  'meteo.couvert':     { fr: 'Couvert', en: 'Overcast', es: 'Cubierto', nl: 'Zwaar bewolkt' },
  'meteo.brouillard':  { fr: 'Brouillard', en: 'Fog', es: 'Niebla', nl: 'Mist' },
  'meteo.bruine':      { fr: 'Bruine', en: 'Drizzle', es: 'Llovizna', nl: 'Motregen' },
  'meteo.pluie':       { fr: 'Pluie', en: 'Rain', es: 'Lluvia', nl: 'Regen' },
  'meteo.averses':     { fr: 'Averses', en: 'Showers', es: 'Chubascos', nl: 'Buien' },
  'meteo.neige':       { fr: 'Neige', en: 'Snow', es: 'Nieve', nl: 'Sneeuw' },
  'meteo.orage':       { fr: 'Orage', en: 'Thunderstorm', es: 'Tormenta', nl: 'Onweer' },

  // ── Signalement ─────────────────────────────────────────────────────────
  'signaler.titre':       { fr: 'Signaler un problème', en: 'Report an issue', es: 'Informar de un problema', nl: 'Probleem melden' },
  'signaler.court':       { fr: 'Signaler', en: 'Report', es: 'Informar', nl: 'Melden' },
  'signaler.sous_titre':  { fr: "Prévenez l'équipe du camping en quelques secondes. Une photo aide beaucoup.", en: 'Let the campsite team know in seconds. A photo helps a lot.', es: 'Avisa al equipo del camping en segundos. Una foto ayuda mucho.', nl: 'Laat het campingteam het binnen enkele seconden weten. Een foto helpt enorm.' },
  'signaler.categorie':   { fr: 'Catégorie', en: 'Category', es: 'Categoría', nl: 'Categorie' },
  'signaler.cat_proprete':{ fr: 'Propreté', en: 'Cleanliness', es: 'Limpieza', nl: 'Netheid' },
  'signaler.cat_panne':   { fr: 'Panne', en: 'Breakdown', es: 'Avería', nl: 'Storing' },
  'signaler.cat_securite':{ fr: 'Sécurité', en: 'Safety', es: 'Seguridad', nl: 'Veiligheid' },
  'signaler.cat_bruit':   { fr: 'Bruit', en: 'Noise', es: 'Ruido', nl: 'Geluid' },
  'signaler.cat_autre':   { fr: 'Autre', en: 'Other', es: 'Otro', nl: 'Anders' },
  'signaler.description': { fr: 'Description', en: 'Description', es: 'Descripción', nl: 'Omschrijving' },
  'signaler.description_ph': { fr: 'ex : La poubelle près du bloc B déborde', en: 'e.g. The bin near block B is overflowing', es: 'ej.: La papelera del bloque B está desbordada', nl: 'bijv. De afvalbak bij blok B puilt uit' },
  'signaler.lieu':        { fr: 'Où ?', en: 'Where?', es: '¿Dónde?', nl: 'Waar?' },
  'signaler.lieu_ph':     { fr: 'ex : Sanitaires bloc B', en: 'e.g. Block B toilets', es: 'ej.: Sanitarios bloque B', nl: 'bijv. Sanitair blok B' },
  'signaler.photo':       { fr: 'Photo (optionnelle)', en: 'Photo (optional)', es: 'Foto (opcional)', nl: 'Foto (optioneel)' },
  'signaler.ajouter_photo': { fr: 'Ajouter une photo', en: 'Add a photo', es: 'Añadir una foto', nl: 'Foto toevoegen' },
  'signaler.envoyer':     { fr: 'Envoyer le signalement', en: 'Send report', es: 'Enviar informe', nl: 'Melding versturen' },
  'signaler.envoi':       { fr: 'Envoi…', en: 'Sending…', es: 'Enviando…', nl: 'Versturen…' },
  'signaler.merci_titre': { fr: 'Merci !', en: 'Thank you!', es: '¡Gracias!', nl: 'Bedankt!' },
  'signaler.merci_texte': { fr: "L'équipe du camping a reçu votre signalement et va s'en occuper.", en: 'The campsite team has received your report and will take care of it.', es: 'El equipo del camping ha recibido tu informe y se encargará.', nl: 'Het campingteam heeft je melding ontvangen en gaat ermee aan de slag.' },
  'signaler.retour':      { fr: "Retour à l'accueil", en: 'Back to home', es: 'Volver al inicio', nl: 'Terug naar start' },
  'signaler.err_photo':   { fr: "Impossible de charger cette photo.", en: "Couldn't load this photo.", es: 'No se pudo cargar esta foto.', nl: 'Kon deze foto niet laden.' },
  'signaler.err_envoi':   { fr: "L'envoi a échoué. Réessayez.", en: 'Sending failed. Please try again.', es: 'El envío falló. Inténtalo de nuevo.', nl: 'Versturen mislukt. Probeer opnieuw.' },

  // ── Petites annonces ────────────────────────────────────────────────────
  'annonces.titre':       { fr: 'Annonces & objets trouvés', en: 'Notices & lost and found', es: 'Anuncios y objetos perdidos', nl: 'Advertenties & gevonden voorwerpen' },
  'annonces.court':       { fr: 'Annonces', en: 'Notices', es: 'Anuncios', nl: 'Advertenties' },
  'annonces.sous_titre':  { fr: "Prêtez, demandez, retrouvez. Entre vacanciers du camping.", en: 'Lend, ask, find. Between campers on site.', es: 'Presta, pide, encuentra. Entre campistas del camping.', nl: 'Uitlenen, vragen, terugvinden. Tussen kampeerders onderling.' },
  'annonces.f_tous':      { fr: 'Tout', en: 'All', es: 'Todo', nl: 'Alles' },
  'annonces.f_annonce':   { fr: 'Annonces', en: 'Notices', es: 'Anuncios', nl: 'Advertenties' },
  'annonces.f_trouve':    { fr: 'Trouvés', en: 'Found', es: 'Encontrados', nl: 'Gevonden' },
  'annonces.f_perdu':     { fr: 'Perdus', en: 'Lost', es: 'Perdidos', nl: 'Verloren' },
  'annonces.type_annonce':{ fr: 'Annonce', en: 'Notice', es: 'Anuncio', nl: 'Advertentie' },
  'annonces.type_trouve': { fr: 'Trouvé', en: 'Found', es: 'Encontrado', nl: 'Gevonden' },
  'annonces.type_perdu':  { fr: 'Perdu', en: 'Lost', es: 'Perdido', nl: 'Verloren' },
  'annonces.aucune':      { fr: 'Aucune annonce pour le moment.', en: 'No notices yet.', es: 'Aún no hay anuncios.', nl: 'Nog geen advertenties.' },
  'annonces.premier':     { fr: 'Publiez la première !', en: 'Post the first one!', es: '¡Publica el primero!', nl: 'Plaats de eerste!' },
  'annonces.nouvelle':    { fr: 'Nouvelle annonce', en: 'New notice', es: 'Nuevo anuncio', nl: 'Nieuwe advertentie' },
  'annonces.titre_champ': { fr: 'Titre', en: 'Title', es: 'Título', nl: 'Titel' },
  'annonces.titre_ph':    { fr: 'ex : Je prête ma pompe à vélo', en: 'e.g. Lending my bike pump', es: 'ej.: Presto mi bomba de bicicleta', nl: 'bijv. Ik leen mijn fietspomp uit' },
  'annonces.description_champ': { fr: 'Détails', en: 'Details', es: 'Detalles', nl: 'Details' },
  'annonces.description_ph': { fr: 'Emplacement, horaires, précisions…', en: 'Pitch, times, details…', es: 'Parcela, horarios, detalles…', nl: 'Standplaats, tijden, details…' },
  'annonces.publier':     { fr: 'Publier', en: 'Post', es: 'Publicar', nl: 'Plaatsen' },
  'annonces.publication': { fr: 'Publication…', en: 'Posting…', es: 'Publicando…', nl: 'Plaatsen…' },
  'annonces.marquer_resolu': { fr: 'Terminé', en: 'Done', es: 'Resuelto', nl: 'Klaar' },
  'annonces.confirm_resolu': { fr: 'Marquer cette annonce comme terminée ?', en: 'Mark this notice as done?', es: '¿Marcar este anuncio como resuelto?', nl: 'Deze advertentie als klaar markeren?' },
  'annonces.err_publier': { fr: 'La publication a échoué. Réessayez.', en: 'Posting failed. Please try again.', es: 'La publicación falló. Inténtalo de nuevo.', nl: 'Plaatsen mislukt. Probeer opnieuw.' },

  'annonces.indispo': { fr: "Les annonces ne sont pas encore disponibles sur ce camping.", en: 'Notices are not available yet at this campsite.', es: 'Los anuncios aún no están disponibles en este camping.', nl: 'Advertenties zijn nog niet beschikbaar op deze camping.' },

  // ── Fin de séjour ───────────────────────────────────────────────────────
  'fin.bon_retour':  { fr: 'Bon retour, {pseudo} !', en: 'Welcome back, {pseudo}!', es: '¡Bienvenido de nuevo, {pseudo}!', nl: 'Welkom terug, {pseudo}!' },
  'fin.termine':     { fr: 'Votre séjour {camping}est terminé. Vos données seront automatiquement supprimées. À l\'année prochaine ! 🌲', en: 'Your stay {camping}has ended. Your data will be deleted automatically. See you next year! 🌲', es: 'Tu estancia {camping}ha terminado. Tus datos se eliminarán automáticamente. ¡Hasta el año que viene! 🌲', nl: 'Je verblijf {camping}is voorbij. Je gegevens worden automatisch verwijderd. Tot volgend jaar! 🌲' },
  'fin.de_retour':   { fr: 'Je suis de retour au camping 🏕️', en: "I'm back at the campsite 🏕️", es: 'He vuelto al camping 🏕️', nl: 'Ik ben terug op de camping 🏕️' },
}

// ── Moteur ──────────────────────────────────────────────────────────────────
const CODES = LANGUES.map(l => l.code)
const STORAGE_KEY = 'langue'

function detecter() {
  const stocke = localStorage.getItem(STORAGE_KEY)
  if (stocke && CODES.includes(stocke)) return stocke
  const nav = (navigator.languages?.[0] || navigator.language || 'fr').slice(0, 2).toLowerCase()
  return CODES.includes(nav) ? nav : 'fr'
}

let langue = detecter()
const abonnes = new Set()

export function getLangue() { return langue }

export function setLangue(code) {
  if (!CODES.includes(code) || code === langue) return
  langue = code
  localStorage.setItem(STORAGE_KEY, code)
  abonnes.forEach(fn => fn())
}

/** Traduit une clé. `vars` remplace les {jetons} du texte. */
export function t(cle, vars) {
  const entree = STRINGS[cle]
  if (!entree) return cle // clé manquante : visible en dev, jamais bloquant
  let texte = entree[langue] ?? entree.fr ?? cle
  if (vars) {
    for (const [k, v] of Object.entries(vars)) texte = texte.replaceAll(`{${k}}`, v)
  }
  return texte
}

/** Hook : re-rend le composant quand la langue change. */
export function useLangue() {
  return useSyncExternalStore(
    (fn) => { abonnes.add(fn); return () => abonnes.delete(fn) },
    () => langue,
  )
}

/** Locale complète pour les dates/heures (toLocaleDateString…). */
export function locale() {
  return { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', nl: 'nl-NL' }[langue] || 'fr-FR'
}
