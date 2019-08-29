const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');

const uzytkownikSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'użytkownik musi mieć imię i nazwisko :name'],
        trim: true,
        maxlength: [30, 'Zbyt długie imię i naziwsko (max. 30) :name'],
        minlength: [5, 'Zbyt krótkie imię i naziwsko (max. 5) :name'],
        validate: {
            validator: function (val) {
                const valBezSpacji = val.split(' ').join(''); // obcina spacje
                return validator.isAlpha(valBezSpacji, 'pl-PL'); // validator firmy trzeciej
            },
            message: 'imię i nazwisko może się składać tylko ze znaków [a-z][A-Z][ ]:name'
        }
    },
    email: {
        type: String,
        required: [true, 'użytkownik musi mieć email: email'],
        unique: true,
        trim: true,
        validate: [validator.isEmail, 'Musi być poprawny email: email'],
        lowercase: true
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guest', 'lead-guest', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'użytkownik musi mieć hasło: password'],
        trim: true,
        select: false // żeby nie przesyłał hasła przy GET
    },
    passwordConfirm: {
        type: String,
        required: [true, 'hasło jest nie zgodne: passwordConfirm'],
        trim: true,
        validate: {
            validator: function (pass) {
                return pass === this.password; // this. jest widoczne tylko przy operacja na modelSchema create lub save 
            },
            message: 'Potwierdzenie hasła jest różne od hasła'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    toJSON: {
        virtuals: true
    }, // umożliwia pokazywanie i używanie zmiennych virtualnych
    toObject: {
        virtuals: true
    }
});

uzytkownikSchema.pre('save', async function (next) { // middleware ukrycie hasła, musi być async, żeby użyć await
    if (!this.isModified('password')) return next(); // jesli hasło sie nie zmieniło, to nic się nie dzieje
    this.password = await bcryptjs.hash(this.password, 13); // normalny poziom trudności hashowania to 10
    this.passwordConfirm = undefined; // passwordConfirm już nie jest potrzebne, więc nie będzie zapisane w bazie
    next(); // jak we wszystkich middleware
});

uzytkownikSchema.pre('save', function (next) { // ustawia passwordChangedAt
    if (!this.isModified('password') || this.isNew) return next(); // jesli hasło sie nie zmieniło, to nic się nie dzieje
    this.passwordChangedAt = Date.now() - 1000; // jeśli się zmieniło, to ustawia aktualną datę
    // czasami jest tak, że timestamp generuje się później niż JWT token, więc - 1000, żeby nie pojawiał się błąd
    next();
})

uzytkownikSchema.pre(/^find/, function (next) { // jeżeli FIND, to wtedy nie pokazuje uzuniętych (active: false)
    this.find({
        active: {
            $ne: false
        }
    });
    next();
})

uzytkownikSchema.methods.czyPrawidloweHaslo = async function (candidatePassword, userPassword) { //.methods. umożliwia używanie tej metody w innych miejscach
    return await bcryptjs.compare(candidatePassword, userPassword);
}

uzytkownikSchema.methods.czyZmianaHaslaPo = function (JWTTimestamp) {
    if (this.passwordChangedAt) { // sprawdza przez this. ostatni dokument, czy ma ustawiony passwordChangedAt
        const zmienionyTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10); // normalizuje passwordChangedAt
        // console.log(JWTTimestamp, zmienionyTimestamp);
        return JWTTimestamp < zmienionyTimestamp //jeżeli pobrany z tokena czas zmiany jest starszy niż zmiana hasła, to jest true i trzeba się przelogować
    }
    return false; // Jeżeli false, to nic się nie zmieniło
}

uzytkownikSchema.methods.utworzenieResetTokena = function () {
    const resetToken = crypto.randomBytes(32).toString('hex') // tworzy przypadkowy ciąg zanków hex

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({
        resetToken
    }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // +10 minut

    return resetToken;
}

const Uzytkownik = mongoose.model('Uzytkownicy', uzytkownikSchema); // tworzy  nazwę bazy

module.exports = Uzytkownik;