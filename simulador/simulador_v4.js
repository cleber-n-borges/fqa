let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;
let quizData = [];
let totalQuestions = 5;
let jsonOriginal = null;

const TEMPO_LIMITE_QUESTAO = 60; /* em segundos */
const INTERVALO_TRANSICAO  = 25; /* em segundos */

let tempoRestante = TEMPO_LIMITE_QUESTAO;
let cronometroInterval = null;
let transicaoTimeout = null;

function startQuizWithTimer() {
    const startScreen = document.getElementById("start-screen");
    const quizScreen = document.getElementById("quiz-screen");
    
    if (startScreen) startScreen.style.display = "none";
    if (quizScreen) quizScreen.style.display = "block";
    
    if (jsonOriginal && jsonOriginal.questoes) {
        quizData = selectRandomQuestions(jsonOriginal.questoes, totalQuestions);
        console.log(`🎯 [SORTEIO] IDs selecionados:`, quizData.map(q => q.id));
        currentQuestionIndex = 0;
        score = 0;
        loadQuestion();
    } else {
        loadQuestions(); 
    }
}

function iniciarCronometro() {
    clearInterval(cronometroInterval); 
    clearTimeout(transicaoTimeout); 
    
    tempoRestante = TEMPO_LIMITE_QUESTAO;
    const timerDisplay = document.getElementById("timer-display");
    
    if (timerDisplay) timerDisplay.innerText = `${tempoRestante}s`;

    cronometroInterval = setInterval(() => {
        tempoRestante--;
        if (timerDisplay) timerDisplay.innerText = `${tempoRestante}s`;

        if (tempoRestante <= 0) {
            clearInterval(cronometroInterval);
            tratarTempoEsgotado();
        }
    }, 1000);
}

function tratarTempoEsgotado() {
    if (hasAnswered) return; 
    hasAnswered = true;

    const botoesOpcoes = document.querySelectorAll("#options-field button");
    botoesOpcoes.forEach(btn => btn.disabled = true);

    const feedbackField = document.getElementById("feedback-field");
    if (feedbackField) {
        feedbackField.style.display = "block";
        feedbackField.className = "feedback-box wrong";
        feedbackField.innerHTML = `
            <div class="feedback-content-wrapper">
                ⚠️ Tempo esgotado! Esta questão foi marcada como incorreta.
                <br><span class="feedback-subtext">
                    Avançando automaticamente em ${INTERVALO_TRANSICAO} segundos...
                </span>
            </div>
        `;
    }

    const nextBtn = document.getElementById("next-button");
    if (nextBtn) nextBtn.disabled = false;

    transicaoTimeout = setTimeout(() => {
        nextQuestion();
    }, INTERVALO_TRANSICAO * 1000); 
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function selectRandomQuestions(questions, count) {
    const shuffled = shuffleArray(questions);
    return shuffled.slice(0, count);
}

function getJsonFileName() {
    if (window.Quarto?.metadata?.questionario) {
        return window.Quarto.metadata.questionario;
    }
    if (typeof JSON_Questionario !== 'undefined') {
        return JSON_Questionario;
    }
    return 'questoes.json';
}

async function loadQuestions() {
    let jsonFileName = 'questoes.json';
    try {
        jsonFileName = await getJsonFileName();
        let jsonPath = jsonFileName.includes('simulador/') ? jsonFileName : `/simulador/${jsonFileName}`;
        
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`Arquivo não encontrado: ${jsonPath}`);
        
        const stringBase64 = await response.text();
        const binaryString = atob(stringBase64.trim());
        const len = binaryString.length;
        const bytesCompactados = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytesCompactados[i] = binaryString.charCodeAt(i);
        }
        
        const bytesDescompactados = pako.ungzip(bytesCompactados);
        const textoJson = new TextDecoder("utf-8").decode(bytesDescompactados);
        jsonOriginal = JSON.parse(textoJson);
        
        const progressText = document.getElementById("progress-text");
        const questionField = document.getElementById("question-field");
        if (progressText) progressText.innerText = "Pronto para iniciar!";
        if (questionField) questionField.innerText = "Clique no botão abaixo para começar o simulado.";
        
    } catch (error) {
        console.error('Erro Crítico:', error);
        const progressText = document.getElementById("progress-text");
        const questionField = document.getElementById("question-field");
        if (progressText) progressText.innerText = "❌ Erro";
        if (questionField) questionField.innerHTML = `<p class="error-message">❌ Erro ao carregar as questões do banco de dados.</p>`;
    }
}

function loadQuestion() {
    if (!quizData || quizData.length === 0) return;
    
    hasAnswered = false;
    const nextBtn = document.getElementById("next-button");
    if (nextBtn) nextBtn.disabled = true;
    
    const feedbackField = document.getElementById("feedback-field");
    if (feedbackField) {
        feedbackField.className = "feedback-box";
        feedbackField.innerHTML = "";
        feedbackField.style.display = "none";
    }

    const currentQuestion = quizData[currentQuestionIndex];
    currentQuestion.shuffledOptions = shuffleArray(currentQuestion.options);
    
    const progressText = document.getElementById("progress-text");
    const questionField = document.getElementById("question-field");
    
    if (progressText) progressText.innerText = `Questão ${currentQuestionIndex + 1} de ${quizData.length}`;
    if (questionField) questionField.innerText = currentQuestion.question;

    const optionsField = document.getElementById("options-field");
    if (optionsField) {
        optionsField.innerHTML = "";
        const letters = ['A', 'B', 'C', 'D', 'E'];
        currentQuestion.shuffledOptions.forEach((option, index) => {
            const button = document.createElement("button");
            button.className = "option-btn";
            button.innerText = `${letters[index]}. ${option.text}`;
            button.onclick = () => selectOption(index, button);
            optionsField.appendChild(button);
        });
    }

    iniciarCronometro();
}

function selectOption(selectedIndex, clickedButton) {
    if (hasAnswered) return;
    hasAnswered = true;
    
    clearInterval(cronometroInterval); 
    clearTimeout(transicaoTimeout);

    const currentQuestion = quizData[currentQuestionIndex];
    const shuffledOptions = currentQuestion.shuffledOptions;
    const selectedOption = shuffledOptions[selectedIndex];
    const buttons = document.querySelectorAll(".option-btn");

    buttons.forEach((btn) => btn.disabled = true);

    const feedbackField = document.getElementById("feedback-field");
    if (feedbackField) {
        feedbackField.style.display = "block";
        
        if (selectedOption.isCorrect) {
            clickedButton.classList.add("correct");
            feedbackField.className = "feedback-box correct";
            feedbackField.innerHTML = `
                <div class="feedback-content-wrapper">
                    ✅ Correto! ${selectedOption.rationale}
                    <br><span class="feedback-subtext">
                        Avançando automaticamente em ${INTERVALO_TRANSICAO} segundos...
                    </span>
                </div>
            `;
            score++;
        } else {
            clickedButton.classList.add("wrong");
            feedbackField.className = "feedback-box wrong";
            feedbackField.innerHTML = `
                <div class="feedback-content-wrapper">
                    ❌ Incorreto. ${selectedOption.rationale}
                    <br><span class="feedback-subtext">
                        Avançando automaticamente em ${INTERVALO_TRANSICAO} segundos...
                    </span>
                </div>
            `;
            
            const correctIndex = shuffledOptions.findIndex(opt => opt.isCorrect);
            if (buttons[correctIndex]) buttons[correctIndex].classList.add("correct");
        }
    }

    const nextBtn = document.getElementById("next-button");
    if (nextBtn) nextBtn.disabled = false;

    transicaoTimeout = setTimeout(() => {
        nextQuestion();
    }, INTERVALO_TRANSICAO * 1000);
}

function nextQuestion() {
    clearInterval(cronometroInterval);
    clearTimeout(transicaoTimeout);

    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    clearInterval(cronometroInterval);
    clearTimeout(transicaoTimeout);

    const quizScreen = document.getElementById("quiz-screen");
    const resultsScreen = document.getElementById("results-screen");
    
    if (quizScreen) quizScreen.style.display = "none";
    if (resultsScreen) resultsScreen.style.display = "block";

    const totalDefinitivo = (quizData && quizData.length) ? quizData.length : totalQuestions;
    const percentual = totalDefinitivo > 0 ? (score / totalDefinitivo) * 100 : 0;

    const campoNota = document.getElementById("resultado-nota-final");
    const campoMensagem = document.getElementById("resultado-txt-mensagem");

    let mensagemFinal = "";
    if (percentual === 100) {
        mensagemFinal = "🌟 Excelente! Você dominou o contexto básico sobre o tema!";
    } else if (percentual >= 70) {
        mensagemFinal = "👏 Bom trabalho! Você tem uma boa base, mas vale a pena revisar os detalhes analíticos.";
    } else if (percentual >= 50) {
        mensagemFinal = "📖 Continue estudando! Você está no caminho certo, mas precisa de mais prática.";
    } else {
        mensagemFinal = "💪 Comece a estudar! Penso que você ainda não leu o texto! Revisite o material teórico.";
    }

    if (campoNota) campoNota.innerText = `${score} / ${totalDefinitivo}`;
    if (campoMensagem) campoMensagem.innerText = mensagemFinal;
}

function restartQuiz() {
    clearInterval(cronometroInterval); 
    clearTimeout(transicaoTimeout);

    const startScreen = document.getElementById("start-screen");
    const quizScreen = document.getElementById("quiz-screen");
    const resultsScreen = document.getElementById("results-screen");

    if (resultsScreen) resultsScreen.style.display = "none";
    if (startScreen) startScreen.style.display = "none";
    if (quizScreen) quizScreen.style.display = "block";

    currentQuestionIndex = 0;
    score = 0;
    hasAnswered = false;
    
    if (!jsonOriginal) {
        loadQuestions();
        return;
    }
    
    quizData = selectRandomQuestions(jsonOriginal.questoes, totalQuestions);
    loadQuestion();
}

function changeQuestionCount(value) {
    totalQuestions = parseInt(value);
    restartQuiz();
}

function renderizarTextosTelaInicial() {
    const elementoTotalQuest = document.getElementById("NumTotalQuest");
    if (elementoTotalQuest) {
        elementoTotalQuest.textContent = totalQuestions;
    }

    const elementoTempoLimite = document.getElementById("tempo-limite");
    if (elementoTempoLimite) {
        elementoTempoLimite.textContent = `${TEMPO_LIMITE_QUESTAO} segundos`;
    }

    const elementoTempoIntervalo = document.getElementById("tempo-intervalo");
    if (elementoTempoIntervalo) {
        // Corrigido para mostrar dinamicamente o valor real
        elementoTempoIntervalo.textContent = `${INTERVALO_TRANSICAO} segundos`;
    }
}


// Remova o escutador de eventos e deixe a lógica rodar direto e imediato!
const urlParams = new URLSearchParams(window.location.search);
const qtd = parseInt(urlParams.get('qtd')) || 5;
totalQuestions = Math.min(Math.max(qtd, 3), 10);

const selector = document.getElementById('qtd-questoes');
if (selector) {
    selector.value = totalQuestions;
    selector.disabled = true;
}

// 1. Executa a renderização visual imediatamente
renderizarTextosTelaInicial();

// 2. Carrega as questões do banco de dados
loadQuestions();







