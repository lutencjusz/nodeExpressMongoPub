const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // ładuje i od razu podaje sekretny klucz
const Wycieczki = require('../models/wyczieczkiModel');
const Platnosci = require('../models/platnosciModel');
const przechwycAsyncErrors = require('../utils/przechwycAsyncErrors');
const fabrykaOperacji = require('./fabrykaOperacji');
// const AppError = require('./../utils/appError');

exports.checkoutSesja = przechwycAsyncErrors(async (req, res, next) => {
    const wycieczka = await Wycieczki.findById(req.params.idWycieczki);

    const sesja = await stripe.checkout.sessions.create({ // dokonuje płatności przez Stripe
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?wycieczka=${wycieczka.id}&uzytkownik=${req.nowyUzytkownik.id}&cena=${wycieczka.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/wycieczka/${wycieczka.slug}`,
        customer_email: req.nowyUzytkownik.email,
        client_reference_id: req.params.idWycieczki,
        line_items: [{
            name: `${wycieczka.name}`,
            description: `${wycieczka.description}`,
            images: [`https://www.natours.dev/img/tours/${wycieczka.imageCover}`],
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

exports.getWszystkiePlatnosci = fabrykaOperacji.getPobierzWszystkieFabryka(Platnosci);
exports.getPobierzPlatnosc = fabrykaOperacji.getPobierzPojedynczyFabryka(Platnosci);
exports.patchZmienPlatnosc = fabrykaOperacji.patchZmienFabryka(Platnosci);
exports.postUtworzPlatnosc = fabrykaOperacji.postUtworzFabryka(Platnosci);
exports.deleteUsunPlatnosc = fabrykaOperacji.deleteUsunFabryka(Platnosci);