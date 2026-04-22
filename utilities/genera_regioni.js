const fs = require('fs');

console.log("Generazione del file dati_regioni.json (Schema Unificato) in corso...");

try {
    const datiProvince = JSON.parse(fs.readFileSync('./data/dati_province.json', 'utf8'));
    const regioni = {};

    // 1. Sommiamo tutti i valori provincia per provincia
    for (const sigla in datiProvince) {
        const p = datiProvince[sigla];
        let nomeRegione = p.regione;

        // Accorpiamo il Trentino
        if (nomeRegione.includes("Trentino")) nomeRegione = "Trentino-Alto Adige";

        if (!regioni[nomeRegione]) {
            regioni[nomeRegione] = {
                nome: nomeRegione,
                irradiazione: { gen: 0, feb: 0, mar: 0, apr: 0, mag: 0, giu: 0, lug: 0, ago: 0, set: 0, ott: 0, nov: 0, dic: 0, annuo: 0 },
                reddito: 0,
                edifici_bassi: 0,
                conta: 0
            };
        }

        // Somma di ogni singolo mese e dell'annuo
        const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic', 'annuo'];
        for (let m of mesi) {
            regioni[nomeRegione].irradiazione[m] += p.irradiazione[m];
        }
        
        regioni[nomeRegione].reddito += p.reddito;
        regioni[nomeRegione].edifici_bassi += p.edifici_bassi;
        regioni[nomeRegione].conta++;
    }

    // 2. Calcoliamo le medie e creiamo il formato finale pulito
    const outputRegioni = {};
    for (const r in regioni) {
        const reg = regioni[r];
        const conta = reg.conta;
        
        outputRegioni[r] = {
            nome: reg.nome,
            irradiazione: {},
            reddito: Math.round(reg.reddito / conta),
            edifici_bassi: Math.round(reg.edifici_bassi / conta)
        };
        
        // Media mensile dell'irradiazione (con 2 decimali come nell'originale)
        const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic', 'annuo'];
        for (let m of mesi) {
            let media = reg.irradiazione[m] / conta;
            // L'annuo lo teniamo intero, i mesi con 2 decimali
            outputRegioni[r].irradiazione[m] = (m === 'annuo') ? Math.round(media) : parseFloat(media.toFixed(2));
        }
    }

    fs.writeFileSync('./data/dati_regioni.json', JSON.stringify(outputRegioni, null, 2));
    console.log(`✅ Successo! Creato dati_regioni.json con struttura perfettamente identica alle province.`);

} catch (e) {
    console.error("❌ Errore:", e.message);
}