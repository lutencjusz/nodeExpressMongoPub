const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // ładuje i od razu podaje sekretny klucz
const Wycieczki = require('../models/wyczieczkiModel');
const Uzytkownicy = require('../models/uzytkownicyModel');
const Platnosci = require('../models/platnosciModel');
const przechwycAsyncErrors = require('../utils/przechwycAsyncErrors');
const fabrykaOperacji = require('./fabrykaOperacji');
// const AppError = require('./../utils/appError');

exports.checkoutSesja = przechwycAsyncErrors(async (req, res, next) => {
    const wycieczka = await Wycieczki.findById(req.params.idWycieczki);

    const sesja = await stripe.checkout.sessions.create({ // dokonuje płatności przez Stripe
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/?wycieczka=${wycieczka.id}&uzytkownik=${req.nowyUzytkownik.id}&cena=${wycieczka.price}`, // zastąpione przez weebhookCheckoutSucess
        success_url: `${req.protocol}://${req.get('host')}/moje-wycieczki`,
        cancel_url: `${req.protocol}://${req.get('host')}/wycieczka/${wycieczka.slug}`,
        customer_email: req.nowyUzytkownik.email,
        client_reference_id: req.params.idWycieczki, // potrzebny idWycieczki, żeby potem zapisać do bazy
        line_items: [{
            name: `${wycieczka.name}`,
            description: `${wycieczka.description}`,
            images: [`${req.protocol}://${req.get('host')}/img/tours/${wycieczka.imageCover}`],
            amount: wycieczka.price * 100, // musi być *100, żeby weszły grosze.
            currency: 'pln',
            quantity: 1
        }]
    });

    res.status(200).json({
        status: 'ok',
        sesja
    })
});
/*
// zastąpione przez weebhookCheckoutSucess
exports.utworzCheckoutPlatnosci = przechwycAsyncErrors(async (req, res, next) => {
    const {
        wycieczka,
        uzytkownik,
        cena
    } = req.query; // pobiera parametry z zapytania
    if (!wycieczka && !uzytkownik && !cena) return next(); // wykona się widokiRouter
    await Platnosci.create({
        wycieczka,
        uzytkownik,
        cena
    }); // tworzy rekord płatności w bazie

    res.redirect(req.originalUrl.split('?')[0]) // pobiera orginalne zapytanie bez tego po '?'
});
*/
const utworzCheckoutPlatnosci = async sesja =>{
    const wycieczka = sesja.client_reference_id;
    const uzytkownik = (await Uzytkownicy.findOne({email: sesja.customer_email})).id; // pobiera tylko id na podstawie email
    const cena = sesja.display_items[0].amount / 100;

    await Platnosci.create({
        wycieczka,
        uzytkownik,
        cena
    }); // tworzy rekord płatności w bazie
}

exports.weebhookCheckoutSucess = (req, res, next) =>{ // metoda używana w stripe gdy płatność się powiedzie
    const sygnatura = req.headers['stripe-signature']; // sygnatura jest dodawana do nagłówka
    let zdarzenie;
    try {
        zdarzenie = stripe.webhooks.constructEvent(
            req.body, // wymaga aby req.body było w raw, a nie w json
            sygnatura, 
            process.env.STRIPE_WEBHOOK_SECRET
        );         
    } catch (err) {
        return res.status(400).send(`Błąd w weebhookCheckoutSucess ${err.message}`); // odsyła błąd do stripe, że coś nie działa
    }
    console.log(zdarzenie.type);
    if (zdarzenie.type === 'checkout.session.completed') {
        utworzCheckoutPlatnosci(zdarzenie.data.object);
    }


    res.status(200).json({received: true}); // odsyła do stripe, że jest ok
    
}

exports.getWszystkiePlatnosci = fabrykaOperacji.getPobierzWszystkieFabryka(Platnosci);
exports.getPobierzPlatnosc = fabrykaOperacji.getPobierzPojedynczyFabryka(Platnosci);
exports.patchZmienPlatnosc = fabrykaOperacji.patchZmienFabryka(Platnosci);
exports.postUtworzPlatnosc = fabrykaOperacji.postUtworzFabryka(Platnosci);
exports.deleteUsunPlatnosc = fabrykaOperacji.deleteUsunFabryka(Platnosci);