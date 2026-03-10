# 🚀 Guide de démarrage - Velo Info

## Prérequis

- Node.js 20+
- Yarn
- Firebase CLI : `npm install -g firebase-tools`
- Compte Firebase (créé)
- Compte Strava Developer (pour obtenir les clés API)

---

## 📋 ÉTAPE 1 : Configuration Strava

### 1.1 Créer une application Strava

1. Allez sur https://www.strava.com/settings/api
2. Cliquez sur "Create an App" (ou modifiez votre app existante)
3. Remplissez :
   - **Application Name** : Velo Info
   - **Category** : Training
   - **Website** : http://localhost:4200 (pour dev)
   - **Authorization Callback Domain** : `localhost:4200` ⚠️ IMPORTANT pour OAuth
4. Notez vos credentials :
   - `Client ID`
   - `Client Secret`

> **Note OAuth** : Si vous avez déjà une app Strava avec uniquement `localhost`, vous DEVEZ mettre à jour le **Authorization Callback Domain** vers `localhost:4200` pour que l'authentification fonctionne.

### 1.2 Obtenir le Refresh Token

**🎯 Objectif** : Obtenir un `refresh_token` qui permettra à vos Cloud Functions d'accéder automatiquement à Strava.

---

#### **ÉTAPE A : Autoriser l'accès via le navigateur** 🌐

1. **Construisez votre URL d'autorisation** :
   - Prenez votre **Client ID** noté à l'étape 1.1 (par exemple : `145678`)
   - Remplacez `145678` dans l'URL ci-dessous par votre vrai Client ID :

```
https://www.strava.com/oauth/authorize?client_id=145678&redirect_uri=http://localhost&response_type=code&scope=activity:read_all
```

2. **Ouvrez cette URL dans votre navigateur** (Chrome, Edge, Firefox...)

3. **Cliquez sur le bouton "Authorize"** sur la page Strava

4. **Vous allez voir une page d'erreur, c'est NORMAL !** 
   - La barre d'adresse ressemblera à ça :
   ```
   http://localhost/?state=&code=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
   &scope=read,activity:read_all
   ```

5. **Copiez UNIQUEMENT la partie après `code=` et avant `&scope`**
   - Dans l'exemple ci-dessus, copiez : `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

---

#### **ÉTAPE B : Échanger le code contre un refresh token** 💻

## 🧸 VERSION ULTRA-SIMPLE (comme pour un enfant)

### 1️⃣ Ouvre PowerShell
- Clique sur le bouton Windows (en bas à gauche)
- Tape "PowerShell"
- Clique sur "Windows PowerShell"
- Une fenêtre bleue s'ouvre

### 2️⃣ Copie TOUTES ces lignes (les 12 lignes !)

Sélectionne TOUT le texte ci-dessous en cliquant au début et en tirant jusqu'à la fin :

```
$body = @{
    client_id = "ICI_TON_CLIENT_ID"
    client_secret = "ICI_TON_CLIENT_SECRET"
    code = "ICI_TON_CODE"
    grant_type = "authorization_code"
}

$response = Invoke-RestMethod -Uri "https://www.strava.com/oauth/token" -Method Post -Body $body
Write-Host "`n=== VOICI VOTRE REFRESH TOKEN ===" -ForegroundColor Green
Write-Host $response.refresh_token -ForegroundColor Yellow
Write-Host "`n"
$response | ConvertTo-Json
```

### 3️⃣ Change ces 3 choses dans le texte :

**AVANT de coller dans PowerShell, change :**

- À la ligne 2 : Remplace `ICI_TON_CLIENT_ID` par ton vrai numéro (exemple : si ton Client ID est 123456, écris `"123456"`)
- À la ligne 3 : Remplace `ICI_TON_CLIENT_SECRET` par ton secret (garde les guillemets `"` au début et à la fin)
- À la ligne 4 : Remplace `ICI_TON_CODE` par le code copié dans l'étape A (garde les guillemets `"`)

**Exemple concret :**
Si ton Client ID est `123456`, ton secret est `abc789xyz`, et ton code est `def456`, ça doit ressembler à ça :

```
$body = @{
    client_id = "123456"
    client_secret = "abc789xyz"
    code = "def456"
    grant_type = "authorization_code"
}

$response = Invoke-RestMethod -Uri "https://www.strava.com/oauth/token" -Method Post -Body $body
Write-Host "`n=== VOICI VOTRE REFRESH TOKEN ===" -ForegroundColor Green
Write-Host $response.refresh_token -ForegroundColor Yellow
Write-Host "`n"
$response | ConvertTo-Json
```

### 4️⃣ Colle dans PowerShell

- Dans la fenêtre bleue PowerShell, fais **Clic droit** → Le texte se colle automatiquement
- Appuie sur la touche **Entrée** de ton clavier

### 5️⃣ Tu vas voir apparaître

Des lignes de texte, et en JAUNE tu verras ton **refresh_token** qui ressemble à ça :
```
xyz789abc123def456ghi789jkl012mno345pqr678stu901
```

**Copie ce texte jaune, c'est lui que tu utiliseras à l'ÉTAPE 2.2 !**

---

#### **📋 Ce que vous devriez voir dans PowerShell :**

```
=== VOICI VOTRE REFRESH TOKEN ===
xyz789abc123def456ghi789jkl012mno345pqr678stu901

{
  "token_type": "Bearer",
  "expires_at": 1709483245,
  "expires_in": 21600,
  "refresh_token": "xyz789abc123def456ghi789jkl012mno345pqr678stu901",
  "access_token": "temp_access_token_123456...",
  "athlete": {
    "id": 123456,
    "username": "votre_nom",
    ...
  }
}
```

**🎯 COPIEZ le `refresh_token`** (la ligne en jaune dans le terminal) :
```
xyz789abc123def456ghi789jkl012mno345pqr678stu901
```

✅ **C'est ce token que vous utiliserez à l'ÉTAPE 2.2 !**

---

#### **❌ Si vous avez une erreur :**

**Erreur "Bad Request"** → Le code a expiré (valable 10 min), recommencez l'ÉTAPE A

**Erreur "Invalid credentials"** → Vérifiez votre Client ID et Client Secret

---

## 📋 ÉTAPE 2 : Configuration Firebase

### 2.1 Initialiser Firebase dans le projet

Dans le dossier racine du projet :

```powershell
firebase login
firebase init
```

Sélectionnez :
- ✅ Functions
- ✅ Hosting
- ✅ Firestore

Choisissez le projet Firebase que vous avez créé.

### 2.2 Activer Firebase Authentication (Anonymous) ⚠️ IMPORTANT

**🔐 Cette étape est OBLIGATOIRE pour que l'application fonctionne :**

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet **velo-info**
3. Cliquez sur **"Authentication"** dans le menu de gauche
4. Allez dans l'onglet **"Sign-in method"**
5. Cliquez sur **"Anonymous"**
6. **Activez** le provider Anonymous (bouton toggle)
7. Cliquez sur **"Save"**

✅ **Vérification** : Vous devriez voir "Anonymous" avec le statut "Enabled" dans la liste.

> **Pourquoi ?** L'application utilise Firebase Anonymous Auth pour créer des identifiants uniques pour chaque utilisateur. Sans cela, vous obtiendrez l'erreur : `Firebase: Error (auth/configuration-not-found)`

### 2.3 Configurer les secrets Strava dans Firebase

### 2.3 Configurer les secrets Strava dans Firebase

**🔐 Nouvelle méthode (Firebase Secrets) :**

```powershell
firebase functions:secrets:set STRAVA_CLIENT_ID
# Quand demandé, collez votre Client ID et appuyez sur Entrée

firebase functions:secrets:set STRAVA_CLIENT_SECRET
# Quand demandé, collez votre Client Secret et appuyez sur Entrée

firebase functions:secrets:set STRAVA_REFRESH_TOKEN
# Quand demandé, collez votre Refresh Token (obtenu à l'étape 1.2) et appuyez sur Entrée
```

Vérifiez que les secrets sont bien configurés :
```powershell
firebase functions:secrets:access STRAVA_CLIENT_ID
```

### 2.4 Créer les secrets pour l'émulateur local (optionnel)

Pour le développement local, créez le fichier `functions/.secret.local` :

```
STRAVA_CLIENT_ID=VOTRE_CLIENT_ID
STRAVA_CLIENT_SECRET=VOTRE_CLIENT_SECRET
STRAVA_REFRESH_TOKEN=VOTRE_REFRESH_TOKEN
```

⚠️ **Ajoutez `.secret.local` au `.gitignore` !**

---

## 📋 ÉTAPE 3 : Configuration Angular + Firebase

### 3.1 Installer Angular Fire

```powershell
ng add @angular/fire
```

Sélectionnez votre projet Firebase et activez :
- ✅ Firestore
- ✅ Functions

### 3.2 Vérifier firebase.json

Le fichier `firebase.json` doit contenir :
```json
{
  "hosting": {
    "public": "dist/velo-info/browser",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions"
  }
}
```

---

## 📋 ÉTAPE 4 : Installer les dépendances

### 4.1 Backend (Cloud Functions)

```powershell
cd functions
yarn install
cd ..
```

### 4.2 Frontend (Angular)

```powershell
yarn install
```

---

## 📋 ÉTAPE 5 : Déployer les Cloud Functions

```powershell
cd functions
yarn build
firebase deploy --only functions
```

Après le déploiement, notez les URLs de vos fonctions :
- `syncAllActivities`
- `checkSyncStatus`
- `stravaWebhook`
- `getActivityDetail`

---

## 📋 ÉTAPE 6 : Initialiser la base de données (Première synchro)

### Option A : Via l'émulateur Firebase (recommandé pour dev)

```powershell
# Terminal 1 : Démarrer l'émulateur
cd functions
yarn serve

# Terminal 2 : Appeler la fonction depuis Angular ou via curl
```

### Option B : Via les fonctions déployées

Depuis votre app Angular (ou via Postman), appelez :

```typescript
// 1. Lancer la première page avec reset
const result = await functions.httpsCallable('syncAllActivities')({ 
  page: 1, 
  reset: true, 
  perPage: 200 
});

// 2. Si result.count === 200, continuer avec page 2, 3, etc.
// Répéter jusqu'à ce que result.count === 0
```

---

## 📋 ÉTAPE 7 : Configurer le Webhook Strava (optionnel mais recommandé)

Pour recevoir les nouvelles activités en temps réel :

1. Récupérez l'URL de votre fonction `stravaWebhook`
2. Allez sur https://www.strava.com/settings/api
3. Créez une "Webhook Subscription" :
   - **Callback URL** : `https://REGION-PROJECT_ID.cloudfunctions.net/stravaWebhook`
   - **Verify Token** : Remplacez `YOUR_VERIFY_TOKEN` dans le code par un token secret de votre choix

---

## 📋 ÉTAPE 8 : Démarrer l'application Angular

```powershell
yarn start
```

Ouvrez http://localhost:4200

---

## 🔧 Commandes utiles

### Développement local avec émulateurs

```powershell
# Terminal 1 : Émulateurs Firebase
firebase emulators:start

# Terminal 2 : App Angular
yarn start
```

### Build & Deploy complet

```powershell
# Build Angular
ng build --configuration production

# Deploy tout (hosting + functions)
firebase deploy
```

### Logs des Cloud Functions

```powershell
firebase functions:log --only syncAllActivities
```

---

## 📊 Structure Firestore attendue

Après la première synchro, vous devriez avoir :

```
/activities/{activityId}
  - id
  - name
  - distance
  - moving_time
  - metrics { intensity, fatigue, ... }

/stats/global
  - totalDistance
  - totalElevation
  - totalRides

/stats/monthly/summaries/{YYYY_MM}
  - distance
  - elevation
  - count

/_metadata/sync
  - lastSyncDate
  - lastKnownStravaCount
  - syncStatus
```

---

## ❓ Troubleshooting

### "Firebase: Error (auth/configuration-not-found)" ⚠️ PRIORITAIRE

**Symptômes :**
- Erreur lors de la connexion Strava
- Erreur `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=... 400 (Bad Request)`
- Erreur `No Firebase user ID`
- Message : `Firebase: Error (auth/configuration-not-found)`

**Solution :**
Firebase Anonymous Auth n'est pas activé. Suivez ces étapes :

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet **velo-info**
3. Cliquez sur **"Authentication"** dans le menu de gauche
4. Allez dans l'onglet **"Sign-in method"**
5. Cliquez sur **"Anonymous"**
6. **Activez** le provider Anonymous (toggle à droite)
7. Cliquez sur **"Save"**
8. **Rechargez votre application** (F5)

✅ Après activation, l'authentification devrait fonctionner automatiquement au chargement de la page.

### "Failed to exchange Strava authorization code"

**Symptômes :**
- Erreur après redirection depuis Strava
- Le callback échoue

**Solutions :**
1. Vérifiez que le **Authorization Callback Domain** dans Strava est bien `localhost:4200`
2. Vérifiez que `clientSecret` est bien dans `environments.ts`
3. Le code d'autorisation expire après 10 minutes - réessayez la connexion

### "Missing or insufficient permissions" dans Firestore

**Symptômes :**
- Erreur lors de la synchronisation : `FirebaseError: Missing or insufficient permissions`

**Cause :** Firebase Auth n'était pas activé ou l'utilisateur n'est pas authentifié.

**Solution :**
1. Activez Firebase Anonymous Auth (voir ci-dessus)
2. Assurez-vous que les règles Firestore requièrent l'authentification (déjà fait)
3. Rechargez l'application pour obtenir un nouveau token d'authentification

### "Cannot find module 'firebase-admin'"
```powershell
cd functions
yarn install
```

### "Strava configuration missing"
```powershell
firebase functions:secrets:access STRAVA_CLIENT_ID
# Si erreur, refaire ÉTAPE 2.2
```

### "CORS error" dans Angular
Vérifiez que vos fonctions sont bien déployées et que vous utilisez les bons endpoints.

### Rate limit Strava
Strava limite à 100 requêtes/15min et 1000/jour. Utilisez `perPage=200` pour minimiser les appels.

---

## 📝 Prochaines étapes

1. ✅ Initialiser la base avec toutes les activités
2. ✅ Configurer le webhook Strava
3. ✅ Créer les composants Angular pour afficher les stats
4. 🔄 Implémenter la synchro incrémentale au login
5. 🔄 Implémenter les métriques Exploration & Régularité
