const mongoose = require('mongoose');

const platnosciSchema = new mongoose.Schema({
    wycieczka: {
        type: mongoose.Schema.ObjectId,
        ref: 'Wycieczki',
        required: [true, 'Płatności muszą mieć wycieczkę']
    },
    uzytkownik: {
        type: mongoose.Schema.ObjectId,
        ref: 'Uzytkownicy',
        required: [true, 'Płatności muszą być płacone przez użytkownika']
    },
    cena: {
        type: Number,
        required: [true, 'Płatności muszą mieć cenę']
    },
    dataUtworzenia: {
        type: Date,
        default: Date.now()
    },
    platnosc: {
        type: Boolean,
        default: true
    }
});

platnosciSchema.pre(/^find/, function (next) { // uzupełnia referencję do wycieczek, wszytkie pre muszą mieć next
    // wszystkie populate muszą być przed mongoose.model
    this.populate({
            path: 'uzytkownik',
            select: 'name'
        })
        .populate({
            path: 'wycieczka',
            select: 'name'
        });
    next();
})

const Platnosci = mongoose.model('Platnosci', platnosciSchema);

module.exports = Platnosci;