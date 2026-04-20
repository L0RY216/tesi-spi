const fs = require('fs');

// 1. Legge il nostro file con le coordinate
const provinceRaw = fs.readFileSync('province.json');
const province = JSON.parse(provinceRaw);

// Il file finale che andremo a creare
const outputData = {};

async function fetchAllData() {
    console.log("Inizio l'estrazione dati da PVGIS...\n");

    // 2. Ciclo attraverso ogni provincia
    for (const prov of province) {
        console.log(`Sto scaricando i dati per: ${prov.nome} (${prov.sigla})...`);

        // 3. Costruisco l'URL magico per l'API (come se lo scrivessi nel browser)
        // param: outputformat=json (ci dà il dato pulito, non il csv sporco!)
        // param: angle=0 (piano orizzontale, come abbiamo deciso)
        const url = `https://re.jrc.ec.europa.eu/api/MRcalc?lat=${prov.lat}&lon=${prov.lon}&horirrad=1&outputformat=json`;

        try {
            // 4. Eseguo la chiamata al server
            const response = await fetch(url);
            const data = await response.json();

            // 5. Estraggo i dati mensili e li formatto come vogliamo noi
            const irradiazioneMensile = {};
            const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

            // I dati mensili sono nell'array data.outputs.monthly
            data.outputs.monthly.forEach(meseData => {
                // Scegliamo H(h)_m come deciso prima (Global horizontal irradiation)
                irradiazioneMensile[mesi[meseData.month - 1]] = meseData['H(h)_m'];
            });

            // 6. Aggiungo la provincia al nostro oggetto finale
            outputData[prov.sigla] = {
                nome: prov.nome,
                lat: prov.lat,
                lon: prov.lon,
                irradiazione: irradiazioneMensile
            };

            // Pausa di 1 secondo per non "bombardare" il server europeo e farci bloccare
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.error(`Errore nel download di ${prov.nome}:`, error.message);
        }
    }

    // 7. Scrivo il risultato nel file finale
    fs.writeFileSync('./data/irradiazione.json', JSON.stringify(outputData, null, 2));
    console.log("\nFinito! Il file irradiazione.json è stato creato nella cartella 'data'.");
}

// Faccio partire la funzione
fetchAllData();