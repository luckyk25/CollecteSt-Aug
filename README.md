# CollecteSt-Aug · Ma collecte

Application française, privée, avec horaires 2026, recherche automatique des secteurs et rappels Telegram individuels pour les membres de la famille.

## Adresses

216 rues du répertoire public municipal : noms, plages civiques et centres de chaussée. La recherche n’envoie pas l’adresse à un service de géocodage externe. Les secteurs sont estimés à partir de la carte 2026 d’ÉEQ, alignée sur les intersections et le lac dans les données municipales. Ce ne sont pas des limites SIG officielles.

Une zone d’incertitude de 300 m autour des limites de la carte déclenche une confirmation explicite. Une rue qui traverse plusieurs secteurs demande le numéro civique. Une adresse non reconnue n’est pas affectée arbitrairement. Les corrections manuelles sont conservées dans le navigateur. Rue du Vitrier est estimée dans le secteur 1.

Sources, récupérées le 20 octobre 2026 :
- https://services6.arcgis.com/bb3A2FAyAtd6ADTL/arcgis/rest/services/CentreChaussee/FeatureServer/8
- https://www.eeq.ca/assets/pdf/33849_EEQ_CarteCollecte_VSAD_2026-FR.pdf
- https://vsad.ca/uploads/communication/2026/Collectes_des_matieres_residuelles_2026.pdf
- https://www.eeq.ca/assets/pdf/33849_EEQ_CalendrierCollecte_VSAD_2026-FR.pdf

## Telegram

La famille gère les connexions depuis le Site privé. Chaque membre ouvre son lien personnel et appuie sur Démarrer dans Telegram : aucun pseudonyme ni numéro de téléphone à saisir. Le lien est à usage unique et expire après 20 minutes. Jusqu’à 10 comptes peuvent recevoir leurs propres rappels, avec des choix de collectes distincts. Le compte Telegram reste reconnu par son identifiant stable, même si son pseudonyme change.

Les rappels regroupent les collectes choisies du lendemain, à 18 h dans America/Toronto. La file Telegram est synchronisée dans la fenêtre de connexion et par la tâche liée au Site. /stop est traité avant le prochain rappel. Les contraintes uniques évitent les doublons et une réponse d’envoi ambiguë ne déclenche aucune répétition automatique. Telegram confirme l’acceptation du message, pas sa lecture.

Voir TELEGRAM-SETUP.md et TELEGRAM-RUNTIME.md. Le bot doit être configuré comme secret de production et le planificateur doit être actif. Le site affiche un état de préparation tant que ces conditions ne sont pas remplies. Les anciennes API SMS restent désactivées tant qu’aucune configuration Twilio n’existe.

## Développement

Node.js 26 ou ultérieur. Installer avec `npm ci`, puis lancer `npm run dev -- --host 127.0.0.1 --port 4173`.

Le fichier source HTML est `page.html`. Exécuter `node scripts/sync-html.mjs` après toute modification pour mettre à jour le module de la route racine. Les assets sont dans `public/`, les API dans `app/api/`, et la logique testable dans `lib/`.

Validation : `npm test`, `npm run typecheck`, `npm run build`. Les tests couvrent aussi les limites de requêtes, les accès, la concurrence et les reprises Telegram. Les fournisseurs sont simulés.

Les dates ne sont pas extrapolées au-delà du 31 décembre 2026. Les avis municipaux et d’ÉEQ ont priorité sur cette copie datée. Les conteneurs d’immeubles/commerces peuvent avoir des horaires différents.

## Architecture et publication

Lire [ARCHITECTURE.md](ARCHITECTURE.md) et [SECURITY.md](SECURITY.md). Le code peut être publié sur GitHub ; le site familial et sa base restent privés. Les routes API font partie du code source, leurs clés ne sont jamais publiées. Le distributeur actuel est adapté à une famille ; un service grand public nécessite une file de travail et des contrôles d’accès supplémentaires.

La copie publique n’inclut aucun identifiant de Site actif ni historique privé. Pour une nouvelle installation Sites, enregistrer son propre Site, copier `.openai/hosting.example.json` vers `.openai/hosting.json`, puis y renseigner son propre `project_id`, en conservant `d1: "DB"`. Garder ce fichier de déploiement privé. Les commandes de développement et de construction initialisent automatiquement une configuration locale depuis le modèle sans identifiant, sans remplacer une configuration existante. Les secrets Telegram/Twilio sont fournis séparément par l’hébergeur. Les migrations SQL du dépôt construisent une base vide, sans données de famille.
