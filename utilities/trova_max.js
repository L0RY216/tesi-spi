const fs = require('fs');

console.log("Analisi del database in corso per trovare i Massimi Globali...\n");

try {
    const dati = JSON.parse(fs.readFileSync('./data/dati_province.json', 'utf8'));
    
    let maxReddito = 0;
    let maxIrradAnnuale = 0;
    let maxIrradMensile = 0;

    const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

    for (let p in dati) {
        const prov = dati[p];
        
        // 1. Trova il reddito massimo
        if (prov.reddito > maxReddito) maxReddito = prov.reddito;
        
        // 2. Trova l'irradiazione annuale massima
        if (prov.irradiazione.annuo > maxIrradAnnuale) maxIrradAnnuale = prov.irradiazione.annuo;
        
        // 3. Trova l'irradiazione mensile massima (controlla tutti i 12 mesi di questa provincia)
        for (let mese of mesi) {
            if (prov.irradiazione[mese] > maxIrradMensile) {
                maxIrradMensile = prov.irradiazione[mese];
            }
        }
    }

    console.log("=== VALORI DA INCOLLARE IN SIDEBAR.JS ===");
    console.log(`const MAX_REDDITO_ASSOLUTO = ${maxReddito};`);
    console.log(`const MAX_IRRAD_ANNUALE = ${maxIrradAnnuale};`);
    console.log(`const MAX_IRRAD_MENSILE = ${maxIrradMensile};`);
    console.log("=========================================");

} catch (e) {
    console.error("Errore durante la lettura del file:", e.message);
}