const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
    promisify
} = require('util'); // przerabia metodę na promise
const Uzytkownik = require('../models/uzytkownicyModel');
const przechwycAsyncErrors = require('./../utils/przechwycAsyncErrors');
const AppError = require('./../utils/appError');
// const wyslijEmail = require('./../utils/email'); // wyparte przez Email
const Email = require('./../utils/email');

const pobierzToken = id => {
    return jwt.sign({ //pobiera JWT token z servera
        id // nie musi być id: id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const utworzWyslijToken = (nowyUzytkownik, statusCode, res) => { // tworzy token i wysyła pełne info o użytkowniku

    const cookieOpcje = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 1000),
        httpOnly: true // dostęp do cookie tylko przez przeglądarkę
    }
    if (process.env.NODE_ENV.trim() === 'production') cookieOpcje.secure = true; // cookie będzie wysyłany tylko przy połaczeniu HTTPS na produkcji

    const token = pobierzToken(nowyUzytkownik._id); // pobieraz token użytkownika
    res.cookie('jwt', token, cookieOpcje);

    nowyUzytkownik.password = undefined; // usuwa hasło z widoku przy tworzeniu użytkownika, ale nie usuwa z bazy

    res.status(statusCode).json({
        status: 'ok',
        token,
        dane: {
            uzytkownik: nowyUzytkownik
        }
    });
}
//funkcje middleware
exports.signup = przechwycAsyncErrors(async (req, res, next) => { // tworzenie użytkownika
    const nowyUzytkownik = await Uzytkownik.create({ // nie używamy req.body, bo bedą włamania
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    const url = `${req.protocol}://${req.get('host')}/me`; // tworzy link url do ustawień użytkownika w środowiska developerskiego
    await new Email(nowyUzytkownik, url).wyslijWitam(); // wysyła powitalny email

    utworzWyslijToken(nowyUzytkownik, 201, res);
});

exports.login = przechwycAsyncErrors(async (req, res, next) => {
    const {
        email,
        password
    } = req.body; // pobiera email i password z req.body, sktrócony zapis

    // sprawdza czy email i password istenieją
    if (!email || !password) {
        return next(new AppError('authController: login: Proszę podać prawidłowy email lub hasło', 400)); // return musi być, żeby nie zwracał błedu
    }
    // sprawdza czy email i password są poprawne
    const nowyUzytkownik = await Uzytkownik.findOne({
        email // zastodowany uproszczony zapis zamiast email:email
    }).select('+password'); // musi być, bo w modelu select password: false

    if (!nowyUzytkownik || !(await nowyUzytkownik.czyPrawidloweHaslo(password, nowyUzytkownik.password))) { // jeżeli nie ma użytkownika, to nie wykona się druga część
        // musi być, await bo funkcja jest async i przepuszcza każde hasło
        return next(new AppError('authController: login: Nieprawidłowy email lub hasło', 401)); // return musi być, żeby nie zwracał błedu
    }

    utworzWyslijToken(nowyUzytkownik, 200, res); // tworzy token i wysyła odpowiedź

});

exports.logout = (req, res) => {
    res.cookie('jwt', 'wylogowany', {
        expires: new Date(Date.now() + 5 * 1000),
        httpOnly: true
    })

    res.status(200).json({
        status: 'ok'
    })
}

exports.forgotPassword = przechwycAsyncErrors(async (req, res, next) => {
    // pobierz użytkownika na podstawie Email
    const nowyUzytkownik = await Uzytkownik.findOne({
        email: req.body.email
    });
    if (!nowyUzytkownik) return next(new AppError('authController: forgotPassword: Nie znaleniono użytkownika po email!', 404));

    const resetToken = nowyUzytkownik.utworzenieResetTokena();
    await nowyUzytkownik.save({
        validateBeforeSave: false // wyłącza wszystkie validatory w Schema
    });


    // wysłanie do użytkownika mejlem
    const resetowanieURL = `${req.protocol}://${req.get(
        'host'
        )}/api/v1/uzytkownicy/resetPassword/${resetToken}`;

    /*
    // wyparte przez Email
    // generowanie losowego tokena
    const message = `Zapomniałeś hasła? Kliknij załączony link, aby zresetować hasło ${resetowanieURL}\n 
    Jeśli nie chcesz zmianić hasła, zignorój ten mejl.`;
    */

    console.log('Wysyłam mejla...');
    try {
        /*
        // wyparte przez Email
        await wyslijEmail({
            email: nowyUzytkownik.email,
            subject: 'Zmiana hasła Wycieczki (ważne 10 min)',
            message
        });*/

        await new Email(nowyUzytkownik, resetowanieURL).wyslijResetHasla();

        res.status(200).json({
            status: 'ok',
            message: `Token wysłany mejlem na ${nowyUzytkownik.email}`
        });
    } catch (err) {
        nowyUzytkownik.passwordResetToken = undefined;
        nowyUzytkownik.passwordResetExpires = undefined;
        await nowyUzytkownik.save({
            validateBeforeSave: false
        }); // wyłącza wszystkie validatory w Schema
        return next(new AppError('authController: forgotPassword: Błąd podczas wysyłania hasła mejlem', 500))
    }
});

exports.resetPassword = przechwycAsyncErrors(async (req, res, next) => {
    const hashedToken = crypto // token pobiera z parametru w uzytkownicyRouter
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const nowyUzytkownik = await Uzytkownik.findOne({ // znajduje po dwóch kategoriach
        passwordResetToken: hashedToken,
        passwordResetExpires: { // sprawdza, czy hasło wyekspajrowało
            $gt: Date.now()
        }
    });

    if (!nowyUzytkownik) return next(new AppError('authController: resetPassword: Token jest błędny lub wyexpirował!', 400))

    // ustawianie parametrów hasła
    nowyUzytkownik.password = req.body.password;
    nowyUzytkownik.passwordConfirm = req.body.passwordConfirm;
    nowyUzytkownik.passwordResetExpires = undefined;
    nowyUzytkownik.passwordResetToken = undefined;
    await nowyUzytkownik.save(); // zapisuje użytkownika w bazie z validacją middleware

    utworzWyslijToken(nowyUzytkownik, 201, res); // tworzy token i wysyła odpowiedź
});

exports.ochrona = przechwycAsyncErrors(async (req, res, next) => { // sprawdza, czy token jest prawidłowy
    // probranie tokena z nagłówka, który jest po słowie token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // pobiera drugi element po spacji
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt // wyciąga token z cookie
    }
    // console.log(`podany token: ${token}`);

    if (!token) {
        return next(new AppError('authController: ochrona: Nie jesteś zalogowany. Zaloguj się, aby mieć dostęp!', 401));
    }

    // weryfikacja tokena
    const zdekodowany = await promisify(jwt.verify)(token, process.env.JWT_SECRET) // weryfikuje token z secret z przerobieniem motody na Promise

    // sprawdzenie, czy  użytkownik nadal istenieją
    const zdekodowanyUzytkownik = await Uzytkownik.findById(zdekodowany.id);
    if (!zdekodowanyUzytkownik) {
        return next(new AppError('authController: ochrona: Token użytkownika nie jest już ważny. Zaloguj się, aby mieć dostęp!', 401));
    }
    // czy użtykownik zmieniał  hasło po przyznaniu tokena
    if (zdekodowanyUzytkownik.czyZmianaHaslaPo(zdekodowany.iat)) {
        return next(new AppError('authController: ochrona: hasło zostało zmienione po pobraniu tokena. Zaloguj się, aby mieć dostęp!', 401));
    };

    req.nowyUzytkownik = zdekodowanyUzytkownik; // przekazuje do dalszego wykorzystania w middleware, nie przekazuje do viewierów
    res.locals.uzytkownik = zdekodowanyUzytkownik; // przekazanie uzytkownika do widoku
    next();
});


exports.zalogowany = async (req, res, next) => { // sprawdza, użytkownik jest zalogowany, nie zwraca błedu
    // probranie tokena z nagłówka, który jest po słowie token
    try {
        let token;
        if (req.cookies.jwt) {
            token = req.cookies.jwt // wyciąga token z cookie

            // weryfikacja tokena
            const zdekodowany = await promisify(jwt.verify)(token, process.env.JWT_SECRET) // weryfikuje token z secret z przerobieniem motody na Promise

            // sprawdzenie, czy  użytkownik nadal istenieją
            const zdekodowanyUzytkownik = await Uzytkownik.findById(zdekodowany.id);
            if (!zdekodowanyUzytkownik) {
                return next();
            }
            // czy użtykownik zmieniał  hasło po przyznaniu tokena
            if (zdekodowanyUzytkownik.czyZmianaHaslaPo(zdekodowany.iat)) {
                return next();
            };
            res.locals.uzytkownik = zdekodowanyUzytkownik; // każda przeglądarka widzi zmienne z res.locals
        }
        next();
    } catch (err) {
        return next();
    }
};

exports.ograniczenieDo = (...roles) => { // sposób na przekazanie parametrów do middleware
    return (req, res, next) => {
        // roles to tablica ['administrator', 'lead-gosc']
        if (!roles.includes(req.nowyUzytkownik.role)) { //roles.include - bada, czy zawiera się w tablicy
            // req.nowyUzytkownik jest ustawiony w poprzedniej metodzie ochrona
            return next(new AppError('authController: ograniczenieDo: nie masz uprawnień do wykonania tego zadania!', 403));
        }
        next();
    };
}

exports.zmianaHasla = przechwycAsyncErrors(async (req, res, next) => {
    // pobierz użytkownika z bazy danych na podstawie nowyUzytkownik ustawiony w ochrona
    const nowyUzytkownik = await Uzytkownik.findById(req.nowyUzytkownik.id).select('+password'); // pobiera użytkownika na podstawie id i dodatkowo hasło

    // sprawdzenie, czy hasło z POST jest aktualne
    console.log(req.body.passwordCurrent, nowyUzytkownik.password)
    if (!(await nowyUzytkownik.czyPrawidloweHaslo(req.body.passwordCurrent, nowyUzytkownik.password))) {
        return next(new AppError('authController: użyte hasło nie jest prawidłowe!', 401));
    }
    // zmień hasło
    nowyUzytkownik.password = req.body.password;
    nowyUzytkownik.passwordConfirm = req.body.passwordConfirm; // musi  być, żeby walidacja w passwordConfirm przepuściła
    await nowyUzytkownik.save(); // zapisuje użytkowika z walidacjami
    // nowyUzytkownik.findByIdAndUpdate nie zadziała, save w uzytkownicyModel nie będzie działać

    // zaloguj się i wyślij JWT
    utworzWyslijToken(nowyUzytkownik, 201, res); // tworzy token i wysyła odpowiedźS
})