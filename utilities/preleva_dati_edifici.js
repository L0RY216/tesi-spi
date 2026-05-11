const fs = require('fs');
const path = require('path');

function prelevaDatiEdifici() {
    console.log("Ricerca dei file CSV ISTAT in corso...");

    // Cerca i file del censimento delle 20 regioni nella cartella corrente
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

    // 2. CREAZIONE DATI PROVINCE
    let csvProvince = "REGIONE;PROVINCIA;EDIFICI_1_PIANO;EDIFICI_2_PIANI;EDIFICI_3_PIANI;EDIFICI_4+_PIANI;EDIFICI_PESATI\n";

    for (const key in datiProvince) {
        const p = datiProvince[key];
        const ed_1_piano = p.E17;
        const ed_2_piani = p.E18
        const ed_3_piani = p.E19;
        const ed_4_piani = p.E20

        // Calcolo edifici pesati (1*E17 + 1*E18 + 1*E19 + 0*E20)
        // Diamo un peso di 1 a edifici con 1, 2 o 3 piani e 0 a quelli con 4 o più piani
        const ed_pesati = 1 * ed_1_piano + 1 * ed_2_piani + 1 * ed_3_piani + 0 * ed_4_piani;

        // Costruisci riga CSV
        csvProvince += `${p.REGIONE};${p.PROVINCIA};${ed_1_piano};${ed_2_piani};${ed_3_piani};${ed_4_piani};${ed_pesati}\n`;
    }

    // 3. CREAZIONE DATI REGIONI
    let csvRegioni = "REGIONE;EDIFICI_1_PIANO;EDIFICI_2_PIANI;EDIFICI_3_PIANI;EDIFICI_4+_PIANI;EDIFICI_PESATI\n";

    for (const reg in datiRegioni) {
        const r = datiRegioni[reg];
        const ed_1_piano = r.E17;
        const ed_2_piani = r.E18
        const ed_3_piani = r.E19;
        const ed_4_piani = r.E20;

        // Calcolo edifici pesati (1*E17 + 1*E18 + 1*E19 + 0*E20)
        // Diamo un peso di 1 a edifici con 1, 2 o 3 piani e 0 a quelli con 4 o più piani
        const ed_pesati = 1 * ed_1_piano + 1 * ed_2_piani + 1 * ed_3_piani + 0 * ed_4_piani;

        csvRegioni += `${r.REGIONE};${ed_1_piano};${ed_2_piani};${ed_3_piani};${ed_4_piani};${ed_pesati}\n`;
    }

    // 4. SCRITTURA FILE FINALI
    fs.writeFileSync('risultati_edifici_bassi_province.csv', csvProvince, 'utf8');
    fs.writeFileSync('risultati_edifici_bassi_regioni.csv', csvRegioni, 'utf8');

    console.log("Ho creato 2 file:");
    console.log("1. risultati_edifici_bassi_province.csv");
    console.log("2. risultati_edifici_bassi_regioni.csv");
}

prelevaDatiEdifici();