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
  // ── Modération du contenu publié par les vacanciers ──────────────────────
  'moderation.ce_vacancier':    { fr: 'ce vacancier', en: 'this camper', es: 'este campista', nl: 'deze kampeerder' },
  'moderation.sous_titre':      { fr: 'Que voulez-vous faire ?', en: 'What would you like to do?', es: '¿Qué quieres hacer?', nl: 'Wat wil je doen?' },
  'moderation.signaler':        { fr: 'Signaler ce contenu', en: 'Report this content', es: 'Denunciar este contenido', nl: 'Deze inhoud melden' },
  'moderation.signaler_detail': { fr: 'L’équipe du camping l’examinera sous 24 h.', en: 'The campsite team will review it within 24 h.', es: 'El equipo del camping lo revisará en 24 h.', nl: 'Het campingteam bekijkt dit binnen 24 uur.' },
  'moderation.bloquer':         { fr: 'Bloquer {pseudo}', en: 'Block {pseudo}', es: 'Bloquear a {pseudo}', nl: '{pseudo} blokkeren' },
  'moderation.bloquer_detail':  { fr: 'Vous ne verrez plus ses messages ni ses publications.', en: 'You will no longer see their messages or posts.', es: 'Ya no verás sus mensajes ni publicaciones.', nl: 'Je ziet hun berichten en posts niet meer.' },
  'moderation.bloque':          { fr: '{pseudo} est bloqué', en: '{pseudo} is blocked', es: '{pseudo} está bloqueado', nl: '{pseudo} is geblokkeerd' },
  'moderation.debloque':        { fr: '{pseudo} est débloqué', en: '{pseudo} is unblocked', es: '{pseudo} está desbloqueado', nl: '{pseudo} is gedeblokkeerd' },
  'moderation.signale':         { fr: 'Signalement envoyé. Merci.', en: 'Report sent. Thank you.', es: 'Denuncia enviada. Gracias.', nl: 'Melding verzonden. Bedankt.' },
  'moderation.err_signal':      { fr: 'Envoi impossible. Réessayez.', en: 'Could not send. Try again.', es: 'No se pudo enviar. Inténtalo de nuevo.', nl: 'Verzenden mislukt. Probeer opnieuw.' },
  'moderation.motif_titre':     { fr: 'Pourquoi le signalez-vous ?', en: 'Why are you reporting this?', es: '¿Por qué lo denuncias?', nl: 'Waarom meld je dit?' },
  'moderation.motif_sous_titre':{ fr: 'Votre signalement reste anonyme pour l’auteur.', en: 'Your report stays anonymous to the author.', es: 'Tu denuncia es anónima para el autor.', nl: 'Je melding blijft anoniem voor de auteur.' },
  'moderation.motif_harcelement': { fr: 'Harcèlement ou insultes', en: 'Harassment or insults', es: 'Acoso o insultos', nl: 'Intimidatie of beledigingen' },
  'moderation.motif_haine':     { fr: 'Propos haineux ou discriminatoires', en: 'Hateful or discriminatory speech', es: 'Discurso de odio o discriminación', nl: 'Haatdragende of discriminerende taal' },
  'moderation.motif_sexuel':    { fr: 'Contenu sexuel ou choquant', en: 'Sexual or shocking content', es: 'Contenido sexual o chocante', nl: 'Seksuele of schokkende inhoud' },
  'moderation.motif_arnaque':   { fr: 'Arnaque ou spam', en: 'Scam or spam', es: 'Estafa o spam', nl: 'Oplichting of spam' },
  'moderation.motif_autre':     { fr: 'Autre raison', en: 'Other reason', es: 'Otro motivo', nl: 'Andere reden' },
  'moderation.bloques_titre':   { fr: 'Vacanciers bloqués', en: 'Blocked campers', es: 'Campistas bloqueados', nl: 'Geblokkeerde kampeerders' },
  'moderation.aucun_bloque':    { fr: 'Vous n’avez bloqué personne.', en: 'You haven’t blocked anyone.', es: 'No has bloqueado a nadie.', nl: 'Je hebt niemand geblokkeerd.' },
  'moderation.debloquer':       { fr: 'Débloquer', en: 'Unblock', es: 'Desbloquear', nl: 'Deblokkeren' },

  // ── Conditions d'utilisation (règle 1.2 de l'App Store) ──────────────────
  'cgu.titre':        { fr: 'Règles de la communauté', en: 'Community rules', es: 'Normas de la comunidad', nl: 'Communityregels' },
  'cgu.tolerance':    { fr: 'Tolérance zéro : aucun contenu offensant ni comportement abusif n’est accepté. Harcèlement, insultes, propos haineux ou contenus choquants entraînent la suppression immédiate et l’exclusion définitive de leur auteur.', en: 'Zero tolerance: no objectionable content or abusive behaviour is accepted. Harassment, insults, hate speech or shocking content lead to immediate removal and a permanent ban.', es: 'Tolerancia cero: no se acepta ningún contenido ofensivo ni comportamiento abusivo. El acoso, los insultos, el discurso de odio o el contenido chocante conllevan la eliminación inmediata y la expulsión definitiva.', nl: 'Nultolerantie: aanstootgevende inhoud of misbruik wordt niet geaccepteerd. Intimidatie, beledigingen, haatzaaien of schokkende inhoud leiden tot onmiddellijke verwijdering en permanente uitsluiting.' },
  'cgu.accepte':      { fr: 'J’ai lu et j’accepte les', en: 'I have read and accept the', es: 'He leído y acepto las', nl: 'Ik heb gelezen en accepteer de' },
  'cgu.lien_cgu':     { fr: 'conditions d’utilisation', en: 'terms of use', es: 'condiciones de uso', nl: 'gebruiksvoorwaarden' },
  'cgu.lien_confid':  { fr: 'politique de confidentialité', en: 'privacy policy', es: 'política de privacidad', nl: 'privacybeleid' },
  'cgu.visibilite':   { fr: 'Mon pseudo, mon avatar et mon emplacement seront visibles par les autres vacanciers du camping pendant mon séjour.', en: 'My nickname, avatar and pitch number will be visible to other campers during my stay.', es: 'Mi apodo, mi avatar y mi parcela serán visibles para los demás campistas durante mi estancia.', nl: 'Mijn bijnaam, avatar en plaatsnummer zijn tijdens mijn verblijf zichtbaar voor andere kampeerders.' },
  'cgu.obligatoire':  { fr: 'Vous devez accepter les conditions d’utilisation pour continuer.', en: 'You must accept the terms of use to continue.', es: 'Debes aceptar las condiciones de uso para continuar.', nl: 'Je moet de gebruiksvoorwaarden accepteren om door te gaan.' },
  'commun.et':        { fr: 'et', en: 'and', es: 'y', nl: 'en' },

  'commun.annuler':     { fr: 'Annuler',     en: 'Cancel',     es: 'Cancelar',  nl: 'Annuleren' },
  'commun.enregistrer': { fr: 'Enregistrer', en: 'Save',       es: 'Guardar',   nl: 'Opslaan' },
  'commun.enregistrement': { fr: 'Enregistrement…', en: 'Saving…', es: 'Guardando…', nl: 'Opslaan…' },
  'commun.modifier':    { fr: 'Modifier',    en: 'Edit',       es: 'Editar',    nl: 'Wijzigen' },
  'commun.fermer':      { fr: 'Fermer',      en: 'Close',      es: 'Cerrar',    nl: 'Sluiten' },
  'commun.retour':      { fr: 'Retour',      en: 'Back',       es: 'Atrás',     nl: 'Terug' },
  'erreur.titre':       { fr: 'Oups, une erreur est survenue', en: 'Oops, something went wrong', es: 'Vaya, se produjo un error', nl: 'Oeps, er ging iets mis' },
  'erreur.texte':       { fr: "Rechargez l'application. Si le problème persiste, contactez la réception.", en: 'Reload the app. If the problem persists, contact reception.', es: 'Recarga la aplicación. Si el problema continúa, contacta con recepción.', nl: 'Herlaad de app. Blijft het probleem, neem contact op met de receptie.' },
  'erreur.recharger':   { fr: 'Recharger',   en: 'Reload',     es: 'Recargar',  nl: 'Herladen' },
  'commun.envoyer':     { fr: 'Envoyer',     en: 'Send',       es: 'Enviar',    nl: 'Versturen' },
  'commun.chargement':  { fr: 'Chargement…',  en: 'Loading…',   es: 'Cargando…', nl: 'Laden…' },
  'commun.erreur':      { fr: 'Une erreur est survenue. Réessayez.', en: 'Something went wrong. Please try again.', es: 'Se produjo un error. Inténtalo de nuevo.', nl: 'Er is iets misgegaan. Probeer opnieuw.' },
  'commun.reseau':      { fr: 'Vérifiez votre connexion.', en: 'Check your connection.', es: 'Comprueba tu conexión.', nl: 'Controleer je verbinding.' },
  'commun.places':      { fr: '{n} places',   en: '{n} spots',  es: '{n} plazas', nl: '{n} plaatsen' },
  'commun.membres':     { fr: '{n} membres',  en: '{n} members', es: '{n} miembros', nl: '{n} leden' },
  'commun.membre':      { fr: '{n} membre',   en: '{n} member', es: '{n} miembro', nl: '{n} lid' },
  // 42501 : la base refuse la publication (vacancier banni par le gérant).
  'commun.banni':      { fr: "Votre compte ne peut plus publier dans ce camping. Adressez-vous à la réception.", en: "Your account can no longer post at this campsite. Please contact reception.", es: 'Tu cuenta ya no puede publicar en este camping. Dirígete a recepción.', nl: 'Je account kan op deze camping niet meer posten. Neem contact op met de receptie.' },
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
  'accueil.campeur':      { fr: 'Campeur', en: 'Camper', es: 'Campista', nl: 'Kampeerder' },
  'accueil.groupes_maintenant': { fr: 'Groupes actifs maintenant', en: 'Active groups right now', es: 'Grupos activos ahora', nl: 'Nu actieve groepen' },
  'accueil.voir_tout':    { fr: 'Voir tout',   en: 'See all',    es: 'Ver todo',  nl: 'Alles bekijken' },
  'accueil.publier_statut': { fr: 'Publier',   en: 'Post',       es: 'Publicar',  nl: 'Plaatsen' },
  'accueil.statut_place':  { fr: 'Partagez quelque chose…', en: 'Share something…', es: 'Comparte algo…', nl: 'Deel iets…' },

  'accueil.mot_vacanciers': { fr: 'vacanciers ici', en: 'campers here', es: 'campistas aquí', nl: 'kampeerders hier' },
  'accueil.mot_groupes':    { fr: 'groupes actifs', en: 'active groups', es: 'grupos activos', nl: 'actieve groepen' },
  'accueil.mot_animations': { fr: 'animations à venir', en: 'upcoming events', es: 'próximas actividades', nl: 'komende activiteiten' },
  // Singuliers : « 1 groupes actifs » s'affichait tel quel.
  'accueil.mot_vacancier':  { fr: 'vacancier ici', en: 'camper here', es: 'campista aquí', nl: 'kampeerder hier' },
  'accueil.mot_groupe':     { fr: 'groupe actif', en: 'active group', es: 'grupo activo', nl: 'actieve groep' },
  'accueil.mot_animation':  { fr: 'animation à venir', en: 'upcoming event', es: 'próxima actividad', nl: 'komende activiteit' },

  'accueil.aucun_groupe':  { fr: "Aucun groupe actif pour l'instant.", en: 'No active groups right now.', es: 'No hay grupos activos ahora.', nl: 'Nu geen actieve groepen.' },
  'accueil.premier_creer': { fr: 'Soyez le premier à en créer un !', en: 'Be the first to create one!', es: '¡Sé el primero en crear uno!', nl: 'Wees de eerste die er een aanmaakt!' },
  'accueil.creer_groupe':  { fr: '+ Créer un groupe', en: '+ Create a group', es: '+ Crear un grupo', nl: '+ Groep aanmaken' },
  'accueil.visible24':     { fr: '(visible 24h)', en: '(visible for 24h)', es: '(visible 24h)', nl: '(24u zichtbaar)' },
  'accueil.statut_ph':     { fr: 'ex : BBQ ce soir emplacement 47, tous invités !', en: 'e.g. BBQ tonight at pitch 47, everyone welcome!', es: 'ej.: ¡Barbacoa esta noche en la parcela 47, todos invitados!', nl: 'bijv. BBQ vanavond op plek 47, iedereen welkom!' },
  'accueil.publier':       { fr: 'Publier', en: 'Post', es: 'Publicar', nl: 'Plaatsen' },
  'accueil.publication':   { fr: 'Publication…', en: 'Posting…', es: 'Publicando…', nl: 'Plaatsen…' },

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
  'chat.quitter':       { fr: 'Quitter', en: 'Leave', es: 'Salir', nl: 'Verlaten' },
  'chat.quitter_titre': { fr: 'Quitter « {titre} » ?', en: 'Leave “{titre}”?', es: '¿Salir de «{titre}»?', nl: '“{titre}” verlaten?' },
  'chat.quitter_texte': { fr: "Vous ne recevrez plus ses messages ni ses notifications. Vous pourrez le rejoindre à nouveau tant qu'il est proposé.", en: 'You will no longer get its messages or notifications. You can join again as long as it is listed.', es: 'Ya no recibirás sus mensajes ni sus notificaciones. Podrás volver a unirte mientras siga disponible.', nl: 'Je ontvangt geen berichten of meldingen meer van deze groep. Je kunt weer meedoen zolang de groep zichtbaar is.' },
  'chat.quitte':        { fr: 'Vous avez quitté « {titre} »', en: 'You left “{titre}”', es: 'Has salido de «{titre}»', nl: 'Je hebt “{titre}” verlaten' },
  'chat.err_quitter':   { fr: 'Impossible de quitter le groupe. Vérifiez votre connexion.', en: 'Could not leave the group. Check your connection.', es: 'No se pudo salir del grupo. Comprueba tu conexión.', nl: 'Kon de groep niet verlaten. Controleer je verbinding.' },
  'chat.non_envoye':  { fr: 'Message non envoyé. Vérifiez votre connexion.', en: 'Message not sent. Check your connection.', es: 'Mensaje no enviado. Comprueba tu conexión.', nl: 'Bericht niet verzonden. Controleer je verbinding.' },
  'chat.aujourdhui':  { fr: "Aujourd'hui", en: 'Today', es: 'Hoy', nl: 'Vandaag' },
  'chat.hier':        { fr: 'Hier', en: 'Yesterday', es: 'Ayer', nl: 'Gisteren' },
  'chat.parti':       { fr: 'Vacancier parti', en: 'Camper has left', es: 'Campista que se fue', nl: 'Vertrokken kampeerder' },

  // ── Agenda ──────────────────────────────────────────────────────────────
  'agenda.titre':       { fr: 'Agenda', en: 'Events', es: 'Agenda', nl: 'Agenda' },
  'agenda.tout':        { fr: 'Tout', en: 'All', es: 'Todo', nl: 'Alles' },
  'agenda.mes_inscr':   { fr: 'Mes inscriptions', en: 'My bookings', es: 'Mis inscripciones', nl: 'Mijn inschrijvingen' },
  'agenda.matin':       { fr: 'CE MATIN', en: 'THIS MORNING', es: 'ESTA MAÑANA', nl: 'VANOCHTEND' },
  'agenda.apresmidi':   { fr: 'CET APRÈS-MIDI', en: 'THIS AFTERNOON', es: 'ESTA TARDE', nl: 'VANMIDDAG' },
  'agenda.soir':        { fr: 'CE SOIR', en: 'TONIGHT', es: 'ESTA NOCHE', nl: 'VANAVOND' },
  'agenda.inscrire':    { fr: "S'inscrire", en: 'Sign up', es: 'Apuntarse', nl: 'Inschrijven' },
  'agenda.inscrit':     { fr: '✓ Inscrit', en: '✓ Booked', es: '✓ Apuntado', nl: '✓ Ingeschreven' },
  'agenda.desinscrire': { fr: '✓ Inscrit — Se désinscrire', en: '✓ Booked — Cancel', es: '✓ Apuntado — Cancelar', nl: '✓ Ingeschreven — Afmelden' },
  'agenda.aucune':      { fr: 'Aucune animation prévue pour le moment.', en: 'No events scheduled yet.', es: 'No hay actividades programadas.', nl: 'Nog geen activiteiten gepland.' },
  'agenda.err_inscr':   { fr: 'Impossible de vous inscrire pour le moment.', en: "Can't sign you up right now.", es: 'No se puede inscribir en este momento.', nl: 'Inschrijven lukt nu niet.' },
  'agenda.err_desinscr':{ fr: 'Impossible de vous désinscrire pour le moment.', en: "Can't cancel right now.", es: 'No se puede cancelar en este momento.', nl: 'Afmelden lukt nu niet.' },
  'agenda.inscrit_a':   { fr: 'Inscrit à « {titre} »', en: 'Booked: “{titre}”', es: 'Apuntado a «{titre}»', nl: 'Ingeschreven voor ‘{titre}’' },

  // ── Choix d'emoji ───────────────────────────────────────────────────────
  'emoji.plus':        { fr: "➕ Plus d'emojis", en: '➕ More emojis', es: '➕ Más emojis', nl: '➕ Meer emoji' },
  'emoji.moins':       { fr: 'Réduire', en: 'Less', es: 'Menos', nl: 'Minder' },
  'emoji.autre':       { fr: "Ou tapez n'importe quel emoji 😀", en: 'Or type any emoji 😀', es: 'O escribe cualquier emoji 😀', nl: 'Of typ een willekeurige emoji 😀' },
  'emoji.seulement':   { fr: 'Tapez un emoji, pas du texte.', en: 'Type an emoji, not text.', es: 'Escribe un emoji, no texto.', nl: 'Typ een emoji, geen tekst.' },
  'emoji.refuse':      { fr: "Cet emoji n'est pas disponible sur CampConnect.", en: "This emoji isn't available on CampConnect.", es: 'Este emoji no está disponible en CampConnect.', nl: 'Deze emoji is niet beschikbaar op CampConnect.' },
  'emoji.cat_visages': { fr: 'Visages', en: 'Faces', es: 'Caras', nl: 'Gezichten' },
  'emoji.cat_sport':   { fr: 'Sport', en: 'Sport', es: 'Deporte', nl: 'Sport' },
  'emoji.cat_manger':  { fr: 'À manger', en: 'Food', es: 'Comida', nl: 'Eten' },
  'emoji.cat_boire':   { fr: 'À boire', en: 'Drinks', es: 'Bebidas', nl: 'Drinken' },
  'emoji.cat_nature':  { fr: 'Nature', en: 'Nature', es: 'Naturaleza', nl: 'Natuur' },
  'emoji.cat_animaux': { fr: 'Animaux', en: 'Animals', es: 'Animales', nl: 'Dieren' },
  'emoji.cat_fete':    { fr: 'Fête et loisirs', en: 'Fun', es: 'Fiesta y ocio', nl: 'Feest en vrije tijd' },
  'emoji.cat_voyage':  { fr: 'Balade et objets', en: 'Travel and objects', es: 'Paseos y objetos', nl: 'Onderweg en spullen' },

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
  'carte.ici':      { fr: 'Vous êtes ici', en: 'You are here', es: 'Estás aquí', nl: 'Je bent hier' },
  'carte.plan_alt': { fr: 'Plan du camping', en: 'Campsite map', es: 'Plano del camping', nl: 'Plattegrond van de camping' },
  'carte.recentrer': { fr: 'Recentrer sur ma position', en: 'Recentre on my position', es: 'Centrar en mi posición', nl: 'Centreer op mijn positie' },
  'infos.question': { fr: 'Une question ?', en: 'A question?', es: '¿Una pregunta?', nl: 'Een vraag?' },

  // ── Profil ──────────────────────────────────────────────────────────────
  'profil.mes_infos':    { fr: 'Mes informations', en: 'My details', es: 'Mis datos', nl: 'Mijn gegevens' },
  'profil.pseudo':       { fr: 'Pseudo', en: 'Nickname', es: 'Apodo', nl: 'Bijnaam' },
  'profil.emplacement':  { fr: 'Emplacement', en: 'Pitch', es: 'Parcela', nl: 'Standplaats' },
  'profil.tranche_age':  { fr: "Tranche d'âge", en: 'Age range', es: 'Rango de edad', nl: 'Leeftijdsgroep' },
  'profil.avec':         { fr: 'Je voyage', en: 'I travel', es: 'Viajo', nl: 'Ik reis' },
  'profil.interets':     { fr: 'Centres d\'intérêt', en: 'Interests', es: 'Intereses', nl: 'Interesses' },
  'profil.interets_court': { fr: 'Intérêts', en: 'Interests', es: 'Intereses', nl: 'Interesses' },
  'profil.depart':       { fr: 'Date de départ', en: 'Departure date', es: 'Fecha de salida', nl: 'Vertrekdatum' },
  'profil.langue':       { fr: 'Langue', en: 'Language', es: 'Idioma', nl: 'Taal' },
  'profil.deconnexion':  { fr: 'Se déconnecter', en: 'Log out', es: 'Cerrar sesión', nl: 'Uitloggen' },
  'profil.enregistre':   { fr: 'Profil enregistré ✓', en: 'Profile saved ✓', es: 'Perfil guardado ✓', nl: 'Profiel opgeslagen ✓' },
  'profil.err_save':     { fr: "Impossible d'enregistrer votre profil pour le moment.", en: "Couldn't save your profile right now.", es: 'No se pudo guardar tu perfil ahora.', nl: 'Kon je profiel nu niet opslaan.' },

  // Suppression du compte — exigée par la règle 5.1.1(v) de l'App Store.
  'onb.pas_pret_titre':  { fr: "Ce camping n'est pas encore ouvert", en: 'This campsite is not open yet', es: 'Este camping aún no está abierto', nl: 'Deze camping is nog niet open' },
  'onb.pas_pret_detail': { fr: "Son espace CampConnect n'a pas encore été configuré par la réception. Réessayez dans quelques jours, ou demandez-leur où en est la mise en place.", en: 'Its CampConnect space has not been set up by reception yet. Try again in a few days, or ask them how the setup is going.', es: 'La recepción todavía no ha configurado su espacio CampConnect. Vuelve a intentarlo en unos días o pregúntales cómo va la instalación.', nl: 'De receptie heeft de CampConnect-ruimte nog niet ingesteld. Probeer het over een paar dagen opnieuw of vraag hoe het ervoor staat.' },
  'profil.suppr_compte':   { fr: 'Supprimer mon compte', en: 'Delete my account', es: 'Eliminar mi cuenta', nl: 'Mijn account verwijderen' },
  'profil.espace_gerant':  { fr: 'Espace gérant', en: 'Manager console', es: 'Espacio del gerente', nl: 'Beheerdersruimte' },
  'profil.suppr_titre':    { fr: 'Supprimer votre compte ?', en: 'Delete your account?', es: '¿Eliminar tu cuenta?', nl: 'Je account verwijderen?' },
  'profil.suppr_texte':    { fr: 'Votre profil, vos messages, vos statuts, vos annonces et vos inscriptions aux animations seront effacés. Les groupes que vous avez créés resteront ouverts pour leurs autres membres, sans votre nom.', en: 'Your profile, messages, statuses, listings and event sign-ups will be erased. Groups you created stay open for their other members, without your name.', es: 'Tu perfil, mensajes, estados, anuncios e inscripciones se borrarán. Los grupos que creaste seguirán abiertos para sus demás miembros, sin tu nombre.', nl: 'Je profiel, berichten, statussen, advertenties en inschrijvingen worden gewist. Groepen die je hebt aangemaakt blijven open voor de andere leden, zonder je naam.' },
  'profil.suppr_definitif':{ fr: '⚠️ Cette action est définitive : rien ne pourra être récupéré.', en: '⚠️ This cannot be undone: nothing can be recovered.', es: '⚠️ Esta acción es definitiva: no se podrá recuperar nada.', nl: '⚠️ Dit is definitief: niets kan worden hersteld.' },
  'profil.suppr_confirmer':{ fr: 'Supprimer', en: 'Delete', es: 'Eliminar', nl: 'Verwijderen' },
  'profil.suppr_en_cours': { fr: 'Suppression…', en: 'Deleting…', es: 'Eliminando…', nl: 'Verwijderen…' },
  'profil.suppr_erreur':   { fr: 'Impossible de supprimer le compte pour le moment. Réessayez.', en: "Couldn't delete the account right now. Please try again.", es: 'No se pudo eliminar la cuenta ahora. Inténtalo de nuevo.', nl: 'Kon het account nu niet verwijderen. Probeer opnieuw.' },

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
  'onb.camping_ph':    { fr: 'ex : Camping Les Pins Verts', en: 'e.g. Green Pines Campsite', es: 'ej.: Camping Los Pinos Verdes', nl: 'bijv. Camping De Groene Dennen' },
  'onb.en_recherche':  { fr: 'Recherche…', en: 'Searching…', es: 'Buscando…', nl: 'Zoeken…' },
  'onb.aucun_camping': { fr: "Aucun camping trouvé. Vérifiez l'orthographe.", en: 'No campsite found. Check the spelling.', es: 'No se encontró ningún camping. Comprueba la ortografía.', nl: 'Geen camping gevonden. Controleer de spelling.' },
  'onb.qr_astuce':     { fr: '💡 Ou scannez le QR code affiché à la réception de votre camping', en: '💡 Or scan the QR code displayed at your campsite reception', es: '💡 O escanea el código QR expuesto en la recepción de tu camping', nl: '💡 Of scan de QR-code bij de receptie van je camping' },
  'onb.verif_presence':{ fr: 'Vérification de votre présence', en: 'Checking you are on site', es: 'Comprobando tu presencia', nl: 'We controleren of je aanwezig bent' },
  'onb.verif_gps':     { fr: 'Vérification GPS', en: 'GPS check', es: 'Verificación GPS', nl: 'GPS-controle' },
  'onb.gps_confirme':  { fr: '✓ Confirmé', en: '✓ Confirmed', es: '✓ Confirmado', nl: '✓ Bevestigd' },
  'onb.gps_indispo':   { fr: 'Non disponible', en: 'Unavailable', es: 'No disponible', nl: 'Niet beschikbaar' },
  'onb.gps_en_cours':  { fr: 'Localisation en cours…', en: 'Locating…', es: 'Localizando…', nl: 'Locatie bepalen…' },
  'onb.gps_ok':        { fr: 'Vous êtes bien dans le camping !', en: 'You are on the campsite!', es: '¡Estás en el camping!', nl: 'Je bent op de camping!' },
  'onb.gps_echec':     { fr: 'GPS non disponible ou trop loin — utilisez le code ci-dessous.', en: 'GPS unavailable or too far away — use the code below.', es: 'GPS no disponible o demasiado lejos: usa el código de abajo.', nl: 'GPS niet beschikbaar of te ver weg — gebruik de code hieronder.' },
  'onb.code_titre':    { fr: "Code d'accès du jour", en: "Today's access code", es: 'Código de acceso de hoy', nl: 'Toegangscode van vandaag' },
  'onb.code_detail':   { fr: "Affiché à la réception et sur le tableau d'affichage. Change toutes les heures.", en: 'Shown at reception and on the notice board. Changes every hour.', es: 'Expuesto en recepción y en el tablón de anuncios. Cambia cada hora.', nl: 'Te zien bij de receptie en op het mededelingenbord. Verandert elk uur.' },
  'onb.changer':       { fr: '← Changer de camping', en: '← Change campsite', es: '← Cambiar de camping', nl: '← Andere camping' },
  'onb.creez_profil':  { fr: 'Créez votre profil vacancier', en: 'Create your holidaymaker profile', es: 'Crea tu perfil de veraneante', nl: 'Maak je vakantieprofiel aan' },
  'onb.avatar':        { fr: 'Avatar', en: 'Avatar', es: 'Avatar', nl: 'Avatar' },
  'onb.depart_aide':   { fr: "Jusqu'à quand restez-vous ? Modifiable dans votre profil si vous prolongez.", en: 'How long are you staying? You can change it in your profile if you extend.', es: '¿Hasta cuándo te quedas? Puedes cambiarlo en tu perfil si prolongas.', nl: 'Hoelang blijf je? Je kunt dit in je profiel wijzigen als je verlengt.' },
  'onb.err_generique': { fr: 'Erreur. Réessayez.', en: 'Something went wrong. Please try again.', es: 'Se produjo un error. Inténtalo de nuevo.', nl: 'Er ging iets mis. Probeer opnieuw.' },
  'onb.emplacement_ph':{ fr: 'ex : A42 (optionnel)', en: 'e.g. A42 (optional)', es: 'ej.: A42 (opcional)', nl: 'bijv. A42 (optioneel)' },
  'onb.pseudo_place':  { fr: 'ex : Marie42', en: 'e.g. Marie42', es: 'ej.: Marie42', nl: 'bijv. Marie42' },

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
  'signaler.retirer_photo': { fr: 'Retirer la photo', en: 'Remove photo', es: 'Quitar la foto', nl: 'Foto verwijderen' },
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
  'annonces.photo_non_envoyee': { fr: "La photo n'a pas pu être envoyée : l'annonce est publiée sans elle.", en: "The photo couldn't be uploaded: the post was published without it.", es: 'No se pudo subir la foto: el anuncio se publicó sin ella.', nl: 'De foto kon niet worden geüpload: de aankondiging is zonder foto geplaatst.' },

  'annonces.indispo': { fr: "Les annonces ne sont pas encore disponibles sur ce camping.", en: 'Notices are not available yet at this campsite.', es: 'Los anuncios aún no están disponibles en este camping.', nl: 'Advertenties zijn nog niet beschikbaar op deze camping.' },

  // ── Fin de séjour ───────────────────────────────────────────────────────
  'fin.bon_retour':  { fr: 'Bon retour, {pseudo} !', en: 'Welcome back, {pseudo}!', es: '¡Bienvenido de nuevo, {pseudo}!', nl: 'Welkom terug, {pseudo}!' },
  'fin.termine':     { fr: 'Votre séjour {camping}est terminé. Vos données seront automatiquement supprimées. À l\'année prochaine ! 🌲', en: 'Your stay {camping}has ended. Your data will be deleted automatically. See you next year! 🌲', es: 'Tu estancia {camping}ha terminado. Tus datos se eliminarán automáticamente. ¡Hasta el año que viene! 🌲', nl: 'Je verblijf {camping}is voorbij. Je gegevens worden automatisch verwijderd. Tot volgend jaar! 🌲' },
  'fin.de_retour':   { fr: 'Je suis de retour au camping 🏕️', en: "I'm back at the campsite 🏕️", es: 'He vuelto al camping 🏕️', nl: 'Ik ben terug op de camping 🏕️' },

  // — Lot A : carte et infos
  'infos.vide':           { fr: 'Les infos du camping arrivent. En attendant, demandez à la réception.', en: 'Campsite info is on its way. In the meantime, ask at reception.', es: 'La información del camping llegará pronto. Mientras tanto, pregunta en recepción.', nl: 'De campinginfo komt eraan. Vraag het in de tussentijd bij de receptie.' },
  'infos.urgences':       { fr: 'Urgences', en: 'Emergencies', es: 'Emergencias', nl: 'Noodgevallen' },
  'infos.samu':           { fr: 'SAMU · urgence médicale', en: 'Ambulance · medical emergency', es: 'SAMU · urgencia médica', nl: 'Ambulance · medisch noodgeval' },
  'infos.police':         { fr: 'Police', en: 'Police', es: 'Policía', nl: 'Politie' },
  'infos.pompiers':       { fr: 'Pompiers', en: 'Fire brigade', es: 'Bomberos', nl: 'Brandweer' },
  'infos.urgence_eu':     { fr: "Numéro d'urgence européen", en: 'European emergency number', es: 'Número de emergencia europeo', nl: 'Europees alarmnummer' },
  'infos.question_texte': { fr: "Passez à la réception ou signalez un problème à l'équipe.", en: 'Drop by reception or report a problem to the team.', es: 'Pasa por recepción o informa de un problema al equipo.', nl: 'Kom langs bij de receptie of meld een probleem aan het team.' },

  // — Lot C : profil et arrivee
  'profil.avec_solo':      { fr: 'Solo', en: 'Solo', es: 'Solo', nl: 'Alleen' },
  'profil.avec_couple':    { fr: 'En couple', en: 'As a couple', es: 'En pareja', nl: 'Met partner' },
  'profil.avec_amis':      { fr: 'Entre amis', en: 'With friends', es: 'Con amigos', nl: 'Met vrienden' },
  'profil.avec_famille':   { fr: 'En famille', en: 'With family', es: 'En familia', nl: 'Met familie' },
  'profil.interet_sport':     { fr: 'Sport', en: 'Sport', es: 'Deporte', nl: 'Sport' },
  'profil.interet_musique':   { fr: 'Musique', en: 'Music', es: 'Música', nl: 'Muziek' },
  'profil.interet_nature':    { fr: 'Nature', en: 'Nature', es: 'Naturaleza', nl: 'Natuur' },
  'profil.interet_cuisine':   { fr: 'Cuisine', en: 'Cooking', es: 'Cocina', nl: 'Koken' },
  'profil.interet_jeux':      { fr: 'Jeux', en: 'Games', es: 'Juegos', nl: 'Spelletjes' },
  'profil.interet_lecture':   { fr: 'Lecture', en: 'Reading', es: 'Lectura', nl: 'Lezen' },
  'profil.interet_randonnee': { fr: 'Randonnée', en: 'Hiking', es: 'Senderismo', nl: 'Wandelen' },
  'profil.interet_piscine':   { fr: 'Piscine', en: 'Pool', es: 'Piscina', nl: 'Zwembad' },
  'profil.interet_soirees':   { fr: 'Soirées', en: 'Evenings out', es: 'Fiestas', nl: 'Avondjes uit' },
  'profil.interet_enfants':   { fr: 'Enfants', en: 'Kids', es: 'Niños', nl: 'Kinderen' },
  'profil.deconnexion_titre': { fr: 'Se déconnecter ?', en: 'Log out?', es: '¿Cerrar sesión?', nl: 'Uitloggen?' },
  'profil.deconnexion_texte': { fr: 'Pour revenir, il faudra rechercher à nouveau le camping et confirmer votre présence. Votre profil sera retrouvé.', en: 'To come back, you will need to search for the campsite again and confirm you are here. Your profile will be kept.', es: 'Para volver, tendrás que buscar de nuevo el camping y confirmar tu presencia. Tu perfil se conservará.', nl: 'Om terug te komen moet je de camping opnieuw zoeken en bevestigen dat je er bent. Je profiel blijft bewaard.' },
  'moderation.bloquer_titre':    { fr: 'Bloquer {pseudo} ?', en: 'Block {pseudo}?', es: '¿Bloquear a {pseudo}?', nl: '{pseudo} blokkeren?' },
  'moderation.bloquer_texte':    { fr: 'Ses messages, statuts et annonces disparaîtront de votre écran, dans tous vos groupes. Vous pourrez le débloquer depuis votre profil.', en: 'Their messages, statuses and notices will disappear from your screen, in all your groups. You can unblock them from your profile.', es: 'Sus mensajes, estados y anuncios desaparecerán de tu pantalla, en todos tus grupos. Podrás desbloquearlo desde tu perfil.', nl: 'Hun berichten, statussen en advertenties verdwijnen van je scherm, in al je groepen. Je kunt de blokkering opheffen via je profiel.' },
  'moderation.bloquer_confirmer':{ fr: 'Bloquer', en: 'Block', es: 'Bloquear', nl: 'Blokkeren' },
  'moderation.err_debloquer':    { fr: 'Déblocage impossible. Réessayez.', en: 'Could not unblock. Try again.', es: 'No se pudo desbloquear. Inténtalo de nuevo.', nl: 'Deblokkeren mislukt. Probeer opnieuw.' },
  'signaler.photo_non_envoyee':  { fr: "La photo n'a pas pu être envoyée : le signalement est parti sans elle.", en: "The photo couldn't be uploaded: the report was sent without it.", es: 'No se pudo subir la foto: el informe se envió sin ella.', nl: 'De foto kon niet worden geüpload: de melding is zonder foto verstuurd.' },

  // — Lot B : groupes, chat, agenda
  'commun.reseau_titre':  { fr: 'Problème de connexion', en: 'Connection problem', es: 'Problema de conexión', nl: 'Verbindingsprobleem' },
  'commun.reessayer':     { fr: 'Réessayer', en: 'Try again', es: 'Reintentar', nl: 'Opnieuw proberen' },
  'agenda.desinscrire_titre': { fr: 'Se désinscrire de « {titre} » ?', en: 'Cancel your booking for “{titre}”?', es: '¿Cancelar tu inscripción en «{titre}»?', nl: 'Afmelden voor “{titre}”?' },
  'agenda.desinscrire_texte': { fr: 'Votre place sera libérée pour un autre vacancier.', en: 'Your spot will be freed up for another camper.', es: 'Tu plaza quedará libre para otro campista.', nl: 'Je plaats komt vrij voor een andere kampeerder.' },
  'agenda.se_desinscrire':    { fr: 'Se désinscrire', en: 'Cancel booking', es: 'Cancelar inscripción', nl: 'Afmelden' },
  'agenda.desinscrit_de':     { fr: 'Désinscrit de « {titre} »', en: 'Booking cancelled: “{titre}”', es: 'Inscripción cancelada: «{titre}»', nl: 'Afgemeld voor ‘{titre}’' },
  'chat.rejoindre':           { fr: 'Rejoindre le groupe', en: 'Join the group', es: 'Unirse al grupo', nl: 'Deelnemen aan groep' },
  'accueil.statut_suppr_titre': { fr: 'Supprimer mon statut ?', en: 'Delete my update?', es: '¿Eliminar mi estado?', nl: 'Mijn update verwijderen?' },
  'accueil.statut_suppr':       { fr: 'Supprimer', en: 'Delete', es: 'Eliminar', nl: 'Verwijderen' },
  'accueil.statut_supprime':    { fr: 'Statut supprimé', en: 'Update deleted', es: 'Estado eliminado', nl: 'Update verwijderd' },
  'accueil.err_statut_suppr':   { fr: 'Impossible de supprimer votre statut pour le moment.', en: "Couldn't delete your update right now.", es: 'No se pudo eliminar tu estado ahora.', nl: 'Kon je update nu niet verwijderen.' },
  'groupes.max_place':     { fr: 'ex : 10', en: 'e.g. 10', es: 'ej.: 10', nl: 'bijv. 10' },
  'groupes.tpl_petanque':  { fr: 'Pétanque', en: 'Pétanque', es: 'Petanca', nl: 'Jeu de boules' },
  'groupes.tpl_apero':     { fr: 'Apéro ce soir', en: 'Drinks tonight', es: 'Aperitivo esta noche', nl: 'Borrel vanavond' },
  'groupes.tpl_rando':     { fr: 'Rando demain matin', en: 'Hike tomorrow morning', es: 'Excursión mañana por la mañana', nl: 'Wandeling morgenochtend' },
  'groupes.tpl_volley':    { fr: 'Volley', en: 'Volleyball', es: 'Voleibol', nl: 'Volleybal' },
  'groupes.tpl_piscine':   { fr: 'Piscine', en: 'Pool', es: 'Piscina', nl: 'Zwembad' },
  'groupes.tpl_bbq':       { fr: 'BBQ', en: 'BBQ', es: 'Barbacoa', nl: 'BBQ' },
  'groupes.tpl_jeux':      { fr: 'Jeux / soirée', en: 'Games night', es: 'Juegos / velada', nl: 'Spelletjesavond' },
  'groupes.tpl_lieu_petanque': { fr: 'Terrain de pétanque', en: 'Pétanque court', es: 'Pista de petanca', nl: 'Jeu-de-boulesbaan' },
  'groupes.tpl_lieu_rando':    { fr: 'Accueil', en: 'Reception', es: 'Recepción', nl: 'Receptie' },
  'groupes.tpl_lieu_volley':   { fr: 'Terrain de sport', en: 'Sports ground', es: 'Pista deportiva', nl: 'Sportveld' },
  'groupes.tpl_lieu_piscine':  { fr: 'Piscine', en: 'Pool', es: 'Piscina', nl: 'Zwembad' },

  // — Supprimer son message
  'chat.mon_message':     { fr: 'Votre message', en: 'Your message', es: 'Tu mensaje', nl: 'Jouw bericht' },
  'chat.suppr':           { fr: 'Supprimer le message', en: 'Delete message', es: 'Eliminar el mensaje', nl: 'Bericht verwijderen' },
  'chat.suppr_detail':    { fr: 'Il disparaîtra pour tous les membres du groupe.', en: 'It will disappear for everyone in the group.', es: 'Desaparecerá para todos los miembros del grupo.', nl: 'Het verdwijnt voor iedereen in de groep.' },
  'chat.suppr_titre':     { fr: 'Supprimer ce message ?', en: 'Delete this message?', es: '¿Eliminar este mensaje?', nl: 'Dit bericht verwijderen?' },
  'chat.suppr_texte':     { fr: 'Il disparaîtra pour tous les membres du groupe. Une notification déjà reçue ne peut pas être retirée.', en: 'It will disappear for everyone in the group. A notification already received cannot be withdrawn.', es: 'Desaparecerá para todos los miembros del grupo. Una notificación ya recibida no se puede retirar.', nl: 'Het verdwijnt voor iedereen in de groep. Een al ontvangen melding kan niet worden ingetrokken.' },
  'chat.suppr_confirmer': { fr: 'Supprimer', en: 'Delete', es: 'Eliminar', nl: 'Verwijderen' },
  'chat.supprime':        { fr: 'Message supprimé', en: 'Message deleted', es: 'Mensaje eliminado', nl: 'Bericht verwijderd' },
  'chat.err_suppr':       { fr: 'Impossible de supprimer le message. Vérifiez votre connexion.', en: "Couldn't delete the message. Check your connection.", es: 'No se pudo eliminar el mensaje. Comprueba tu conexión.', nl: 'Kon het bericht niet verwijderen. Controleer je verbinding.' },

  // — Profil moderne : les nouveaux centres d'intérêt
  'profil.interet_plage':     { fr: 'Plage', en: 'Beach', es: 'Playa', nl: 'Strand' },
  'profil.interet_apero':     { fr: 'Apéro', en: 'Drinks', es: 'Aperitivo', nl: 'Borrel' },
  'profil.interet_petanque':  { fr: 'Pétanque', en: 'Pétanque', es: 'Petanca', nl: 'Jeu de boules' },
  'profil.interet_velo':      { fr: 'Vélo', en: 'Cycling', es: 'Bici', nl: 'Fietsen' },
  'profil.interet_padel':     { fr: 'Padel', en: 'Padel', es: 'Pádel', nl: 'Padel' },
  'profil.interet_paddle':    { fr: 'Paddle & kayak', en: 'Paddle & kayak', es: 'Paddle y kayak', nl: 'Suppen & kajak' },
  'profil.interet_yoga':      { fr: 'Yoga', en: 'Yoga', es: 'Yoga', nl: 'Yoga' },
  'profil.interet_photo':     { fr: 'Photo', en: 'Photography', es: 'Fotografía', nl: 'Fotografie' },
  'profil.modifier':          { fr: 'Modifier le profil', en: 'Edit profile', es: 'Editar perfil', nl: 'Profiel bewerken' },
  'profil.jusquau':           { fr: 'Jusqu’au {date}', en: 'Until {date}', es: 'Hasta el {date}', nl: 'Tot {date}' },
  'profil.depart_aujourdhui': { fr: 'Départ aujourd’hui', en: 'Leaving today', es: 'Salida hoy', nl: 'Vandaag vertrek' },
  'profil.interets_vide':     { fr: 'Ajoutez vos centres d’intérêt', en: 'Add your interests', es: 'Añade tus intereses', nl: 'Voeg je interesses toe' },
  'profil.interets_vide_aide':{ fr: 'Pour croiser des vacanciers qui aiment les mêmes choses.', en: 'To meet campers who enjoy the same things.', es: 'Para conocer a campistas con tus mismos gustos.', nl: 'Om kampeerders te ontmoeten die van hetzelfde houden.' },
  // — Profil immersif et mini-fiche
  'profil.bio_solo':          { fr: 'En vacances en solo', en: 'On holiday solo', es: 'De vacaciones en solitario', nl: 'Alleen op vakantie' },
  'profil.bio_couple':        { fr: 'En vacances en couple', en: 'On holiday as a couple', es: 'De vacaciones en pareja', nl: 'Met partner op vakantie' },
  'profil.bio_amis':          { fr: 'En vacances entre amis', en: 'On holiday with friends', es: 'De vacaciones con amigos', nl: 'Met vrienden op vakantie' },
  'profil.bio_famille':       { fr: 'En vacances en famille', en: 'On holiday with family', es: 'De vacaciones en familia', nl: 'Met familie op vakantie' },
  'profil.age':               { fr: '{tranche} ans', en: 'aged {tranche}', es: '{tranche} años', nl: '{tranche} jaar' },
  'profil.nb_groupe':         { fr: 'groupe', en: 'group', es: 'grupo', nl: 'groep' },
  'profil.nb_groupes':        { fr: 'groupes', en: 'groups', es: 'grupos', nl: 'groepen' },
  'profil.nb_animation':      { fr: 'animation', en: 'event', es: 'actividad', nl: 'activiteit' },
  'profil.nb_animations':     { fr: 'animations', en: 'events', es: 'actividades', nl: 'activiteiten' },
  'profil.nb_nuit':           { fr: 'nuit restante', en: 'night left', es: 'noche restante', nl: 'nacht over' },
  'profil.nb_nuits':          { fr: 'nuits restantes', en: 'nights left', es: 'noches restantes', nl: 'nachten over' },
  'profil.interets_visibles': { fr: 'Visibles par les vacanciers du camping', en: 'Visible to campers at this campsite', es: 'Visibles para los campistas del camping', nl: 'Zichtbaar voor kampeerders op de camping' },
  'profil.objet_plage':       { fr: 'la plage', en: 'the beach', es: 'la playa', nl: 'het strand' },
  'profil.objet_piscine':     { fr: 'la piscine', en: 'the pool', es: 'la piscina', nl: 'het zwembad' },
  'profil.objet_apero':       { fr: 'l’apéro', en: 'a good apéro', es: 'el aperitivo', nl: 'een borrel' },
  'profil.objet_petanque':    { fr: 'la pétanque', en: 'pétanque', es: 'la petanca', nl: 'jeu de boules' },
  'profil.objet_randonnee':   { fr: 'la randonnée', en: 'hiking', es: 'el senderismo', nl: 'wandelen' },
  'profil.objet_velo':        { fr: 'le vélo', en: 'cycling', es: 'la bici', nl: 'fietsen' },
  'profil.objet_padel':       { fr: 'le padel', en: 'padel', es: 'el pádel', nl: 'padel' },
  'profil.objet_paddle':      { fr: 'le paddle et le kayak', en: 'paddling and kayaking', es: 'el paddle y el kayak', nl: 'suppen en kajakken' },
  'profil.objet_yoga':        { fr: 'le yoga', en: 'yoga', es: 'el yoga', nl: 'yoga' },
  'profil.objet_sport':       { fr: 'le sport', en: 'sport', es: 'el deporte', nl: 'sport' },
  'profil.objet_jeux':        { fr: 'les jeux', en: 'games', es: 'los juegos', nl: 'spelletjes' },
  'profil.objet_musique':     { fr: 'la musique', en: 'music', es: 'la música', nl: 'muziek' },
  'profil.objet_soirees':     { fr: 'les soirées', en: 'evenings out', es: 'las fiestas', nl: 'avondjes uit' },
  'profil.objet_cuisine':     { fr: 'la cuisine', en: 'cooking', es: 'la cocina', nl: 'koken' },
  'profil.objet_nature':      { fr: 'la nature', en: 'nature', es: 'la naturaleza', nl: 'de natuur' },
  'profil.objet_photo':       { fr: 'la photo', en: 'photography', es: 'la fotografía', nl: 'fotografie' },
  'profil.objet_lecture':     { fr: 'la lecture', en: 'reading', es: 'la lectura', nl: 'lezen' },
  'profil.objet_enfants':     { fr: 'les activités pour enfants', en: 'kids’ activities', es: 'las actividades para niños', nl: 'kinderactiviteiten' },
  'fiche.voir':               { fr: 'Voir le profil de {pseudo}', en: 'See {pseudo}’s profile', es: 'Ver el perfil de {pseudo}', nl: 'Profiel van {pseudo} bekijken' },
  'fiche.ses_interets':       { fr: 'Ses centres d’intérêt', en: 'Their interests', es: 'Sus intereses', nl: 'Interesses' },
  'fiche.commun_un':          { fr: 'Vous aimez tous les deux {chose}', en: 'You both love {chose}', es: 'Compartís el gusto por {chose}', nl: 'Jullie houden allebei van {chose}' },
  'fiche.communs':            { fr: '{n} centres d’intérêt en commun', en: '{n} interests in common', es: '{n} intereses en común', nl: '{n} gedeelde interesses' },
  'fiche.en_commun':          { fr: 'En commun', en: 'In common', es: 'En común', nl: 'Gedeeld' },
  'fiche.vide':               { fr: '{pseudo} n’a pas encore ajouté de centres d’intérêt.', en: '{pseudo} hasn’t added any interests yet.', es: '{pseudo} aún no ha añadido intereses.', nl: '{pseudo} heeft nog geen interesses toegevoegd.' },
  'fiche.mes_vides':          { fr: 'Ajoutez les vôtres pour voir vos points communs', en: 'Add yours to see what you have in common', es: 'Añade los tuyos para ver qué tenéis en común', nl: 'Voeg de jouwe toe om te zien wat jullie delen' },
  'fiche.signaler':           { fr: 'Signaler', en: 'Report', es: 'Denunciar', nl: 'Melden' },
  'fiche.bloquer':            { fr: 'Bloquer', en: 'Block', es: 'Bloquear', nl: 'Blokkeren' },
  'fiche.bloque':             { fr: 'Vous avez bloqué ce vacancier.', en: 'You have blocked this camper.', es: 'Has bloqueado a este campista.', nl: 'Je hebt deze kampeerder geblokkeerd.' },
  'fiche.bloque_aide':        { fr: 'Vous pouvez le débloquer depuis votre profil.', en: 'You can unblock them from your profile.', es: 'Puedes desbloquearlo desde tu perfil.', nl: 'Je kunt deze persoon deblokkeren via je profiel.' },
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
