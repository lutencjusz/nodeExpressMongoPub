/* eslint-disable */

import axios from 'axios'; // pomimo błedu wszystko działa prawidłowo
import {
    pokazAlert
} from './alert'

export const login = async (email, password) => {
    try {
        const wynik = await axios({ // wykonuje podzapytanie do bazy
            method: 'POST',
            url: '/api/v1/uzytkownicy/login',
            data: {
                email,
                password
            }
        });
        // console.log(wynik);
        if (wynik.data.status === 'ok') {
            window.setTimeout(() => { // to raczej, żeby przetestować setTimeout 
                location.assign('/'); // przechodzi do strony startowej po zalogowaniu się
            }, 1);
        }
        console.log(wynik);
    } catch (err) {
        pokazAlert('error', 'Nieprawidłowe login lub hasło'); // jeżeli chcemy zobaczyć zawartość błedu to jest w err.response.data.message
    }
}

export const logout = async () => {
    try {
        const wynik = await axios({ // wykonuje podzapytanie do bazy
            method: 'GET',
            url: '/api/v1/uzytkownicy/logout',
        });
        if (wynik.data.status === 'ok') {
            if (location.pathname === '/me') { // jeżeli po wylogowaniu się jest na /me to będzie błąd
                location.assign('/'); //przechodzi do strony startowej, żeby się zabezpieczyć przed błedem
            } else {
                location.reload(true); // true powoduje, że strona się przeładuje bez użycia cache
            }
        }
    } catch (err) {
        pokazAlert('error', 'Bład podczas wylogowania');
    }
}