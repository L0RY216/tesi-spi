const fs = require('fs');

function aggiornaDatiProvince() {
    console.log("Inizio aggiornamento del file JSON...");

    // 1. Legge il file JSON originale
    let datiProv;
    try {
        const jsonRaw = fs.readFileSync('dati_province.json', 'utf-8');
        datiProv = JSON.parse(jsonRaw);
    } catch (e) {
        console.error("Errore: impossibile leggere 'dati_province.json'. Sicuro che esista?");
        return;
    }

    // 2. Legge il file CSV con i risultati degli edifici
    let righeCsv;
    try {
        const csvRaw = fs.readFileSync('risultati_edifici_bassi_province.csv', 'utf-8');
        righeCsv = csvRaw.split('\n');
    } catch (e) {
        console.error("Errore: impossibile leggere 'risultati_edifici_bassi_province.csv'.");
        return;
    }

    // 3. Estrae i dati dal CSV e li mette in una mappa { "Nome Provincia": Percentuale }
    const mappaCsv = {};
    // Partiamo da 1 per saltare l'intestazione del CSV
    for (let i = 1; i < righeCsv.length; i++) {
        const riga = righeCsv[i].trim();
        if (!riga) continue;

        const colonne = riga.split(';');
        const provincia = colonne[1].trim();
        
        // ISTAT/il nostro script precedente usa la virgola per i decimali, JS vuole il punto
        const percStr = colonne[4].replace(',', '.');
        mappaCsv[provincia] = parseFloat(percStr);
    }

    // 4. Scorre le province del JSON e aggiorna il parametro edifici_bassi
    for (const sigla in datiProv) {
        const prov = datiProv[sigla];
        const nomeProv = prov.nome;
        let nomeRicerca = nomeProv;

        // Gestione delle differenze di nomenclatura tra mappa e ISTAT
        if (nomeProv === 'Aosta') nomeRicerca = "Valle d'Aosta/Vallée d'Aoste";
        else if (nomeProv === 'Bolzano') nomeRicerca = 'Bolzano/Bozen';
        else if (nomeProv === 'Reggio Calabria') nomeRicerca = 'Reggio di Calabria';
        else if (nomeProv === 'Reggio Emilia') nomeRicerca = "Reggio nell'Emilia";

        // Gestione speciale per Sud Sardegna (Media di Medio Campidano e Carbonia-Iglesias)
        if (nomeProv === 'Sud Sardegna') {
            const mc = mappaCsv['Medio Campidano'] || 0;
            const ci = mappaCsv['Carbonia-Iglesias'] || 0;
            if (mc > 0 && ci > 0) {
                // Calcola la media e arrotonda a 2 decimali
                prov.edifici_bassi = parseFloat(((mc + ci) / 2).toFixed(2));
            }
            continue; // Passa alla prossima provincia
        }

        // Cerca il valore nella mappa CSV e aggiorna
        if (mappaCsv[nomeRicerca] !== undefined) {
            prov.edifici_bassi = mappaCsv[nomeRicerca];
        } else {
            console.log(`\u26A0\uFE0F Attenzione: Dato non trovato nel CSV per ${nomeProv}`);
        }
    }

    // 5. Salva il file JSON aggiornato
    fs.writeFileSync('dati_province.json', JSON.stringify(datiProv, null, 2), 'utf-8');
    console.log('\u2705 Operazione completata! Il file dati_province.json è stato aggiornato con successo.');
}

aggiornaDatiProvince();