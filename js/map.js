// 1. Inizializzo la mappa e la centro sull'Italia
const map = L.map('mappa-spi').setView([41.902, 12.496], 6); // Coordinate di Roma, Zoom 6

// 2. Aggiungo i "Mosaici" visivi della mappa (uso OpenStreetMap, gratis e affidabile)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
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