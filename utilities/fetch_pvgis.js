const fs = require('fs');

// 1. Legge il nostro file con le coordinate
const provinceRaw = fs.readFileSync('province.json');
const province = JSON.parse(provinceRaw);

const outputData = {};

async function fetchAllData() {
    console.log(`Inizio l'estrazione dati da PVGIS per ${province.length} province...\n`);

    for (const prov of province) {
        console.log(`Scaricando i dati solari per: ${prov.nome} (${prov.sigla})...`);

        const url = `https://re.jrc.ec.europa.eu/api/MRcalc?lat=${prov.lat}&lon=${prov.lon}&horirrad=1&outputformat=json`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const irradiazioneMensile = {};
            const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
            let totaleAnnuo = 0; // Variabile per calcolare il totale

            // Mappiamo i mesi e sommiamo
            data.outputs.monthly.forEach(meseData => {
                const valore = meseData['H(h)_m'];
                irradiazioneMensile[mesi[meseData.month - 1]] = valore;
                totaleAnnuo += valore;
            });

            // Aggiungiamo il parametro "annuo" arrotondato
            irradiazioneMensile['annuo'] = Math.round(totaleAnnuo);

            // Costruiamo il Master JSON con i placeholder per gli altri dati
            outputData[prov.sigla] = {
                nome: prov.nome,
                regione: prov.regione,
                lat: prov.lat,
                lon: prov.lon,
                irradiazione: irradiazioneMensile,
                reddito: 0,          // CAMPO PRONTO PER IL PROSSIMO PARAMETRO
                edifici_bassi: 0     // CAMPO PRONTO PER IL PROSSIMO PARAMETRO
            };

            // Pausa per rispettare i limiti del server europeo
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.error(`Errore nel download di ${prov.nome}:`, error.message);
        }
    }

    // Scriviamo il risultato nel nuovo Master JSON
    fs.writeFileSync('./data/dati_province.json', JSON.stringify(outputData, null, 2));
    console.log("\nFinito! Il file 'dati_province.json' è stato creato con successo nella cartella 'data'.");
}

fetchAllData();