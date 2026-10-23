# Activation des rappels SMS

La fonction est préparée, mais aucun SMS n’est envoyé avant la configuration du compte et du planificateur.

1. Créer un compte Twilio. Choisir un expéditeur autorisé à envoyer des SMS vers le Canada et terminer les vérifications demandées par Twilio pour cet expéditeur. Ne pas acheter de numéro ni accepter de frais sans décider du budget.
2. Créer un Messaging Service avec cet expéditeur. Activer la gestion de STOP et vérifier que les permissions géographiques autorisent le Canada.
3. Créer un service Twilio Verify, avec un code à 6 chiffres. Il sert à vérifier le propriétaire du numéro.
4. Configurer les secrets de production du Site via les outils natifs Sites : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID et TWILIO_MESSAGING_SERVICE_SID. Ne pas les écrire dans Git ni dans le navigateur.
5. Lire le Site et ses automations. Réutiliser une tâche liée existante si elle couvre cet envoi ; sinon créer une tâche liée via Sites, chaque jour à 18 h dans America/Toronto. Suivre SMS-RUNTIME.md. Vérifier l’accès au distributeur en mode dry_run.
6. Une fois le planificateur créé et vérifié, configurer SMS_SCHEDULER_READY=true et SMS_ENABLED=true dans les variables du Site, puis redéployer la version enregistrée pour appliquer la révision d’environnement. Garder SMS_ENABLED=false tant que l’expéditeur et le planificateur ne sont pas prêts.
7. S’abonner dans l’application avec son propre numéro, confirmer le code reçu et vérifier que l’abonnement apparaît actif. Ce test envoie un SMS de vérification facturable par Twilio.

Un test réel utilise le propre numéro du propriétaire et envoie un SMS de vérification facturable. Les identifiants doivent être configurés comme secrets, sans être collés dans le chat.

Documentation officielle :
- [Créer un message](https://www.twilio.com/docs/messaging/api/message-resource)
- [Twilio Verify](https://www.twilio.com/docs/verify/api/verification)
- [Vérification d’un numéro sans frais](https://www.twilio.com/docs/messaging/api/tollfree-verification-resource)
- [Désabonnement](https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out)
