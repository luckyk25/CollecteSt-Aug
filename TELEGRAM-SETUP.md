# Activation des rappels Telegram

Les rappels sont gratuits au volume d’une famille. Le serveur ne peut pas contacter une personne à partir de son pseudonyme ou de son numéro de téléphone : elle doit ouvrir son lien personnel et appuyer sur Démarrer.

1. Créer le bot auprès de [BotFather](https://t.me/BotFather), avec `/newbot`.
2. Configurer `TELEGRAM_BOT_TOKEN` comme secret de production du Site et `TELEGRAM_BOT_USERNAME` avec le nom exact retourné par Telegram, sans @. Garder ces valeurs hors de Git, du navigateur public et des journaux. Ne pas réutiliser le même bot pour une autre intégration qui consomme getUpdates. Aucun webhook ne doit être configuré, car ce Site privé utilise le polling.
3. Créer ou réutiliser la tâche liée au Site en suivant TELEGRAM-RUNTIME.md. Vérifier sa cadence et son état actif avant de configurer `TELEGRAM_SCHEDULER_READY=true` et `TELEGRAM_ENABLED=true`.
4. Redéployer la version enregistrée pour appliquer les variables de production.
5. Depuis le Site, choisir l’adresse et les collectes, puis créer un lien de connexion. Il est utilisable une seule fois, pendant 20 minutes. Ouvrir le lien dans Telegram et appuyer sur Démarrer ; laisser la fenêtre de connexion du Site ouverte pour la synchronisation immédiate.
6. Vérifier le compte connecté, puis utiliser Envoyer un test. Confirmer la réception dans Telegram. Créer un nouveau lien pour chaque membre de la famille (jusqu’à 10 comptes). Une famille partage les liens, sans qu’il soit nécessaire de changer la visibilité du Site.
7. `/stop` et le bouton Désabonner suppriment l’abonnement. `/status` affiche les préférences actives. Les commandes sont traitées avant le prochain rappel ; en dehors d’une connexion sur le site, leur confirmation peut attendre la prochaine synchronisation planifiée.

Un acquittement de Telegram ne prouve pas la lecture du message ni l’activation des notifications sur le téléphone. Chaque personne doit autoriser les notifications Telegram et ne pas mettre le bot en sourdine.

Les calendriers 2027 ne sont pas encore intégrés. Les rappels cessent à la fin du calendrier 2026.

Documentation : [Bots Telegram](https://core.telegram.org/bots), [liens de connexion](https://core.telegram.org/bots/features#deep-linking), [Bot API](https://core.telegram.org/bots/api).
