(function() {
    'use strict';

    const API_URL = 'http://localhost:5103/api/leaderboard';

    // =========================================
    // 1. АУДИО ДВИЖОК
    // =========================================
    const AudioEngine = {
        ctx: null,
        enabled: localStorage.getItem('hub_sound') !== 'off',
        init: function() {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') this.ctx.resume();
        },
        toggle: function() {
            this.enabled = !this.enabled;
            localStorage.setItem('hub_sound', this.enabled ? 'on' : 'off');
            return this.enabled;
        },
        play: function(type) {
            if (!this.enabled) return;
            this.init();
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(), now = this.ctx.currentTime;
            osc.connect(gain); gain.connect(this.ctx.destination);

            if (type === 'move') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'win') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(554.37, now + 0.1); osc.frequency.setValueAtTime(659.25, now + 0.2);
                gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
            } else if (type === 'lose') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
                gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
            } else if (type === 'draw') {
                osc.type = 'square'; osc.frequency.setValueAtTime(200, now); osc.frequency.setValueAtTime(200, now + 0.2);
                gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            } else if (type === 'pop') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now); osc.stop(now + 0.05);
            } else if (type === 'flag') {
                osc.type = 'square'; osc.frequency.setValueAtTime(900, now); osc.frequency.setValueAtTime(1200, now + 0.05);
                gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'explosion') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
                gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
            }
        }
    };

    // =========================================
    // 2. СЛОВАРИ (МУЛЬТИЯЗЫЧНОСТЬ)
    // =========================================
    const translations = {
        en: {
            hubTitle: "🎮 Retro Hub", chooseGame: "Choose a game:", backBtn: "⬅ Back to Menu", restart: "Restart Game",
            tictactoe: "Tic-Tac-Toe", tictactoeDesc: "Play against computer", rps: "Rock-Paper-Scissors", rpsDesc: "Play against computer",
            minesweeper: "Minesweeper", minesweeperDesc: "Classic logic puzzle", turnX: "Your turn (X)", turnO: "Computer's turn (O)", compThinking: "Computer is thinking...",
            winX: "You Win! 🎉", winO: "Computer Wins! 😢", draw: "It's a draw! 🤝", chooseWeapon: "Choose your weapon:", win: "You Win! 🎉", lose: "You Lose! 😢", tie: "It's a Tie! 🤝",
            wins: "Wins", losses: "Losses", draws: "Draws", difficulty: "Difficulty:", easy: "Easy", hard: "Hard (Unbeatable)", flags: "Flags:", msWin: "You cleared the minefield! 🎉", msLose: "Boom! You hit a mine 💥", toggleMC: "MC Theme: OFF", toggleMCon: "MC Theme: ON",
            leaderboard: "🏆 Top Players", enterName: "Enter your name to save score:", loading: "Loading...", noRecords: "No records yet.", changeName: "✏️ Change Name",
            snake: "Snake", snakeDesc: "Classic arcade", score: "Score", gameOver: "GAME OVER!"
        },
        es: {
            hubTitle: "🎮 Retro Hub", chooseGame: "Elige un juego:", backBtn: "⬅ Volver al menú", restart: "Reiniciar juego",
            tictactoe: "Tres en raya", tictactoeDesc: "Juega contra la PC", rps: "Piedra, Papel, Tijera", rpsDesc: "Juega contra la PC",
            minesweeper: "Buscaminas", minesweeperDesc: "Puzle lógico", turnX: "Tu turno (X)", turnO: "Turno de PC (O)", compThinking: "La PC está pensando...",
            winX: "¡Ganaste! 🎉", winO: "¡PC Gana! 😢", draw: "¡Empate! 🤝", chooseWeapon: "Elige tu arma:", win: "¡Ganaste! 🎉", lose: "¡Perdiste! 😢", tie: "¡Empate! 🤝",
            wins: "Victorias", losses: "Derrotas", draws: "Empates", difficulty: "Dificultad:", easy: "Fácil", hard: "Difícil", flags: "Banderas:", msWin: "¡Limpiaste el campo! 🎉", msLose: "¡Boom! Pisaste una mina 💥", toggleMC: "Tema MC: OFF", toggleMCon: "Tema MC: ON",
            leaderboard: "🏆 Mejores Jugadores", enterName: "Ingresa tu nombre para guardar el puntaje:", loading: "Cargando...", noRecords: "No hay registros aún.", changeName: "✏️ Cambiar nombre",
            snake: "Serpiente", snakeDesc: "Arcade clásico", score: "Puntaje", gameOver: "¡JUEGO TERMINADO!"
        },
        fr: {
            hubTitle: "🎮 Retro Hub", chooseGame: "Choisissez un jeu:", backBtn: "⬅ Retour au menu", restart: "Recommencer",
            tictactoe: "Morpion", tictactoeDesc: "Contre l'ordinateur", rps: "Pierre-Papier-Ciseaux", rpsDesc: "Contre l'ordinateur",
            minesweeper: "Démineur", minesweeperDesc: "Jeu de logique", turnX: "A ton tour (X)", turnO: "Tour du PC (O)", compThinking: "L'ordinateur réfléchit...",
            winX: "Tu as gagné! 🎉", winO: "Le PC a gagné! 😢", draw: "Match nul! 🤝", chooseWeapon: "Choisissez votre arme:", win: "Vous gagnez! 🎉", lose: "Vous perdez! 😢", tie: "Égalité! 🤝",
            wins: "Victoires", losses: "Défaites", draws: "Nuls", difficulty: "Difficulté:", easy: "Facile", hard: "Difficile", flags: "Drapeaux:", msWin: "Champ déminé! 🎉", msLose: "Boom! Une mine 💥", toggleMC: "Thème MC: OFF", toggleMCon: "Thème MC: ON",
            leaderboard: "🏆 Meilleurs Joueurs", enterName: "Entrez votre nom pour enregistrer le score:", loading: "Chargement...", noRecords: "Aucun enregistrement.", changeName: "✏️ Changer de nom",
            snake: "Serpent", snakeDesc: "Arcade classique", score: "Score", gameOver: "FIN DE PARTIE!"
        },
        "zh-CN": {
            hubTitle: "🎮 复古游戏中心", chooseGame: "选择游戏:", backBtn: "⬅ 返回菜单", restart: "重新开始",
            tictactoe: "井字棋", tictactoeDesc: "人机对战", rps: "石头剪刀布", rpsDesc: "人机对战",
            minesweeper: "扫雷", minesweeperDesc: "经典逻辑谜题", turnX: "你的回合 (X)", turnO: "电脑回合 (O)", compThinking: "电脑正在思考...",
            winX: "你赢了! 🎉", winO: "电脑赢了! 😢", draw: "平局! 🤝", chooseWeapon: "选择武器:", win: "你赢了! 🎉", lose: "你输了! 😢", tie: "平局! 🤝",
            wins: "胜", losses: "负", draws: "平", difficulty: "难度:", easy: "简单", hard: "困难 (无敌)", flags: "旗帜:", msWin: "你清除了雷区! 🎉", msLose: "砰！踩到地雷了 💥", toggleMC: "MC 主题: 关", toggleMCon: "MC 主题: 开",
            leaderboard: "🏆 顶级玩家", enterName: "输入你的名字保存分数:", loading: "加载中...", noRecords: "暂无记录.", changeName: "✏️ 换名字",
            snake: "贪吃蛇", snakeDesc: "经典街机", score: "分数", gameOver: "游戏结束!"
        },
        "zh-TW": {
            hubTitle: "🎮 復古遊戲中心", chooseGame: "選擇遊戲:", backBtn: "⬅ 返回菜單", restart: "重新開始",
            tictactoe: "井字棋", tictactoeDesc: "人機對戰", rps: "石頭剪刀布", rpsDesc: "人機對戰",
            minesweeper: "踩地雷", minesweeperDesc: "經典邏輯謎題", turnX: "你的回合 (X)", turnO: "電腦回合 (O)", compThinking: "電腦正在思考...",
            winX: "你贏了! 🎉", winO: "電腦贏了! 😢", draw: "平手! 🤝", chooseWeapon: "選擇武器:", win: "你贏了! 🎉", lose: "你輸了! 😢", tie: "平手! 🤝",
            wins: "勝", losses: "負", draws: "平", difficulty: "難度:", easy: "簡單", hard: "困難 (無敵)", flags: "旗幟:", msWin: "你清除了雷區! 🎉", msLose: "砰！踩到地雷了 💥", toggleMC: "MC 主題: 關", toggleMCon: "MC 主題: 開",
            leaderboard: "🏆 頂級玩家", enterName: "輸入你的名字保存分數:", loading: "加載中...", noRecords: "暫無記錄.", changeName: "✏️ 換名字",
            snake: "貪吃蛇", snakeDesc: "經典街機", score: "分數", gameOver: "遊戲結束!"
        },
        ru: {
            hubTitle: "🎮 Ретро Хаб", chooseGame: "Выберите игру:", backBtn: "⬅ Назад в меню", restart: "Начать заново",
            tictactoe: "Крестики-нолики", tictactoeDesc: "Игра против ПК", rps: "Камень-Ножницы-Бумага", rpsDesc: "Игра против ПК",
            minesweeper: "Сапер", minesweeperDesc: "Классическая головоломка", turnX: "Твой ход (X)", turnO: "Ход компьютера (O)", compThinking: "Компьютер думает...",
            winX: "Ты победил! 🎉", winO: "Компьютер победил! 😢", draw: "Ничья! 🤝", chooseWeapon: "Сделай выбор:", win: "Ты победил! 🎉", lose: "Ты проиграл! 😢", tie: "Ничья! 🤝",
            wins: "Победы", losses: "Поражения", draws: "Ничьи", difficulty: "Сложность:", easy: "Легко", hard: "Сложно", flags: "Флаги:", msWin: "Минное поле чисто! 🎉", msLose: "Бум! Ты подорвался 💥", toggleMC: "Тема MC: ВЫКЛ", toggleMCon: "Тема MC: ВКЛ",
            leaderboard: "🏆 Таблица рекордов", enterName: "Введи имя для сохранения рекорда:", loading: "Загрузка...", noRecords: "Рекордов пока нет.", changeName: "✏️ Сменить имя",
            snake: "Змейка", snakeDesc: "Классическая аркада", score: "Счет", gameOver: "ИГРА ОКОНЧЕНА!"
        },
        kk: {
            hubTitle: "🎮 Ретро Хаб", chooseGame: "Ойынды таңдаңыз:", backBtn: "⬅ Мәзірге қайту", restart: "Қайта бастау",
            tictactoe: "Крестик-нолик", tictactoeDesc: "Компьютерге қарсы", rps: "Тас-Қайшы-Қағаз", rpsDesc: "Компьютерге қарсы",
            minesweeper: "Сапер", minesweeperDesc: "Логикалық ойын", turnX: "Сенің жүрісің (X)", turnO: "Компьютер жүрісі (O)", compThinking: "Компьютер ойлануда...",
            winX: "Сен жеңдің! 🎉", winO: "Компьютер жеңді! 😢", draw: "Тең ойын! 🤝", chooseWeapon: "Таңдау жаса:", win: "Сен жеңдің! 🎉", lose: "Сен ұтылдың! 😢", tie: "Тең ойын! 🤝",
            wins: "Жеңістер", losses: "Жеңілістер", draws: "Тең", difficulty: "Қиындық:", easy: "Оңай", hard: "Қиын", flags: "Жалаулар:", msWin: "Сен миналарды тазарттың! 🎉", msLose: "Бум! Минаға түстің 💥", toggleMC: "MC Тема: ӨШУЛІ", toggleMCon: "MC Тема: ҚОСУЛЫ",
            leaderboard: "🏆 Рекордтар тақтасы", enterName: "Рекордты сақтау үшін атыңызды енгізіңіз:", loading: "Жүктелуде...", noRecords: "Әзірге рекордтар жоқ.", changeName: "✏️ Атын өзгерту",
            snake: "Жылан", snakeDesc: "Классикалық аркада", score: "Есеп", gameOver: "ОЙЫН АЯҚТАЛДЫ!"
        },
        be: {
            hubTitle: "🎮 Рэтра Хаб", chooseGame: "Выберыце гульню:", backBtn: "⬅ Назад у меню", restart: "Пачаць нанова",
            tictactoe: "Крыжыкі-нолікі", tictactoeDesc: "Супраць камп'ютара", rps: "Камень-Нажніцы-Папера", rpsDesc: "Супраць камп'ютара",
            minesweeper: "Сапёр", minesweeperDesc: "Лагічная галаваломка", turnX: "Твой ход (X)", turnO: "Ход ПК (O)", compThinking: "Камп'ютар думае...",
            winX: "Ты перамог! 🎉", winO: "Камп'ютар перамог! 😢", draw: "Нічыя! 🤝", chooseWeapon: "Зрабі выбар:", win: "Ты перамог! 🎉", lose: "Ты прайграў! 😢", tie: "Нічыя! 🤝",
            wins: "Перамогі", losses: "Паражэнні", draws: "Нічыі", difficulty: "Складанасць:", easy: "Лёгка", hard: "Складана", flags: "Сцяжкі:", msWin: "Міннае поле чыстае! 🎉", msLose: "Бум! Падарваўся 💥", toggleMC: "Тэма MC: ВЫКЛ", toggleMCon: "Тэма MC: УКЛ",
            leaderboard: "🏆 Табліца рэкордаў", enterName: "Увядзі імя для захавання рэкорду:", loading: "Загрузка...", noRecords: "Рэкордаў пакуль няма.", changeName: "✏️ Змяніць імя",
            snake: "Змейка", snakeDesc: "Класічная аркада", score: "Лік", gameOver: "ГУЛЬНЯ СКОНЧАНА!"
        },
        uk: {
            hubTitle: "🎮 Ретро Хаб", chooseGame: "Оберіть гру:", backBtn: "⬅ Назад до меню", restart: "Почати заново",
            tictactoe: "Хрестики-нулики", tictactoeDesc: "Гра проти ПК", rps: "Камінь-Ножиці-Папір", rpsDesc: "Гра проти ПК",
            minesweeper: "Сапер", minesweeperDesc: "Класична головоломка", turnX: "Твій хід (X)", turnO: "Хід комп'ютера (O)", compThinking: "Комп'ютер думає...",
            winX: "Ти переміг! 🎉", winO: "Комп'ютер переміг! 😢", draw: "Нічия! 🤝", chooseWeapon: "Зроби вибір:", win: "Ти переміг! 🎉", lose: "Ти програв! 😢", tie: "Нічия! 🤝",
            wins: "Перемоги", losses: "Поразки", draws: "Ничиї", difficulty: "Складність:", easy: "Легко", hard: "Складно", flags: "Прапорці:", msWin: "Мінне поле чисте! 🎉", msLose: "Бум! Ти підірвався 💥", toggleMC: "Тема MC: ВИМК", toggleMCon: "Тема MC: УВІМК",
            leaderboard: "🏆 Таблиця рекордів", enterName: "Введіть ім'я для збереження рекорду:", loading: "Завантаження...", noRecords: "Рекордів поки немає.", changeName: "✏️ Змінити ім'я",
            snake: "Змійка", snakeDesc: "Класична аркада", score: "Рахунок", gameOver: "ГРУ ЗАКІНЧЕНО!"
        },
        uz: {
            hubTitle: "🎮 Retro Xab", chooseGame: "O'yinni tanlang:", backBtn: "⬅ Menyuga qaytish", restart: "Qayta boshlash",
            tictactoe: "Tik-tak-toe", tictactoeDesc: "Kompyuterga qarshi", rps: "Tosh-Qaychi-Qog'oz", rpsDesc: "Kompyuterga qarshi",
            minesweeper: "Sapyol", minesweeperDesc: "Mantiqiy o'yin", turnX: "Sizning navbatingiz (X)", turnO: "Kompyuter navbati (O)", compThinking: "Kompyuter o'ylamoqda...",
            winX: "Siz yutdingiz! 🎉", winO: "Kompyuter yutdi! 😢", draw: "Durang! 🤝", chooseWeapon: "Tanlovingizni qiling:", win: "Siz yutdingiz! 🎉", lose: "Siz yutqazdingiz! 😢", tie: "Durang! 🤝",
            wins: "G'alabalar", losses: "Mag'lubiyatlar", draws: "Durang", difficulty: "Qiyinlik:", easy: "Oson", hard: "Qiyin", flags: "Bayroqlar:", msWin: "Maydon tozalandi! 🎉", msLose: "Bum! Minaga tushdingiz 💥", toggleMC: "MC Tema: O'CHIQ", toggleMCon: "MC Tema: YONIQ",
            leaderboard: "🏆 Rekordlar jadvali", enterName: "Rekordni saqlash uchun ismingizni kiriting:", loading: "Yuklanmoqda...", noRecords: "Hozircha rekordlar yo'q.", changeName: "✏️ Ismni o'zgartirish",
            snake: "Ilon", snakeDesc: "Klassik arkada", score: "Hisob", gameOver: "O'YIN TUGADI!"
        }
    };

    // =========================================
    // 3. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И НАСТРОЙКИ
    // =========================================
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const soundToggle = document.getElementById('soundToggle');
    const langSelect = document.getElementById('langSelect');
    const colorSelect = document.getElementById('colorSelect');
    const clockTime = document.getElementById('clockTime');
    const clockDate = document.getElementById('clockDate');
    
    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const gameContainer = document.getElementById('game-container');
    const backBtn = document.getElementById('back-btn');
    const lbBackBtn = document.getElementById('lb-back-btn');
    const btnLeaderboard = document.getElementById('btnLeaderboard');
    const btnChangeName = document.getElementById('btnChangeName');
    const gameCards = document.querySelectorAll('.game-card:not(.disabled)');
    const gamesGrid = document.getElementById('gamesGrid');

    let currentLang = localStorage.getItem('hub_lang') || 'en';
    let currentTheme = localStorage.getItem('hub_theme') || 'dark';
    let currentAccent = localStorage.getItem('hub_accent') || 'cyan';
    let favoriteGames = JSON.parse(localStorage.getItem('hub_favorites')) || [];
    let activeGameInstance = null; 
    let activeGameId = null;

    function initApp() {
        root.setAttribute('data-theme', currentTheme);
        root.setAttribute('data-accent', currentAccent);
        updateThemeIcon(); updateSoundIcon();
        langSelect.value = currentLang;
        colorSelect.value = currentAccent;
        updateLanguage(); updateClock(); setInterval(updateClock, 1000);
        initFavorites();
        initDragAndDrop(); 
    }

    // =========================================
    // 4. UI КОНТРОЛЛЕРЫ И ПАЛИТРА ЦВЕТОВ
    // =========================================
    function updateThemeIcon() { themeToggle.querySelector('.theme-icon').textContent = currentTheme === 'dark' ? '🌙' : '☀️'; }
    function updateSoundIcon() { soundToggle.querySelector('.sound-icon').textContent = AudioEngine.enabled ? '🔊' : '🔇'; }

    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', currentTheme);
        localStorage.setItem('hub_theme', currentTheme);
        updateThemeIcon();
        if(activeGameInstance && activeGameInstance.updateThemeColors) activeGameInstance.updateThemeColors();
    });

    colorSelect.addEventListener('change', (e) => {
        currentAccent = e.target.value;
        root.setAttribute('data-accent', currentAccent);
        localStorage.setItem('hub_accent', currentAccent);
        if(activeGameInstance && activeGameInstance.updateThemeColors) activeGameInstance.updateThemeColors();
    });

    soundToggle.addEventListener('click', () => { AudioEngine.toggle(); updateSoundIcon(); });

    langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value; localStorage.setItem('hub_lang', currentLang);
        updateLanguage(); updateClock(); 
        if (activeGameInstance && activeGameInstance.updateTexts) activeGameInstance.updateTexts();
    });

    function getTranslation(key) { return translations[currentLang][key] || key; }
    function updateLanguage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang][key]) el.textContent = translations[currentLang][key];
        });
    }

    function updateClock() {
        const now = new Date();
        clockTime.textContent = now.toLocaleTimeString(currentLang);
        clockDate.textContent = now.toLocaleDateString(currentLang, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    }

    function initFavorites() {
        gameCards.forEach(card => {
            const gameId = card.getAttribute('data-game'), favBtn = card.querySelector('.fav-btn');
            if (favoriteGames.includes(gameId)) { card.classList.add('favorite'); favBtn.textContent = '★'; }
            favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(gameId, card, favBtn); });
        });
    }

    function toggleFavorite(gameId, cardEl, btnEl) {
        if (favoriteGames.includes(gameId)) {
            favoriteGames = favoriteGames.filter(id => id !== gameId);
            cardEl.classList.remove('favorite'); btnEl.textContent = '☆';
        } else {
            favoriteGames.push(gameId); cardEl.classList.add('favorite'); btnEl.textContent = '★';
        }
        localStorage.setItem('hub_favorites', JSON.stringify(favoriteGames));
    }

    function initDragAndDrop() {
        let draggedCard = null;
        const savedOrder = JSON.parse(localStorage.getItem('hub_cardOrder')) || [];
        if (savedOrder.length > 0) {
            savedOrder.forEach(gameId => {
                const card = gamesGrid.querySelector(`[data-game="${gameId}"]`);
                if (card) gamesGrid.appendChild(card);
            });
        }
        gameCards.forEach(card => {
            card.addEventListener('dragstart', function(e) { draggedCard = this; setTimeout(() => this.classList.add('dragging'), 0); });
            card.addEventListener('dragend', function() { this.classList.remove('dragging'); draggedCard = null; saveCardOrder(); });
            card.addEventListener('dragover', function(e) {
                e.preventDefault();
                if (draggedCard === this || !draggedCard) return;
                const children = Array.from(gamesGrid.querySelectorAll('.game-card')), draggedIndex = children.indexOf(draggedCard), targetIndex = children.indexOf(this);
                if (draggedIndex < targetIndex) this.after(draggedCard); else this.before(draggedCard);
            });
        });
    }

    function saveCardOrder() {
        const currentOrder = [...document.querySelectorAll('.game-card')].map(card => card.getAttribute('data-game'));
        localStorage.setItem('hub_cardOrder', JSON.stringify(currentOrder));
    }

    // =========================================
    // 5. МАРШРУТИЗАЦИЯ SPA И РЕКОРДЫ (API)
    // =========================================
    function showScreen(screen) {
        menuScreen.classList.remove('active'); gameScreen.classList.remove('active'); leaderboardScreen.classList.remove('active');
        screen.classList.add('active');
    }

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            AudioEngine.play('move'); activeGameId = card.getAttribute('data-game'); loadGame(activeGameId); showScreen(gameScreen);
        });
    });

    backBtn.addEventListener('click', () => {
        AudioEngine.play('pop');
        if (activeGameInstance) {
            if (activeGameInstance.getStats) {
                const stats = activeGameInstance.getStats();
                if (stats && stats.w > 0) saveScoreToDatabase(activeGameId, stats.w);
            }
            if (activeGameInstance.destroy) activeGameInstance.destroy();
        }
        gameContainer.innerHTML = ''; activeGameInstance = null; activeGameId = null; showScreen(menuScreen);
    });

    btnLeaderboard.addEventListener('click', () => {
        AudioEngine.play('move'); showScreen(leaderboardScreen); fetchLeaderboard('tictactoe'); 
    });

    lbBackBtn.addEventListener('click', () => { AudioEngine.play('pop'); showScreen(menuScreen); });

    document.querySelectorAll('.lb-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            AudioEngine.play('pop');
            document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active'); fetchLeaderboard(e.target.getAttribute('data-tab'));
        });
    });

    btnChangeName.addEventListener('click', () => {
        AudioEngine.play('pop');
        let newName = prompt(getTranslation('enterName'));
        if (newName && newName.trim() !== '') localStorage.setItem('hub_playerName', newName.trim());
    });

    async function saveScoreToDatabase(gameName, wins) {
        let playerName = localStorage.getItem('hub_playerName');
        if (!playerName || playerName === 'undefined' || playerName === 'null') {
            playerName = prompt(getTranslation('enterName')) || 'Anonymous';
            localStorage.setItem('hub_playerName', playerName);
        }
        try {
            await fetch(API_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName, gameName, wins })
            });
        } catch (e) { console.error('Ошибка API:', e); }
    }

    async function fetchLeaderboard(gameName) {
        const listEl = document.getElementById('leaderboardList');
        listEl.innerHTML = `<p>${getTranslation('loading')}</p>`;
        try {
            const res = await fetch(`${API_URL}/${gameName}`);
            const data = await res.json();
            if (data.length === 0) { listEl.innerHTML = `<p>${getTranslation('noRecords')}</p>`; return; }
            
            listEl.innerHTML = data.map((item, i) => {
                const safeName = item.playername || item.playerName || item.PlayerName || 'Anonymous';
                const safeWins = item.wins || item.Wins || 0;
                return `
                <div class="lb-item">
                    <span class="lb-rank">#${i + 1}</span>
                    <span class="lb-name">${safeName}</span>
                    <span class="lb-wins">${safeWins} <span data-i18n="wins">wins</span></span>
                </div>
            `}).join('');
            updateLanguage();
        } catch (e) { listEl.innerHTML = '<p>Не удалось загрузить данные. Сервер запущен?</p>'; }
    }

    function loadGame(gameId) {
        gameContainer.innerHTML = ''; 
        if (gameId === 'tictactoe') activeGameInstance = initTicTacToe();
        else if (gameId === 'rps') activeGameInstance = initRPS();
        else if (gameId === 'minesweeper') activeGameInstance = initMinesweeper();
        else if (gameId === 'snake') activeGameInstance = initSnake();
    }

    // =========================================
    // 6. ИГРА 1: КРЕСТИКИ-НОЛИКИ 
    // =========================================
    function initTicTacToe() {
        gameContainer.innerHTML = `
            <div class="game-top-bar">
                <div class="scoreboard">
                    <div class="score-item score-w"><span data-i18n="wins">Wins</span>: <span id="tttWins" class="val">0</span></div>
                    <div class="score-item score-d"><span data-i18n="draws">Draws</span>: <span id="tttDraws" class="val">0</span></div>
                    <div class="score-item score-l"><span data-i18n="losses">Losses</span>: <span id="tttLosses" class="val">0</span></div>
                </div>
                <select id="tttDifficulty" class="difficulty-select">
                    <option value="easy" data-i18n="easy">Easy</option>
                    <option value="hard" data-i18n="hard">Hard</option>
                </select>
            </div>
            <div class="game-status" id="tttStatus"></div>
            <div class="tictactoe-board" id="tttBoard"></div>
            <button id="tttRestart" class="restart-btn" style="display:none;"></button>
        `;
        updateLanguage();

        const boardEl = document.getElementById('tttBoard'), statusEl = document.getElementById('tttStatus'), restartBtn = document.getElementById('tttRestart'), diffSelect = document.getElementById('tttDifficulty');
        const scores = { w: document.getElementById('tttWins'), d: document.getElementById('tttDraws'), l: document.getElementById('tttLosses') };

        let board = Array(9).fill(null), currentPlayer = 'X', gameOver = false, winCells = [], isThinking = false, timer = null;
        let stats = { w: 0, d: 0, l: 0 };

        function updateScoreBoard() { scores.w.textContent = stats.w; scores.d.textContent = stats.d; scores.l.textContent = stats.l; }
        function renderBoard() {
            boardEl.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div'); cell.className = 'ttt-cell'; cell.dataset.index = i;
                cell.addEventListener('click', () => handlePlayerClick(i)); boardEl.appendChild(cell);
            }
        }

        function updateTexts() {
            restartBtn.textContent = getTranslation('restart');
            Array.from(diffSelect.options).forEach(opt => { if(opt.getAttribute('data-i18n')) opt.textContent = getTranslation(opt.getAttribute('data-i18n')); });
            if (gameOver) statusEl.textContent = getTranslation(winCells.length > 0 ? (currentPlayer === 'X' ? 'winX' : 'winO') : 'draw');
            else statusEl.textContent = getTranslation(currentPlayer === 'O' && isThinking ? 'compThinking' : 'turnX');
        }

        function makeMove(index, player) {
            AudioEngine.play('move'); board[index] = player;
            const cellEl = boardEl.children[index]; cellEl.textContent = player; cellEl.classList.add('taken', player.toLowerCase());
            if (checkWinLogic(board, player)) {
                gameOver = true; highlightWinCells(player); markGameOver(); statusEl.className = `game-status win-${player.toLowerCase()}`;
                if (player === 'X') { stats.w++; AudioEngine.play('win'); } else { stats.l++; AudioEngine.play('lose'); }
                updateScoreBoard(); restartBtn.style.display = 'block'; updateTexts(); return true;
            }
            if (board.every(cell => cell !== null)) {
                gameOver = true; markGameOver(); statusEl.className = 'game-status draw';
                stats.d++; AudioEngine.play('draw'); updateScoreBoard(); restartBtn.style.display = 'block'; updateTexts(); return true;
            }
            return false;
        }

        function handlePlayerClick(index) {
            if (gameOver || isThinking || board[index] !== null) return;
            if (makeMove(index, 'X')) return;
            currentPlayer = 'O'; isThinking = true; updateTexts(); timer = setTimeout(computerMove, 500);
        }

        function computerMove() {
            if (!document.getElementById('tttBoard')) return; 
            let moveIndex;
            if (diffSelect.value === 'hard') moveIndex = minimax(board, 'O').index;
            else {
                const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                if (empty.length > 0) moveIndex = empty[Math.floor(Math.random() * empty.length)];
            }
            if (moveIndex !== undefined && !makeMove(moveIndex, 'O')) { currentPlayer = 'X'; isThinking = false; updateTexts(); }
        }

        function minimax(newBoard, player) {
            let avail = newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
            if (checkWinLogic(newBoard, 'X')) return { score: -10 }; if (checkWinLogic(newBoard, 'O')) return { score: 10 }; if (avail.length === 0) return { score: 0 };
            let moves = [];
            for (let i = 0; i < avail.length; i++) {
                let move = { index: avail[i] }; newBoard[avail[i]] = player;
                move.score = minimax(newBoard, player === 'O' ? 'X' : 'O').score;
                newBoard[avail[i]] = null; moves.push(move);
            }
            let bestMove, bestScore = player === 'O' ? -10000 : 10000;
            for (let i = 0; i < moves.length; i++) {
                if ((player === 'O' && moves[i].score > bestScore) || (player === 'X' && moves[i].score < bestScore)) { bestScore = moves[i].score; bestMove = i; }
            }
            return moves[bestMove];
        }

        function checkWinLogic(b, p) {
            const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            return lines.some(([a, b_idx, c]) => b[a] === p && b[b_idx] === p && b[c] === p);
        }
        function highlightWinCells(p) {
            const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            const winLine = lines.find(([a, b_idx, c]) => board[a] === p && board[b_idx] === p && board[c] === p);
            if(winLine) { winCells = winLine; winCells.forEach(idx => boardEl.children[idx].classList.add('win-cell', p.toLowerCase())); }
        }
        function markGameOver() { Array.from(boardEl.children).forEach(el => { if (!el.classList.contains('win-cell')) el.classList.add('game-over'); }); }

        restartBtn.addEventListener('click', () => {
            clearTimeout(timer); board.fill(null); currentPlayer = 'X'; gameOver = false; winCells = []; isThinking = false;
            statusEl.className = 'game-status'; restartBtn.style.display = 'none'; renderBoard(); updateTexts();
        });
        diffSelect.addEventListener('change', () => { if (board.some(c => c !== null)) restartBtn.click(); });

        renderBoard(); updateTexts(); updateScoreBoard();
        return { updateTexts, getStats: () => stats, destroy: () => clearTimeout(timer) };
    }

    // =========================================
    // 7. ИГРА 2: КАМЕНЬ-НОЖНИЦЫ-БУМАГА 
    // =========================================
    function initRPS() {
        gameContainer.innerHTML = `
            <div class="game-top-bar">
                <div class="scoreboard">
                    <div class="score-item score-w"><span data-i18n="wins">Wins</span>: <span id="rpsWins" class="val">0</span></div>
                    <div class="score-item score-d"><span data-i18n="draws">Draws</span>: <span id="rpsDraws" class="val">0</span></div>
                    <div class="score-item score-l"><span data-i18n="losses">Losses</span>: <span id="rpsLosses" class="val">0</span></div>
                </div>
            </div>
            <div class="game-status" id="rpsStatus"></div>
            <div class="rps-result-display">
                <span id="playerChoice">❓</span><span class="rps-vs">VS</span><span id="compChoice">❓</span>
            </div>
            <div class="section-title" id="rpsPrompt" style="margin-top: 10px;"></div>
            <div class="rps-controls">
                <button class="rps-btn" data-choice="rock">✊</button>
                <button class="rps-btn" data-choice="paper">✋</button>
                <button class="rps-btn" data-choice="scissors">✌️</button>
            </div>
            <button id="rpsRestart" class="restart-btn" style="display:none;"></button>
        `;
        updateLanguage();

        const statusEl = document.getElementById('rpsStatus'), promptEl = document.getElementById('rpsPrompt'), restartBtn = document.getElementById('rpsRestart');
        const pDisplay = document.getElementById('playerChoice'), cDisplay = document.getElementById('compChoice'), btns = document.querySelectorAll('.rps-btn');
        const scores = { w: document.getElementById('rpsWins'), d: document.getElementById('rpsDraws'), l: document.getElementById('rpsLosses') };
        
        const choices = ['rock', 'paper', 'scissors'], emojis = { rock: '✊', paper: '✋', scissors: '✌️' };
        let hasPlayed = false, lastResult = '', stats = { w: 0, d: 0, l: 0 };

        function updateScoreBoard() { scores.w.textContent = stats.w; scores.d.textContent = stats.d; scores.l.textContent = stats.l; }
        function updateTexts() {
            promptEl.textContent = getTranslation('chooseWeapon'); restartBtn.textContent = getTranslation('restart');
            statusEl.textContent = getTranslation(hasPlayed ? lastResult : 'rps'); if(!hasPlayed) statusEl.className = 'game-status';
        }

        function play(pChoice) {
            hasPlayed = true; const cChoice = choices[Math.floor(Math.random() * choices.length)];
            pDisplay.textContent = emojis[pChoice]; cDisplay.textContent = emojis[cChoice];
            if (pChoice === cChoice) { lastResult = 'tie'; statusEl.className = 'game-status draw'; stats.d++; AudioEngine.play('draw'); } 
            else if ((pChoice === 'rock' && cChoice === 'scissors') || (pChoice === 'paper' && cChoice === 'rock') || (pChoice === 'scissors' && cChoice === 'paper')) {
                lastResult = 'win'; statusEl.className = 'game-status win'; stats.w++; AudioEngine.play('win');
            } else { lastResult = 'lose'; statusEl.className = 'game-status lose'; stats.l++; AudioEngine.play('lose'); }
            updateScoreBoard(); btns.forEach(btn => btn.style.display = 'none'); restartBtn.style.display = 'block'; updateTexts();
        }

        btns.forEach(btn => btn.addEventListener('click', () => play(btn.getAttribute('data-choice'))));
        restartBtn.addEventListener('click', () => {
            AudioEngine.play('pop'); hasPlayed = false; pDisplay.textContent = '❓'; cDisplay.textContent = '❓';
            btns.forEach(btn => btn.style.display = 'block'); restartBtn.style.display = 'none'; updateTexts();
        });

        updateTexts(); updateScoreBoard();
        return { updateTexts, getStats: () => stats };
    }

    // =========================================
    // 8. ИГРА 3: САПЕР (Minesweeper)
    // =========================================
    function initMinesweeper() {
        gameContainer.innerHTML = `
            <div class="ms-top-bar">
                <div><span data-i18n="flags">Flags:</span> <span id="msFlags">10</span></div>
                <button id="msThemeToggle" class="ms-theme-toggle" data-i18n="toggleMC">MC Theme: OFF</button>
            </div>
            <div class="game-status" id="msStatus" style="display:none; margin-bottom:15px;"></div>
            <div class="ms-board" id="msBoard"></div>
            <button id="msRestart" class="restart-btn" style="display:none;"></button>
        `;
        updateLanguage();

        const boardEl = document.getElementById('msBoard'), flagsEl = document.getElementById('msFlags'), statusEl = document.getElementById('msStatus'), restartBtn = document.getElementById('msRestart'), themeBtn = document.getElementById('msThemeToggle');
        const ROWS = 9, COLS = 9, MINES = 10;
        let grid = [], gameOver = false, flagsLeft = MINES, revealedCount = 0, isMCTheme = false, stats = { w: 0, d: 0, l: 0 };
        boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
        const textures = { classic: { mine: '💣', flag: '🚩' }, mc: { mine: '🟩', flag: '🗡️' } };
        function getTex() { return isMCTheme ? textures.mc : textures.classic; }

        function updateTexts() {
            restartBtn.textContent = getTranslation('restart'); themeBtn.textContent = getTranslation(isMCTheme ? 'toggleMCon' : 'toggleMC');
            const flagsSpan = document.querySelector('[data-i18n="flags"]'); if(flagsSpan) flagsSpan.textContent = getTranslation('flags');
        }

        themeBtn.addEventListener('click', () => {
            isMCTheme = !isMCTheme; updateTexts();
            for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) {
                const cell = grid[r][c], el = document.getElementById(`ms-${r}-${c}`);
                if (cell.flagged) el.textContent = getTex().flag;
                if (gameOver && cell.mine && cell.revealed) el.textContent = getTex().mine;
            }}
        });

        function createBoard() {
            grid = [];
            for (let r = 0; r < ROWS; r++) {
                let row = []; for (let c = 0; c < COLS; c++) { row.push({ r, c, mine: false, revealed: false, flagged: false, neighborMines: 0 }); }
                grid.push(row);
            }
            let minesPlaced = 0;
            while (minesPlaced < MINES) {
                let r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
                if (!grid[r][c].mine) { grid[r][c].mine = true; minesPlaced++; }
            }
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (!grid[r][c].mine) {
                        let count = 0;
                        for (let i = -1; i <= 1; i++) { for (let j = -1; j <= 1; j++) { if (r+i >= 0 && r+i < ROWS && c+j >= 0 && c+j < COLS && grid[r+i][c+j].mine) count++; } }
                        grid[r][c].neighborMines = count;
                    }
                }
            }
        }

        function renderBoard() {
            boardEl.innerHTML = '';
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cellEl = document.createElement('div'); cellEl.className = 'ms-cell'; cellEl.id = `ms-${r}-${c}`;
                    cellEl.addEventListener('click', () => handleLeftClick(r, c));
                    cellEl.addEventListener('contextmenu', (e) => { e.preventDefault(); handleRightClick(r, c); });
                    boardEl.appendChild(cellEl);
                }
            }
            flagsEl.textContent = flagsLeft;
        }

        function handleLeftClick(r, c) {
            if (gameOver || grid[r][c].flagged || grid[r][c].revealed) return;
            if (grid[r][c].mine) {
                gameOver = true; stats.l++; AudioEngine.play('explosion'); revealAllMines();
                statusEl.textContent = getTranslation('msLose'); statusEl.className = 'game-status lose'; statusEl.style.display = 'block'; restartBtn.style.display = 'block';
            } else { AudioEngine.play('pop'); floodFill(r, c); checkWin(); }
        }

        function handleRightClick(r, c) {
            if (gameOver || grid[r][c].revealed) return;
            const cell = grid[r][c], el = document.getElementById(`ms-${r}-${c}`);
            if (!cell.flagged && flagsLeft > 0) { AudioEngine.play('flag'); cell.flagged = true; flagsLeft--; el.textContent = getTex().flag; } 
            else if (cell.flagged) { AudioEngine.play('pop'); cell.flagged = false; flagsLeft++; el.textContent = ''; }
            flagsEl.textContent = flagsLeft;
        }

        function floodFill(r, c) {
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
            const cell = grid[r][c]; if (cell.revealed || cell.flagged || cell.mine) return;
            cell.revealed = true; revealedCount++;
            const el = document.getElementById(`ms-${r}-${c}`); el.classList.add('revealed');
            if (cell.neighborMines > 0) { el.textContent = cell.neighborMines; el.dataset.num = cell.neighborMines; } 
            else { for (let i = -1; i <= 1; i++) { for (let j = -1; j <= 1; j++) { floodFill(r + i, c + j); } } }
        }

        function revealAllMines() {
            for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) {
                if (grid[r][c].mine) { const el = document.getElementById(`ms-${r}-${c}`); el.classList.add('revealed', 'mine'); el.textContent = getTex().mine; }
            }}
        }

        function checkWin() {
            if (revealedCount === (ROWS * COLS) - MINES) {
                gameOver = true; stats.w++; AudioEngine.play('win'); flagsEl.textContent = '0';
                statusEl.textContent = getTranslation('msWin'); statusEl.className = 'game-status win'; statusEl.style.display = 'block'; restartBtn.style.display = 'block';
                for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { if (grid[r][c].mine) document.getElementById(`ms-${r}-${c}`).textContent = getTex().flag; } }
            }
        }

        restartBtn.addEventListener('click', () => {
            AudioEngine.play('pop'); gameOver = false; flagsLeft = MINES; revealedCount = 0;
            statusEl.style.display = 'none'; restartBtn.style.display = 'none'; createBoard(); renderBoard();
        });

        createBoard(); renderBoard(); updateTexts();
        return { updateTexts, getStats: () => stats };
    }

    // =========================================
    // 9. ИГРА 4: ТВОЯ ОРИГИНАЛЬНАЯ ЗМЕЙКА (Neon Snake)
    // =========================================
    function initSnake() {
        gameContainer.innerHTML = `
            <div class="snake-header">
                <span><span data-i18n="score">Score</span>: <span id="snakeScore">0</span></span>
                <span>Рекорд: <span id="snakeHighScore">0</span></span>
            </div>

            <canvas id="snakeCanvas" width="300" height="300" class="snake-canvas"></canvas>

            <div class="snake-controls">
                <div class="snake-btn" id="btn-up">▲</div>
                <div class="snake-control-row">
                    <div class="snake-btn" id="btn-left">◀</div>
                    <div class="snake-btn" id="btn-down">▼</div>
                    <div class="snake-btn" id="btn-right">▶</div>
                </div>
            </div>

            <div id="snakeGameOver" style="position:absolute; top:0; left:0; width:100%; height:100%; background:var(--overlay-bg); display:none; flex-direction:column; justify-content:center; align-items:center; z-index:10; border-radius:var(--radius);">
                <h1 style="color:var(--score-lose); font-size:36px; margin-bottom:15px; text-shadow:0 0 20px var(--score-lose);" data-i18n="gameOver">ИГРА ОКОНЧЕНА</h1>
                <p style="font-size:18px; margin-bottom:20px;">Твой счет: <span id="snakeFinalScore">0</span></p>
                <button id="snakeRestartBtn" class="restart-btn" data-i18n="restart">ИГРАТЬ СНОВА</button>
            </div>
        `;

        updateLanguage();

        const canvas = document.getElementById("snakeCanvas");
        const ctx = canvas.getContext("2d");
        const scoreElement = document.getElementById("snakeScore");
        const highScoreElement = document.getElementById("snakeHighScore");
        const gameOverScreen = document.getElementById("snakeGameOver");
        const finalScoreElement = document.getElementById("snakeFinalScore");

        const gridSize = 15;
        const tileCount = canvas.width / gridSize;

        let snake = [];
        let snakeLength = 4;
        let headX = 10;
        let headY = 10;
        let xVelocity = 0;
        let yVelocity = 0;
        let appleX = 5;
        let appleY = 5;
        let score = 0;
        let highScore = localStorage.getItem("snakeHighScore") || 0;
        highScoreElement.innerText = highScore;
        
        let gameLoop;
        let gameSpeed = 120;

        let snakeColor = "#00ffcc";
        let foodColor = "#ff0055";

        function updateThemeColors() {
            const styles = getComputedStyle(document.documentElement);
            snakeColor = styles.getPropertyValue('--accent-color').trim() || "#00ffcc";
            foodColor = styles.getPropertyValue('--score-lose').trim() || "#ff0055";
        }

        updateThemeColors();

        function startGame() {
            snake = [];
            snakeLength = 4;
            headX = 10;
            headY = 10;
            xVelocity = 0;
            yVelocity = 0;
            score = 0;
            gameSpeed = 120;
            scoreElement.innerText = score;
            gameOverScreen.style.display = "none";
            placeApple();
            clearTimeout(gameLoop);
            updateThemeColors();
            drawGame();
        }

        function drawGame() {
            changeSnakePosition();
            if (isGameOver()) return;

            clearScreen();
            checkAppleCollision();
            drawApple();
            drawSnake();

            if (score > 5) gameSpeed = 100;
            if (score > 10) gameSpeed = 80;
            if (score > 20) gameSpeed = 60;

            gameLoop = setTimeout(drawGame, gameSpeed);
        }

        function isGameOver() {
            let gameOver = false;
            if (yVelocity === 0 && xVelocity === 0) return false;

            if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) gameOver = true;

            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === headX && snake[i].y === headY) { gameOver = true; break; }
            }

            if (gameOver) {
                AudioEngine.play('lose');
                gameOverScreen.style.display = "flex";
                finalScoreElement.innerText = score;
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("snakeHighScore", highScore);
                    highScoreElement.innerText = highScore;
                }
            }
            return gameOver;
        }

        function clearScreen() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

        function drawSnake() {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = snakeColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = snakeColor;
            for (let i = 0; i < snake.length; i++) {
                ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
            }
            ctx.globalAlpha = 1.0;
            
            snake.push({ x: headX, y: headY });
            while (snake.length > snakeLength) snake.shift();

            ctx.fillStyle = snakeColor;
            ctx.fillRect(headX * gridSize, headY * gridSize, gridSize - 2, gridSize - 2);
            ctx.shadowBlur = 0;
        }

        function changeSnakePosition() { headX += xVelocity; headY += yVelocity; }

        function drawApple() {
            ctx.fillStyle = foodColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = foodColor;
            ctx.beginPath();
            ctx.arc(appleX * gridSize + gridSize/2, appleY * gridSize + gridSize/2, (gridSize - 2)/2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        function checkAppleCollision() {
            if (appleX === headX && appleY == headY) {
                AudioEngine.play('pop');
                placeApple();
                snakeLength++;
                score++;
                scoreElement.innerText = score;
                if ("vibrate" in navigator) navigator.vibrate(50);
            }
        }

        function placeApple() {
            let valid = false;
            while (!valid) {
                appleX = Math.floor(Math.random() * tileCount);
                appleY = Math.floor(Math.random() * tileCount);
                valid = true;
                for (let part of snake) {
                    if (part.x === appleX && part.y === appleY) { valid = false; break; }
                }
                if(headX === appleX && headY === appleY) valid = false;
            }
        }

        function moveUp() { if (yVelocity == 1) return; yVelocity = -1; xVelocity = 0; }
        function moveDown() { if (yVelocity == -1) return; yVelocity = 1; xVelocity = 0; }
        function moveLeft() { if (xVelocity == 1) return; yVelocity = 0; xVelocity = -1; }
        function moveRight() { if (xVelocity == -1) return; yVelocity = 0; xVelocity = 1; }

        const addControlEvent = (element, callback) => {
            element.addEventListener('touchstart', (e) => { e.preventDefault(); callback(); }, {passive: false});
            element.addEventListener('mousedown', (e) => { e.preventDefault(); callback(); });
        };

        addControlEvent(document.getElementById('btn-up'), moveUp);
        addControlEvent(document.getElementById('btn-down'), moveDown);
        addControlEvent(document.getElementById('btn-left'), moveLeft);
        addControlEvent(document.getElementById('btn-right'), moveRight);

        const restartHandler = () => { AudioEngine.play('pop'); startGame(); };
        const restartBtnEl = document.getElementById('snakeRestartBtn');
        restartBtnEl.addEventListener('click', restartHandler);
        restartBtnEl.addEventListener('touchstart', (e) => { e.preventDefault(); restartHandler(); });

        function handleKeyDown(event) {
            if (event.keyCode == 38 || event.key === 'w') moveUp();
            if (event.keyCode == 40 || event.key === 's') moveDown();
            if (event.keyCode == 37 || event.key === 'a') moveLeft();
            if (event.keyCode == 39 || event.key === 'd') moveRight();
        }
        document.body.addEventListener('keydown', handleKeyDown);

        startGame();

        return {
            updateTexts: () => updateLanguage(),
            updateThemeColors: () => updateThemeColors(),
            getStats: () => ({ w: score }),
            destroy: () => {
                clearTimeout(gameLoop);
                document.body.removeEventListener('keydown', handleKeyDown);
            }
        };
    }

    document.addEventListener('DOMContentLoaded', initApp);
})();