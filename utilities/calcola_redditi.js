const fs = require('fs');

try {
    // 1. Leggo il file CSV sui redditi dei comuni
    const fileCsv = fs.readFileSync('./data/redditi_comuni.csv', 'utf8').replace(/\r/g, '');
    const righe = fileCsv.split('\n');

    // 2. Leggo l'header per trovare le colonne utili
    const intestazioni = righe[0].split(';');
    
    const idxProv = intestazioni.findIndex(h => h.includes('Sigla Provincia'));
    const idxReg = intestazioni.findIndex(h => h.includes('Regione') && !h.includes('Codice'));
    const idxContribuenti = intestazioni.findIndex(h => h.includes('Numero contribuenti'));
    // Cerchiamo la colonna dell'Ammontare Totale
    const idxAmmontare = intestazioni.findIndex(h => h.includes('Reddito imponibile - Ammontare in euro') || h.includes('Reddito complessivo da dichiarazione - Ammontare in euro'));

    if (idxProv === -1 || idxContribuenti === -1 || idxAmmontare === -1) {
        throw new Error("Non riesco a trovare le colonne corrette nel file CSV. Controlla le intestazioni.");
    }

    // 3. Oggetti temporanei per calcolare le somme
    const aggregatoProvince = {};
    const aggregatoRegioni = {};

    // 4. Ciclo su tutti gli 8000 comuni d'Italia
    for (let i = 1; i < righe.length; i++) {
        const colonne = righe[i].split(';');
        if (colonne.length < 5) continue; // Salta le righe vuote

        const siglaProv = colonne[idxProv].trim();
        const nomeRegione = colonne[idxReg].trim();
        const numContribuenti = parseFloat(colonne[idxContribuenti]) || 0;
        const ammontareEuro = parseFloat(colonne[idxAmmontare]) || 0;

        // Se è una riga valida e non è "Italia" (il totale nazionale)
        if (siglaProv && siglaProv !== '') {
            // Aggrego per Provincia
            if (!aggregatoProvince[siglaProv]) {
                aggregatoProvince[siglaProv] = { ammontareTot: 0, contribuentiTot: 0 };
            }
            aggregatoProvince[siglaProv].ammontareTot += ammontareEuro;
            aggregatoProvince[siglaProv].contribuentiTot += numContribuenti;

            // Aggrego per Regione
            if (!aggregatoRegioni[nomeRegione]) {
                aggregatoRegioni[nomeRegione] = { ammontareTot: 0, contribuentiTot: 0 };
            }
            aggregatoRegioni[nomeRegione].ammontareTot += ammontareEuro;
            aggregatoRegioni[nomeRegione].contribuentiTot += numContribuenti;
        }
    }

    // 5. Apro il nostro file dati_province.json per aggiornarlo
    const fileDatiProvince = fs.readFileSync('./data/dati_province.json', 'utf8');
    const datiProvince = JSON.parse(fileDatiProvince);

    let aggiornati = 0;

    // 6. Calcolo la Media (Ammontare Totale / Numero Contribuenti) e la salvo
    for (const sigla in aggregatoProvince) {
        if (datiProvince[sigla]) {
            const media = aggregatoProvince[sigla].ammontareTot / aggregatoProvince[sigla].contribuentiTot;
            // Arrotondo all'intero (es. 24560 euro)
            datiProvince[sigla].reddito = Math.round(media);
            aggiornati++;
        }
    }

    // 7. Salvo il JSON definitivo
    fs.writeFileSync('./data/dati_province.json', JSON.stringify(datiProvince, null, 2));

    console.log(`Reddito medio calcolato per ${aggiornati} province.`);
    
    // 8. Stampiamo a schermo le Regioni
    // (Mi servirà per il prossimo step, quando creerò dati_regioni.json)
    console.log("\n--- ANTEPRIMA REDDITI REGIONALI CALCOLATI ---");
    for (const reg in aggregatoRegioni) {
        const mediaReg = Math.round(aggregatoRegioni[reg].ammontareTot / aggregatoRegioni[reg].contribuentiTot);
        console.log(`${reg}: ${mediaReg} €`);
    }

} catch (e) {
    console.error("Errore:", e.message);
}