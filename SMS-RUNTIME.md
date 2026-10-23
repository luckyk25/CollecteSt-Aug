# Rappels SMS · Exécution planifiée

Site : utiliser le `project_id` de votre configuration privée `.openai/hosting.json`.
URL : utiliser l’URL de déploiement retournée par Sites.

Chaque jour à 18 h, heure America/Toronto, appeler POST /api/reminders/dispatch sur ce Site privé. Obtenir le service access actuel via get_site ; utiliser son siwc_bypass_bearer_token uniquement dans l’en-tête OAI-Sites-Authorization pour ce Site. Ne jamais placer le jeton dans le prompt, dans un fichier, dans la sortie ou dans le navigateur. Ne pas utiliser une identité de visiteur ni un en-tête Origin pour ce distributeur partagé.

Pour vérifier le chemin sans envoyer de SMS : POST /api/reminders/dispatch?dry_run=1. Le résultat contient seulement des comptes et l’état de préparation, jamais les numéros ou les adresses des abonnés.

Le serveur calcule lui-même la date du lendemain et les collectes des abonnés vérifiés, puis effectue l’envoi. Ne pas reconstruire les messages, lire la liste des numéros ni envoyer les SMS depuis le chat. Ne pas changer la visibilité du Site. L’API suppose que le Site reste privé pour son propriétaire.

Les états not_configured, outside_delivery_window et calendar_ended sont des résultats sans envoi. Ne pas les annoncer à chaque exécution. En cas de failed/uncertain non nul, prévenir le propriétaire avec les comptes seulement. Ne pas relancer une réponse d’envoi ambiguë ; la contrainte d’unicité bloque les doublons. Ne pas republier le Site pendant une exécution de rappels.

La tâche ne met pas à jour les dates 2027. Les rappels cessent après le calendrier 2026 tant qu’un nouveau calendrier n’est pas intégré.
