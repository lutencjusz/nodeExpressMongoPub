/* eslint-disable */

import axios from 'axios'; // pomimo błedu wszystko działa prawidłowo
import {
    pokazAlert
} from './alert';

// type może być 'ustawienia' lub 'hasło'
export const updateUstawienia = async (data, type) => {
    try {

        const url = type === 'hasło' ?
            '/api/v1/uzytkownicy/updateMyPassword' :
            '/api/v1/uzytkownicy/updateMe';

        const wynik = await axios({ // wykonuje podzapytanie do bazy
            method: 'PATCH',
            url,
            data // data jest obiketem
        });

        if (wynik.data.status === 'ok') {
            pokazAlert('success', `Zmieniono Twoje ${type}!`)
            // location.assign('/me'); // nie uruhamiam odświerzenia, bo obcina czas pokazywania komunikatu
        }
        console.log(wynik);
    } catch (err) {
        pokazAlert('error', err.response.data.message); // jeżeli chcemy zobaczyć zawartość błedu to jest w err.response.data.message
    }
}