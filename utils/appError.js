class AppError extends Error {
    constructor(message, statusCode) {
        console.log(`AppError: błąd: ${message}`);
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'błąd' : 'error'; // jeżeli statusCode zaczyna się od 4
        this.isOperational = true; // czy błąd jest operacyjny i warto wysyłać odpowiedź
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;