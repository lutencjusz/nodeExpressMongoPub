/* eslint-disable */
export const ukryjAlert = () => {
    const el = document.querySelector('.alert'); // znajduje element alert
    if (el) el.parentElement.removeChild(el); // usuwa element poprzez rodzica, który usuwa dziecko
}

export const pokazAlert = (typ, komunikat) => {
    // if (typ = 'success') location.reload(true); // skraca pokazywanie znacznik i true powoduje, że strona się przeładuje bez użycia cache
    ukryjAlert() // najpierw ukrywa alert, jeżeli już jakiś jest
    const znacznik = `<div class="alert alert--${typ}">${komunikat}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', znacznik); // dodaje do body obiekt
    window.setTimeout(ukryjAlert, 3000); // ukrywa alert po 3 sek.
}