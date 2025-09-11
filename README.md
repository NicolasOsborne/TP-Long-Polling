# Nicolas OSBORNE

# Applications en temps réel - TP Long Polling

## Contexte

Ce TP est réalisé dans le cadre du module "Applications en Temps Réel" en M2 Ingénierie du Web à l'ESGI, dispensé par Laurent BELLON.

## Objectif du TP

Ce projet implémente un système de type "mini-Trello" où le statut de plusieurs tâches est mis à jour en temps réel sur tous les clients connectés, en utilisant la technique de Long Polling.

## Technologies utilisées

- Node.js et Express
- HTML, CSS et Vanilla JS

## Lancer l'application

- S'assurer d'avoir Node.js d'installé

- Installer les dépendances :

```bash
cd server
npm install
npm install express
```

- Lancer l'application :

```bash
node server.js
```

- Accéder à l'application à l'addresse http://localhost:3000

## Implémentation et défis

### Fonctionnement général :

Le client envoie une requête GET au serveur en demandant le statut d'une tâche spécifique et en indiquant la dernière version qu'il connaît.

Le serveur reçoit la requête. Au lieu de répondre immédiatement, il examine la version de la tâche. Si la version du client est obsolète, il envoie la nouvelle information instantanément. Si le client est à jour, le serveur maintient la connexion HTTP ouverte sans envoyer de réponse.

Notification de changement : Un autre client ou une action externe peut déclencher une requête POST pour mettre à jour l'état d'une tâche. Lorsque cela se produit, le serveur met à jour le statut en mémoire et parcourt toutes les requêtes en attente pour cette tâche afin d'envoyer la nouvelle information à chaque client, ce qui a pour effet de fermer ces connexions.

Timeout et Relance : Pour éviter que les connexions ne restent ouvertes indéfiniment, le serveur impose une limite de temps. Si aucun changement n'a lieu avant le timeout, il envoie une réponse vide (204 No Content) et le client se relance immédiatement avec une nouvelle requête.

### Défis et Solutions :

Gestion des requêtes multiples : Le principal défi était de gérer plusieurs requêtes de Long Polling pour différentes tâches en même temps. La solution a été d'utiliser un objet JavaScript (waitingClients) sur le serveur, où chaque clé correspond à l'identifiant d'une tâche et la valeur est un tableau des objets de réponse (res) en attente pour cette tâche.

Cohérence des données : Pour garantir que chaque client reçoive la bonne mise à jour, un système de numéro de version (statusVersion) a été mis en place. Chaque fois que l'état d'une tâche change, sa version est incrémentée. Cela permet au client de déterminer si sa copie locale est à jour ou si elle a manqué des mises à jour.
