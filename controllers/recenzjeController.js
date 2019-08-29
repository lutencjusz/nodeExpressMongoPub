const Recenzje = require('../models/recenzjeModel');
const fabrykaOperacji = require('./fabrykaOperacji');

/*
// zastąpionne przez fabrykaOperacji
exports.getWszystkieRecenzje = przechwycAsyncErrors(async (req, res, next) =>{
    let  filtr = {};
    if (req.params.idWycieczki) filtr = {wycieczka: req.params.idWycieczki}; // jeżeli jest podany idWycieczki, to wtedy filtruje po wycieczce

    const recenzje = await Recenzje.find(filtr);

    res.status(200).json({
        status: 'ok',
        wynik: recenzje.length,
        dane: {
            recenzje
        }       
    });
});
*/

/*
// zastąpionne przez fabrykaOperacji
exports.postUtworzRecenzje = przechwycAsyncErrors(async (req, res, next) => {
    if(!req.body.wycieczka) req.body.wycieczka = req.params.idWycieczki // id pochodzi od parametru wycieczki 
    if(!req.body.uzytkownik) req.body.uzytkownik = req.nowyUzytkownik.id // id pochodzi z middleware 

    const nowaRecenzja = await Recenzje.create(req.body);

    res.status(200).json({
        status: 'ok',
        dane: {
            nowaRecenzja
        }       
    });
})
*/

exports.ustawWycieczkaUzytkownikId = (req, res, next) => { // dodatkowa operacja powstała po zastosowaniu fabrykaOperacji
    if(!req.body.wycieczka) req.body.wycieczka = req.params.idWycieczki // id pochodzi od parametru wycieczki 
    if(!req.body.uzytkownik) req.body.uzytkownik = req.nowyUzytkownik.id // id pochodzi z middleware 
    next();
}

exports.getWszystkieRecenzje = fabrykaOperacji.getPobierzWszystkieFabryka(Recenzje); // pobiera wszyatkie z APIParametry
exports.getPobierzRecenzje = fabrykaOperacji.getPobierzPojedynczyFabryka(Recenzje); // pobiera pojedynczą recenzje
exports.deleteUsunRecenzje = fabrykaOperacji.deleteUsunFabryka(Recenzje); // usuwa korzystając z fabrykaOperacji
exports.postUtworzRecenzje = fabrykaOperacji.postUtworzFabryka(Recenzje); // tworzy korzystając z fabrykaOperacji
exports.patchZmienRecenzje = fabrykaOperacji.patchZmienFabryka(Recenzje); // zmienia korzystając z fabrykaOperacji, nigdy nie zmieniaj hasła tą operacją
