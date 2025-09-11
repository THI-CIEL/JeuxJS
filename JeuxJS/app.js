'use strict';

console.log('TP-CIEL Podechard - Démarrage du serveur...');

var port = 80;
var express = require('express');
var exp = express();

// Configuration du serveur Express
exp.use(express.static(__dirname + '/www'));
exp.get('/', function (req, res) {
    console.log('Réponse à un client');
    res.sendFile(__dirname + '/www/textchat.html');
});

exp.get('/qr', function (req, res) {
    console.log('Réponse à un client - Page QR');
    res.sendFile(__dirname + '/www/qr.html');
});

/*  *************** serveur WebSocket express *********************   */
var expressWs = require('express-ws')(exp);

/*  ****************** Broadcast clients WebSocket  **************   */ 
var aWss = expressWs.getWss('/echo');
var aWssQR = expressWs.getWss('/qr');
var WebSocket = require('ws'); 

aWss.broadcast = function broadcast(data) { 
    console.log("Broadcast aux clients navigateur : %s", data); 
    aWss.clients.forEach(function each(client) { 
        if (client.readyState == WebSocket.OPEN) { 
            client.send(data, function ack(error) { 
                console.log("    -  %s-%s", client._socket.remoteAddress, 
client._socket.remotePort); 
                if (error) { 
                    console.log('ERREUR websocket broadcast : %s', error.toString()); 
                } 
            }); 
        } 
    }); 
};

aWssQR.broadcast = function broadcast(data) { 
    console.log("Broadcast question aux clients QR : %s", data); 
    aWssQR.clients.forEach(function each(client) { 
        if (client.readyState == WebSocket.OPEN) { 
            client.send(data, function ack(error) { 
                console.log("    -  %s-%s", client._socket.remoteAddress, 
client._socket.remotePort); 
                if (error) { 
                    console.log('ERREUR websocket broadcast QR : %s', error.toString()); 
                } 
            }); 
        } 
    }); 
};

// Connexion des clients à la WebSocket /echo et événements associés
exp.ws('/echo', function (ws, req) {
    console.log('Connexion WebSocket de %s sur le port %s',
        req.socket.remoteAddress, req.socket.remotePort);

    ws.on('message', function (message) {
        console.log('Message de %s:%s - %s',
            req.socket.remoteAddress, req.socket.remotePort, message);
        
        // Ajoute l'adresse IP de l'expéditeur au message
        var ipAddress = req.headers['x-forwarded-for'] || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress ||
                       (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                       '172.17.50.133'; // IP par défaut si aucune détectée (la mienne)
        
        // Nettoyer l'adresse IPv6 mapped vers IPv4
        if (ipAddress.startsWith('::ffff:')) {
            ipAddress = ipAddress.substring(7);
        } else if (ipAddress === '::1') {
            ipAddress = '172.17.50.133';
        }
        
        var messageAvecIP = ipAddress + ' : ' + message;
        
        // Diffuser le message avec l'IP à tous les clients connectés
        aWss.broadcast(messageAvecIP);
    });

    ws.on('close', function (reasonCode, description) {
        console.log('Déconnexion WebSocket de %s:%s - Code: %s, Raison: %s',
            req.socket.remoteAddress, req.socket.remotePort, reasonCode, description);
    });

    ws.on('error', function (error) {
        console.error('Erreur WebSocket:', error);
    });
});

/*  ****************** Variables globales jeu Questions/Réponses **************   */
var question = '?'; 
var bonneReponse = 0; 

/*  ****************** Connexion clients WebSocket /qr - Jeu Q/R **************   */
// Connexion des clients à la WebSocket /qr et événements associés 
// Questions/réponses 
exp.ws('/qr', function (ws, req) { 
    console.log('Connexion WebSocket QR de %s sur le port %s', 
        req.socket.remoteAddress, req.socket.remotePort); 
    
    // Envoyer une nouvelle question dès la connexion
    NouvelleQuestion(); 
 
    ws.on('message', TraiterReponse); 
 
    ws.on('close', function (reasonCode, description) { 
        console.log('Déconnexion WebSocket QR de %s:%s - Code: %s, Raison: %s', 
            req.socket.remoteAddress, req.socket.remotePort, reasonCode, description); 
    }); 

    ws.on('error', function (error) {
        console.error('Erreur WebSocket QR:', error);
    });
 
    /*  ****************** Traitement des réponses **************   */
    function TraiterReponse(message) { 
        console.log('Réponse de %s:%s - %s', req.socket.remoteAddress, 
            req.socket.remotePort, message); 
        
        // Vérifier si la réponse est correcte
        if (message == bonneReponse) { 
            console.log('Bonne réponse ! Nouvelle question générée.');
            
            // Envoyer message de succès uniquement à celui qui a répondu
            ws.send('Bonne réponse ! Bravo !');
            
            // Attendre 3 secondes puis envoyer nouvelle question
            setTimeout(function() {
                NouvelleQuestion();
            }, 3000);
        } else {
            console.log('Mauvaise réponse de %s:%s', req.socket.remoteAddress, req.socket.remotePort);
            
            // Envoyer message d'échec uniquement à celui qui a répondu
            ws.send('Mauvaise réponse. Essayez encore !');
            
            // Remettre la question actuelle après 3 secondes
            setTimeout(function() {
                ws.send(question);
            }, 3000);
        }
    } 
 
    /*  ****************** Génération de nouvelles questions **************   */
    function NouvelleQuestion() { 
        var x = GetRandomInt(11); 
        var y = GetRandomInt(11); 
        question = x + ' * ' + y + ' = ?'; 
        bonneReponse = x * y; 
        
        console.log('Nouvelle question générée: %s (réponse: %d)', question, bonneReponse);
        aWssQR.broadcast(question);         
    } 
 
    /*  ****************** Générateur de nombres aléatoires **************   */
    function GetRandomInt(max) { 
        return Math.floor(Math.random() * Math.floor(max)); 
    } 
});

// Démarrage du serveur (une seule fois)
var server = exp.listen(port, function () {
    console.log('Serveur Express et WebSocket en écoute sur le port %d', port);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', function () {
    console.log('\nArrêt du serveur...');
    server.close(function () {
        console.log('Serveur arrêté');
        process.exit(0);
    });
});

process.on('SIGTERM', function () {
    console.log('\nArrêt du serveur...');
    server.close(function () {
        console.log('Serveur arrêté');
        process.exit(0);
    });
});

// Empêcher la fermeture de la console
process.stdin.resume();