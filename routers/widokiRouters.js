const express = require('express');
const widokiController = require('../controllers/widokiController');
const authController = require('../controllers/authController');
const platnosciController = require('../controllers/platnosciController')

const Router = express.Router();

Router.get('/me', authController.ochrona, widokiController.getKonto); // authController.ochrona nie powinno się łączyć z authController.zalogowany
Router.get('/moje-wycieczki', authController.ochrona, widokiController.getMojeWycieczki); // authController.ochrona nie powinno się łączyć z authController.zalogowany

Router.use(authController.zalogowany); // ustawia locals.uzytkownik, jeżeli zalogowany dla wszystkich poniżej

Router.get('/', platnosciController.utworzCheckoutPlatnosci, widokiController.getPrzegladWycieczek); //platnosciController.utworzCheckoutPlatnosci dodaje płatności do bazy 
Router.get('/wycieczka/:slug', widokiController.getWycieczka);
Router.get('/login', widokiController.getLogin);
Router.post('/submit-dane', authController.ochrona, widokiController.submitDaneUzytkownika);

module.exports = Router; // musi  być exports, bo inaczej nie działa 