class APIParametry {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filtr() {
        let queryObj = { // kopiowanie do nowego obiektu queryObj
            ...this.queryString
        };

        // wykluczenie z filtra słów kluczowych
        const usunietePola = ['page', 'limit', 'fields', 'sort'];
        usunietePola.forEach(el => delete queryObj[el]); // usuwa z obiektu pola

        // dodanie do filtra gte|gt|lte|lt
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, m => `$${m}`); // dodaje $ przed gte, gt, lte, lt
        queryObj = JSON.parse(queryStr);

        console.log(this.queryString, queryObj);

        this.query.find(queryObj); // wprowadza parametry zapytania za pomocą queryObj
        return this; // zwraca cały obiekt this
    }

    sort() { // sotrowanie
        if (this.queryString.sort) {
            console.log('sortowanie...')
            const queryBy = this.queryString.sort.split(',').join(' '); //zamienia przecinek na spację
            //umożliwa sortowanie po wilu kategoriach
            this.query = this.query.sort(queryBy);
        } else {
            console.log('bez sortowania, czyli po dacie utworzenia (createdAt)...')
            this.query = this.query.sort('createdAt');
        }
        return this; // zwraca cały obiekt this
    }

    ograniczeniePol() { // ograniczenie ilości wyświetlanych pól
        if (this.queryString.fields) {
            console.log('ogranicznie pól...');
            const pola = this.queryString.fields.split(',').join(' '); // zmianie przecinki na spacje
            this.query = this.query.select(pola);
        } else {
            console.log('bez ogranicznia pól, czyli ogranicza tylko do __v...')
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginacja() {
        const wLimit = this.queryString.limit * 1 || 10; // przyjmuje parametry lub ustawia domyślnie 5 stron
        const wPage = this.queryString.page * 1 || 1;
        const wSkip = (wPage - 1) * wLimit; // wylicza od którego rekordu pokazywać dane
        console.log(`paginacja z limitem: ${wLimit}...`);

        this.query = this.query.skip(wSkip).limit(wLimit); //podaje tylko ograniczone rekordy

        return this;
    }
}

module.exports = APIParametry;