const express = require('express');
const wycieczkiController = require('../controllers/wycieczkiController');
const authController = require('../controllers/authController');
const recenzjeRouters = require('../routers/recenzjeRouters');

const Router = express.Router();

// Router.param('id', wycieczkiController.sprawdzId);
/*
Router // zastąpionne przez mergeParams
    .route('/:idWycieczki/recenzje') // idWycieczki, bo obsługa jest w recenzjeController
    .post(
        authController.ochrona, 
        authController.ograniczenieDo('uzytkownik'), 
        recenzjeController.postUtworzRecenzje);
*/

Router.use('/:idWycieczki/recenzje', recenzjeRouters);

// ustawienie routingu
Router // wybiera 5 najlepszych wycieczek
    .route('/top/:ilosc?') //? dla pola opcjonalnego
    .get(wycieczkiController.getTop, wycieczkiController.getWszystkieWycieczki);

Router // wybiera 5 najlepszych wycieczek
    .route('/get-plan-miesieczny/:rok/:miesiac?') //? dla pola opcjonalnego
    .get(
        authController.ochrona,
        authController.ograniczenieDo('admin', 'lead-gosc'),
        wycieczkiController.getPlanMiesieczny
    );

Router
    .route('/get-statystyki-wycieczek')
    .get(wycieczkiController.getStatystykiWycieczek);

Router
    .route('/wycieczki-w-zasiegu/:odleglosc/srodek/:wspolrzedne/jednostka/:jednostka')
    .get(wycieczkiController.getWycieczkiWZasiegu);

Router
    .route('/odleglosc/:wspolrzedne/jednostka/:jednostka')
    .get(wycieczkiController.getWycieczkiOdleglosc);

Router
    .route('/')
    .get(wycieczkiController.getWszystkieWycieczki)
    .post(
        authController.ochrona,
        authController.ograniczenieDo('admin', 'lead-guest'),
        wycieczkiController.postUtworzWycieczke
    );
//.post(wycieczkiController.sprawdzNamePrice, wycieczkiController.postZapiszWycieczke);
Router
    .route('/:id')
    .get(wycieczkiController.getWycieczke)
    .patch(
        authController.ochrona,
        authController.ograniczenieDo('admin', 'lead-guest'),
        wycieczkiController.ladowanieObrazowWycieczki,
        wycieczkiController.zmianaRozmiaruObrazowWycieczki,
        wycieczkiController.patchZmienWycieczke
    )
    .delete(
        authController.ochrona,
        authController.ograniczenieDo('admin', 'lead-guest'),
        wycieczkiController.deleteUsunWycieczke
    );

module.exports = Router;