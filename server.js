const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => { // gdy jest jakiś błąd w aplikacji, dlatego na początku kodu
    console.log('server.js: uncaughtException: błąd w aplikacji...');
    console.log(err.name, err.message);
})

dotenv.config({
    path: './config.env',
});

//if (process.argv[2] === '--global') {
// połączenie z bazą zdalną
this.DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD); // zmienia hasło w stringu
console.log('Próba połaczenia z bazą zdalną...');
//} else {
//    this.DB = process.env.DATABASE_LOCAL;
//    console.log('Próba połaczenia z bazą lokalną...');
//}
mongoose
    .connect(this.DB, {
        // podłączenie do bazy
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then(() => {
        // console.log(con.connections);
        console.log('Połączyłeś się z bazą!\nUruchomienie servera zakończone!');
    })
/* // catch zaostaje zastąpione przez process.on unhandledRejection
.catch(err => {
    console.log(`Błąd przy próbie połaczenia z bazą: ${err}`);
});*/

// uruchomienie serwera
const app = require(`./app`); // musi być wczytany po ustawieniu zmiennych

if (process.env.NODE_ENV.trim() === `production`) process.env.PORT = 8000; // po zmiennej jest ' ', więc musi być trim()

const port = process.env.PORT || 3000;
const server = app.listen(port, () => { // server, żeby potem obsłużyć server.close
    console.log(`Server uruchomiony na porcie: ${port}!`);
});

process.on('unhandledRejection', err => { // gdy np. hasło do bazy nie pasuje
    console.log(err.name, err.message);
    console.log('server.js: unhandledRejection: Wyłaczenie serwera...');
    server.close(() => {
        console.log('Wyłączenie aplikacji...');
        process.exit(1) // całkowite wyjście z aplikacji: 0 - ok, 1 - error
    });

});
 
process.on('SIGTERM', () => { // co 24 godziny Huroku wysysyła sygnał SIGNTERM do aplikacji
    console.log('Otrzymałem SIGNTERM - restartuje aplikację...');
    server.close(() =>{
        console.log('Restart zakończony!')
    });
});
