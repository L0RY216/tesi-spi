// --- LOGICA DELLA SIDEBAR E DEI PARAMETRI ---

// Elementi della UI
const toggleIrrad = document.getElementById('toggle-irrad');
const bloccoMese = document.getElementById('blocco-mese');
const meseSelect = document.getElementById('mese-select');
const btnConferma = document.getElementById('btn-conferma');

// 1. Mostra/Nascondi il mese se l'irradiazione viene spenta/accesa
toggleIrrad.addEventListener('change', function () {
    if (this.checked) {
        bloccoMese.style.display = 'flex';
    } else {
        bloccoMese.style.display = 'none';
    }
});

// 2. Il click sul bottone CONFERMA
btnConferma.addEventListener('click', function () {
    console.log("Bottone Conferma premuto! Calcolo i dati...");
    eseguiCalcoloIndice();
});

// 3. Il cambio del MESE (aggiornamento istantaneo)
meseSelect.addEventListener('change', function () {
    console.log("Mese cambiato in: " + this.value + ". Aggiorno istantaneamente!");
    eseguiCalcoloIndice();
});

// 4. La funzione "Motore" che chiameremo quando servirà colorare la mappa
function eseguiCalcoloIndice() {
    // Leggo quali parametri sono attivi in questo momento
    const irradiazioneAttiva = toggleIrrad.checked;
    const meseScelto = meseSelect.value;

    // TODO: Qui, nel prossimo step, inseriremo la matematica vera!
    // Per ora facciamo finta di aggiornare la classifica per farti vedere che funziona
    if (irradiazioneAttiva) {
        document.getElementById('lista-top').innerHTML = `<li>Sicilia</li><li>Puglia</li><li>Sardegna</li>`;
        document.getElementById('lista-flop').innerHTML = `<li>Valle d'Aosta</li><li>Trentino</li><li>Lombardia</li>`;
    } else {
        document.getElementById('lista-top').innerHTML = `<li>-</li><li>-</li><li>-</li>`;
        document.getElementById('lista-flop').innerHTML = `<li>-</li><li>-</li><li>-</li>`;
    }

    // Un piccolo feedback visivo sul bottone
    const testoOriginale = btnConferma.innerText;
    btnConferma.innerText = "Dati Aggiornati!";
    btnConferma.style.backgroundColor = "#2ecc71";

    setTimeout(() => {
        btnConferma.innerText = testoOriginale;
        btnConferma.style.backgroundColor = "#3498db";
    }, 1500);
}