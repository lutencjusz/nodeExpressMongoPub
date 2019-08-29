const AppError = require('./../utils/appError');

const przechwytujCastErrorDB = err => {
    // zamienia error z mongoose na operacyjny dla CastError
    const message = `errorController: przechwytujCastErrorDB: Błędna scieżka ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const przechwytujValidationErrorDB = err => {
    // zamienia error z mongoose na operacyjny dla ValidationError}
    const errors = Object.values(err.errors).map(el => el.message); //mapuje pole meesage w tablicę
    const message = `errorController: przechwytujValidationErrorDB: Niewłaściwe wartości pól: ${errors.join('. ')}`; // łączy tablicę w jeden ciąg, czyli pokazuje od razu wszystkie błedy
    return new AppError(message, 400);
};
const przechwytujDuplicateFieldsDB = err => {
    // zamienia error z mongoose na operacyjny dla duplikatu
    const wart = err.errmsg.match(/(["])(\\?.)*?\1/)[0];
    const message = `errorController: przechwytujDuplicateFieldsDB: Zdublikowane pole: ${wart}`;
    return new AppError(message, 400);
};
const przechwytujJWTError = () =>
    new AppError('errorController: przechwytujJWTError: Niewłaściwy token, zaloguj się ponownie!', 401); // z automatu dodaje return przed appError
const przechwytujJWTTokenExpiredError = () =>
    new AppError('errorController: przechwytujJWTTokenExpiredError: Token stracił ważność, zaloguj się ponownie!', 401); // z automatu dodaje return przed appError

const wyslijErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // orginalUrl to url bez hosta
        // console.error('errorController: wyslijErrorDev: błąd 💥:', err);
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: `errorController: wyslijErrorDev: błąd: ${err.message}`,
            stack: err.stack,
        });
    }
    // w przypadku, jeżeli bład dotyczy widoku, to uruchamia template error
    return res.status(err.statusCode).render('error', {
        title: 'Coś poszło nie tak!',
        komunikat: err.message,
    });

};
const wyslijErrorPro = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // bład operacyjny - wysłanie komunikatu do klienta
        if (err.isOperational) {
            console.error('errorController: wyslijErrorPro: err.isOperational: błąd 💥:', err);
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        console.error('errorController: wyslijErrorPro: !err.isOperational: błąd 💥:', err);
        // błąd programistyczny - nie wysyłaj szczegółów do klienta
        return res.status(500).json({ // jeżeli jest return, to nie używamy else
            status: 'error',
            message: 'errorController: wyslijErrorPro: Coś poszło nie tak. Skontaktuj się z administratorem!',
        });
    }
    if (err.isOperational) {
        console.error('errorController: wyslijErrorPro: err.isOperational: błąd 💥:', err);
        // w przypadku, jeżeli bład dotyczy widoku, to uruchamia template error
        return res.status(err.statusCode).render('error', {
            title: 'Coś poszło nie tak!',
            komunikat: err.message,
        });
    }
    console.error('errorController: wyslijErrorPro: !err.isOperational: błąd 💥:', err);
    // w przypadku, jeżeli bład dotyczy widoku, to uruchamia template error
    return res.status(err.statusCode).render('error', { // jeżeli jest return, to nie używamy else
        title: 'Coś poszło nie tak!',
        komunikat: 'Spróbuj później!',
    });

};

// tą metodę można wykorzystać w middleware - app.use()
module.exports = (err, req, res, next) => {
    // middleware do obsługi centralnych błędów
    // obsługa bez własnej klasy
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    console.log(err.stack); // pokazuje stos błędu
    if (process.env.NODE_ENV.trim() === 'development') {
        wyslijErrorDev(err, req, res);
    } else if (process.env.NODE_ENV.trim() === 'production') {
        let error = {
            // kopiowanie err
            ...err,
        };
        error.message = err.message; // rozwiązanie błedu 
        if (error.name === 'CastError') error = przechwytujCastErrorDB(error);
        // przechwytuje err operacyjne z bazy danych dotyczące CastError
        if (error.code === 11000) error = przechwytujDuplicateFieldsDB(error);
        // przechwytuje err operacyjne z bazy danych dotyczące Duplicate fields
        if (error.name === 'ValidationError') error = przechwytujValidationErrorDB(error);
        // przechwytuje err operacyjne z bazy danych dotyczące Duplicate fields
        if (error.name === 'JsonWebTokenError') error = przechwytujJWTError();
        if (error.name === 'TokenExpiredError') error = przechwytujJWTTokenExpiredError();
        wyslijErrorPro(error, req, res);
    }
};