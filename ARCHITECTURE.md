# Architecture et limites

## Organisation

- `public/` : interface, calendrier pur, styles et illustrations SVG. Aucun secret ni identifiant de conversation n’y est stocké.
- `app/api/` : routes HTTP courtes ; contrôle d’identité et d’origine avant les opérations utilisateur.
- `lib/` : règles métier, validation d’adresses et adaptateurs Telegram/Twilio. Les appels externes restent côté serveur, avec délai maximal.
- `db/schema.ts` et `drizzle/` : schéma D1/SQLite et migrations versionnées. Ajouter une migration ; ne jamais réécrire une migration appliquée.
- `*-checks.mjs` : tests fonctionnels avec SQLite en mémoire et fournisseurs simulés ; aucun message réel n’est envoyé par les tests.

## Accès et données privées

Le déploiement actuel repose sur la passerelle d’authentification de Sites, avec accès limité au propriétaire. Les en-têtes `oai-authenticated-user-*` sont fiables uniquement derrière cette passerelle ; ils ne constituent pas une authentification sur un serveur exposé directement. Les requêtes utilisateur sont limitées à leur propriétaire en SQL et les mutations vérifient aussi l’origine.

`POST /api/reminders/dispatch` est une route de service : Sites valide le jeton de service avant la requête. La route refuse une identité navigateur et un en-tête Origin. **Ne pas exposer ce Worker directement ou rendre le site public avec cette architecture.** Un autre hébergement doit d’abord ajouter des sessions vérifiées et une authentification explicite du planificateur ; l’absence d’Origin seule n’est pas une preuve d’autorisation.

Les fichiers d’environnement, bases locales, données de familles, journaux et archives ne font pas partie du dépôt. Les secrets sont fournis par l’hébergeur. Le code des routes API est public ; les clés API restent privées. Les liens Telegram utilisent 256 bits aléatoires et seule leur empreinte SHA-256 est conservée. Ils expirent après 20 minutes et sont à usage unique.

## Concurrence et fiabilité

La limite de dix comptes et invitations par propriétaire est vérifiée atomiquement dans la requête d’insertion. Les index portent sur le propriétaire, la date de création et l’expiration pour éviter les parcours complets dans les recherches de famille.

Les invitations et confirmations expirées sont purgées lors de la synchronisation, et la suppression d’un abonnement retire aussi son état de test.

Une location en base sérialise la lecture de la file Telegram. Le propriétaire de la location est vérifié et sa durée renouvelée avant chaque mise à jour. Une exécution de synchronisation s’arrête après son budget de 45 secondes ou cinq pages ; l’offset persistant permet la reprise. Un retard empêche l’envoi des rappels jusqu’au traitement des commandes, notamment `/stop`.

Une contrainte unique par destinataire/date empêche les rappels en double, même avec plusieurs déclenchements. Un envoi dont l’issue est incertaine n’est pas relancé automatiquement. Cela privilégie l’absence de doublons ; il existe un risque de rappel manqué nécessitant une vérification manuelle.

## Capacité et évolution

Cette application vise une famille, avec dix comptes maximum par propriétaire. Le calendrier et les assets sont statiques, et les requêtes serveur sont sans état local. Les index et les opérations atomiques facilitent une croissance modérée, mais **aucun test de charge ne démontre une capacité de service grand public**.

Le distributeur lit les abonnements puis envoie séquentiellement. Pour des centaines ou milliers de destinataires, il faudra remplacer ce parcours par une file durable, une pagination par curseur, des lots bornés, un traitement des quotas Telegram et une surveillance des retards. Conserver les clés d’idempotence pendant cette évolution. Ne pas simplement augmenter les limites ou multiplier les exécutions.

La file Telegram est globale au bot : un seul système doit la consommer. Le polling et un webhook concurrent ne doivent pas partager le même bot. Le calendrier 2026 est volontairement borné : importer et vérifier les calendriers 2027 avant toute extension.

## Validation et livraison

Utiliser Node.js 26 ou ultérieur pour les tests SQLite. Exécuter `npm ci`, `npm test`, `npm run typecheck`, puis `npm run build`. La configuration de déploiement et les migrations sont vérifiées avant publication. Sites applique les migrations D1 avant le Worker. Ne jamais joindre une base réelle au dépôt pour initialiser une installation.
