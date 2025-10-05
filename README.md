# Collecte API 2025 – Restaurants du Cœur

Bienvenue sur le projet **Collecte API 2025** dédié à la gestion des collectes pour les Restaurants du Cœur.

## 🌟 Objectif

Cette API permet de gérer les campagnes de collecte de denrées, les centres, les magasins partenaires et le suivi des utilisateurs impliqués dans l’organisation.

## 🚀 Fonctionnalités principales

- Gestion des collectes : création, mise à jour, archivage, suivi des statuts
- Gestion des centres et magasins partenaires
- Suivi des utilisateurs et des rôles
- Statistiques et reporting

## 🛠️ Technologies

- NestJS (Node.js)
- TypeORM (MySQL)
- Docker (base de données et phpMyAdmin)
- Jest (tests unitaires)
- GitHub Actions (CI/CD)

## 📦 Démarrage rapide

1. **Cloner le projet**
   ```sh
   git clone https://github.com/remymoro/collecte-api-2025.git
   cd collecte-api-2025
   ```

2. **Lancer la base de données avec Docker**
   ```sh
   docker-compose up -d
   ```

3. **Installer les dépendances**
   ```sh
   npm install
   ```

4. **Lancer l’API en développement**
   ```sh
   npm run start:dev
   ```

5. **Accéder à phpMyAdmin**
   - [http://localhost:8080](http://localhost:8080)
   - Utilisateur : `root` / Mot de passe : `secret`

## 🧪 Lancer les tests unitaires

```sh
npm run test
```

## 🔒 Variables d'environnement

> **Note :** Les variables d'environnement ne sont pas encore privées car il s'agit juste d'un projet d'apprentissage. Pense à les sécuriser si tu utilises ce projet en production.

## 🤝 Contribuer

Les contributions sont les bienvenues !  
N’hésitez pas à ouvrir une issue ou une pull request pour proposer des améliorations ou signaler un bug.

---

**Pour toute question ou suggestion, contacte l’équipe technique des Restaurants du Cœur.**