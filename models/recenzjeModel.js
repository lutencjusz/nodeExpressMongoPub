const mongoose = require('mongoose');
const validator = require('validator');
const Wycieczki = require('./wyczieczkiModel');

const recenzjaSchema = mongoose.Schema({
    recenzja: {
        type: String,
        required: [true, 'Pole recenzji jest wymagane'],
        unique: true,
        trim: true,
        maxlength: [500, 'Zbyt długa nazwa recenzji (max. 500) :recenzja'],
        minlength: [5, 'Zbyt krótka nazwa recenzji (max. 5) :recenzja'],
        // validator wyłączony przy imporcie
        validate: {
            validator: function (val) {
                const valBezSpacji = val.split(' ').join(''); // obcina spacje
                const valBezSpacjiCyfr = valBezSpacji.split(/[0-9]/g).join(''); /// obcina liczby
                return validator.isAlpha(valBezSpacjiCyfr, 'pl-PL'); // validator firmy trzeciej
            },
            message: 'Nazwa recenzji może się składać tylko ze znaków [a-z][A-Z][ ]:recenzja'
        }
    },
    ranking: {
        type: Number,
        max: 5,
        min: 1
    },
    dataUtworzenia: {
        type: Date,
        default: Date.now()
    },
    wycieczka: {
        type: mongoose.Schema.ObjectId,
        ref: 'Wycieczki',
        required: [true, 'Pole id wycieczki jest wymagane']
    },
    uzytkownik: { // tworzy referencję do innego zbioru dokumnetów
        type: mongoose.Schema.ObjectId,
        ref: 'Uzytkownicy',
        required: [true, 'Pole id użytkownika jest wymagane']
    }
}, {
    toJSON: {
        virtuals: true
    }, // umożliwia pokazywanie i używanie zmiennych virtualnych
    toObject: {
        virtuals: true
    }
});

recenzjaSchema.index({
    wycieczka: 1,
    uzytkownik: 1
}, {
    unique: true
});

recenzjaSchema.pre(/^find/, function (next) { // wstawia embaded dla wszystkich guides przy find i update
    this.populate({ // populate pobiera dane z obcej kolekcji dokumnetów jako embeded
        path: 'wycieczka',
        select: 'name' // blokuje pokazywanie wybranych pól
    }).populate({
        path: 'uzytkownik',
        select: 'name photo' // pokazuje tylko wybrane pola      
    });
    next();
});

recenzjaSchema.statics.kalkRatingsAverage = async function (wycieczkaId) {
    const statystyki = await this.aggregate([{
            $match: {
                wycieczka: wycieczkaId
            }
        },
        {
            $group: {
                _id: `$wycieczka`,
                nRating: { // wylicza ilość recenzji
                    $sum: 1
                },
                avgRating: { // wylicza średnią z tej ilości
                    $avg: `$ranking`
                }
            }
        }
    ]);
    // console.log(statystyki);
    if (statystyki.length > 0) { // jeśli są jakieś recenzje
        await Wycieczki.findByIdAndUpdate(wycieczkaId, { // zapisuje do wycieczki, musibyć await
            ratingsAverage: statystyki[0].avgRating,
            ratingsQuantity: statystyki[0].nRating
        })
    } else {
        await Wycieczki.findByIdAndUpdate(wycieczkaId, { // zapisuje do wycieczki, musibyć await
            ratingsAverage: 4.2,
            ratingsQuantity: 0
        })
    }

}

recenzjaSchema.post('save', function () { // wykonuje się po zapisaniu w bazie i nie ma dostępu do next
    this.constructor.kalkRatingsAverage(this.wycieczka) // constructor umożliwia odwołanie się modelu
})

recenzjaSchema.pre(/^findOneAnd/, async function (next) { // findAnd powoduje, że działa na findOneAndUpdate i findOneAndDelete i pobiera nowaRecenzja
    this.nowaRecenzja = await this.findOne(); // this. ustawia zmienną widoczną w całym ciągu middleware
    // console.log(this.nowaRecenzja);
    next();
})

recenzjaSchema.post(/^findOneAnd/, async function () { // uruchamia po zmianach w bazie korzystając z nowaRecenzja, która była ustawiona w pre
    await this.nowaRecenzja.constructor.kalkRatingsAverage(this.nowaRecenzja.wycieczka._id) // ponieważ metoda jest static, i await bo sync, w post już jest embedowana wycieczka, więc wycieczka nie przedstawia id
});

const Recenzja = mongoose.model('Recenzje', recenzjaSchema);

module.exports = Recenzja;