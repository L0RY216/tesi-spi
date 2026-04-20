// --- CONFIGURAZIONE ---
const mapItalia = L.map('map-italia', {
    zoomControl: false, dragging: false, scrollWheelZoom: false, zoomSnap: 0.1
}).setView([41.5, 12.5], 7);

const mapRegione = L.map('map-regione', {
    zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false
}).setView([42.0, 12.5], 7);

let layerProvinceAttive = null;
let datiProvinceGlobali = null; // Salviamo i dati qui per riusarli

async function init() {
    try {
        const resReg = await fetch('https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson');
        const dataReg = await resReg.json();

        const resProv = await fetch('https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_provinces.geojson');
        datiProvinceGlobali = await resProv.json();

        const layerItalia = L.geoJSON(dataReg, {
            style: { color: "#2c3e50", weight: 1.5, fillColor: "#ecf0f1", fillOpacity: 1 },
            onEachFeature: (f, l) => {
                l.on('mouseover', () => l.setStyle({ fillColor: '#3498db' }));
                l.on('mouseout', () => l.setStyle({ fillColor: '#ecf0f1' }));
                l.on('click', () => mostraDettaglio(f.properties.reg_name));
            }
        }).addTo(mapItalia);
        // lasciamo 40 pixel di margine (padding) da ogni lato
        mapItalia.fitBounds(layerItalia.getBounds(), { padding: [20, 20] });
    } catch (e) { console.error(e); }
}

function mostraDettaglio(nomeRegione) {
    const sezioneDettaglio = document.getElementById('blocco-dettaglio');
    sezioneDettaglio.classList.remove('nascosto');

    // 1. Scorrimento verso il basso
    sezioneDettaglio.scrollIntoView({ behavior: 'smooth' });

    // 2. Aggiorno testo
    document.getElementById('nome-regione-titolo').innerText = "Regione: " + nomeRegione;

    // 3. Disegno Province con un piccolo ritardo per evitare la mappa bianca
    setTimeout(() => {
        mapRegione.invalidateSize();

        if (layerProvinceAttive) mapRegione.removeLayer(layerProvinceAttive);

        const filtrate = {
            type: "FeatureCollection",
            features: datiProvinceGlobali.features.filter(p => p.properties.reg_name === nomeRegione)
        };

        layerProvinceAttive = L.geoJSON(filtrate, {
            style: { color: "#2c3e50", weight: 1, fillColor: "#bdc3c7", fillOpacity: 1 },
            onEachFeature: (f, l) => {
                l.bindTooltip(f.properties.prov_name);
                l.on('mouseover', () => l.setStyle({ fillColor: '#f1c40f' }));
                l.on('mouseout', () => l.setStyle({ fillColor: '#bdc3c7' }));
            }
        }).addTo(mapRegione);

        mapRegione.fitBounds(layerProvinceAttive.getBounds(), { padding: [20, 20] });
    }, 400); // 400ms di attesa per permettere allo scorrimento di iniziare
}

init();