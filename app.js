const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const app = express(); // dla express domyślną aplikacją jest app.js i musi być załadowana przed ...Routers

app.enable('trust proxy') // zaufanie do proxy - konieczne, żeby działało heroku

app.set('view engine', 'pug'); // automatycznie ustawia template engine na pug
app.set('views', path.join(__dirname, 'views')); // normalizuje zapis ścieżki dostępu do kat. views i pokazuje, gdzie jest katalog pug

app.use(express.static(path.join(__dirname, 'public'))); //udostępnia publicznie katalog w tym do elemtów z pub

const morgan = require('morgan');
const AppError = require('./utils/appError.js'); // własna klasa obsługi błędów
const errorController = require('./controllers/errorController.js');
const wycieczkiRouter = require('./routers/wycieczkiRouters'); // moduł aplikacji
const uzytkownicyRouter = require('./routers/uzytkownicyRouters'); // moduł aplikacji
const recenzjeRouter = require('./routers/recenzjeRouters'); // moduł aplikacji
const widokiRouter = require('./routers/widokiRouters'); // moduł aplikacji
const platnosciRouter = require('./routers/platnosciRouters'); // moduł aplikacji

// funkcje middleware
app.use(helmet()); // middleware firmy 3, zawsze uruchamiane na początku, dodaje parametry bezpieczeństwa do nagłówka
if (process.env.NODE_ENV === 'development') console.log('załadowano helmet...');

if (process.env.NODE_ENV === 'development') {
    console.log('Tryb developerski...')
    app.use(morgan('dev')); // middleware firmy 3 pokazuje parametry zapytania
} else {
    console.log(`Nie używam trybu developerskiego, tylko ${process.env.NODE_ENV}...`);
}

const limitLogowania = rateLimit({ // ustawienia limitu logowania
    max: 100, // maksymalna ilość prób
    windowMs: 60 * 60 * 1000, // okno czasowe w ms
    message: '<h3>Zbyt wiele prób logowań z tego IP, spróbuj za godzinę!</h3>'
})
app.use('/api', limitLogowania); // uruchamia limiter tylko gdy w URL jest api
if (process.env.NODE_ENV === 'development') console.log('załadowano limit logowania na 100/h...');


app.use(express.json({ // middleware - dostępne są zawartości w req.body i res.body.
    limit: '10kb' // Ustawia limit body na 10kb
}));
if (process.env.NODE_ENV === 'development') console.log('ustawiono limit dla req, res.body na 10kb...');

app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
})); // umożliwia zwracanie danych (name) formularza poprzez active submit

app.use(cookieParser()); // umozliwa parsowanie cookies

app.use(mongoSanitize()); //chroni przed NoSQL query injection np. przy logowaniu "email": {"$gt":""}
// usuwa z body wszystkie $ i :

app.use(xss()); // chroni przed wprowadzaniem kodu JavaScript w HTML przez parametry poprzez zamianę znaków np. <
if (process.env.NODE_ENV === 'development') console.log('załadowano cookieParser, mongoSanitize, xss...');

app.use(hpp({ // chroni przed błędnymi parametrami ignorując je lub uwzględnia ostatni prawidłowy
    whitelist: [ // parametry udostępnione, żeby powtarzać, ale nie chroni przed błędnymi wartościami parametrów
        'duration',
        'ratingsAverage',
        'ratingsQuantity',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));
if (process.env.NODE_ENV === 'development') console.log('załadowano hpp i ustawiono whiteliste na parametry...');

app.use(compression()) // kompresuje tekst wysyłany do klienta

app.use((req, res, next) => {
    // ta funkcja musi posiadać trzy argumenty oraz musi być przed app.route
    console.log(
        `Cześć z middleware, IP: ${req.ip}; ${req.hostname}; ${req.user}`
    );
    next(); // ta funckaja musi być, jeżeli ma być middleware
});

app.use((req, res, next) => {
    req.czasWyslania = new Date().toLocaleTimeString(); //dopisuje parametr do pytania
    //console.log(req.cookies);
    console.log(`uzupełniłem czasWyslania na ${req.czasWyslania}...`);
    next();
});

// dodwanie routingu

app.use('/', widokiRouter); // middleware ustawienie routingu i podłączenie aplikacji
app.use('/api/v1/uzytkownicy', uzytkownicyRouter); // middleware ustawienie routingu i podłączenie aplikacji
app.use('/api/v1/wycieczki', wycieczkiRouter); // middleware ustawienie routingu i podłączenie aplikacji
app.use('/api/v1/recenzje', recenzjeRouter);
app.use('/api/v1/platnosci', platnosciRouter);

app.all('*', (req, res, next) => { // middleware ustawienie routingu nieznanego kolejność * jest ważna
    // kod poniżej zastąpiony przez AppError
    /*res.status(404).json({
        status: 'błąd',
        message: `Podana ścieżka (${req.originalUrl}) nie jest znana!`
    })*/

    /*const err = new Error(`Podana ścieżka (${req.originalUrl}) nie jest znana!`);
    err.status = 'błąd';
    err.statusCode = 404;
    next(err); // middleware wie, że to jest błąd i trzeba uruchomić centralną obsługę błędów middleware
    */
    next(new AppError(`Podana ścieżka (${req.originalUrl}) nie jest znana!`));
});

app.use(errorController); // wykorzystując własną klasę typu globalErrorHandler 

module.exports = app;