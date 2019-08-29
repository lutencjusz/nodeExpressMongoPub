/* eslint-disable */
import axios from 'axios';
import {
    pokazAlert
} from './alert';
var stripe = Stripe('pk_test_fkb8sZZaeyNKeamMOnCt5Egu00sPMtjCwx'); // pobiera Stripe z samej strony wycieczka.pug

export const zakupWycieczke = async wycieczkaId => { // wycieczkaId powstaje ze strony data-wycieczka-id
    try {
        const sesja = await axios(`/api/v1/platnosci/checkout-sesja/${wycieczkaId}`); // uproszczona wersja wysyłania GET
        await stripe.redirectToCheckout({ // potwierdza płatność
            sessionId: sesja.data.sesja.id
        });
    } catch (err) {
        console.log(err);
        pokazAlert('error', err);
    }
}