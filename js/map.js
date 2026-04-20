// Definizione dei confini dell'Italia [Sud-Ovest, Nord-Est]
const sudOvest = L.latLng(35.0, 6.0);
const nordEst = L.latLng(47.5, 19.0);
const boundsItalia = L.latLngBounds(sudOvest, nordEst);

const map = L.map('mappa-spi', {
    center: [42.0, 12.5],
    zoom: 6,
    minZoom: 6, // Impedisce di rimpicciolire troppo la mappa
    maxBounds: boundsItalia, // Blocca lo spostamento fuori dall'Italia
    maxBoundsViscosity: 1.0 // Rende i confini "solidi" (la mappa rimbalza indietro)
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 3. Funzione per scaricare i nostri dati e metterli sulla mappa
async function caricaDati() {
    try {
        // Vado a leggere il file JSON che abbiamo creato con Node.js
        const response = await fetch('./data/irradiazione.json');
        const datiProvincie = await response.json();

        // 4. Ciclo su ogni provincia del file JSON
        for (const sigla in datiProvincie) {
            const provincia = datiProvincie[sigla];

            // Calcolo l'irradiazione totale annuale sommando i mesi
            let totaleAnnuo = 0;
            for (const mese in provincia.irradiazione) {
                totaleAnnuo += provincia.irradiazione[mese];
            }

            // 5. Creo il "Segnaposto" sulla mappa
            const marker = L.marker([provincia.lat, provincia.lon]).addTo(map);

            // 6. Aggiungo il popup che appare cliccando sul segnaposto
            const testoPopup = `
                <b>${provincia.nome} (${sigla})</b><br>
                Irradiazione Annua: ${Math.round(totaleAnnuo)} kWh/m²
            `;
            marker.bindPopup(testoPopup);
        }

    } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
    }
}

// Faccio partire la funzione
caricaDati();