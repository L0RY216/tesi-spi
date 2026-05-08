// --- CONFIGURAZIONE ---
const mapItalia = L.map('map-italia', {
    zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, zoomSnap: 0.1, attributionControl: false
}).setView([41.5, 12.5], 7);

const mapRegione = L.map('map-regione', {
    zoomControl: true, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, attributionControl: false
}).setView([42.0, 12.5], 7);

let layerProvinceAttive = null;
let datiProvinceGlobali = null; // Salviamo i dati qui per riusarli

let layerItalia = null; // Portiamo fuori il layer così possiamo modificarlo dopo
let datiRegioniSPI = null;
let datiProvinceSPI = null;
let ultimiPesiCalcolati = null;

async function init() {
    try {
        const resReg = await fetch('https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson');
        const dataReg = await resReg.json();

        const resProv = await fetch('https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_provinces.geojson');
        datiProvinceGlobali = await resProv.json();

        // Carico i nostri dati SPI dai file JSON
        const resRegSPI = await fetch('data/dati_regioni.json');
        datiRegioniSPI = await resRegSPI.json();

        const resProvSPI = await fetch('data/dati_province.json');
        datiProvinceSPI = await resProvSPI.json();

        // Disegna la mappa Italia base
        layerItalia = L.geoJSON(dataReg, {
            style: { color: "#2c3e50", weight: 1.5, fillColor: "#c6c6c6", fillOpacity: 1 },
            onEachFeature: (f, l) => {
                l.bindTooltip(f.properties.reg_name);
                l.on('mouseover', () => l.setStyle({ weight: 3 })); // Evidenzia solo il bordo
                l.on('mouseout', () => l.setStyle({ weight: 1.5 })); // Ripristina il bordo
                l.on('click', () => mostraDettaglio(f.properties.reg_name));
            }
        }).addTo(mapItalia);
        // lasciamo 20 pixel di margine (padding) da ogni lato
        mapItalia.fitBounds(layerItalia.getBounds(), { padding: [20, 20] });
    } catch (e) { console.error("Errore di caricamento:", e); }
}

function mostraDettaglio(nomeRegione) {
    if (!ultimiPesiCalcolati) {
        return;
    }

    const sezioneDettaglio = document.getElementById('blocco-dettaglio');
    sezioneDettaglio.classList.remove('nascosto');

    // Scorrimento verso il basso allineato al fondo
    sezioneDettaglio.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Aggiorno testo
    document.getElementById('nome-regione-titolo').innerText = "Regione: " + nomeRegione;

    // Disegno Province con un piccolo ritardo per permettere l'animazione di scorrimento
    setTimeout(() => {
        mapRegione.invalidateSize();

        if (layerProvinceAttive) mapRegione.removeLayer(layerProvinceAttive);

        const filtrate = {
            type: "FeatureCollection",
            features: datiProvinceGlobali.features.filter(p => p.properties.reg_name === nomeRegione)
        };

        // LOGICA RANKING PROVINCE
        const rankingProvince = [];
        let nomeRegioneRanking = nomeRegione;
        if (nomeRegioneRanking === "Valle d'Aosta/Vallée d'Aoste") nomeRegioneRanking = "Valle d'Aosta";
        if (nomeRegioneRanking === "Trentino-Alto Adige/Südtirol") nomeRegioneRanking = "Trentino-Alto Adige";

        // Cerchiamo nel nostro JSON tutte le province che appartengono a questa regione
        for (const sigla in datiProvinceSPI) {
            const infoProv = datiProvinceSPI[sigla];

            if (infoProv.regione === nomeRegioneRanking) {
                const score = calcolaPunteggioSPI(infoProv, ultimiPesiCalcolati);
                rankingProvince.push({ nome: infoProv.nome, score: score });
            }
        }

        // Popoliamo la lista nel dettaglio
        aggiornaListaRanking('lista-ranking-province', rankingProvince);

        layerProvinceAttive = L.geoJSON(filtrate, {
            // STILE DINAMICO: calcoliamo il colore provincia per provincia
            style: function (feature) {
                // Recupero la sigla direttamente dal GeoJSON
                const siglaProv = feature.properties.prov_acr;

                const item = datiProvinceSPI[siglaProv];
                let color = "#c6c6c6"; // Colore di default se mancano i dati

                // Se troviamo i dati nel nostro JSON, calcoliamo il punteggio
                if (item) {
                    const score = calcolaPunteggioSPI(item, ultimiPesiCalcolati);
                    color = getColorByScore(score);
                }

                return {
                    color: "#2c3e50", // Colore del bordo
                    weight: 1.5,        // Spessore del bordo
                    fillColor: color, // Il nostro colore dinamico
                    fillOpacity: 1
                };
            },
            onEachFeature: (f, l) => {
                const siglaProv = f.properties.prov_acr;
                const item = datiProvinceSPI[siglaProv];
                let nomeDaMostrare = item ? item.nome : f.properties.prov_name;
                let labelTesto = nomeDaMostrare;

                if (item) {
                    const score = calcolaPunteggioSPI(item, ultimiPesiCalcolati);
                    labelTesto = `${nomeDaMostrare}: ${score.toFixed(1)}`;
                }

                l.bindTooltip(labelTesto);

                // HOVER EFFECT: Ingrossiamo il bordo come per le regioni
                l.on('mouseover', () => l.setStyle({ weight: 3 }));
                l.on('mouseout', () => l.setStyle({ weight: 1.5 }));
            }
        }).addTo(mapRegione);

        mapRegione.fitBounds(layerProvinceAttive.getBounds(), { padding: [20, 20] });
    }, 400); // 400ms di attesa per permettere allo scorrimento di iniziare
}

// Funzione per ottenere il colore in base al punteggio SPI (0-100)
function getColorByScore(score) {
    if (score === null || score === undefined) return '#c6c6c6'; // Grigio se nessun dato
    // 100-91 / 90-81 / 80-76 / 75-71 / 70-66 / 65-61 / 60-56 / 55-51 / 50-41 / 40-31 / 30-21 / 20-0

    return score > 90 ? '#0b901c' : // Verde Scuro
        score > 80 ? '#5fc610' : // Verde
            score > 75 ? '#8fea20' : // Verde chiaro
                score > 70 ? '#d4f52d' : // Giallo-Verde 
                    score > 65 ? '#fffb00' : // Giallo chiaro
                        score > 60 ? '#ffea00' : // Giallo
                            score > 55 ? '#edd500' : // Giallo scuro
                                score > 50 ? '#fec300' : // Arancione chiaro
                                    score > 40 ? '#fc9b00' : // Arancione
                                        score > 30 ? '#e27a03' : // Arancione scuro
                                            score > 20 ? '#f21212' : // Rosso
                                                '#c42b23';  // Rosso scuro
}

// Viene chiamata da sidebar.js quando si clicca "Calcola" o si cambia il mese
window.aggiornaMappaRegioni = function (pesi) {
    if (!layerItalia || !datiRegioniSPI) return; // Sicurezza: attendi il caricamento dei dati

    ultimiPesiCalcolati = pesi;

    const punteggiPerRanking = [];

    // 1. Calcola il punteggio per TUTTE le regioni
    const punteggiRegioni = {};
    for (const nomeReg in datiRegioniSPI) {
        const item = datiRegioniSPI[nomeReg];
        const score = calcolaPunteggioSPI(item, pesi);
        punteggiRegioni[nomeReg] = score;
        // Aggiungiamo all'array per il ranking
        punteggiPerRanking.push({ nome: nomeReg, score: score });
    }

    // 2. Ricolora la mappa in base ai punteggi
    layerItalia.eachLayer(layer => {
        const nomeRegGeo = layer.feature.properties.reg_name;

        // Bisogna mappare il nome GeoJSON con la chiave JSON se ci sono differenze (es. Valle d'Aosta)
        // Gestistiamo qui le eccezioni
        let key = nomeRegGeo;
        if (key === "Valle d'Aosta/Vallée d'Aoste") key = "Valle d'Aosta";
        if (key === "Trentino-Alto Adige/Südtirol") key = "Trentino-Alto Adige";

        const score = punteggiRegioni[key];

        if (score !== undefined) {
            const color = getColorByScore(score);
            layer.setStyle({ fillColor: color });

            // Aggiorna l'etichetta per mostrare il punteggio
            layer.setTooltipContent(`${nomeRegGeo}: ${score.toFixed(1)}`);
        }
    });

    // Se c'è una regione aperta nel dettaglio, aggiorniamo anche i colori delle sue province
    const nomeRegioneAperta = document.getElementById('nome-regione-titolo').innerText.replace("Regione: ", "");
    if (document.getElementById('blocco-dettaglio').classList.contains('nascosto') === false) {
        // Ridisegna il dettaglio con i nuovi pesi
        mostraDettaglio(nomeRegioneAperta);
    }

    // LOGICA RANKING REGIONI
    // Top 3
    const top3 = [...punteggiPerRanking].sort((a, b) => b.score - a.score).slice(0, 3);
    aggiornaListaRanking('top-3-list', top3);

    // Flop 3 (gli ultimi 3, invertiti per mostrare il peggiore in cima)
    const flop3 = [...punteggiPerRanking].sort((a, b) => a.score - b.score).slice(0, 3);
    aggiornaListaRanking('flop-3-list', flop3, false);

    // Rimuove il messaggio "Calcola l'indice..." se presente
    const msg = document.querySelector('.empty-msg');
    if (msg) msg.style.display = 'none';
};

// Funzione per popolare una lista di ranking
function aggiornaListaRanking(containerId, dati, decrescente = true) {
    const listaUL = document.getElementById(containerId);
    if (!listaUL) return;

    // Pulizia della lista e rimozione eventuale messaggio "vuoto"
    listaUL.innerHTML = "";

    // Ordiniamo i dati in base allo score
    const datiOrdinati = [...dati].sort((a, b) =>
        decrescente ? b.score - a.score : a.score - b.score
    );

    datiOrdinati.forEach(item => {
        const li = document.createElement('li');
        li.className = 'rank-item';
        li.innerHTML = `
            <span>${item.nome}</span>
            <span class="rank-score" style="background-color: ${getColorByScore(item.score)}22; color: ${getColorByScore(item.score)}">
                ${item.score.toFixed(1)}
            </span>
        `;
        listaUL.appendChild(li);
    });
}

init();