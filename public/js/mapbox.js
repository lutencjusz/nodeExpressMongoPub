/* eslint-disable */

export const pokazMape = (lokalizacje) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibHV0ZW5janVzeiIsImEiOiJjanpmNWV5bncwOHV5M2xqdzdkc3Bkb3hzIn0.MYE4I8ZXzpsTj1wxjiMf8w';
    // indywidualny token dla konta/projektu
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/lutencjusz/cjzf671s60wiu1cpgsne97aiu', // po utworzeniu własnego stylu mapy w studio kopiuje URL style
        scrollZoom: false // wyłacza możliwość zoomowania przy scrollowaniu
        // center: [-118, 34], // najpierw lng potem lat,
        // zoom: 4, // określenie przybliżenia
        // interactive: false // blokuje możliwość interakcji
    });

    const punkty = new mapboxgl.LngLatBounds(); // tworzy punkty przy użyciu biblioteki mapboxgl

    lokalizacje.forEach(lok => {
        const punkt = document.createElement('div');
        punkt.className = 'marker'; // klasa jest zdefiniowana w style.css i oznacza zielony marker
        new mapboxgl.Marker({
                element: punkt,
                anchor: 'bottom'
            })
            .setLngLat(lok.coordinates) // coordinates jest tablicą
            .addTo(map)
        new mapboxgl.Popup({
                offset: 30 // zmienia punkt zaczepienia popapu
            })
            .setLngLat(lok.coordinates)
            .setHTML(`<p>Dzień ${lok.day}: ${lok.description}</p>`) // opis popapu
            .addTo(map)
        punkty.extend(lok.coordinates); // rozszerza mapę o lokalizacje
    });

    map.fitBounds(punkty, { // wpasowuje mapę do punktów i ogranicza obszer, żeby punkty były widoczne w polu widoczności
        padding: {
            top: 200,
            bottom: 200,
            left: 100,
            right: 100
        }
    });
}