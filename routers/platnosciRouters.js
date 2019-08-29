const express = require('express');
const platnosciController = require('../controllers/platnosciController');
const authController = require('../controllers/authController');

const Router = express.Router();

Router.use(authController.ochrona);

Router.get('/checkout-sesja/:idWycieczki', platnosciController.checkoutSesja);

Router.use(authController.ograniczenieDo('admin', 'lead-guest'));

Router
    .route('/')
    .get(platnosciController.getWszystkiePlatnosci)
    .post(platnosciController.postUtworzPlatnosc);


Router
    .route('/:id')
    .get(platnosciController.getPobierzPlatnosc)
    .patch(platnosciController.patchZmienPlatnosc)
    .delete(platnosciController.deleteUsunPlatnosc)

module.exports = Router; // musi  być exports, bo inaczej nie działa 