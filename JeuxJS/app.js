'use strict';

console.log('TP-CIEL Podechard - Démarrage du serveur...');

var port = 80;
var express = require('express');
var exp = express();

// Configuration du serveur Express
exp.use(express.static(__dirname + '/www'));
exp.get('/', function (req, res) {
    console.log('Réponse à un client');
    res.sendFile(__dirname + '/www/index.html');
});

/*  *************** serveur WebSocket express *********************   */
var expressWs = require('express-ws')(exp);

// Connexion des clients à la WebSocket /echo et événements associés
exp.ws('/echo', function (ws, req) {
    console.log('Connexion WebSocket de %s sur le port %s',
        req.socket.remoteAddress, req.socket.remotePort);

    ws.on('message', function (message) {
        console.log('Message de %s:%s - %s',
            req.socket.remoteAddress, req.socket.remotePort, message);
        ws.send(message);
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
    console.log('\nArrêt du serveur en cours...');
    server.close(function () {
        console.log('Serveur arrêté proprement');
        process.exit(0);
    });
});

process.on('SIGTERM', function () {
    console.log('\nArrêt du serveur demandé...');
    server.close(function () {
        console.log('Serveur arrêté proprement');
        process.exit(0);
    });
});

// Empêcher la fermeture de la console
process.stdin.resume();