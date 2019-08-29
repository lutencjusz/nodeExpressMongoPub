const multer = require('multer'); // musi być ładowany przed kontrolerami
const sharp = require('sharp');
const Wycieczki = require('../models/wyczieczkiModel');
const przechwycAsyncErrors = require('../utils/przechwycAsyncErrors');
const fabrykaOperacji = require('./fabrykaOperacji');
const AppError = require('./../utils/appError');

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

exports.ladowanieObrazowWycieczki = ladowanieOpcje.fields([{ // określa pola i ilości plików z obazami oraz ładuje do req.fields
    name: 'imageCover',
    maxCount: 1
}, {
    name: 'images',
    maxCount: 5
}])

// ladowanieOpcje.single('imageCover'); // req.file
// ladowanieOpcje.array('images', 5); // req.files

exports.zmianaRozmiaruObrazowWycieczki = przechwycAsyncErrors(async (req, res, next) => {

    if (!req.files.imageCover || !req.files.images) return next();

    req.body.imageCover = `wycieczka-${req.params.id}-cover.jpg`; // uzupełniając req.body.imageCover potem z automatu zostanie uzupełnione przez fabrykaOperacji.patchZmienFabryka
    await sharp(req.files.imageCover[0].buffer) // req.file.buffer tam jest trzymany obrazek, jeżeli trzymamy w pamięci multer.memoryStorage(), await, żeby next nie wykonał się wcześniej
        .resize(2000, 1333) // zmiana wielkości obrazka na 3:2
        .toFormat('jpeg') // zmiana formatu na skompresowany
        .jpeg({
            quality: 90 // zmienia jakość na 80%
        })
        .toFile(`public/img/tours/${req.body.imageCover}`); // na początku nie może być /public...

    req.body.images = []; // tworzy pustą tablicę w req.body.images

    await Promise.all(
        req.files.images.map(async (obraz, i) => { // nie może być async w foreach, zamiast tego jest map i Promise
            const nazwaObrazu = `wycieczka-${req.params.id}-${i+1}.jpg`; // bo i zaczyna się od 0
            req.body.images.push(nazwaObrazu);
            await sharp(obraz.buffer) // req.file.buffer tam jest trzymany obrazek, jeżeli trzymamy w pamięci multer.memoryStorage(), await, żeby next nie wykonał się wcześniej
                .resize(2000, 1333) // zmiana wielkości obrazka na 3:2
                .toFormat('jpeg') // zmiana formatu na skompresowany
                .jpeg({
                    quality: 90 // zmienia jakość na 80%
                })
                .toFile(`public/img/tours/${nazwaObrazu}`);
        }));

    next();
});


// pobranie danych dotyczących z pliku wycieczek
// const wycieczki = JSON.parse(
//    fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// funkcje routingu - sprawdzenia middleware
// 
// Fukcja do testowania middleware
/*
exports.sprawdzId = (req, res, next, val) => {
    console.log(`Sprawdza id: ${val}...`)
    if (val * 1 > wycieczki.length) // uruchamia się middleware tylko gdy wystąpi parametr
        return res.status(404).json({ // bez return nie przerwałby działania
            system: 'błąd',
            message: 'Niewłasciwe id'
        });
    next();
}
*/

// W schema jest validator, więc nie trzeba już sprawdzać
/*
exports.sprawdzNamePrice = (req, res, next) => {
    console.log(`Sprawdzam name: ${req.body.name}, price: ${req.body.price}`)
    if (!req.body.name || !req.body.price)
        return res.status(400).json({
            system: 'błąd',
            message: 'brak nazwy lub ceny'
        });
    next();
}
*/

// funkcje routingu - CRUD
/*
exports.deleteUsunWycieczke = (req, res) => {
    res.status(204).json({
        status: 'ok',
        dane: null
    });
};
*/
// korzysta z modelu w bazie danych mongo

/*
// zastąpione przez fabrykaOperacji
exports.getWycieczke = przechwycAsyncErrors(async (req, res, next) => { // przeniesienie obsługi błędów na middleware

    const wycieczka = await Wycieczki.findById(req.params.id).populate('recenzje'); // używa virtual populate
    // Wycieczki.findOne({_id: req.params.id})

    if (!wycieczka) {
        return next(new AppError('Nie znaleziono wycieczki o takim ID', 404)); //musi być return, zeby nie wykoanł następnej komendy 
    }

    res.status(200).json({
        status: 'ok',
        dane: {
            wycieczka // nie muszę stosować wycieczka: wycieczka
        }
    });
    /*
    try {} catch (err) { // obsługa błędów również tych ze schama, niepotrzebna gdy jest globalErrorHandler
        res.status(400).json({
            status: 'błąd',
            komunikat: err
        })
    }*/
// });

/*
// zastąpionne przez fabrykaOperacji
exports.getWszystkieWycieczki = przechwycAsyncErrors(async (req, res, next) => {
    const dodatki = new APIParametry(Wycieczki.find(), req.query)
        .filtr() //uruchamia klasę metodą filtru
        .sort()
        .ograniczeniePol()
        .paginacja();
    const wycieczki = await dodatki.query; // zamienia query na tablice, ponieważ query jest promise

    res.status(200).json({
        status: 'ok',
        wynik: wycieczki.length,
        dane: {
            wycieczki // nie muszę stosować wycieczki: wycieczki
        }
    });
});
*/

/*
// zastąpionne przez fabrykaOperacji
exports.patchZmienWycieczke = przechwycAsyncErrors(async (req, res, next) => {
    const wycieczka = await Wycieczki.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true // uruchamia  validatory
    });

    if (!wycieczka) {
        return next(new AppError('Nie znaleziono wycieczki o takim ID', 404)); //musi być return, zeby nie wykoanł następnej komendy 
    }

    res.status(200).json({
        status: 'ok',
        dane: {
            wycieczka // nie muszę stosować wycieczka: wycieczka
        }
    });
});
*/

/*
// zastąpionne przez fabrykaOperacji
exports.postUtworzWycieczke = przechwycAsyncErrors(async (req, res, next) => {

    const nowaWycieczka = await Wycieczki.create(req.body);
    res.status(201).json({
        status: 'ok',
        dane: {
            wycieczka: nowaWycieczka
        }
    });
    /*
        try {
    } catch (err) { // obsługa błędów również tych ze schama, nie potrzebna gdy jest globalErrorHandler
        res.status(400).json({
            status: 'błąd',
            komunikat: err
        })
    }*/
/*    
});
*/

/*
// usunięte przez fabrykę operacji
exports.deleteUsunWycieczke = przechwycAsyncErrors(async (req, res, next) => {

    const wycieczka = await Wycieczki.findByIdAndDelete(req.params.id); // jeżeli nic ma nie wychodzić do przeglądarki

    // jeżeli chcaiłbym jednak zwrócić informacje o usunięciu, jednak w bestpractice nie należy niczego zwrracać
    /*
    const wycieczka = await Wycieczki.findByIdAndRemove(req.params.id, {
        rawResult: true
    });*/
/*
    if (!wycieczka) {
        return next(new AppError('Nie znaleziono wycieczki o takim ID', 404)); //musi być return, zeby nie wykoanł następnej komendy 
    }

    res.status(204).json({
        status: 'ok',
        dane: {
            wycieczka // nie muszę stosować wycieczka: wycieczka
        }
    });
});
*/

exports.getWszystkieWycieczki = fabrykaOperacji.getPobierzWszystkieFabryka(Wycieczki);
exports.getWycieczke = fabrykaOperacji.getPobierzPojedynczyFabryka(Wycieczki, {
    path: 'recenzje'
}); // można dodać select, żeby ograniczyć pokazywane dane
exports.patchZmienWycieczke = fabrykaOperacji.patchZmienFabryka(Wycieczki);
exports.postUtworzWycieczke = fabrykaOperacji.postUtworzFabryka(Wycieczki);
exports.deleteUsunWycieczke = fabrykaOperacji.deleteUsunFabryka(Wycieczki);

// funkcje z middleware
exports.getTop = (req, res, next) => {
    req.query.limit = req.params.ilosc || '5'; // wszytko musi być stringiem
    req.query.sort = 'price,-ratingsAverage';
    req.query.fields = 'name,price,ratingsAverage';
    next() // zawsze musi być w middleware
};

exports.getStatystykiWycieczek = przechwycAsyncErrors(async (req, res, next) => { // aggregation pipeline
    console.log('Obliczam statystyki wycieczek...')
    const statystyki = await Wycieczki.aggregate([{
            $match: {
                ratingsAverage: {
                    $gte: 4.5
                }
            }
        },
        {
            $group: {
                // _id: null, // null - grupuje po wszystkich _id
                _id: '$difficulty', // '$<nazwa pola>' - można po różnych polach
                // _id: {$toLength: '$difficulty'}, // dodatkowe operatory
                iloscOcen: {
                    $sum: '$ratingsQuantity'
                },
                sredniaOcenNaWycieczke: {
                    $avg: '$ratingsQuantity'
                },
                iloscWycieczek: {
                    $sum: 1 // każdą wycieczkę traktuje jak 1
                },
                sredniaRating: {
                    $avg: '$ratingsAverage'
                },
                sredniaPrice: {
                    $avg: '$price'
                },
                nimPrice: {
                    $min: '$price'
                },
                maxPrice: {
                    $max: '$price'
                }
            }
        }, {
            $sort: { // sortowanie po polach określonych w $group
                iloscWycieczek: 1
            }
        }
        /*, {
                        $match: {
                            _id: {
                                $ne: 'easy' // usuwa sekcje z $group
                            }
                        }
                    }*/
    ]);
    res.status(200).json({
        status: 'ok',
        wynik: statystyki.length,
        statystyki: {
            statystyki // nie muszę stosować wycieczka: wycieczka
        }
    });
});

exports.getPlanMiesieczny = przechwycAsyncErrors(async (req, res, next) => {
    console.log(req.params);
    const rok = req.params.rok * 1; // pobiera z parametrów rok
    const miesiac = req.params.miesiac || '01';
    const plan = await Wycieczki.aggregate([{
            $unwind: '$startDates' // dekomponuje tablice na pojedyncze rekordy
        }, {
            $sort: {
                startDates: 1 // sortuje po startDates
            }
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${rok}-${miesiac}-01`),
                    $lte: new Date(`${rok}-12-31`)
                }
            }
        }, {
            $group: {
                _id: {
                    $month: '$startDates'
                },
                iloscWycieczek: {
                    $sum: 1
                },
                wycieczki: { // tworzy tablice złożoną z pól
                    $push: {
                        nazwa: '$name',
                        dzienRozpoczecia: {
                            $dayOfMonth: '$startDates'
                        }
                    }
                }
            }
        }, {
            $sort: {
                _id: 1 // jeden od najmniejszego, -1 - od największego
            }
        }, {
            $addFields: {
                miesiac: '$_id' // dodaje pole miesiąc z wartością _id
            }
        }, {
            $project: {
                _id: 0 // jeżeli 0, to te pola nie będą pokazywane, 1-będą
            }
        }, {
            $limit: 6 // pokazuje do 6 rekordów
        }
    ]);
    res.status(200).json({
        status: 'ok',
        wynik: plan.length,
        plan: {
            plan // nie muszę stosować plan:plan
        }
    });
});

// metoda nie używa bazy danych
/*
exports.getWycieczke = (req, res) => {
    const id = req.params.id * 1; // mnożenie zamienia string na liczbę
    const wycieczka = wycieczki.find(el => el.id === id); // szuka w tablicy id

    if (!wycieczka)
        // czy została znaleziona jakaś wycieczka z podanym id
        return res.status(404).json({
            system: 'błąd',
            message: 'Niewłasciwy Id'
        });

    res.status(200).json({
        status: 'ok',
        dane: {
            wycieczka: wycieczka
        }
    });
};

exports.getWszystkieWycieczki = (req, res) => {
    res.status(200).json({
        status: 'Sukces',
        czas: req.czasWyslania,
        wyniki: wycieczki.length,
        dane: {
            wycieczki: wycieczki
        }
    });
};

exports.postZapiszWycieczke = (req, res) => {
    const noweId = wycieczki[wycieczki.length - 1].id + 1;
    const nowaWycieczka = Object.assign({
        id: noweId
    }, req.body);

    wycieczki.push(nowaWycieczka);
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(wycieczki),
        err => {
            res.status(201).json({
                status: 'wycieczka zapisana',
                data: {
                    wycieczka: nowaWycieczka
                }
            });
            console.log(`Wyczieczka zapisana. Id: ${noweId}`);
        }
    );
};
*/
// /wycieczki-w-zasiegu/:odleglosc/center/:wspolrzedne/jednostka/:jednostka
exports.getWycieczkiWZasiegu = przechwycAsyncErrors(async (req, res, next) => {
    const {
        odleglosc,
        wspolrzedne,
        jednostka
    } = req.params;
    const [lat, lng] = wspolrzedne.split(',');

    if (!lat || !lng) next(new AppError('Nieprawidłowe współprzędne, proszę wprowadzić jako <dług,szer> geogrficzną!', 400));

    const radiany = jednostka === 'km' ? odleglosc / 6378.1 : odleglosc / 3963.2; // przelicza km lub mi na radiany

    const wycieczki = await Wycieczki.find({
        startLocation: {
            $geoWithin: { // potrzebuje utworzone indeksu typu '2dsphere'
                $centerSphere: [
                    [lng, lat], radiany
                ]
            }
        }
    });

    res.status(200).json({
        status: 'ok',
        wynik: wycieczki.length,
        dane: {
            wycieczki
        }
    });

});

exports.getWycieczkiOdleglosc = przechwycAsyncErrors(async (req, res, next) => {
    const {
        wspolrzedne,
        jednostka
    } = req.params;
    const [lat, lng] = wspolrzedne.split(',');
    const multipiler = jednostka === 'mi' ? 0.000621371 : 0.001; // jeżeli mile, to zmiania parametr multipiler

    if (!lat || !lng) next(new AppError('Nieprawidłowe współprzędne, proszę wprowadzić jako <dług,szer> geogrficzną!', 400));

    const odleglosci = await Wycieczki.aggregate([{
            $geoNear: { // musi być pierwsza w pipleline, więc trzeba wyłączyć wycieczkiSchema.pre('aggregate'...
                // wszystkie rekordy muszą mieć współrzędne, inaczej zgłasza błąd
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1] // wymnaża przez 1, żeby były liczby
                },
                distanceField: 'odległość',
                distanceMultiplier: multipiler // pokazuje w kilometrach, a nie w metrach
            }
        },
        {
            $project: { // ogranicza pokazywane pola
                odległość: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: 'ok',
        wynik: odleglosci.length,
        dane: {
            odleglosci
        }
    });

});