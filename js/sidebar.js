document.addEventListener('DOMContentLoaded', function () {
    // 1. RIFERIMENTI AGLI ELEMENTI UI
    const wIrrad = document.getElementById('w_irrad');
    const wReddito = document.getElementById('w_reddito');
    const wEdifici = document.getElementById('w_edifici');

    const valIrrad = document.getElementById('val_irrad');
    const valReddito = document.getElementById('val_reddito');
    const valEdifici = document.getElementById('val_edifici');

    const calculateBtn = document.getElementById('calculate-btn');
    const monthSelector = document.getElementById('month-selector-container');
    let calcoloEffettuato = false; // Tiene traccia se il calcolo è stato avviato

    // 2. LOGICA DI CONTROLLO PESI
    function controllaPesi() {
        const v1 = parseInt(wIrrad.value);
        const v2 = parseInt(wReddito.value);
        const v3 = parseInt(wEdifici.value);
        const somma = v1 + v2 + v3;

        let v1Norm = 0;
        let v2Norm = 0;
        let v3Norm = 0;

        if (somma > 0) {
            // normalizziamo i valori
            v1Norm = (v1 / somma) * 100;
            v2Norm = (v2 / somma) * 100;
            v3Norm = (v3 / somma) * 100;

            calculateBtn.disabled = false;
            calculateBtn.style.opacity = '1';
        } else {
            calculateBtn.disabled = true;
            calculateBtn.style.opacity = '0.5';
        }

        valIrrad.textContent = v1Norm.toFixed(1) + '%';
        valReddito.textContent = v2Norm.toFixed(1) + '%';
        valEdifici.textContent = v3Norm.toFixed(1) + '%';

        // GESTIONE VISIBILITÀ SELETTORE MESI
        if (calcoloEffettuato) {
            if (v1 > 0) {
                monthSelector.style.display = 'block';
            } else {
                monthSelector.style.display = 'none';
            }
        }
    }

    // 3. LA FUNZIONE DI CALCOLO
    const MAX_REDDITO_ASSOLUTO = 30742;
    const MAX_IRRAD_ANNUALE = 34999;
    const MAX_IRRAD_MENSILE = 249.29;
    const MAX_EDIFICI_BASSI_REG = 1332784;
    const MAX_EDIFICI_BASSI_PROV = 316295;

    // Questa funzione trasforma i dati della provincia/regione in un punteggio 0-100
    window.calcolaPunteggioSPI = function (item, pesi, flag) {
        // flag = false, se stiamo calcolando per le regioni (usa MAX_EDIFICI_BASSI_REG), true per le province (usa MAX_EDIFICI_BASSI_PROV)

        const meseSelezionato = document.querySelector('input[name="month"]:checked').value;

        // Normalizzazione: portiamo tutto in scala 0-1
        const maxIrrad = (meseSelezionato === 'annuo') ? MAX_IRRAD_ANNUALE : MAX_IRRAD_MENSILE;
        const scoreIrrad = (item.irradiazione[meseSelezionato] / maxIrrad);

        const scoreReddito = (item.reddito / MAX_REDDITO_ASSOLUTO);

        const maxEdifici = flag ? MAX_EDIFICI_BASSI_PROV : MAX_EDIFICI_BASSI_REG;
        const scoreEdifici = (item.edifici_bassi / maxEdifici);

        // Applichiamo i pesi (w/100) e sommiamo
        const punteggioFinale = (
            (scoreIrrad * (pesi.irrad / 100)) +
            (scoreReddito * (pesi.reddito / 100)) +
            (scoreEdifici * (pesi.edifici / 100))
        ) * 100; // Riportiamo in scala 0-100 per i colori della mappa

        let valoriDiRitorno = {
            irrad: (scoreIrrad * pesi.irrad),
            reddito: (scoreReddito * pesi.reddito),
            edifici: (scoreEdifici * pesi.edifici),
            totale: punteggioFinale
        };

        console.log(valoriDiRitorno);
        return valoriDiRitorno;
    };

    // 4. GESTIONE EVENTI
    [wIrrad, wReddito, wEdifici].forEach(s => s.addEventListener('input', controllaPesi));

    calculateBtn.addEventListener('click', function () {
        calcoloEffettuato = true;

        // Estrai valori grezzi
        const v1Raw = parseInt(wIrrad.value);
        const v2Raw = parseInt(wReddito.value);
        const v3Raw = parseInt(wEdifici.value);
        const sommaRaw = v1Raw + v2Raw + v3Raw;

        if (sommaRaw === 0) return; // Evita divisioni per 0

        // Calcola e passa le percentuali precise
        const pesiAttuali = {
            irrad: (v1Raw / sommaRaw) * 100,
            reddito: (v2Raw / sommaRaw) * 100,
            edifici: (v3Raw / sommaRaw) * 100
        };

        controllaPesi();

        if (typeof aggiornaMappaRegioni === "function") {
            aggiornaMappaRegioni(pesiAttuali);
        }
    });

    // Se l'utente cambia il mese dopo aver già calcolato, aggiorna tutto
    document.querySelectorAll('input[name="month"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (monthSelector.style.display === 'block') {
                calculateBtn.click();
            }
        });
    });

    controllaPesi(); // Inizializzazione al caricamento
});

// Gestione della Modal Guida
const modal = document.getElementById("modal-guida");
const btn = document.getElementById("btn-guida");
const span = document.getElementsByClassName("close-modal")[0];

// Apri al click
btn.onclick = function () {
    modal.classList.remove("nascosto");
}

// Chiudi con la X
span.onclick = function () {
    modal.classList.add("nascosto");
}

// Chiudi cliccando fuori dalla finestra bianca
window.onclick = function (event) {
    if (event.target == modal) {
        modal.classList.add("nascosto");
    }
}