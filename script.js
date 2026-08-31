(function() {
    'use strict';

    const API_BASE = 'http://localhost:5103/api';
    const HUB_URL = 'http://localhost:5103/gamehub'; // URL для локального SignalR

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
            this.enabled = !this.enabled; localStorage.setItem('hub_sound', this.enabled ? 'on' : 'off'); return this.enabled;
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
            hubTitle: "🎮 Retro Hub", chooseGame: "Choose a game:", backBtn: "⬅ Back to Menu", restart: "Restart", cancel: "Cancel", pause: "Pause", resume: "Resume",
            tictactoe: "Tic-Tac-Toe", tictactoeDesc: "Play against computer or online", rps: "Rock-Paper-Scissors", rpsDesc: "Play against computer",
            minesweeper: "Minesweeper", minesweeperDesc: "Classic logic puzzle", turnX: "Your turn (X)", turnO: "Computer's turn (O)", compThinking: "Computer is thinking...",
            winX: "You Win! 🎉", winO: "Computer Wins! 😢", draw: "It's a draw! 🤝", chooseWeapon: "Choose your weapon:", win: "You Win! 🎉", lose: "You Lose! 😢", tie: "It's a Tie! 🤝",
            wins: "Wins", losses: "Losses", draws: "Draws", easy: "vs PC (Easy)", hard: "vs PC (Hard)", online: "🌐 Play Online", searching: "Searching for opponent...", opponentLeft: "Opponent left! You win! 🎉", waitingTurn: "Opponent's turn", yourTurn: "Your turn!",
            flags: "Flags:", msWin: "You cleared the minefield! 🎉", msLose: "Boom! You hit a mine 💥", toggleMC: "MC Theme: OFF", toggleMCon: "MC Theme: ON",
            leaderboard: "🏆 Top Players", loading: "Loading...", noRecords: "No records yet.",
            snake: "Snake", snakeDesc: "Classic arcade", score: "Score", gameOver: "GAME OVER!",
            tetris: "Tetris", tetrisDesc: "Classic block puzzle", nextPiece: "Next:", lines: "Lines", level: "Level",
            allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top."
        },
        ru: {
            hubTitle: "🎮 Ретро Хаб", chooseGame: "Выберите игру:", backBtn: "⬅ Назад в меню", restart: "Заново", cancel: "Отмена", pause: "Пауза", resume: "Продолжить",
            tictactoe: "Крестики-нолики", tictactoeDesc: "Игра против ПК или онлайн", rps: "Камень-Ножницы-Бумага", rpsDesc: "Игра против ПК",
            minesweeper: "Сапер", minesweeperDesc: "Классическая головоломка", turnX: "Твой ход (X)", turnO: "Ход компьютера (O)", compThinking: "Компьютер думает...",
            winX: "Ты победил! 🎉", winO: "Компьютер победил! 😢", draw: "Ничья! 🤝", chooseWeapon: "Сделай выбор:", win: "Ты победил! 🎉", lose: "Ты проиграл! 😢", tie: "Ничья! 🤝",
            wins: "Победы", losses: "Поражения", draws: "Ничьи", easy: "С ПК (Легко)", hard: "С ПК (Сложно)", online: "🌐 Играть онлайн", searching: "Поиск противника...", opponentLeft: "Противник вышел! Победа! 🎉", waitingTurn: "Ход противника", yourTurn: "Ваш ход!",
            flags: "Флаги:", msWin: "Минное поле чисто! 🎉", msLose: "Бум! Ты подорвался 💥", toggleMC: "Тема MC: ВЫКЛ", toggleMCon: "Тема MC: ВКЛ",
            leaderboard: "🏆 Таблица рекордов", loading: "Загрузка...", noRecords: "Рекордов пока нет.",
            snake: "Змейка", snakeDesc: "Классическая аркада", score: "Счет", gameOver: "ИГРА ОКОНЧЕНА!",
            tetris: "Тетрис", tetrisDesc: "Классическая головоломка", nextPiece: "Следующая:", lines: "Линии", level: "Уровень",
            allowRotation: "Вращение фигур", rulesTitle: "Правила", rule1Title: "Цель:", rule1Desc: "Строить сплошные горизонтальные ряды из падающих блоков (они называются тетромино). Ряд без единой пустоты 'сжигается' (исчезает), освобождая место.", rule2Title: "Управление:", rule2Desc: "Пока фигура летит, ты можешь двигать её влево-вправо, вращать, а также ускорять падение (стрелка вниз) или мгновенно сбрасывать на дно (Пробел — это называется Hard Drop).", rule3Title: "Очки:", rule3Desc: "Чем больше линий ты сжигаешь за один бросок, тем больше очков. Максимум — 4 линии за раз (это делается только длинной прямой 'палкой'), этот прием так и называется — «Тетрис».", rule4Title: "Прогрессия (Сложность):", rule4Desc: "За каждые 10 сожженных линий повышается уровень. С каждым новым уровнем фигуры начинают падать быстрее.", rule5Title: "Game Over:", rule5Desc: "Игра заканчивается, когда стакан заполняется доверху, и для появления новой фигуры просто не остается места."
        },
        es: { hubTitle: "🎮 Retro Hub", chooseGame: "Elige un juego:", backBtn: "⬅ Volver", restart: "Reiniciar", cancel: "Cancelar", pause: "Pausa", resume: "Reanudar", tictactoe: "Tres en raya", tictactoeDesc: "PC u online", rps: "Piedra, Papel, Tijera", rpsDesc: "Contra la PC", minesweeper: "Buscaminas", minesweeperDesc: "Puzle lógico", turnX: "Tu turno (X)", turnO: "Turno de PC (O)", compThinking: "Pensando...", winX: "¡Ganaste! 🎉", winO: "¡PC Gana! 😢", draw: "¡Empate! 🤝", chooseWeapon: "Elige tu arma:", win: "¡Ganaste! 🎉", lose: "¡Perdiste! 😢", tie: "¡Empate! 🤝", wins: "Victorias", losses: "Derrotas", draws: "Empates", easy: "PC (Fácil)", hard: "PC (Difícil)", online: "🌐 Online", searching: "Buscando...", opponentLeft: "Rival desconectado. ¡Ganas! 🎉", waitingTurn: "Turno del rival", yourTurn: "¡Tu turno!", flags: "Banderas:", msWin: "¡Limpiaste el campo! 🎉", msLose: "¡Boom! Mina 💥", toggleMC: "MC: OFF", toggleMCon: "MC: ON", leaderboard: "🏆 Mejores", loading: "Cargando...", noRecords: "Sin registros.", snake: "Serpiente", snakeDesc: "Arcade clásico", score: "Puntaje", gameOver: "¡TERMINADO!", tetris: "Tetris", tetrisDesc: "Puzle de bloques", nextPiece: "Sig.:", lines: "Líneas", level: "Nivel", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top." },
        fr: { hubTitle: "🎮 Retro Hub", chooseGame: "Choisissez:", backBtn: "⬅ Retour", restart: "Recommencer", cancel: "Annuler", pause: "Pause", resume: "Reprendre", tictactoe: "Morpion", tictactoeDesc: "PC ou en ligne", rps: "Pierre-Papier-Ciseaux", rpsDesc: "Contre le PC", minesweeper: "Démineur", minesweeperDesc: "Jeu de logique", turnX: "A ton tour (X)", turnO: "Tour du PC (O)", compThinking: "Réfléchit...", winX: "Tu as gagné! 🎉", winO: "Le PC a gagné! 😢", draw: "Match nul! 🤝", chooseWeapon: "Arme:", win: "Gagné! 🎉", lose: "Perdu! 😢", tie: "Égalité! 🤝", wins: "Victoires", losses: "Défaites", draws: "Nuls", easy: "PC (Facile)", hard: "PC (Difficile)", online: "🌐 En ligne", searching: "Recherche...", opponentLeft: "Adversaire parti! Gagné! 🎉", waitingTurn: "Tour de l'adversaire", yourTurn: "A ton tour!", flags: "Drapeaux:", msWin: "Champ déminé! 🎉", msLose: "Boom! 💥", toggleMC: "MC: OFF", toggleMCon: "MC: ON", leaderboard: "🏆 Meilleurs", loading: "Chargement...", noRecords: "Aucun enregistrement.", snake: "Serpent", snakeDesc: "Arcade", score: "Score", gameOver: "FIN!", tetris: "Tetris", tetrisDesc: "Puzzle de blocs", nextPiece: "Suiv:", lines: "Lignes", level: "Niveau", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top." },
        "zh-CN": { hubTitle: "🎮 复古游戏中心", chooseGame: "选择游戏:", backBtn: "⬅ 返回", restart: "重新开始", cancel: "取消", pause: "暂停", resume: "继续", tictactoe: "井字棋", tictactoeDesc: "单机或联机", rps: "石头剪刀布", rpsDesc: "人机对战", minesweeper: "扫雷", minesweeperDesc: "经典逻辑", turnX: "你的回合 (X)", turnO: "电脑回合 (O)", compThinking: "思考中...", winX: "你赢了! 🎉", winO: "电脑赢了! 😢", draw: "平局! 🤝", chooseWeapon: "选择武器:", win: "你赢了! 🎉", lose: "你输了! 😢", tie: "平局! 🤝", wins: "胜", losses: "负", draws: "平", easy: "简单", hard: "困难", online: "🌐 联机对战", searching: "寻找对手...", opponentLeft: "对手退出! 你赢了! 🎉", waitingTurn: "等待对手...", yourTurn: "你的回合!", flags: "旗帜:", msWin: "过关! 🎉", msLose: "砰！💥", toggleMC: "MC: 关", toggleMCon: "MC: 开", leaderboard: "🏆 排行榜", loading: "加载中...", noRecords: "暂无记录.", snake: "贪吃蛇", snakeDesc: "街机", score: "分数", gameOver: "游戏结束!", tetris: "俄罗斯方块", tetrisDesc: "经典方块", nextPiece: "下一个:", lines: "行数", level: "等级", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top." },
        "zh-TW": { hubTitle: "🎮 復古遊戲中心", chooseGame: "選擇遊戲:", backBtn: "⬅ 返回", restart: "重新開始", cancel: "取消", pause: "暫停", resume: "繼續", tictactoe: "井字棋", tictactoeDesc: "單機或聯機", rps: "石頭剪刀布", rpsDesc: "人機對戰", minesweeper: "踩地雷", minesweeperDesc: "經典邏輯", turnX: "你的回合 (X)", turnO: "電腦回合 (O)", compThinking: "思考中...", winX: "你贏了! 🎉", winO: "電腦贏了! 😢", draw: "平手! 🤝", chooseWeapon: "選擇武器:", win: "你贏了! 🎉", lose: "你輸了! 😢", tie: "平手! 🤝", wins: "勝", losses: "負", draws: "平", easy: "簡單", hard: "困難", online: "🌐 聯機對戰", searching: "尋找對手...", opponentLeft: "對手退出! 你贏了! 🎉", waitingTurn: "等待對手...", yourTurn: "你的回合!", flags: "旗幟:", msWin: "過關! 🎉", msLose: "砰！💥", toggleMC: "MC: 關", toggleMCon: "MC: 開", leaderboard: "🏆 排行榜", loading: "加載中...", noRecords: "暫無記錄.", snake: "貪吃蛇", snakeDesc: "街機", score: "分數", gameOver: "遊戲結束!", tetris: "俄羅斯方塊", tetrisDesc: "經典方塊", nextPiece: "下一個:", lines: "行數", level: "等級", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top." },
        kk: { hubTitle: "🎮 Ретро Хаб", chooseGame: "Ойынды таңдаңыз:", backBtn: "⬅ Қайту", restart: "Қайта бастау", cancel: "Болдырмау", pause: "Үзіліс", resume: "Жалғастыру", tictactoe: "Крестик-нолик", tictactoeDesc: "ДК немесе онлайн", rps: "Тас-Қайшы-Қағаз", rpsDesc: "ДК қарсы", minesweeper: "Сапер", minesweeperDesc: "Логикалық", turnX: "Сенің жүрісің (X)", turnO: "ДК жүрісі (O)", compThinking: "Ойлануда...", winX: "Жеңдің! 🎉", winO: "ДК жеңді! 😢", draw: "Тең! 🤝", chooseWeapon: "Таңдау жаса:", win: "Жеңдің! 🎉", lose: "Ұтылдың! 😢", tie: "Тең! 🤝", wins: "Жеңістер", losses: "Жеңілістер", draws: "Тең", easy: "Оңай", hard: "Қиын", online: "🌐 Онлайн", searching: "Іздеу...", opponentLeft: "Қарсылас шықты! 🎉", waitingTurn: "Қарсылас жүрісі", yourTurn: "Сенің жүрісің!", flags: "Жалаулар:", msWin: "Тазарттың! 🎉", msLose: "Бум! 💥", toggleMC: "MC: ӨШУЛІ", toggleMCon: "MC: ҚОСУЛЫ", leaderboard: "🏆 Рекордтар", loading: "Жүктелуде...", noRecords: "Жазбалар жоқ.", snake: "Жылан", snakeDesc: "Аркада", score: "Есеп", gameOver: "АЯҚТАЛДЫ!", tetris: "Тетрис", tetrisDesc: "Блоктар", nextPiece: "Келесі:", lines: "Жолдар", level: "Деңгей", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top." },
        be: { hubTitle: "🎮 Рэтра Хаб", chooseGame: "Выберыце:", backBtn: "⬅ Назад", restart: "Нанова", cancel: "Адмена", pause: "Паўза", resume: "Працягнуць", tictactoe: "Крыжыкі-нолікі", tictactoeDesc: "ПК або анлайн", rps: "Камень-Нажніцы-Папера", rpsDesc: "Супраць ПК", minesweeper: "Сапёр", minesweeperDesc: "Галаваломка", turnX: "Твой ход (X)", turnO: "Ход ПК (O)", compThinking: "Думае...", winX: "Перамог! 🎉", winO: "ПК перамог! 😢", draw: "Нічыя! 🤝", chooseWeapon: "Выбар:", win: "Перамог! 🎉", lose: "Прайграў! 😢", tie: "Нічыя! 🤝", wins: "Перамогі", losses: "Паражэнні", draws: "Нічыі", easy: "Лёгка", hard: "Складана", online: "🌐 Анлайн", searching: "Пошук...", opponentLeft: "Праціўнік выйшаў! 🎉", waitingTurn: "Ход праціўніка", yourTurn: "Твой ход!", flags: "Сцяжкі:", msWin: "Чыста! 🎉", msLose: "Бум! 💥", toggleMC: "MC: ВЫКЛ", toggleMCon: "MC: УКЛ", leaderboard: "🏆 Рэкорды", loading: "Загрузка...", noRecords: "Няма рэкордаў.", snake: "Змейка", snakeDesc: "Аркада", score: "Лік", gameOver: "СКОНЧАНА!", tetris: "Тэтрыс", tetrisDesc: "Галаваломка", nextPiece: "Наступная:", lines: "Лініі", level: "Узровень", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top." },
        uk: { hubTitle: "🎮 Ретро Хаб", chooseGame: "Оберіть гру:", backBtn: "⬅ Назад", restart: "Заново", cancel: "Скасувати", pause: "Пауза", resume: "Продовжити", tictactoe: "Хрестики-нулики", tictactoeDesc: "ПК або онлайн", rps: "Камінь-Ножиці-Папір", rpsDesc: "Проти ПК", minesweeper: "Сапер", minesweeperDesc: "Головоломка", turnX: "Твій хід (X)", turnO: "Хід ПК (O)", compThinking: "Думає...", winX: "Перемога! 🎉", winO: "ПК переміг! 😢", draw: "Нічия! 🤝", chooseWeapon: "Вибір:", win: "Перемога! 🎉", lose: "Поразка! 😢", tie: "Нічия! 🤝", wins: "Перемоги", losses: "Поразки", draws: "Нічиї", easy: "Легко", hard: "Складно", online: "🌐 Онлайн", searching: "Пошук...", opponentLeft: "Суперник вийшов! 🎉", waitingTurn: "Хід суперника", yourTurn: "Твій хід!", flags: "Прапорці:", msWin: "Чисто! 🎉", msLose: "Бум! 💥", toggleMC: "MC: ВИМК", toggleMCon: "MC: УВІМК", leaderboard: "🏆 Рекорди", loading: "Завантаження...", noRecords: "Немає записів.", snake: "Змійка", snakeDesc: "Аркада", score: "Рахунок", gameOver: "КІНЕЦЬ!", tetris: "Тетріс", tetrisDesc: "Головоломка", nextPiece: "Наступна:", lines: "Лінії", level: "Рівень", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top." },
        uz: { hubTitle: "🎮 Retro Xab", chooseGame: "Tanlang:", backBtn: "⬅ Orqaga", restart: "Qayta", cancel: "Bekor qilish", pause: "Pauza", resume: "Davom etish", tictactoe: "Tik-tak-toe", tictactoeDesc: "PK yoki onlayn", rps: "Tosh-Qaychi-Qog'oz", rpsDesc: "PK ga qarshi", minesweeper: "Sapyol", minesweeperDesc: "Boshqotirma", turnX: "Siz (X)", turnO: "PK (O)", compThinking: "O'ylamoqda...", winX: "Yutdingiz! 🎉", winO: "PK yutdi! 😢", draw: "Durang! 🤝", chooseWeapon: "Tanlov:", win: "Yutdingiz! 🎉", lose: "Yutqazdingiz! 😢", tie: "Durang! 🤝", wins: "G'alaba", losses: "Mag'lubiyat", draws: "Durang", easy: "Oson", hard: "Qiyin", online: "🌐 Onlayn", searching: "Qidirilmoqda...", opponentLeft: "Raqib chiqdi! 🎉", waitingTurn: "Raqib navbati", yourTurn: "Sizning navbatingiz!", flags: "Bayroqlar:", msWin: "Tozalandi! 🎉", msLose: "Bum! 💥", toggleMC: "MC: O'CHIQ", toggleMCon: "MC: YONIQ", leaderboard: "🏆 Rekordlar", loading: "Yuklanmoqda...", noRecords: "Yozuvlar yo'q.", snake: "Ilon", snakeDesc: "Arkada", score: "Hisob", gameOver: "TUGADI!", tetris: "Tetris", tetrisDesc: "Boshqotirma", nextPiece: "Keyingisi:", lines: "Qatorlar", level: "Daraja", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows. Rows without empty spaces disappear.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points. Max 4 lines (Tetris).", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level and speed.", rule5Title: "Game Over:", rule5Desc: "Game ends when the grid fills to the top." }
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
    const btnAuth = document.getElementById('btnAuth');
    const gameCards = document.querySelectorAll('.game-card:not(.disabled)');
    const gamesGrid = document.getElementById('gamesGrid');

    const authModal = document.getElementById('authModal');
    const authClose = document.getElementById('authClose');
    const authSwitch = document.getElementById('authSwitch');
    const authSubmit = document.getElementById('authSubmit');
    const authTitle = document.getElementById('authTitle');
    const authUsername = document.getElementById('authUsername');
    const authPassword = document.getElementById('authPassword');
    const authError = document.getElementById('authError');

    let currentLang = localStorage.getItem('hub_lang') || 'en';
    let currentTheme = localStorage.getItem('hub_theme') || 'dark';
    let currentAccent = localStorage.getItem('hub_accent') || 'cyan';
    let favoriteGames = JSON.parse(localStorage.getItem('hub_favorites')) || [];
    let activeGameInstance = null; 
    let activeGameId = null;
    let isRegisterMode = false;

    function initApp() {
        if (!translations[currentLang]) currentLang = 'en'; 
        root.setAttribute('data-theme', currentTheme);
        root.setAttribute('data-accent', currentAccent);
        updateThemeIcon(); updateSoundIcon(); updateAuthBtn();
        langSelect.value = currentLang; colorSelect.value = currentAccent;
        updateLanguage(); updateClock(); setInterval(updateClock, 1000);
        initFavorites(); initDragAndDrop(); 
    }

    // =========================================
    // 4. АВТОРИЗАЦИЯ (JWT)
    // =========================================
    function updateAuthBtn() {
        const token = localStorage.getItem('hub_jwt');
        const username = localStorage.getItem('hub_username');
        btnAuth.textContent = token ? `👤 ${username}` : `👤 Login`;
    }

    btnAuth.addEventListener('click', () => {
        AudioEngine.play('pop');
        const token = localStorage.getItem('hub_jwt');
        if (token) {
            if (confirm("Выйти из аккаунта?")) {
                localStorage.removeItem('hub_jwt');
                localStorage.removeItem('hub_username');
                updateAuthBtn();
            }
        } else {
            authModal.style.display = 'flex';
        }
    });

    authClose.addEventListener('click', () => { authModal.style.display = 'none'; });

    authSwitch.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        authTitle.textContent = isRegisterMode ? 'Register' : 'Login';
        authSwitch.textContent = isRegisterMode ? "Already have an account? Login" : "Don't have an account? Register";
        authError.style.display = 'none';
    });

    authSubmit.addEventListener('click', async () => {
        const username = authUsername.value.trim();
        const password = authPassword.value.trim();
        if(!username || !password) { authError.textContent = "Заполните все поля"; authError.style.display = 'block'; return; }

        authSubmit.disabled = true;
        authSubmit.textContent = "...";
        const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) {
                authError.textContent = data.message || "Ошибка сервера";
                authError.style.display = 'block';
            } else {
                if (isRegisterMode) {
                    alert("Успешно! Теперь войдите.");
                    authSwitch.click();
                } else {
                    localStorage.setItem('hub_jwt', data.token);
                    localStorage.setItem('hub_username', data.username);
                    updateAuthBtn(); authModal.style.display = 'none';
                    authUsername.value = ''; authPassword.value = '';
                }
            }
        } catch (e) {
            authError.textContent = "Нет связи с сервером"; authError.style.display = 'block';
        }
        authSubmit.disabled = false; authSubmit.textContent = "Submit";
    });

    // =========================================
    // 5. UI КОНТРОЛЛЕРЫ
    // =========================================
    function updateThemeIcon() { themeToggle.querySelector('.theme-icon').textContent = currentTheme === 'dark' ? '🌙' : '☀️'; }
    function updateSoundIcon() { soundToggle.querySelector('.sound-icon').textContent = AudioEngine.enabled ? '🔊' : '🔇'; }

    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', currentTheme); localStorage.setItem('hub_theme', currentTheme);
        updateThemeIcon(); if(activeGameInstance && activeGameInstance.updateThemeColors) activeGameInstance.updateThemeColors();
    });

    colorSelect.addEventListener('change', (e) => {
        currentAccent = e.target.value; root.setAttribute('data-accent', currentAccent);
        localStorage.setItem('hub_accent', currentAccent);
        if(activeGameInstance && activeGameInstance.updateThemeColors) activeGameInstance.updateThemeColors();
    });

    soundToggle.addEventListener('click', () => { AudioEngine.toggle(); updateSoundIcon(); });
    langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value; localStorage.setItem('hub_lang', currentLang);
        updateLanguage(); updateClock(); if (activeGameInstance && activeGameInstance.updateTexts) activeGameInstance.updateTexts();
    });

    function getTranslation(key) { return translations[currentLang] ? (translations[currentLang][key] || key) : key; }
    function updateLanguage() {
        if(!translations[currentLang]) return;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang][key]) el.textContent = translations[currentLang][key];
        });
    }

    function updateClock() {
        const now = new Date();
        try {
            clockTime.textContent = now.toLocaleTimeString(currentLang);
            clockDate.textContent = now.toLocaleDateString(currentLang, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        } catch(e) { }
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
            card.addEventListener('dragstart', function() { draggedCard = this; setTimeout(() => this.classList.add('dragging'), 0); });
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
    // 6. МАРШРУТИЗАЦИЯ SPA И РЕКОРДЫ (API)
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

    btnLeaderboard.addEventListener('click', () => { AudioEngine.play('move'); showScreen(leaderboardScreen); fetchLeaderboard('tictactoe'); });
    lbBackBtn.addEventListener('click', () => { AudioEngine.play('pop'); showScreen(menuScreen); });

    document.querySelectorAll('.lb-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            AudioEngine.play('pop');
            document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active'); fetchLeaderboard(e.target.getAttribute('data-tab'));
        });
    });

    async function saveScoreToDatabase(gameName, wins) {
        const token = localStorage.getItem('hub_jwt');
        if (!token) return;
        try {
            await fetch(`${API_BASE}/leaderboard`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ gameName, wins })
            });
        } catch (e) { console.error('Ошибка API:', e); }
    }

    async function fetchLeaderboard(gameName) {
        const listEl = document.getElementById('leaderboardList');
        listEl.innerHTML = `<p>${getTranslation('loading')}</p>`;
        try {
            const res = await fetch(`${API_BASE}/leaderboard/${gameName}`);
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
        else if (gameId === 'tetris') activeGameInstance = initTetris();
    }

    // =========================================
    // 7. ИГРА 1: КРЕСТИКИ-НОЛИКИ (С SIGNALR МУЛЬТИПЛЕЕРОМ)
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
                    <option value="easy" data-i18n="easy">vs PC (Easy)</option>
                    <option value="hard" data-i18n="hard">vs PC (Hard)</option>
                    <option value="online" data-i18n="online">🌐 Play Online</option>
                </select>
            </div>
            <div class="game-status" id="tttStatus"></div>
            <div class="tictactoe-board" id="tttBoard"></div>
            <button id="tttRestart" class="restart-btn" style="display:none;"></button>

            <!-- Спиннер поиска онлайн игры -->
            <div id="searchingOverlay" class="searching-overlay">
                <div class="spinner"></div>
                <p data-i18n="searching">Searching for opponent...</p>
                <button id="cancelSearchBtn" class="btn-small" style="margin-top:20px;" data-i18n="cancel">Cancel</button>
            </div>
        `;
        updateLanguage();

        const boardEl = document.getElementById('tttBoard'), statusEl = document.getElementById('tttStatus');
        const restartBtn = document.getElementById('tttRestart'), diffSelect = document.getElementById('tttDifficulty');
        const scores = { w: document.getElementById('tttWins'), d: document.getElementById('tttDraws'), l: document.getElementById('tttLosses') };
        const overlay = document.getElementById('searchingOverlay'), cancelBtn = document.getElementById('cancelSearchBtn');

        let board = Array(9).fill(null), currentPlayer = 'X', gameOver = false, winCells = [];
        let isThinking = false, timer = null;
        let stats = { w: 0, d: 0, l: 0 };

        let connection = null;
        let isOnline = false, mySign = 'X', isMyTurn = true;

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
            const searchP = overlay.querySelector('p'); if (searchP) searchP.textContent = getTranslation('searching');
            cancelBtn.textContent = getTranslation('cancel');

            if (gameOver) {
                if (winCells.length > 0) statusEl.textContent = getTranslation(currentPlayer === 'X' ? 'winX' : 'winO');
                else statusEl.textContent = getTranslation('draw');
            } else {
                if (isOnline) { statusEl.textContent = getTranslation(isMyTurn ? 'yourTurn' : 'waitingTurn'); } 
                else { statusEl.textContent = getTranslation(currentPlayer === 'O' && isThinking ? 'compThinking' : 'turnX'); }
            }
        }

        function makeMove(index, player) {
            AudioEngine.play('move'); board[index] = player;
            const cellEl = boardEl.children[index]; cellEl.textContent = player; cellEl.classList.add('taken', player.toLowerCase());
            
            if (checkWinLogic(board, player)) {
                gameOver = true; highlightWinCells(player); markGameOver(); statusEl.className = `game-status win-${player.toLowerCase()}`;
                if (isOnline) { if (player === mySign) { stats.w++; AudioEngine.play('win'); } else { stats.l++; AudioEngine.play('lose'); } } 
                else { if (player === 'X') { stats.w++; AudioEngine.play('win'); } else { stats.l++; AudioEngine.play('lose'); } }
                updateScoreBoard(); restartBtn.style.display = isOnline ? 'none' : 'block'; updateTexts(); return true;
            }
            if (board.every(cell => cell !== null)) {
                gameOver = true; markGameOver(); statusEl.className = 'game-status draw';
                stats.d++; AudioEngine.play('draw'); updateScoreBoard(); restartBtn.style.display = isOnline ? 'none' : 'block'; updateTexts(); return true;
            }
            return false;
        }

        function handlePlayerClick(index) {
            if (gameOver || board[index] !== null) return;
            if (isOnline) {
                if (!isMyTurn) return;
                const isEnded = makeMove(index, mySign);
                connection.invoke("MakeMove", index, mySign).catch(err => console.error(err));
                if (!isEnded) { isMyTurn = false; currentPlayer = (mySign === 'X' ? 'O' : 'X'); updateTexts(); }
            } else {
                if (isThinking) return;
                if (makeMove(index, 'X')) return;
                currentPlayer = 'O'; isThinking = true; updateTexts(); timer = setTimeout(computerMove, 500);
            }
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

        function resetGame() {
            clearTimeout(timer); board.fill(null); currentPlayer = 'X'; gameOver = false; winCells = []; isThinking = false;
            statusEl.className = 'game-status'; restartBtn.style.display = 'none'; renderBoard(); updateTexts();
        }

        restartBtn.addEventListener('click', () => { AudioEngine.play('pop'); resetGame(); });

        async function startOnlineMatch() {
            if (!window.signalR) { alert("Библиотека SignalR не загружена."); diffSelect.value = 'pc_easy'; return; }
            isOnline = true; resetGame(); overlay.style.display = 'flex';
            if (!connection) {
                connection = new signalR.HubConnectionBuilder().withUrl(HUB_URL).withAutomaticReconnect().build();
                connection.on("WaitingForOpponent", () => { overlay.style.display = 'flex'; });
                connection.on("GameStarted", (sign) => {
                    overlay.style.display = 'none'; mySign = sign; isMyTurn = (sign === 'X'); currentPlayer = 'X'; gameOver = false; AudioEngine.play('pop'); updateTexts();
                });
                connection.on("ReceiveMove", (index, sign) => {
                    if (gameOver) return; makeMove(index, sign); isMyTurn = true; currentPlayer = mySign; updateTexts();
                });
                connection.on("OpponentDisconnected", () => {
                    if(!gameOver) {
                        gameOver = true; markGameOver(); statusEl.textContent = getTranslation('opponentLeft'); statusEl.className = 'game-status win';
                        stats.w++; updateScoreBoard(); AudioEngine.play('win'); setTimeout(() => { if (isOnline) connection.invoke("FindOpponent"); }, 3000);
                    }
                });
            }
            try { if (connection.state === signalR.HubConnectionState.Disconnected) await connection.start(); await connection.invoke("FindOpponent"); } 
            catch (err) { console.error(err); alert("Не удалось подключиться к серверу!"); diffSelect.value = 'pc_easy'; isOnline = false; overlay.style.display = 'none'; }
        }

        diffSelect.addEventListener('change', () => { 
            if (diffSelect.value === 'online') { startOnlineMatch(); } else { isOnline = false; overlay.style.display = 'none'; if (connection) connection.stop(); resetGame(); }
        });

        cancelBtn.addEventListener('click', () => { AudioEngine.play('pop'); if (connection) connection.stop(); diffSelect.value = 'pc_easy'; isOnline = false; overlay.style.display = 'none'; resetGame(); });
        renderBoard(); updateTexts(); updateScoreBoard();
        return { updateTexts, getStats: () => stats, destroy: () => { clearTimeout(timer); if (connection) connection.stop(); } };
    }

    // =========================================
    // 8. ИГРА 2: КАМЕНЬ-НОЖНИЦЫ-БУМАГА 
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
            <div class="rps-result-display"><span id="playerChoice">❓</span><span class="rps-vs">VS</span><span id="compChoice">❓</span></div>
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
            scores.w.textContent = stats.w; scores.d.textContent = stats.d; scores.l.textContent = stats.l;
            btns.forEach(btn => btn.style.display = 'none'); restartBtn.style.display = 'block'; updateTexts();
        }

        btns.forEach(btn => btn.addEventListener('click', () => play(btn.getAttribute('data-choice'))));
        restartBtn.addEventListener('click', () => {
            AudioEngine.play('pop'); hasPlayed = false; pDisplay.textContent = '❓'; cDisplay.textContent = '❓';
            btns.forEach(btn => btn.style.display = 'block'); restartBtn.style.display = 'none'; updateTexts();
        });

        updateTexts(); return { updateTexts, getStats: () => stats };
    }

    // =========================================
    // 9. ИГРА 3: САПЕР (Minesweeper)
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
            grid = []; for (let r = 0; r < ROWS; r++) { let row = []; for (let c = 0; c < COLS; c++) { row.push({ r, c, mine: false, revealed: false, flagged: false, neighborMines: 0 }); } grid.push(row); }
            let minesPlaced = 0;
            while (minesPlaced < MINES) { let r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS); if (!grid[r][c].mine) { grid[r][c].mine = true; minesPlaced++; } }
            for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) {
                if (!grid[r][c].mine) {
                    let count = 0; for (let i = -1; i <= 1; i++) { for (let j = -1; j <= 1; j++) { if (r+i >= 0 && r+i < ROWS && c+j >= 0 && c+j < COLS && grid[r+i][c+j].mine) count++; } }
                    grid[r][c].neighborMines = count;
                }
            }}
        }

        function renderBoard() {
            boardEl.innerHTML = '';
            for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) {
                const cellEl = document.createElement('div'); cellEl.className = 'ms-cell'; cellEl.id = `ms-${r}-${c}`;
                cellEl.addEventListener('click', () => handleLeftClick(r, c)); cellEl.addEventListener('contextmenu', (e) => { e.preventDefault(); handleRightClick(r, c); });
                boardEl.appendChild(cellEl);
            }}
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
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return; const cell = grid[r][c]; if (cell.revealed || cell.flagged || cell.mine) return;
            cell.revealed = true; revealedCount++; const el = document.getElementById(`ms-${r}-${c}`); el.classList.add('revealed');
            if (cell.neighborMines > 0) { el.textContent = cell.neighborMines; el.dataset.num = cell.neighborMines; } else { for (let i = -1; i <= 1; i++) { for (let j = -1; j <= 1; j++) { floodFill(r + i, c + j); } } }
        }

        function revealAllMines() {
            for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { if (grid[r][c].mine) { const el = document.getElementById(`ms-${r}-${c}`); el.classList.add('revealed', 'mine'); el.textContent = getTex().mine; } }}
        }

        function checkWin() {
            if (revealedCount === (ROWS * COLS) - MINES) {
                gameOver = true; stats.w++; AudioEngine.play('win'); flagsEl.textContent = '0';
                statusEl.textContent = getTranslation('msWin'); statusEl.className = 'game-status win'; statusEl.style.display = 'block'; restartBtn.style.display = 'block';
                for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { if (grid[r][c].mine) document.getElementById(`ms-${r}-${c}`).textContent = getTex().flag; } }
            }
        }

        restartBtn.addEventListener('click', () => { AudioEngine.play('pop'); gameOver = false; flagsLeft = MINES; revealedCount = 0; statusEl.style.display = 'none'; restartBtn.style.display = 'none'; createBoard(); renderBoard(); });

        createBoard(); renderBoard(); updateTexts(); return { updateTexts, getStats: () => stats };
    }

    // =========================================
    // 10. ИГРА 4: ЗМЕЙКА (Neon Snake)
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

        const canvas = document.getElementById("snakeCanvas"), ctx = canvas.getContext("2d");
        const scoreElement = document.getElementById("snakeScore"), highScoreElement = document.getElementById("snakeHighScore"), gameOverScreen = document.getElementById("snakeGameOver"), finalScoreElement = document.getElementById("snakeFinalScore");
        const gridSize = 15, tileCount = canvas.width / gridSize;

        let snake = [], snakeLength = 4, headX = 10, headY = 10, xVelocity = 0, yVelocity = 0, appleX = 5, appleY = 5, score = 0;
        let highScore = localStorage.getItem("snakeHighScore") || 0; highScoreElement.innerText = highScore;
        let gameLoop, gameSpeed = 120, snakeColor = "#00ffcc", foodColor = "#ff0055";

        function updateThemeColors() {
            const styles = getComputedStyle(document.documentElement);
            snakeColor = styles.getPropertyValue('--accent-color').trim() || "#00ffcc"; foodColor = styles.getPropertyValue('--score-lose').trim() || "#ff0055";
        }

        function startGame() {
            snake = []; snakeLength = 4; headX = 10; headY = 10; xVelocity = 0; yVelocity = 0; score = 0; gameSpeed = 120;
            scoreElement.innerText = score; gameOverScreen.style.display = "none"; placeApple(); clearTimeout(gameLoop); updateThemeColors(); drawGame();
        }

        function drawGame() {
            headX += xVelocity; headY += yVelocity;
            if (isGameOver()) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height); checkAppleCollision(); drawApple(); drawSnake();
            if (score > 5) gameSpeed = 100; if (score > 10) gameSpeed = 80; if (score > 20) gameSpeed = 60;
            gameLoop = setTimeout(drawGame, gameSpeed);
        }

        function isGameOver() {
            let over = false; if (yVelocity === 0 && xVelocity === 0) return false;
            if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) over = true;
            for (let i = 0; i < snake.length; i++) { if (snake[i].x === headX && snake[i].y === headY) { over = true; break; } }
            if (over) {
                AudioEngine.play('lose'); gameOverScreen.style.display = "flex"; finalScoreElement.innerText = score;
                if (score > highScore) { highScore = score; localStorage.setItem("snakeHighScore", highScore); highScoreElement.innerText = highScore; }
            }
            return over;
        }

        function drawSnake() {
            ctx.globalAlpha = 0.7; ctx.fillStyle = snakeColor; ctx.shadowBlur = 10; ctx.shadowColor = snakeColor;
            for (let i = 0; i < snake.length; i++) { ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2); }
            ctx.globalAlpha = 1.0; snake.push({ x: headX, y: headY }); while (snake.length > snakeLength) snake.shift();
            ctx.fillStyle = snakeColor; ctx.fillRect(headX * gridSize, headY * gridSize, gridSize - 2, gridSize - 2); ctx.shadowBlur = 0;
        }

        function drawApple() {
            ctx.fillStyle = foodColor; ctx.shadowBlur = 15; ctx.shadowColor = foodColor; ctx.beginPath();
            ctx.arc(appleX * gridSize + gridSize/2, appleY * gridSize + gridSize/2, (gridSize - 2)/2, 0, 2 * Math.PI); ctx.fill(); ctx.shadowBlur = 0;
        }

        function checkAppleCollision() { if (appleX === headX && appleY == headY) { AudioEngine.play('pop'); placeApple(); snakeLength++; score++; scoreElement.innerText = score; } }
        function placeApple() {
            let valid = false; while (!valid) {
                appleX = Math.floor(Math.random() * tileCount); appleY = Math.floor(Math.random() * tileCount); valid = true;
                for (let p of snake) { if (p.x === appleX && p.y === appleY) { valid = false; break; } }
                if(headX === appleX && headY === appleY) valid = false;
            }
        }

        function moveUp() { if (yVelocity == 1) return; yVelocity = -1; xVelocity = 0; }
        function moveDown() { if (yVelocity == -1) return; yVelocity = 1; xVelocity = 0; }
        function moveLeft() { if (xVelocity == 1) return; yVelocity = 0; xVelocity = -1; }
        function moveRight() { if (xVelocity == -1) return; yVelocity = 0; xVelocity = 1; }

        const restartBtnEl = document.getElementById('snakeRestartBtn');
        restartBtnEl.addEventListener('click', () => { AudioEngine.play('pop'); startGame(); });

        function handleKeyDown(event) {
            if (event.keyCode == 38 || event.key === 'w') moveUp(); if (event.keyCode == 40 || event.key === 's') moveDown();
            if (event.keyCode == 37 || event.key === 'a') moveLeft(); if (event.keyCode == 39 || event.key === 'd') moveRight();
        }
        document.body.addEventListener('keydown', handleKeyDown);

        startGame();
        return { updateTexts: () => updateLanguage(), updateThemeColors: () => updateThemeColors(), getStats: () => ({ w: score }), destroy: () => { clearTimeout(gameLoop); document.body.removeEventListener('keydown', handleKeyDown); } };
    }

    // =========================================
    // 11. ИГРА 5: ТЕТРИС (Tetris) - Улучшенный 3D + Правила
    // =========================================
    function initTetris() {
        gameContainer.innerHTML = `
            <div class="tetris-header">
                <div class="tetris-stats">
                    <span data-i18n="score">Score</span>: <strong id="tetris-score" style="color:var(--score-win);">0</strong> |
                    <span data-i18n="lines">Lines</span>: <strong id="tetris-lines" style="color:var(--text-muted);">0</strong> |
                    <span data-i18n="level">Level</span>: <strong id="tetris-level" style="color:var(--accent-color);">1</strong>
                </div>
            </div>
            <div class="tetris-layout">
                <div style="position: relative;">
                    <canvas id="tetris-canvas" width="240" height="400"></canvas>
                    
                    <div id="tetrisGameOver" style="position:absolute; top:0; left:0; width:100%; height:100%; background:var(--overlay-bg); display:none; flex-direction:column; justify-content:center; align-items:center; z-index:10; border-radius:10px;">
                        <h2 style="color:var(--score-lose); font-size: 24px; text-shadow:0 0 10px var(--score-lose); margin-bottom: 10px;" data-i18n="gameOver">GAME OVER!</h2>
                        <p style="font-weight: bold; margin-bottom: 15px;">Score: <span id="tetrisFinalScore">0</span></p>
                    </div>
                </div>
                
                <div class="tetris-sidebar">
                    <div class="next-piece-box">
                        <p data-i18n="nextPiece">Next:</p>
                        <canvas id="tetris-next" width="96" height="96"></canvas>
                    </div>
                    
                    <label class="retro-checkbox-label" style="margin-top: 10px; font-size: 0.85rem;">
                        <input type="checkbox" id="tetris-rotation-toggle" checked>
                        <span data-i18n="allowRotation">Вращение фигур</span>
                    </label>

                    <button id="tetris-start-btn" class="btn-small" style="width:100%; padding:10px; margin-top:10px;" data-i18n="restart">Start</button>
                    <button id="tetris-pause-btn" class="btn-small" style="width:100%; padding:10px; margin-top:10px;" data-i18n="pause" disabled>Pause</button>

                    <details class="tetris-rules">
                        <summary data-i18n="rulesTitle">Правила</summary>
                        <div class="rules-content">
                            <p><strong data-i18n="rule1Title">Цель:</strong> <span data-i18n="rule1Desc">...</span></p>
                            <p><strong data-i18n="rule2Title">Управление:</strong> <span data-i18n="rule2Desc">...</span></p>
                            <p><strong data-i18n="rule3Title">Очки:</strong> <span data-i18n="rule3Desc">...</span></p>
                            <p><strong data-i18n="rule4Title">Прогрессия:</strong> <span data-i18n="rule4Desc">...</span></p>
                            <p><strong data-i18n="rule5Title">Game Over:</strong> <span data-i18n="rule5Desc">...</span></p>
                        </div>
                    </details>
                </div>
            </div>
        `;
        updateLanguage();

        const canvas = document.getElementById('tetris-canvas');
        const context = canvas.getContext('2d');
        const nextCanvas = document.getElementById('tetris-next');
        const nextContext = nextCanvas.getContext('2d');
        const gameOverScreen = document.getElementById('tetrisGameOver');
        const finalScoreEl = document.getElementById('tetrisFinalScore');
        const rotationToggle = document.getElementById('tetris-rotation-toggle');

        const BLOCK_SIZE = 20; 
        const COLS = 12;
        const ROWS = 20;

        let arena = createMatrix(COLS, ROWS);

        const PIECES = {
            'T': [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
            'O': [[2, 2], [2, 2]],
            'L': [[0, 3, 0], [0, 3, 0], [0, 3, 3]],
            'J': [[0, 4, 0], [0, 4, 0], [4, 4, 0]],
            'I': [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]],
            'S': [[0, 6, 6], [6, 6, 0], [0, 0, 0]],
            'Z': [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
        };

        const COLORS = [null, '#9b59b6', '#f1c40f', '#e67e22', '#3498db', '#1abc9c', '#2ecc71', '#e74c3c'];

        const player = { pos: { x: 0, y: 0 }, matrix: null, nextMatrix: null, score: 0, lines: 0, level: 1 };

        let dropCounter = 0; let dropInterval = 1000; let lastTime = 0;
        let isGameOver = false; let isPaused = false; let animationId = null;

        function createMatrix(w, h) { const m = []; while (h--) m.push(new Array(w).fill(0)); return m; }

        function collide(arena, player) {
            const [m, o] = [player.matrix, player.pos];
            for (let y = 0; y < m.length; ++y) {
                for (let x = 0; x < m[y].length; ++x) {
                    if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
                }
            }
            return false;
        }

        function merge(arena, player) {
            player.matrix.forEach((row, y) => { row.forEach((val, x) => { if (val !== 0) arena[y + player.pos.y][x + player.pos.x] = val; }); });
        }

        function rotate(matrix, dir) {
            for (let y = 0; y < matrix.length; ++y) { for (let x = 0; x < y; ++x) { [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]; } }
            if (dir > 0) matrix.forEach(row => row.reverse()); else matrix.reverse();
        }

        function playerRotate(dir) {
            const pos = player.pos.x; let offset = 1; rotate(player.matrix, dir);
            while (collide(arena, player)) {
                player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1));
                if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; }
            }
            AudioEngine.play('move');
        }

        function playerDrop() {
            player.pos.y++;
            if (collide(arena, player)) {
                player.pos.y--; merge(arena, player); playerReset(); arenaSweep(); updateScoreUI();
            }
            dropCounter = 0;
        }

        function playerMove(offset) { player.pos.x += offset; if (collide(arena, player)) { player.pos.x -= offset; } else { AudioEngine.play('move'); } }

        function getRandomPiece() { const pieces = 'TJLOSZI'; const name = pieces[(pieces.length * Math.random()) | 0]; return PIECES[name]; }

        function playerReset() {
            if (!player.nextMatrix) player.nextMatrix = getRandomPiece();
            player.matrix = player.nextMatrix; player.nextMatrix = getRandomPiece();
            player.pos.y = 0; player.pos.x = ((COLS / 2) | 0) - ((player.matrix[0].length / 2) | 0);
            drawNextPiece();
            
            if (collide(arena, player)) {
                isGameOver = true; 
                cancelAnimationFrame(animationId); 
                AudioEngine.play('lose');
                finalScoreEl.innerText = player.score;
                gameOverScreen.style.display = 'flex';
            }
        }

        function arenaSweep() {
            let rowCount = 0;
            outer: for (let y = arena.length - 1; y >= 0; --y) {
                for (let x = 0; x < arena[y].length; ++x) { if (arena[y][x] === 0) continue outer; }
                const row = arena.splice(y, 1)[0].fill(0); arena.unshift(row); ++y; rowCount++;
            }
            if (rowCount > 0) {
                AudioEngine.play('win');
                const lineScores = [0, 40, 100, 300, 1200];
                player.score += lineScores[rowCount] * player.level; player.lines += rowCount;
                player.level = Math.floor(player.lines / 10) + 1;
                dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
            } else { AudioEngine.play('pop'); }
        }

        function drawGrid() {
            context.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            context.lineWidth = 1;
            for (let y = 0; y <= canvas.height; y += BLOCK_SIZE) {
                context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke();
            }
            for (let x = 0; x <= canvas.width; x += BLOCK_SIZE) {
                context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke();
            }
        }

        function drawMatrix(matrix, offset, ctx) {
            matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        const px = (x + offset.x) * BLOCK_SIZE;
                        const py = (y + offset.y) * BLOCK_SIZE;
                        
                        ctx.fillStyle = COLORS[value];
                        ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
                        
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.fillRect(px, py, BLOCK_SIZE, 3);
                        ctx.fillRect(px, py, 3, BLOCK_SIZE);
                        
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                        ctx.fillRect(px, py + BLOCK_SIZE - 3, BLOCK_SIZE, 3);
                        ctx.fillRect(px + BLOCK_SIZE - 3, py, 3, BLOCK_SIZE);
                    }
                });
            });
        }

        function drawGhost() {
            const ghost = { matrix: player.matrix, pos: { x: player.pos.x, y: player.pos.y } };
            while (!collide(arena, ghost)) { ghost.pos.y++; }
            ghost.pos.y--; 
            
            context.globalAlpha = 0.2;
            drawMatrix(ghost.matrix, ghost.pos, context);
            context.globalAlpha = 1.0;
        }

        function draw() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            drawMatrix(arena, { x: 0, y: 0 }, context);
            if (player.matrix) { drawGhost(); drawMatrix(player.matrix, player.pos, context); }
        }

        function drawNextPiece() {
            nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
            if (player.nextMatrix) {
                const offsetX = (nextCanvas.width / BLOCK_SIZE - player.nextMatrix[0].length) / 2;
                const offsetY = (nextCanvas.height / BLOCK_SIZE - player.nextMatrix.length) / 2;
                drawMatrix(player.nextMatrix, { x: offsetX, y: offsetY }, nextContext);
            }
        }

        function update(time = 0) {
            if (isGameOver || isPaused) return;
            const deltaTime = time - lastTime; lastTime = time;
            dropCounter += deltaTime; if (dropCounter > dropInterval) playerDrop();
            draw(); animationId = requestAnimationFrame(update);
        }

        function updateScoreUI() {
            document.getElementById('tetris-score').innerText = player.score;
            document.getElementById('tetris-lines').innerText = player.lines;
            document.getElementById('tetris-level').innerText = player.level;
        }

        function keydownHandler(event) {
            if (isGameOver || isPaused || !player.matrix) return;
            if (event.key === 'ArrowLeft' || event.key === 'a') playerMove(-1);
            else if (event.key === 'ArrowRight' || event.key === 'd') playerMove(1);
            else if (event.key === 'ArrowDown' || event.key === 's') playerDrop();
            else if (event.key === 'ArrowUp' || event.key === 'w') {
                // Проверка на то, включено ли вращение фигур
                if (rotationToggle && rotationToggle.checked) {
                    playerRotate(1);
                }
            }
            else if (event.key === ' ') {
                while (!collide(arena, player)) { player.pos.y++; }
                player.pos.y--; merge(arena, player); playerReset(); arenaSweep(); updateScoreUI();
            }
        }
        document.addEventListener('keydown', keydownHandler);

        document.getElementById('tetris-start-btn')?.addEventListener('click', () => {
            AudioEngine.play('pop');
            arena = createMatrix(COLS, ROWS); player.score = 0; player.lines = 0; player.level = 1; dropInterval = 1000;
            isGameOver = false; isPaused = false; gameOverScreen.style.display = 'none'; 
            updateScoreUI(); playerReset(); lastTime = performance.now();
            cancelAnimationFrame(animationId); update(); document.getElementById('tetris-pause-btn').disabled = false;
        });

        document.getElementById('tetris-pause-btn')?.addEventListener('click', () => {
            if (isGameOver) return;
            AudioEngine.play('pop'); isPaused = !isPaused;
            document.getElementById('tetris-pause-btn').innerText = isPaused ? getTranslation('resume') : getTranslation('pause');
            if (!isPaused) { lastTime = performance.now(); update(); }
        });

        return {
            updateTexts: () => updateLanguage(),
            getStats: () => ({ w: player.score }),
            destroy: () => { cancelAnimationFrame(animationId); document.removeEventListener('keydown', keydownHandler); }
        };
    }

    document.addEventListener('DOMContentLoaded', initApp);
})();