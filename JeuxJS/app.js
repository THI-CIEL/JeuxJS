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

/*  *************** serveur WebSocket express *********************   */
var expressWs = require('express-ws')(exp);

/*  ****************** Broadcast clients WebSocket  **************   */ 
var aWss = expressWs.getWss('/echo');
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

// Connexion des clients à la WebSocket /echo et événements associés
exp.ws('/echo', function (ws, req) {
    console.log('Connexion WebSocket de %s sur le port %s',
        req.socket.remoteAddress, req.socket.remotePort);

    ws.on('message', function (message) {
        console.log('Message de %s:%s - %s',
            req.socket.remoteAddress, req.socket.remotePort, message);
        
        // Ajouter l'adresse IP de l'expéditeur au message
        var ipAddress = req.headers['x-forwarded-for'] || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress ||
                       (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                       '172.17.50.133'; // IP par défaut si aucune détectée
        
        // Nettoyer l'adresse IPv6 mapped vers IPv4
        if (ipAddress.startsWith('::ffff:')) {
            ipAddress = ipAddress.substring(7);
        } else if (ipAddress === '::1') {
            ipAddress = '172.17.50.133'; // Utiliser votre IP réseau au lieu de localhost
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