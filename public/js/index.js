/* eslint-disable */
/* jeżeli jest bład import export eslint, trzeba dodać w pliku .eslintrc.json:
"parserOptions": {
    "sourceType": "module"
  } */

import '@babel/polyfill'; // nie musi być nigdzie użyte, ale parcel będzie wiedział jak działać ze starszymi przeglądarkami
import {
    pokazMape
} from './mapbox';
import {
    login,
    logout
} from './login';
import {
    updateUstawienia
} from './updateUstawienia';
import {
    zakupWycieczke
} from './stripe';
import {
    pokazAlert
} from './alert'

// elementy DOM
const zmiennaMap = document.getElementById('map');
const logowanieFormularz = document.querySelector('.form--login'); // czy został wybrany przycisk klasy .form 
const wylogowanie = document.querySelector('.nav__el--logout'); // czy został wybrany przycisk klasy .nav__el--logout   
const uzytkownikUstawieniaFormularz = document.querySelector('.form-user-data');
const uzytkownikHasloFormularz = document.querySelector('.form-user-password');
const zakupPrzycisk = document.getElementById('zarezerwuj-wycieczke');
const alarmKomunikat = document.querySelector('body').dataset.alarm;

// delegacje
if (zmiennaMap) {
    const lokalizacje = JSON.parse(zmiennaMap.dataset.locations);
    // pobiera dane z elementu zmiennaMap jako string i konwertuje je na obiekt JSON
    pokazMape(lokalizacje);
}

if (logowanieFormularz) {
    logowanieFormularz.addEventListener('submit', el => { // podkreśla document bo eslint nie zna js kodu
        el.preventDefault(); // zapobiega uruchamianiu innych linków
        const email = document.getElementById('email').value; // wcześniej tych zmiennych nie widać
        const password = document.getElementById('password').value; // wcześniej tych zmiennych nie widać
        login(email, password);
    })
}

if (wylogowanie) {
    wylogowanie.addEventListener('click', logout);
}

if (uzytkownikUstawieniaFormularz) {
    uzytkownikUstawieniaFormularz.addEventListener('submit', el => { // podkreśla document bo eslint nie zna js kodu
        el.preventDefault(); //  zapobiega uruchamianiu innych linków
        const formularz = new FormData(); // tworzy dormularz z danymi
        formularz.append('name', document.getElementById('name').value);
        formularz.append('email', document.getElementById('email').value);
        formularz.append('photo', document.getElementById('photo').files[0]); // podaje pierwszy plik
        /*
        // zastąpione przez formularz
        const email = document.getElementById('email').value; // wcześniej tych zmiennych nie widać
        const name = document.getElementById('name').value; // wcześniej tych zmiennych nie widać
        */
        updateUstawienia(formularz, 'ustawienia'); // name i hasło muszą być przekazywane jako obiekt, wczęsniej było {name, email}
    })
}

if (uzytkownikHasloFormularz) {
    uzytkownikHasloFormularz.addEventListener('submit', async el => { // podkreśla document bo eslint nie zna js kodu
        el.preventDefault(); //  zapobiega uruchamianiu innych linków
        const b = document.querySelector('.btn--save-password');
        document.querySelector('.btn--save-password').textContent = 'Zapisywanie...' // zmiana napisu na przycisku
        const passwordCurrent = document.getElementById('password-current').value; // wcześniej tych zmiennych nie widać
        const password = document.getElementById('password').value; // wcześniej tych zmiennych nie widać
        const passwordConfirm = document.getElementById('password-confirm').value; // wcześniej tych zmiennych nie widać
        await updateUstawienia({
            passwordCurrent,
            password,
            passwordConfirm
        }, 'hasło'); // name i hasło muszą być przekazywane jako obiekt

        // wyzerowanie jest konieczne, żeby nie przetrzymywać hasła na stronie
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
        document.querySelector('.btn--save-password').textContent = 'Zapisz hasło' // zmiana napisu na przycisku
    })
}

if (zakupPrzycisk) {
    zakupPrzycisk.addEventListener('click', e => {
        e.target.textContent = 'Kupowanie...';
        const {
            wycieczkaId
        } = e.target.dataset; // pobiera wycieczkaId z data-wycieczka-id
        // {wycieczkaId} zastępuje wycieczkaId = e.target.dataset.wycieczkaId
        zakupWycieczke(wycieczkaId);
    });
}

if(alarmKomunikat) {
    pokazAlert('success', alarmKomunikat, 5);
}
