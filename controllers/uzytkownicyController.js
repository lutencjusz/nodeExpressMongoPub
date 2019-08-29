const multer = require('multer'); // musi być ładowany przed kontrolerami
const sharp = require('sharp');
const Uzytkownicy = require('../models/uzytkownicyModel');
const przechwycAsyncErrors = require('../utils/przechwycAsyncErrors');
const AppError = require('./../utils/appError');
const fabrykaOperacji = require('./fabrykaOperacji');

/*
// zrezygnowano ze względu na trzymanie w pamięci 
const multerMagazyn = multer.diskStorage({ // ustawia parametry miejsca przechowywania zdjęć
    destination: (req, file, cb) => {
        cb(null, 'public/img/users');
    },
    filename: (req, file, cb) => { // ustawia nazwę pliku
        const rozszerzenie = file.mimetype.split('/')[1]; // pobiera rozszerzenie z drugiego członu minetype
        cb(null, `uzytkownik-${req.nowyUzytkownik.id}-${Date.now()}.${rozszerzenie}`);
    }
});
*/

const multerMagazyn = multer.memoryStorage(); // jeżeli chcemy trzymać sciągnięty obrazek w pamięci

const multerFiltr = (req, file, cb) => { // sprawdza, czy to jest obrazek
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('uzytkownicyController: multerFiltr: Plik nie jest obrazem!', 400), false);
    }
}
const ladowanieOpcje = multer({
    storage: multerMagazyn,
    fileFilter: multerFiltr
});

const filterObj = (obj, ...allowedFields) => { // po ... podaje listę pól, które układają się w tablicy
    const newObj = {};
    Object.keys(obj).forEach(el => { // tworzy tablicę kluczy z obj
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

/*
// zastąpionne przez fabrykaOperacji
exports.getWszyscyUzytkownicy = przechwycAsyncErrors(async (req, res) => {
    const uzytkownicy = await Uzytkownicy.find();

    res.status(200).json({
        status: 'ok',
        wynik: uzytkownicy.length,
        data: {
            uzytkownicy
        }
    });
});
*/

exports.ladowanieFotoUzytkownika = ladowanieOpcje.single('photo'); // pobiera zdjęcie z parametru photo

exports.zmianaRozmiaruFoto = przechwycAsyncErrors(async (req, res, next) => {
    if (!req.file) return next() // jeżeli nie ma zdjęcia, to nic nie robi

    //const rozszerzenie = req.file.mimetype.split('/')[1]; // pobiera rozszerzenie z drugiego członu minetype, ale nie używamy, bo będzie jpeg
    req.file.filename = `uzytkownik-${req.nowyUzytkownik.id}.jpeg` // pominąłem -${Date.now()}, żeby było tylko jedno zdjęcie użytkownika

    await sharp(req.file.buffer) // req.file.buffer tam jest trzymany obrazek, jeżeli trzymamy w pamięci multer.memoryStorage(), await, żeby next nie wykonał się wcześniej
        .resize(300, 300) // zmiana wielkości obrazka
        .toFormat('jpeg') // zmiana formatu na skompresowany
        .jpeg({
            quality: 80 // zmienia jakość na 80%
        })
        .toFile(`public/img/users/${req.file.filename}`); // na początku nie może być /public...

    next();
});

exports.pobierzMnie = przechwycAsyncErrors(async (req, res, next) => { // pobiera id z zapytania middleware
    req.params.id = req.nowyUzytkownik.id;
    next();
})

exports.zmienMnie = przechwycAsyncErrors(async (req, res, next) => {

    // tworzy error jeżeli użytkownik chce zmienić hasło
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('uzytkownicyController: zmienMnie: Nie można zmienić hasła tą operacją. Użyj /updateMyPassword!', 400))
    }

    const filtrowaneBody = filterObj(req.body, 'name', 'email'); // filtrowanie blokuje zmiane pól, które nie powiny być zmieniane. Wymienione tylko pola dozwolone

    if (req.file) filtrowaneBody.photo = req.file.filename; // jeżeli nastąpiła zmiana foto, to photo jest dodane do filtrowaneBody
    const zmienionyUzytkownik = await Uzytkownicy.findByIdAndUpdate(req.nowyUzytkownik.id, filtrowaneBody, { // x bo zmienia tylko email i name - blokuje zmiane roli na admin
        new: true, // tworzy kopię użytkownika
        runValidators: true // uruchamia jednak walidatory jak przy SAVE
    })

    res.status(200).json({
        status: 'ok',
        data: {
            zmienionyUzytkownik
        }
    });
})

exports.deleteMe = przechwycAsyncErrors(async (req, res, next) => {
    await Uzytkownicy.findByIdAndUpdate(req.nowyUzytkownik.id, {
        active: false
    });

    res.status(204).json({
        status: 'ok',
        data: null // dobra praktyka, że nic nie zwraca
    });
})

/*
// zastąpionne przez fabrykaOperacji
exports.getUzytkownika = (req, res) => {
    res.status(500).json({
        status: 'błąd',
        message: 'użytkownicyController: Operacja jeszcze nie zaimplemnetowana.'
    });
};
*/

exports.getWszyscyUzytkownicy = fabrykaOperacji.getPobierzWszystkieFabryka(Uzytkownicy);
exports.getUzytkownika = fabrykaOperacji.getPobierzPojedynczyFabryka(Uzytkownicy);
exports.getZmienUzytkownika = fabrykaOperacji.patchZmienFabryka(Uzytkownicy);
exports.deleteUsunUzytkownika = fabrykaOperacji.deleteUsunFabryka(Uzytkownicy);