var ipServeur = 'localhost';     // Adresse ip du serveur
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
    ws = new WebSocket('ws://' + ipServeur + '/qr');          // Nouvelle Websocket

    ws.onclose = function (evt) {
        console.log('WebSocket fermée - Code:', evt.code, 'Raison:', evt.reason);
        document.getElementById('question').value = 'Connexion fermée';
    };

    ws.onopen = function () {
        console.log('WebSocket ouverte - Connexion établie avec le serveur');
        document.getElementById('question').value = 'Connecté au serveur - En attente de question...';
    };

    ws.onmessage = function (evt) {
        console.log('Message reçu du serveur:', evt.data);
        document.getElementById('question').value = evt.data;
    };

    ws.onerror = function (error) {
        console.error('Erreur WebSocket:', error);
        document.getElementById('question').value = 'Erreur de connexion';
    };
}

function ControleIHM() {
    document.getElementById('Valider').onclick = BPValider;             // Bouton Valider
}

function BPValider() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        var reponse = document.getElementById('reponse').value;
        console.log('Réponse envoyée au serveur:', reponse);
        ws.send(reponse);
        document.getElementById('reponse').value = ''; // Vider le champ après envoi
    } else {
        alert('WebSocket non connectée');
    }
}

// Fermer proprement la WebSocket quand la page se ferme
window.addEventListener('beforeunload', function () {
    if (ws) {
        ws.close();
    }
});
