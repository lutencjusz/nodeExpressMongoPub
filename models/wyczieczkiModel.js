const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const Uzytkownicy = require('./uzytkownicyModel');

const wycieczkiSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Wycieczka musi mieć nazwę :name'],
        unique: true,
        trim: true,
        maxlength: [20, 'Zbyt długa nazwa wycieczki (max. 20) :name'],
        minlength: [5, 'Zbyt krótka nazwa wycieczki (max. 5) :name'],
        validate: {
            validator: function (val) {
                const valBezSpacji = val.split(' ').join(''); // obcina spacje
                const valBezSpacjiCyfr = valBezSpacji.split(/[0-9]/g).join(''); /// obcina liczby
                return validator.isAlpha(valBezSpacjiCyfr, 'pl-PL'); // validator firmy trzeciej
            },
            message: 'Nazwa wycieczki może się składać tylko ze znaków [a-z][A-Z][ ]:name'
        }
        //używa validatora firmy trzeciej
    },
    ratingsAverage: {
        type: Number,
        default: 4.2,
        min: [1, 'Zbyt niska wartość ratingsAverage (min. 1) :ratingsAverage'],
        max: [5, 'Zbyt wysoka wartość ratingsAverage (max. 5) :ratingsAverage'],
        set: wartosc => Math.round(wartosc * 100) / 100 // proste zaokrąglenie do dwóch miejsc po przecinku przy wykorzystaniu set
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'Wycieczka musi mieć cenę: price']
    },
    duration: {
        type: Number,
        required: [true, 'Wycieczka musi mieć czas trwania: duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'Wycieczka musi mieć wielkość uczestników: maxGroupSize']
    },
    difficulty: {
        type: String,
        required: [true, 'Wycieczka musi mieć określony sropień trudności: difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Nieprawidłowe wartości ("easy", "medium", "difficult") :difficulty'
        }
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) { // własny validator z funkcją mającą dostęp do this.
                return val < this.price;
            },
            message: 'Wartość upustu ({VALUE}) większa niż cena (price)' // {VALUE} pokazuje wartość - pochodzi z Mongoose
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'Wycieczka musi mieć podsumowanie: summary']
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, 'Wycieczka musi mieć obrazek przewodni: imageCover']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(), // wstawia timestamp przy tworzeniu
        select: false // nie zwraca pola w RESTFul
    },
    startDates: [Date],
    slug: String, // tworzy pole z save (MongoDB middleware)
    secret: { // pole wykorzystywane w MongoDB query middleware
        type: Boolean,
        default: false
    },
    startLocation: { //GeoJSON, może być razem z location
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], // tablica numerów
        adress: String,
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], // tablica numerów
        adress: String,
        description: String,
        day: Number // dzień miesiąca 
    }],
    // guides: Array
    guides: [{ // tworzy referencję do innego zbioru dokumnetów
        type: mongoose.Schema.ObjectId,
        ref: 'Uzytkownicy'
    }]
}, {
    toJSON: {
        virtuals: true
    }, // umożliwia pokazywanie i używanie zmiennych virtualnych
    toObject: {
        virtuals: true
    }
});

wycieczkiSchema.virtual('tygodnieTrwania').get(function () { // function może używać this.,a callback nie
    // tworzy zmienną virtualną tygodnieTrwania
    return this.duration / 7;
});

// virtual populate - tworzy tabele id dzieci 
wycieczkiSchema.virtual('recenzje', {
    ref: 'Recenzje',
    foreignField: 'wycieczka',
    localField: '_id'
});

// indeksy do tabeli 1 - rosnące, -1 - malejące
wycieczkiSchema.index({ // indeks compound obejmujący wiele pól ,przy pojedynczym wyszukiwaniu działa na pierwsze pole, nie działa na kolejne pola
    price: 1,
    ratingsAverage: -1
});

wycieczkiSchema.index({
    slug: 1
});

wycieczkiSchema.index({
    startLocation: '2dsphere'
});

// funkcja middleware document - wykonuje się przed .save oraz .create (operacja POST)
wycieczkiSchema.pre('save', function (next) { // function 'save' może używać this., co się zapisze w bazie
    // next jako argument umożliwa dostęp do next z MongoDB middleware
    console.log('Uruchomiona funkcja pre save MongoDB middleware...')
    this.slug = slugify(this.name, {
        lower: true // wszystkie litery zamienia na małe
    });
    next();
});

/*
// potrzebuje pola guides: Array oraz const Uzytkownicy = require('./uzytkownicyModel');
wycieczkiSchema.pre('save', async function(next){ // wprowadza embeded do dokumnetu na podstawie  id
    const guidesPromises = this.guides.map(async id => await Uzytkownicy.findById(id)); // musi być async, żeby można było await bo to promise
    this.guides = await Promise.all(guidesPromises); // funkcja musibyć async, żeby można było użyć Promise.all
    next();
})
*/

// funkcja middleware document - wykonuje się po .save oraz .create (operacja POST)
/*
wycieczkiSchema.post('save', function (doc, next) {
    console.log('Uruchomiona funkcja pre save MongoDB middleware...')
    console.log(doc);
    next();
})*/

// query middleware
wycieczkiSchema.pre(/^find/, function (next) { // wybiera wszystkie rozpoczynające się od find*
    console.log('Uruchomiona funkcja pre find query middleware i obcina secret...');
    this.find({
        secret: {
            $ne: true
        }
    });
    this.dataZapisu = Date.now(); // zapisuje datę przed pobraniem z bazy danych, ale nie zapisuje w bazie
    next();
});

wycieczkiSchema.pre(/^find/, function (next) { // wstawia embaded dla wszystkich find przy find i update
    this.populate({ // populate pobiera dane z obcej kolekcji dokumnetów jako embeded
        path: 'guides',
        select: '-__v -passwordChangedAt' // blokuje pokazywanie wybranych pól
    });
    next();
})

wycieczkiSchema.post(/^find/, function (doc, next) {
    console.log('Uruchomiona funkcja post find query middleware...');
    console.log(`Odczyt z bazy zajmuje ${Date.now()-this.dataZapisu} msek.`);
    next();
})

// aggregation middleware
// ponieważ używamy geoNear, trzeba wyłączyć wszystkie wycieczkiSchema.pre('aggregate'
/*
wycieczkiSchema.pre('aggregate', function (next) {
    console.log('Uruchomiona funkcja post find aggregation middleware usuwa secert...');
    this.pipeline().unshift({ // dodaje na początku pipeline wpis z $match
        $match: {
            secret: {
                $ne: true
            }
        }
    });
    next();
})
*/

const Wycieczka = mongoose.model('Wycieczki', wycieczkiSchema);

module.exports = Wycieczka;

// testowe tworzenie rekordu
/*
const testWycieczki = new WycieczkiModel({ // musi być z dużej litery
    name: 'Druga wycieczka',
    price: 23.3,
    rating: 4.6
});

testWycieczki.save().then(doc => {
    console.log(doc);
}).catch(err => {
    console.log(`Błąd zapisu: ${err}`)
})
*/