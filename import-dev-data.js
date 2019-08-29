const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WycieczkiModel = require('./models/wyczieczkiModel');
const UzytkownicyModel = require('./models/uzytkownicyModel');
const RecenzjeModel = require('./models/recenzjeModel');

dotenv.config({
    path: './config.env',
});

// połączenie z bazą zdalną

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); // zmienia hasło w stringu

mongoose.connect(DB, { // podłączenie do bazy
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    // console.log(con.connections);
    console.log('Połączyłeś się z bazą!')
})

// połączenie z bazą lokalną
/*
mongoose.connect(process.env.DATABASE_LOCAL, { // podłączenie do bazy
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    // console.log(con.connections);
    console.log('Połączyłeś się z lokalną bazą!')
});
*/
// czytanie pliku z danymi i od razu parsowanie do tabeli
const wycieczki = JSON.parse(fs.readFileSync('./dev-data/data/tours.json', 'utf-8'));
const uzytkownicy = JSON.parse(fs.readFileSync('./dev-data/data/users.json', 'utf-8'));
const recenzje = JSON.parse(fs.readFileSync('./dev-data/data/reviews.json', 'utf-8'));

const importDane = async () => {
    try {
        await WycieczkiModel.create(wycieczki); // importuje od razu całą tablicę
        await UzytkownicyModel.create(uzytkownicy, {
            validateBeforeSave: false
        }); // wyłącza walidację przed zapisem np. dla passwordConfirm
        await RecenzjeModel.create(recenzje); // importuje od razu całą tablicę
        console.log('Import do bazy się udał...')

    } catch (err) {
        console.log(err);
    }
    process.exit(); // bardzo agresywne wyjście z aplikacji
}

const deleteDane = async () => {
    try {
        await WycieczkiModel.deleteMany(); // usuwa wszystkie rekordy
        await UzytkownicyModel.deleteMany(); // usuwa wszystkie rekordy
        await RecenzjeModel.deleteMany(); // usuwa wszystkie rekordy
        console.log('Usuwanie dokumnetów się udało...')
    } catch (err) {
        console.log(err);
    }
    process.exit(); // bardzo agresywne wyjście z aplikacji
}

console.log(process.argv); // pokazujeargumnety lub ścieżki

if (process.argv[2] === '--import') { // sprawdza, czy jest jakiś argument
    importDane();
} else if (process.argv[2] === '--delete') {
    deleteDane();
} else {
    console.log('Użyj jednego z argumentów:\n --import - importuje dane z pliku tours-simple.json\n --delete - usuwa dane z bazy danych');
    process.exit();
}