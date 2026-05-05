const fs = require('fs');
const path = require('path');

function calcolaEdificiBassi() {
    console.log("Ricerca dei file CSV ISTAT in corso...");

    // Cerca i file nella cartella corrente che iniziano con "R" e finiscono in ".csv"
    const files = fs.readdirSync(__dirname).filter(f => f.startsWith('R') && f.endsWith('_indicatori_2011_localita.csv'));

    if (files.length === 0) {
        console.log("Nessun file trovato. Assicurati che lo script sia nella stessa cartella dei CSV ISTAT.");
        return;
    }

    console.log(`Trovati ${files.length} file. Inizio l'elaborazione...`);

    // Oggetti per aggregare i dati
    const datiProvince = {};
    const datiRegioni = {};

    // 1. LETTURA ED ESTRAZIONE DATI
    files.forEach(file => {
        // ISTAT usa la codifica 'latin1' per le lettere accentate italiane
        const contenuto = fs.readFileSync(path.join(__dirname, file), 'latin1');
        const righe = contenuto.split('\n');

        if (righe.length < 2) return;

        // Estrai intestazioni pulendo eventuali a capo (\r) e virgolette
        const headers = righe[0].replace(/\r/g, '').replace(/"/g, '').split(';');

        const idxRegione = headers.indexOf('REGIONE');
        const idxProvincia = headers.indexOf('PROVINCIA');
        const idxE17 = headers.indexOf('E17'); // 1 piano
        const idxE18 = headers.indexOf('E18'); // 2 piani
        const idxE19 = headers.indexOf('E19'); // 3 piani
        const idxE20 = headers.indexOf('E20'); // 4+ piani

        // Salta il file se non trova le colonne necessarie
        if (idxRegione === -1 || idxE17 === -1) return;

        // Itera su tutte le righe (partendo dalla 1 per saltare l'intestazione)
        for (let i = 1; i < righe.length; i++) {
            const riga = righe[i].replace(/\r/g, '');
            if (!riga) continue; // Salta righe vuote

            const valori = riga.replace(/"/g, '').split(';');

            const regione = valori[idxRegione];
            const provincia = valori[idxProvincia];

            // Converte in numero intero. Se la cella è vuota o testo strano, mette 0
            const e17 = parseInt(valori[idxE17]) || 0;
            const e18 = parseInt(valori[idxE18]) || 0;
            const e19 = parseInt(valori[idxE19]) || 0;
            const e20 = parseInt(valori[idxE20]) || 0;

            // --- Aggrega per PROVINCIA ---
            const provKey = `${regione}_${provincia}`;
            if (!datiProvince[provKey]) {
                datiProvince[provKey] = { REGIONE: regione, PROVINCIA: provincia, E17: 0, E18: 0, E19: 0, E20: 0 };
            }
            datiProvince[provKey].E17 += e17;
            datiProvince[provKey].E18 += e18;
            datiProvince[provKey].E19 += e19;
            datiProvince[provKey].E20 += e20;

            // --- Aggrega per REGIONE ---
            if (!datiRegioni[regione]) {
                datiRegioni[regione] = { REGIONE: regione, E17: 0, E18: 0, E19: 0, E20: 0 };
            }
            datiRegioni[regione].E17 += e17;
            datiRegioni[regione].E18 += e18;
            datiRegioni[regione].E19 += e19;
            datiRegioni[regione].E20 += e20;
        }
    });

    // 2. CALCOLO PERCENTUALI ED ESPORTAZIONE PROVINCE
    let csvProvince = "REGIONE;PROVINCIA;EDIFICI_1_3_PIANI;TOTALE_EDIFICI_PIANI_NOTI;PERC_EDIFICI_BASSI\n";
    const arrayPerWebApp = []; // Array per il JSON

    for (const key in datiProvince) {
        const p = datiProvince[key];
        const edificiBassi = p.E17 + p.E18 + p.E19;
        const totalePiani = edificiBassi + p.E20;

        let perc = 0;
        if (totalePiani > 0) {
            perc = (edificiBassi / totalePiani) * 100;
        }
        perc = Number(perc.toFixed(2)); // Arrotonda a 2 decimali

        // Costruisci riga CSV (usiamo la virgola per i decimali in stile italiano)
        csvProvince += `${p.REGIONE};${p.PROVINCIA};${edificiBassi};${totalePiani};${perc.toString().replace('.', ',')}\n`;

        // Push nell'array per il file JSON della web app
        arrayPerWebApp.push({
            provincia: p.PROVINCIA,
            edifici_bassi_perc: perc
        });
    }

    // 3. CALCOLO PERCENTUALI ED ESPORTAZIONE REGIONI
    let csvRegioni = "REGIONE;EDIFICI_1_3_PIANI;TOTALE_EDIFICI_PIANI_NOTI;PERC_EDIFICI_BASSI\n";

    for (const reg in datiRegioni) {
        const r = datiRegioni[reg];
        const edificiBassi = r.E17 + r.E18 + r.E19;
        const totalePiani = edificiBassi + r.E20;

        let perc = 0;
        if (totalePiani > 0) {
            perc = (edificiBassi / totalePiani) * 100;
        }
        perc = Number(perc.toFixed(2));

        csvRegioni += `${r.REGIONE};${edificiBassi};${totalePiani};${perc.toString().replace('.', ',')}\n`;
    }

    // 4. SCRITTURA FILE FINALI
    fs.writeFileSync('risultati_edifici_bassi_province.csv', csvProvince, 'utf8');
    fs.writeFileSync('risultati_edifici_bassi_regioni.csv', csvRegioni, 'utf8');

    console.log("Finito! Ho creato 2 file:");
    console.log("1. risultati_edifici_bassi_province.csv");
    console.log("2. risultati_edifici_bassi_regioni.csv");
}

calcolaEdificiBassi();