// 1. Inizializzo Mappa 1 (Italia)
const mapItalia = L.map('map-italia').setView([42.0, 12.5], 6);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapItalia);

// 2. Inizializzo Mappa 2 (Regione - Vuota per ora)
const mapRegione = L.map('map-regione').setView([42.0, 12.5], 6);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRegione);

// --- SIMULAZIONE DATI (Da sostituire con il file GeoJSON vero) ---
async function setupMappa() {
    
    // Per ora mettiamo un click finto per simulare l'interazione
    mapItalia.on('click', function(e) {
        mostraDettaglioRegione("Toscana", e.latlng);
    });
}

// 3. Funzione scatenata dal click su una regione
function mostraDettaglioRegione(nomeRegione, coordinate) {
    // A. Rivelo il blocco nascosto
    const blocco = document.getElementById('blocco-dettaglio');
    blocco.classList.remove('nascosto');

    // B. TRUCCO TECNICO: Dico a Leaflet 2 di ricalcolare le sue dimensioni ora che è visibile
    mapRegione.invalidateSize();

    // C. Aggiorno il titolo della tabella
    document.getElementById('nome-regione-titolo').innerText = "Dettaglio " + nomeRegione;

    // D. Popolo la tabella (Dati finti per ora)
    document.getElementById('corpo-tabella').innerHTML = `
        <tr><td>Massa-Carrara</td><td>1450 kWh</td></tr>
        <tr><td>Lucca</td><td>1420 kWh</td></tr>
    `;

    // E. Sposto la Mappa 2 sulla regione cliccata
    mapRegione.setView(coordinate, 8);
}

setupMappa();