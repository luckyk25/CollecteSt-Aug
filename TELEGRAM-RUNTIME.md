# Rappels Telegram · Exécution planifiée

Site : utiliser le `project_id` de votre configuration privée `.openai/hosting.json`.
URL : utiliser l’URL de déploiement retournée par Sites.

Le Site reste privé. À chaque exécution, obtenir le service access actuel avec get_site. Utiliser uniquement le siwc_bypass_bearer_token retourné, dans l’en-tête OAI-Sites-Authorization: Bearer <token>, pour ce Site. Ne jamais placer le jeton dans le prompt, un fichier, la sortie ou le navigateur. Ne pas ajouter de visiteur ni d’en-tête Origin.

Appeler POST /api/reminders/dispatch. Le serveur traite les connexions et commandes Telegram en attente, puis n’envoie les rappels qu’entre 18 h et 19 h, heure America/Toronto. Le calendrier reste limité à 2026. L’exécution aux autres heures synchronise les commandes sans envoyer de rappel.

La tâche doit s’exécuter chaque jour à 0 h, 6 h, 12 h et 18 h (America/Toronto), pour traiter les commandes avant l’expiration de la file Telegram de 24 heures. Les connexions se synchronisent aussi immédiatement quand la fenêtre de connexion du site reste ouverte. Le backend est seul responsable des destinataires, des préférences, de /stop et de la prévention des doublons. Ne pas lire les identifiants de conversation, les adresses ou les jetons du bot dans la tâche.

Pour vérifier le chemin sans envoi ni mutation : POST /api/reminders/dispatch?dry_run=1. Ce mode ne lit pas la file Telegram et ne confirme aucun abonnement. Le résultat ne contient que des comptes et l’état de préparation.

Ne pas réessayer un résultat d’envoi ambigu : accepted signifie accepté par Telegram, pas lu sur le téléphone. Les lignes sending/uncertain empêchent une nouvelle tentative pour la même collecte. Prévenir le propriétaire uniquement en cas de failed/uncertain non nul, d’erreur persistante, de backlog non résolu ou d’action nécessaire. Rester silencieux pour les états normaux not_configured, outside_delivery_window, calendar_ended et les exécutions sans envoi. Ne pas republier le site pendant une exécution.

Pour déplacer le planificateur sur un serveur ultérieurement, réutiliser ce même appel authentifié et cette cadence. Cela ne nécessite pas de modifier le bot ou les abonnements.
