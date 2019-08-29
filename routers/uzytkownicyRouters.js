const express = require('express');

const uzytkownicyController = require('../controllers/uzytkownicyController');
const authController = require('../controllers/authController');

const Router = express.Router();

Router.post('/signup', authController.signup); // tworzenie użytkownika tylko przez POST
Router.post('/login', authController.login); // logowanie się tylko przez POST
Router.get('/logout', authController.logout); // wylogowanie przez GET
Router.post('/forgotPassword', authController.forgotPassword); // logowanie się tylko przez POST
Router.patch('/resetPassword/:token', authController.resetPassword); // zmiana tylko przez PATCH

Router.use(authController.ochrona); // wszystkie wywołania poniżej, bedą musiały użyć authController.ochrona

Router.patch('/updateMyPassword', authController.zmianaHasla); // sprawdza token bo to tylko dla zalogownych i zmienia hasło 
Router.patch(
    '/updateMe',
    uzytkownicyController.ladowanieFotoUzytkownika,
    uzytkownicyController.zmianaRozmiaruFoto,
    uzytkownicyController.zmienMnie); // sprawdza token bo to tylko dla zalogownych i zmienia dane użytkownika
Router.delete('/deleteMe', uzytkownicyController.deleteMe); // sprawdza token, a potem usuwa
Router
    .route('/mnie')
    .get(
        uzytkownicyController.pobierzMnie,
        uzytkownicyController.getUzytkownika
    );

Router.use(authController.ograniczenieDo('administrator')); // wszystkie poniżej wymagają uprawnień administrator

Router
    .route('/')
    .get(uzytkownicyController.getWszyscyUzytkownicy)
Router
    .route('/:id')
    .get(uzytkownicyController.getUzytkownika)
    .patch(uzytkownicyController.getZmienUzytkownika)
    .delete(
        uzytkownicyController.deleteUsunUzytkownika
    );

module.exports = Router;