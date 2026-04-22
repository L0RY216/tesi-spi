document.addEventListener('DOMContentLoaded', function () {
    // 1. RIFERIMENTI AGLI ELEMENTI UI
    const wSole = document.getElementById('w_sole');
    const wSoldi = document.getElementById('w_soldi');
    const wTecnico = document.getElementById('w_tecnico');

    const valSole = document.getElementById('val_sole');
    const valSoldi = document.getElementById('val_soldi');
    const valTecnico = document.getElementById('val_tecnico');

    const totalWeightDisplay = document.getElementById('total-weight');
    const calculateBtn = document.getElementById('calculate-btn');
    const monthSelector = document.getElementById('month-selector-container');

    // 2. LOGICA DI CONTROLLO PESI
    function controllaPesi() {
        const v1 = parseInt(wSole.value);
        const v2 = parseInt(wSoldi.value);
        const v3 = parseInt(wTecnico.value);

        valSole.textContent = v1 + '%';
        valSoldi.textContent = v2 + '%';
        valTecnico.textContent = v3 + '%';

        const somma = v1 + v2 + v3;
        totalWeightDisplay.textContent = somma + '%';

        if (somma === 100) {
            calculateBtn.disabled = false;
            calculateBtn.style.opacity = '1';
            totalWeightDisplay.style.color = 'green';
        } else {
            calculateBtn.disabled = true;
            calculateBtn.style.opacity = '0.5';
            totalWeightDisplay.style.color = 'red';
        }
    }

    // 3. LA FUNZIONE DI CALCOLO
    const MAX_REDDITO_ASSOLUTO = 30742;
    const MAX_IRRAD_ANNUALE = 34999;
    const MAX_IRRAD_MENSILE = 249;

    w
    // Questa funzione trasforma i dati della provincia/regione in un punteggio 0-100
    window.calcolaPunteggioSPI = function (item, pesi) {
        const meseSelezionato = document.querySelector('input[name="month"]:checked').value;

        // Normalizzazione: portiamo tutto in scala 0-1
        const maxIrrad = (meseSelezionato === 'annuo') ? MAX_IRRAD_ANNUALE : MAX_IRRAD_MENSILE;
        const scoreIrrad = (item.irradiazione[meseSelezionato] / maxIrrad);

        const scoreReddito = (item.reddito / MAX_REDDITO_ASSOLUTO);
        const scoreEdifici = (item.edifici_bassi / 100);

        // Applichiamo i pesi (w/100) e sommiamo
        const punteggioFinale = (
            (scoreIrrad * (pesi.sole / 100)) +
            (scoreReddito * (pesi.soldi / 100)) +
            (scoreEdifici * (pesi.tecnico / 100))
        ) * 100; // Riportiamo in scala 0-100 per i colori della mappa

        return punteggioFinale;
    };

    // 4. GESTIONE EVENTI
    [wSole, wSoldi, wTecnico].forEach(s => s.addEventListener('input', controllaPesi));

    calculateBtn.addEventListener('click', function () {
        monthSelector.style.display = 'block';

        const pesiAttuali = {
            sole: parseInt(wSole.value),
            soldi: parseInt(wSoldi.value),
            tecnico: parseInt(wTecnico.value)
        };

        // Chiamiamo le funzioni di map.js (che scriveremo nel prossimo step)
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