// 1. Inizializzo Mappa 1 (Italia)
// Ho tolto i bottoni dello zoom e il trascinamento per farla sembrare un'immagine fissa "stampata" sul foglio
const mapItalia = L.map('map-italia', {
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false
}).setView([41.5, 12.5], 6);

// ATTENZIONE: Abbiamo eliminato la riga L.tileLayer(...)! 
// Niente più cartina del mondo, il contenitore ora è completamente bianco.

// 2. Inizializzo Mappa 2 (Regione - nel blocco nascosto in basso)
const mapRegione = L.map('map-regione').setView([42.0, 12.5], 6);

// 3. Funzione per scaricare e disegnare SOLO la sagoma dell'Italia
async function caricaSagomaItalia() {
    // Pesco i confini ufficiali ISTAT delle regioni da un database pubblico (Openpolis)
    const urlConfini = 'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson';

    try {
        const response = await fetch(urlConfini);
        const data = await response.json();

        // Dico a Leaflet di disegnare questi confini vettoriali sul foglio bianco
        L.geoJSON(data, {
            style: {
                color: "#2c3e50",       // Colore del bordo (blu scuro)
                weight: 1.5,            // Spessore del bordo
                fillColor: "#ecf0f1",   // Colore interno della regione (grigio chiarissimo)
                fillOpacity: 0.8        // Trasparenza
            },
            onEachFeature: function (feature, layer) {
                // Aggiungo un effetto: quando passi col mouse si colora
                layer.on('mouseover', function () {
                    this.setStyle({ fillColor: '#3498db', fillOpacity: 0.5 });
                });
                layer.on('mouseout', function () {
                    this.setStyle({ fillColor: '#ecf0f1', fillOpacity: 0.8 });
                });

                // L'azione che volevi: cliccando la singola regione si apre la parte sotto!
                layer.on('click', function (e) {
                    // feature.properties.reg_name contiene il nome della regione cliccata
                    mostraDettaglioRegione(feature.properties.reg_name, e.latlng);
                });
            }
        }).addTo(mapItalia);

    } catch (error) {
        console.error("Errore nel caricamento dei confini:", error);
    }
}

// 4. La funzione che fa apparire il blocco inferiore
function mostraDettaglioRegione(nomeRegione, coordinate) {
    // Rivelo il blocco nascosto
    const blocco = document.getElementById('blocco-dettaglio');
    blocco.classList.remove('nascosto');

    // Ricalcolo la mappa 2 (trucco tecnico)
    mapRegione.invalidateSize();

    // Scrivo il nome della regione nel titolo della tabella
    document.getElementById('nome-regione-titolo').innerText = "Dettaglio " + nomeRegione;

    // Metto dei dati finti per farti vedere come verrà
    document.getElementById('corpo-tabella').innerHTML = `
        <tr><td>Massa-Carrara</td><td>1450 kWh/m²</td></tr>
        <tr><td>Lucca</td><td>1420 kWh/m²</td></tr>
        <tr><td>Pisa</td><td>1480 kWh/m²</td></tr>
    `;

    // Sposto la mappa 2 sulla regione cliccata
    mapRegione.setView(coordinate, 8);
}

// Faccio partire il disegno
caricaSagomaItalia();