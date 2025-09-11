var ipServeur = 'localhost';     // Adresse ip du serveur (changé pour localhost)
var ws;                             // Variable pour l'instance de la WebSocket.

window.onload = function () {           // Main
    if (TesterLaCompatibilite()) {
        ConnexionAuServeurWebsocket();
    }
    ControleIHM();
}

function TesterLaCompatibilite() {          // Test de compatibilité Websocket - Navigateur
    let estCompatible = true;
    if (!('WebSocket' in window)) {
        window.alert('WebSocket non supporté par le navigateur');
        estCompatible = false;
    }
    return estCompatible;
}

/*  ***************** Connexion au serveur WebSocket ********************   */
function ConnexionAuServeurWebsocket() {
    ws = new WebSocket('ws://' + ipServeur + '/echo');          // Nouvelle Websocket

    ws.onclose = function (evt) {
        console.log('WebSocket fermée - Code:', evt.code, 'Raison:', evt.reason);
        document.getElementById('messageRecu').value = 'Connexion fermée';
    };

    ws.onopen = function () {
        console.log('WebSocket ouverte - Connexion établie avec le serveur');
        document.getElementById('messageRecu').value = 'Connecté au serveur';
    };

    ws.onmessage = function (evt) {
        console.log('Message reçu du serveur:', evt.data);
        document.getElementById('messageRecu').value = evt.data;
    };

    ws.onerror = function (error) {
        console.error('Erreur WebSocket:', error);
        document.getElementById('messageRecu').value = 'Erreur de connexion';
    };
}

function ControleIHM() {
    document.getElementById('Envoyer').onclick = BPEnvoyer;             // Bouton Envoyer
}

function BPEnvoyer() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        var message = document.getElementById('messageEnvoi').value;
        console.log('Message envoyé au serveur:', message);
        ws.send(message);
        document.getElementById('messageEnvoi').value = ''; // Vider le champ après envoi
    } else {
        console.warn('Tentative échouée - WebSocket non connectée');
        alert('WebSocket non connectée');
    }
}

// Fermer proprement la WebSocket quand la page se ferme
window.addEventListener('beforeunload', function () {
    if (ws) {
        ws.close();
    }
});