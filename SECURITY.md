# Sécurité du dépôt

Ne jamais committer un fichier `.env*`, `.dev.vars*`, une clé privée, un fichier de credentials, une base locale ou une archive de déploiement. Configurer les secrets dans le gestionnaire de l’hébergeur. Un modèle contenant des valeurs vides n’est pas nécessaire : les noms des variables sont documentés dans les guides Telegram et SMS.

Les identifiants de bot et jetons ne doivent apparaître ni dans le navigateur, ni dans les erreurs, ni dans les journaux. Les tests utilisent exclusivement des données fictives et des fournisseurs simulés.

Le dépôt public contient le code des API, pas leurs secrets. Sa visibilité ne doit pas modifier celle du site familial ni l’accès à sa base. Lire les contraintes d’authentification dans [ARCHITECTURE.md](ARCHITECTURE.md) avant de changer d’hébergeur.

Avant chaque push : vérifier `git diff --cached`, les chemins suivis et le résultat du contrôle de secrets en CI. En cas de fuite, révoquer immédiatement le secret chez son fournisseur : supprimer un fichier dans un commit ultérieur ne retire pas le secret de l’historique.
