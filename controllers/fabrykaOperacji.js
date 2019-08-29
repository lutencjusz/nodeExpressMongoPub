const przechwycAsyncErrors = require('../utils/przechwycAsyncErrors');
const AppError = require('./../utils/appError');
const APIParametry = require('../utils/APIParametry');

exports.deleteUsunFabryka = Model => przechwycAsyncErrors(async (req, res, next) => {

    const dokument = await Model.findByIdAndDelete(req.params.id); // jeżeli nic ma nie wychodzić do przeglądarki

    if (!dokument) {
        return next(new AppError('fabrykaOperacji: deleteUsunFabryka: Nie znaleziono dokumentu o takim ID', 404)); //musi być return, zeby nie wykoanł następnej komendy 
    }

    res.status(204).json({
        status: 'ok',
        dane: {
            dokument // nie muszę stosować dokument: dokument
        }
    });
});

exports.patchZmienFabryka = Model => przechwycAsyncErrors(async (req, res, next) => {
    const dokument = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true // uruchamia  validatory
    });

    if (!dokument) {
        return next(new AppError('fabrykaOperacji: patchZmienFabryka: Nie znaleziono dokumentu o takim ID', 404)); //musi być return, zeby nie wykoanł następnej komendy 
    }

    res.status(200).json({
        status: 'ok',
        dane: {
            dokument // nie muszę stosować dokument: dokument
        }
    });
});

exports.postUtworzFabryka = Model => przechwycAsyncErrors(async (req, res, next) => {

    const dokument = await Model.create(req.body);
    res.status(201).json({
        status: 'ok',
        dane: {
            dokument
        }
    });
});

exports.getPobierzPojedynczyFabryka = (Model, populateOpcja) => przechwycAsyncErrors(async (req, res, next) => { // pobiera dokumnet na podstawie id

    let zapytanie = Model.findById(req.params.id);
    if (populateOpcja) zapytanie = zapytanie.populate(populateOpcja) // jeżeli są jakieś opcje to używa virtual populate
    const dokument = await zapytanie;

    if (!dokument) {
        return next(new AppError('fabrykaOperacji: getFabryka: Nie znaleziono dokumentu o takim ID', 404)); //musi być return, zeby nie wykoanł następnej komendy 
    }

    res.status(200).json({
        status: 'ok',
        dane: {
            dokument // nie muszę stosować dokument: dokument
        }
    });
});

exports.getPobierzWszystkieFabryka = Model => przechwycAsyncErrors(async (req, res, next) => {
    let filtr = {};
    if (req.params.idWycieczki) filtr = {
        wycieczka: req.params.idWycieczki
    }; // jeżeli jest podany idWycieczki, to wtedy filtruje po wycieczce. Używany w recenzjeController

    const dodatki = new APIParametry(Model.find(filtr), req.query)
        .filtr() //uruchamia klasę metodą filtru
        .sort()
        .ograniczeniePol()
        .paginacja();
    // const dokument = await dodatki.query.explain(); // zamienia query na tablice, ponieważ query jest promise
    // .explain() służy do analizy zapytania
    const dokument = await dodatki.query;
    res.status(200).json({
        status: 'ok',
        wynik: dokument.length,
        dane: {
            dokument // nie muszę stosować dokument: dokument
        }
    });
});