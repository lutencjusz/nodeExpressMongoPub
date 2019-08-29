const express = require('express');
const recenzjeController = require('../controllers/recenzjeController');
const authController = require('../controllers/authController');

const Router = express.Router({
    mergeParams: true
}); // umożliwa widzenie paametru idWycieczki z wycieczkiRouters

Router.use(authController.ochrona);

// obsługuje:
// {{URL}}/api/v1/wycieczki/5c88fa8cf4afda39709c2955/recenzje
// {{URL}}/api/v1/recenzje
Router
    .route('/') // bez mergeParams: true nie widzi parametru z wycieczkiRouters
    .get(recenzjeController.getWszystkieRecenzje)
    .post(
        authController.ograniczenieDo('user'),
        recenzjeController.ustawWycieczkaUzytkownikId,
        recenzjeController.postUtworzRecenzje
    );

Router
    .route('/:id')
    .get(recenzjeController.getPobierzRecenzje)
    .delete(
        authController.ograniczenieDo('admin', 'user'),
        recenzjeController.deleteUsunRecenzje
    )
    .patch(
        authController.ograniczenieDo('admin', 'user'),
        recenzjeController.patchZmienRecenzje
    );

module.exports = Router; // musi  być exports, bo inaczej nie działa 