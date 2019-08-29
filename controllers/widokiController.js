const Wycieczki = require('../models/wyczieczkiModel');
const Uzytkownik = require('../models/uzytkownicyModel');
const przechwycAsyncErrors = require('../utils/przechwycAsyncErrors');
const Platnosci = require('../models/platnosciModel');
// const AppError = require('../utils/appError');


exports.getStronaGlowna = (req, res) => {
    res.status(200).render('baza', {
        wycieczka: 'Przykładowa wycieczka'
    }); // ustawienie routingu dla pug np. baza.pug 
}

exports.getPrzegladWycieczek = przechwycAsyncErrors(async (req, res, next) => { // jeżeli jest przechwycAsyncErrors to musi być next

    const wycieczki = await Wycieczki.find(); // pobieranie wycieczek z bazy danych

    res.status(200).render('przeglad', {
        naglowek: 'wszystkie wycieczki',
        wycieczki
    }); // ustawienie routingu dla pug np. baza.pug 
});

exports.getWycieczka = przechwycAsyncErrors(async (req, res, next) => { // jeżeli jest przechwycAsyncErrors to musi być next

    const wycieczka = await Wycieczki.findOne({ // findOne umożliwia wyszukiwanie po slug
        slug: req.params.slug
    }).populate({
        path: 'recenzje',
        fields: 'recenzja ranking uzytkownik'
    });

    /*
    // Nie jest potrzebna ta obsługa, bo jest obsługa w errorController wyslijErrorDev i wyslijErrorPro
    if (!wycieczka) { // bez tego zwraca błąd, jeżeli nie znaleziono wycieczki z takim slug'iem
        return next(new AppError('Nie ma wycieczki z tą nazwą', 404));
    }
    */
    res.status(200).render('wycieczka', {
        naglowek: `${wycieczka.name}`,
        wycieczka
    }); // ustawienie routingu dla pug np. baza.pug 
});

exports.getMojeWycieczki = przechwycAsyncErrors(async (req, res, next) => {
    const platnosci = await Platnosci.find({
        uzytkownik: req.nowyUzytkownik.id // podanie samego użytkownik powoduje szukanie id
    });
    const idWycieczek = platnosci.map(el => el.wycieczka); // tworzy tablice złożoną z id wycieczek
    const wycieczki = await Wycieczki.find({
        _id: {
            $in: idWycieczek
        }
    });

    res.status(200).render('przeglad', {
        naglowek: 'Moje wycieczki',
        wycieczki
    })
});

exports.getLogin = (req, res) => {
    res.status(200).render('login', {
        naglowek: 'Logowanie do konta'
    });
}

exports.getKonto = (req, res) => {
    res.status(200).render('konto', {
        naglowek: 'Zarządzanie kontem'
    });
}

exports.submitDaneUzytkownika = przechwycAsyncErrors(async (req, res, next) => { // stosowane przy metodzie action w formularzu
    console.log(req.body);
    const zaktualizowanyUzytkownik = await Uzytkownik.findByIdAndUpdate(req.nowyUzytkownik.id, {
        name: req.body.name,
        email: req.body.email // wymienienie wszystkich pól zabezpiecza przed hakowaniem hasła
    }, {
        new: true,
        runValidators: true // uruchamia walidatory z modelu
    });
    res.status(200).render('konto', {
        naglowek: 'Zarządzanie kontem',
        uzytkownik: zaktualizowanyUzytkownik
    });
});