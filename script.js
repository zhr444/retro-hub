(function() {
    'use strict';

    const API_BASE = 'http://localhost:5103/api';
    const HUB_URL = 'http://localhost:5103/gamehub'; 

    // Глобальная переменная для анимаций
    window.animEnabled = localStorage.getItem('hub_anim') !== 'off';

    // Вспомогательная функция для тряски экрана (Juice effect)
    function applyShake(ctx, shakeAmount) {
        if (shakeAmount > 0 && window.animEnabled) {
            ctx.save();
            const dx = (Math.random() - 0.5) * shakeAmount;
            const dy = (Math.random() - 0.5) * shakeAmount;
            ctx.translate(dx, dy);
            return true;
        }
        return false;
    }

    // =========================================
    // 1. АУДИО И МУЗЫКАЛЬНЫЙ ДВИЖОК
    // =========================================
    const AudioEngine = {
        ctx: null,
        enabled: localStorage.getItem('hub_sound') !== 'off',
        
        // Музыка
        bgmCtx: null,
        musicEnabled: localStorage.getItem('hub_music') !== 'off',
        isPlayingBGM: false,
        bgmTimeout: null,
        
        init: function() {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') this.ctx.resume();
        },
        toggleSound: function() {
            this.enabled = !this.enabled; localStorage.setItem('hub_sound', this.enabled ? 'on' : 'off'); return this.enabled;
        },
        toggleMusic: function() {
            this.musicEnabled = !this.musicEnabled;
            localStorage.setItem('hub_music', this.musicEnabled ? 'on' : 'off');
            if (this.musicEnabled) this.playBGM(); else this.stopBGM();
            return this.musicEnabled;
        },
        playBGM: function() {
            if (!this.musicEnabled) return;
            if (!this.bgmCtx) this.bgmCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.bgmCtx.state === 'suspended') this.bgmCtx.resume();
            if (this.isPlayingBGM) return;

            this.isPlayingBGM = true;
            // Ретро 8-битный бас
            const notes = [130.81, 196.00, 261.63, 196.00, 155.56, 196.00, 261.63, 196.00];
            let noteIdx = 0;

            const playNextNote = () => {
                if (!this.isPlayingBGM) return;
                const osc = this.bgmCtx.createOscillator();
                const gain = this.bgmCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = notes[noteIdx];
                
                osc.connect(gain);
                gain.connect(this.bgmCtx.destination);
                
                const now = this.bgmCtx.currentTime;
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.02, now + 0.05); // Плавное нарастание (низкая громкость)
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Плавное затухание
                
                osc.start(now);
                osc.stop(now + 0.3);
                
                noteIdx = (noteIdx + 1) % notes.length;
                this.bgmTimeout = setTimeout(playNextNote, 300);
            };
            playNextNote();
        },
        stopBGM: function() {
            this.isPlayingBGM = false;
            if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
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
            } else if (type === 'card') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
                gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now); osc.stop(now + 0.05);
            } else if (type === 'shoot') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(900, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            }
        }
    };

    // =========================================
    // 2. СЛОВАРИ (МУЛЬТИЯЗЫЧНОСТЬ)
    // =========================================
    const translations = {
        en: {
            hubTitle: "🎮 Retro Hub", chooseGame: "Choose a game:", backBtn: "⬅ Back to Menu", restart: "Restart", cancel: "Cancel", pause: "Pause", resume: "Resume", moves: "Moves", time: "Time",
            tictactoe: "Tic-Tac-Toe", tictactoeDesc: "Play against computer or online", rps: "Rock-Paper-Scissors", rpsDesc: "Play against computer",
            minesweeper: "Minesweeper", minesweeperDesc: "Classic logic puzzle", turnX: "Your turn (X)", turnO: "Computer's turn (O)", compThinking: "Computer is thinking...",
            winX: "You Win! 🎉", winO: "Computer Wins! 😢", draw: "It's a draw! 🤝", chooseWeapon: "Choose your weapon:", win: "You Win! 🎉", lose: "You Lose! 😢", tie: "It's a Tie! 🤝",
            wins: "Wins", losses: "Losses", draws: "Draws", easy: "vs PC (Easy)", hard: "vs PC (Hard)", online: "🌐 Play Online", searching: "Searching for opponent...", opponentLeft: "Opponent left! You win! 🎉", waitingTurn: "Opponent's turn", yourTurn: "Your turn!",
            flags: "Flags:", msWin: "You cleared the minefield! 🎉", msLose: "Boom! You hit a mine 💥", toggleMC: "MC Theme: OFF", toggleMCon: "MC Theme: ON",
            leaderboard: "🏆 Top Players", loading: "Loading...", noRecords: "No records yet.",
            snake: "Snake", snakeDesc: "Classic arcade", score: "Score", gameOver: "GAME OVER!",
            tetris: "Tetris", tetrisDesc: "Classic block puzzle", nextPiece: "Next:", lines: "Lines", level: "Level", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate, accelerate down, or Hard Drop (Space).", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.",
            solitaire: "Solitaire", solitaireDesc: "Classic card game", solWin: "You Solved It! 🎉", solLose: "No more moves! Game Over 💀",
            solRule1Title: "Goal:", solRule1Desc: "Move all cards to the 4 foundations (top right) from Ace to King by suit.", solRule2Title: "Tableau:", solRule2Desc: "Build down in alternating colors.", solRule3Title: "Stock:", solRule3Desc: "Click the deck to draw.", solRule4Title: "Quick Move:", solRule4Desc: "Double-click to foundation.",
            tanks: "Battle City", tanksDesc: "Classic 1985 tank combat", tanksKills: "Enemies:", tanksBase: "Base:", tanksBaseAlive: "SECURE 🛡️", tanksBaseDead: "DESTROYED 💥",
            tankRule1Title: "Goal:", tankRule1Desc: "Destroy all enemy tanks and defend your base (Eagle 🦅).", tankRule2Title: "Controls:", tankRule2Desc: "WASD / Arrows to move, Space to shoot.", tankRule3Title: "Blocks:", tankRule3Desc: "Brick walls can be destroyed, steel walls are unbreakable."
        },
        ru: {
            hubTitle: "🎮 Ретро Хаб", chooseGame: "Выберите игру:", backBtn: "⬅ Назад в меню", restart: "Заново", cancel: "Отмена", pause: "Пауза", resume: "Продолжить", moves: "Ходы", time: "Время",
            tictactoe: "Крестики-нолики", tictactoeDesc: "Игра против ПК или онлайн", rps: "Камень-Ножницы-Бумага", rpsDesc: "Игра против ПК",
            minesweeper: "Сапер", minesweeperDesc: "Классическая головоломка", turnX: "Твой ход (X)", turnO: "Ход компьютера (O)", compThinking: "Компьютер думает...",
            winX: "Ты победил! 🎉", winO: "Компьютер победил! 😢", draw: "Ничья! 🤝", chooseWeapon: "Сделай выбор:", win: "Ты победил! 🎉", lose: "Ты проиграл! 😢", tie: "Ничья! 🤝",
            wins: "Победы", losses: "Поражения", draws: "Ничьи", easy: "С ПК (Легко)", hard: "С ПК (Сложно)", online: "🌐 Играть онлайн", searching: "Поиск противника...", opponentLeft: "Противник вышел! Победа! 🎉", waitingTurn: "Ход противника", yourTurn: "Ваш ход!",
            flags: "Флаги:", msWin: "Минное поле чисто! 🎉", msLose: "Бум! Ты подорвался 💥", toggleMC: "Тема MC: ВЫКЛ", toggleMCon: "Тема MC: ВКЛ",
            leaderboard: "🏆 Таблица рекордов", loading: "Загрузка...", noRecords: "Рекордов пока нет.",
            snake: "Змейка", snakeDesc: "Классическая аркада", score: "Счет", gameOver: "ИГРА ОКОНЧЕНА!",
            tetris: "Тетрис", tetrisDesc: "Классическая головоломка", nextPiece: "Следующая:", lines: "Линии", level: "Уровень", allowRotation: "Вращение фигур", rulesTitle: "Правила", rule1Title: "Цель:", rule1Desc: "Строить сплошные горизонтальные ряды из падающих блоков (тетромино).", rule2Title: "Управление:", rule2Desc: "Влево/вправо, вращение, ускорение падения или Hard Drop (Пробел).", rule3Title: "Очки:", rule3Desc: "Больше линий = больше очков. Максимум 4 линии («Тетрис»).", rule4Title: "Прогрессия:", rule4Desc: "Каждые 10 линий повышают уровень.", rule5Title: "Game Over:", rule5Desc: "Стакан заполнился доверху.",
            solitaire: "Пасьянс", solitaireDesc: "Косынка (Классика)", solWin: "Пасьянс сошелся! 🎉", solLose: "Нет ходов! Игра окончена 💀",
            solRule1Title: "Цель:", solRule1Desc: "Разложить все карты по мастям в 4 «Дома» (сверху справа) от Туза до Короля.", solRule2Title: "Стол:", solRule2Desc: "Карты кладутся по убыванию с чередованием цвета (красная на черную).", solRule3Title: "Колода:", solRule3Desc: "Клик по колоде (слева сверху) выдает новую карту.", solRule4Title: "Быстрый ход:", solRule4Desc: "Двойной клик по карте отправляет её в «Дом».",
            tanks: "Танчики (1985)", tanksDesc: "Классический Battle City", tanksKills: "Враги:", tanksBase: "Штаб:", tanksBaseAlive: "ЦЕЛ 🛡️", tanksBaseDead: "УНИЧТОЖЕН 💥",
            tankRule1Title: "Цель:", tankRule1Desc: "Уничтожить все танки противника и защитить штаб с Орлом 🦅.", tankRule2Title: "Управление:", tankRule2Desc: "Стрелки или WASD для движения, Пробел для выстрела.", tankRule3Title: "Блоки:", tankRule3Desc: "Кирпич разрушается выстрелом, стальные блоки непробиваемы."
        },
        es: { hubTitle: "🎮 Retro Hub", chooseGame: "Elige un juego:", backBtn: "⬅ Volver", restart: "Reiniciar", cancel: "Cancelar", pause: "Pausa", resume: "Reanudar", moves: "Mov.", time: "Tiempo", tictactoe: "Tres en raya", tictactoeDesc: "PC u online", rps: "Piedra, Papel, Tijera", rpsDesc: "Contra la PC", minesweeper: "Buscaminas", minesweeperDesc: "Puzle lógico", turnX: "Tu turno (X)", turnO: "Turno de PC (O)", compThinking: "Pensando...", winX: "¡Ganaste! 🎉", winO: "¡PC Gana! 😢", draw: "¡Empate! 🤝", chooseWeapon: "Elige tu arma:", win: "¡Ganaste! 🎉", lose: "¡Perdiste! 😢", tie: "¡Empate! 🤝", wins: "Victorias", losses: "Derrotas", draws: "Empates", easy: "PC (Fácil)", hard: "PC (Difícil)", online: "🌐 Online", searching: "Buscando...", opponentLeft: "Rival desconectado. ¡Ganas! 🎉", waitingTurn: "Turno del rival", yourTurn: "¡Tu turno!", flags: "Banderas:", msWin: "¡Limpiaste el campo! 🎉", msLose: "¡Boom! Mina 💥", toggleMC: "MC: OFF", toggleMCon: "MC: ON", leaderboard: "🏆 Mejores", loading: "Cargando...", noRecords: "Sin registros.", snake: "Serpiente", snakeDesc: "Arcade clásico", score: "Puntaje", gameOver: "¡TERMINADO!", tetris: "Tetris", tetrisDesc: "Puzle de bloques", nextPiece: "Sig.:", lines: "Líneas", level: "Nivel", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate.", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.", solitaire: "Solitario", solitaireDesc: "Clásico", solWin: "¡Resuelto! 🎉", solLose: "¡Sin movimientos! 💀", solRule1Title: "Goal:", solRule1Desc: "Move to foundations Ace-King.", solRule2Title: "Tableau:", solRule2Desc: "Build down alt colors.", solRule3Title: "Stock:", solRule3Desc: "Click deck to draw.", solRule4Title: "Quick:", solRule4Desc: "Double-click to foundation.", tanks: "Battle City", tanksDesc: "Combate de tanques", tanksKills: "Enemigos:", tanksBase: "Base:", tanksBaseAlive: "A SALVO 🛡️", tanksBaseDead: "DESTRUIDA 💥", tankRule1Title: "Meta:", tankRule1Desc: "Destruye tanques y defiende la base.", tankRule2Title: "Controles:", tankRule2Desc: "WASD para moverte, Espacio para disparar.", tankRule3Title: "Bloques:", tankRule3Desc: "El ladrillo se rompe, el acero no." },
        fr: { hubTitle: "🎮 Retro Hub", chooseGame: "Choisissez:", backBtn: "⬅ Retour", restart: "Recommencer", cancel: "Annuler", pause: "Pause", resume: "Reprendre", moves: "Coups", time: "Temps", tictactoe: "Morpion", tictactoeDesc: "PC ou en ligne", rps: "Pierre-Papier-Ciseaux", rpsDesc: "Contre le PC", minesweeper: "Démineur", minesweeperDesc: "Jeu de logique", turnX: "A ton tour (X)", turnO: "Tour du PC (O)", compThinking: "Réfléchit...", winX: "Tu as gagné! 🎉", winO: "Le PC a gagné! 😢", draw: "Match nul! 🤝", chooseWeapon: "Arme:", win: "Gagné! 🎉", lose: "Perdu! 😢", tie: "Égalité! 🤝", wins: "Victoires", losses: "Défaites", draws: "Nuls", easy: "PC (Facile)", hard: "PC (Difficile)", online: "🌐 En ligne", searching: "Recherche...", opponentLeft: "Adversaire parti! Gagné! 🎉", waitingTurn: "Tour de l'adversaire", yourTurn: "A ton tour!", flags: "Drapeaux:", msWin: "Champ déminé! 🎉", msLose: "Boom! 💥", toggleMC: "MC: OFF", toggleMCon: "MC: ON", leaderboard: "🏆 Meilleurs", loading: "Chargement...", noRecords: "Aucun enregistrement.", snake: "Serpent", snakeDesc: "Arcade", score: "Score", gameOver: "FIN!", tetris: "Tetris", tetrisDesc: "Puzzle de blocs", nextPiece: "Suiv:", lines: "Lignes", level: "Niveau", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate.", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.", solitaire: "Solitaire", solitaireDesc: "Classique", solWin: "Gagné! 🎉", solLose: "Plus de coups! 💀", solRule1Title: "Goal:", solRule1Desc: "Move to foundations Ace-King.", solRule2Title: "Tableau:", solRule2Desc: "Build down alt colors.", solRule3Title: "Stock:", solRule3Desc: "Click deck to draw.", solRule4Title: "Quick:", solRule4Desc: "Double-click to foundation.", tanks: "Battle City", tanksDesc: "Combat de chars", tanksKills: "Ennemis:", tanksBase: "Base:", tanksBaseAlive: "SÉCURISÉE 🛡️", tanksBaseDead: "DÉTRUITE 💥", tankRule1Title: "But:", tankRule1Desc: "Détruisez les chars et défendez la base.", tankRule2Title: "Contrôles:", tankRule2Desc: "WASD pour bouger, Espace pour tirer.", tankRule3Title: "Blocs:", tankRule3Desc: "La brique casse, l'acier non." },
        "zh-CN": { hubTitle: "🎮 复古游戏中心", chooseGame: "选择游戏:", backBtn: "⬅ 返回", restart: "重新开始", cancel: "取消", pause: "暂停", resume: "继续", moves: "步数", time: "时间", tictactoe: "井字棋", tictactoeDesc: "单机或联机", rps: "石头剪刀布", rpsDesc: "人机对战", minesweeper: "扫雷", minesweeperDesc: "经典逻辑", turnX: "你的回合 (X)", turnO: "电脑回合 (O)", compThinking: "思考中...", winX: "你赢了! 🎉", winO: "电脑赢了! 😢", draw: "平局! 🤝", chooseWeapon: "选择武器:", win: "你赢了! 🎉", lose: "你输了! 😢", tie: "平局! 🤝", wins: "胜", losses: "负", draws: "平", easy: "简单", hard: "困难", online: "🌐 联机对战", searching: "寻找对手...", opponentLeft: "对手退出! 你赢了! 🎉", waitingTurn: "等待对手...", yourTurn: "你的回合!", flags: "旗帜:", msWin: "过关! 🎉", msLose: "砰！💥", toggleMC: "MC: 关", toggleMCon: "MC: 开", leaderboard: "🏆 排行榜", loading: "加载中...", noRecords: "暂无记录.", snake: "贪吃蛇", snakeDesc: "街机", score: "分数", gameOver: "游戏结束!", tetris: "俄罗斯方块", tetrisDesc: "经典方块", nextPiece: "下一个:", lines: "行数", level: "等级", allowRotation: "旋转", rulesTitle: "规则", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate.", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.", solitaire: "纸牌", solitaireDesc: "经典", solWin: "过关! 🎉", solLose: "没有移动了! 💀", solRule1Title: "Goal:", solRule1Desc: "Move to foundations Ace-King.", solRule2Title: "Tableau:", solRule2Desc: "Build down alt colors.", solRule3Title: "Stock:", solRule3Desc: "Click deck to draw.", solRule4Title: "Quick:", solRule4Desc: "Double-click to foundation.", tanks: "坦克大战", tanksDesc: "经典坦克战斗", tanksKills: "敌军:", tanksBase: "基地:", tanksBaseAlive: "安全 🛡️", tanksBaseDead: "被毁 💥", tankRule1Title: "目标:", tankRule1Desc: "消灭所有坦克并保卫老鹰基地。", tankRule2Title: "操作:", tankRule2Desc: "WASD移动，空格射击。", tankRule3Title: "障碍:", tankRule3Desc: "砖块可破坏，铁块不可破坏。" },
        "zh-TW": { hubTitle: "🎮 復古遊戲中心", chooseGame: "選擇遊戲:", backBtn: "⬅ 返回", restart: "重新開始", cancel: "取消", pause: "暫停", resume: "繼續", moves: "步數", time: "時間", tictactoe: "井字棋", tictactoeDesc: "單機或聯機", rps: "石頭剪刀布", rpsDesc: "人機對戰", minesweeper: "踩地雷", minesweeperDesc: "經典邏輯", turnX: "你的回合 (X)", turnO: "電腦回合 (O)", compThinking: "思考中...", winX: "你贏了! 🎉", winO: "電腦贏了! 😢", draw: "平手! 🤝", chooseWeapon: "選擇武器:", win: "你贏了! 🎉", lose: "你輸了! 😢", tie: "平手! 🤝", wins: "勝", losses: "負", draws: "平", easy: "簡單", hard: "困難", online: "🌐 聯機對戰", searching: "尋找對手...", opponentLeft: "對手退出! 你贏了! 🎉", waitingTurn: "等待對手...", yourTurn: "你的回合!", flags: "旗幟:", msWin: "過關! 🎉", msLose: "砰！💥", toggleMC: "MC: 關", toggleMCon: "MC: 開", leaderboard: "🏆 排行榜", loading: "加載中...", noRecords: "暫無記錄.", snake: "貪吃蛇", snakeDesc: "街機", score: "分數", gameOver: "遊戲結束!", tetris: "俄羅斯方塊", tetrisDesc: "經典方塊", nextPiece: "下一個:", lines: "行數", level: "等級", allowRotation: "旋轉", rulesTitle: "規則", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate.", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.", solitaire: "接龍", solitaireDesc: "經典", solWin: "過關! 🎉", solLose: "沒有移動了! 💀", solRule1Title: "Goal:", solRule1Desc: "Move to foundations Ace-King.", solRule2Title: "Tableau:", solRule2Desc: "Build down alt colors.", solRule3Title: "Stock:", solRule3Desc: "Click deck to draw.", solRule4Title: "Quick:", solRule4Desc: "Double-click to foundation.", tanks: "坦克大戰", tanksDesc: "經典坦克戰鬥", tanksKills: "敵軍:", tanksBase: "基地:", tanksBaseAlive: "安全 🛡️", tanksBaseDead: "被毀 💥", tankRule1Title: "目標:", tankRule1Desc: "消滅所有坦克並保衛老鷹基地。", tankRule2Title: "操作:", tankRule2Desc: "WASD移動，空格射擊。", tankRule3Title: "障礙:", tankRule3Desc: "磚塊可破壞，鐵塊不可破壞。" },
        kk: { hubTitle: "🎮 Ретро Хаб", chooseGame: "Ойынды таңдаңыз:", backBtn: "⬅ Қайту", restart: "Қайта бастау", cancel: "Болдырмау", pause: "Үзіліс", resume: "Жалғастыру", moves: "Қадам", time: "Уақыт", tictactoe: "Крестик-нолик", tictactoeDesc: "ДК немесе онлайн", rps: "Тас-Қайшы-Қағаз", rpsDesc: "ДК қарсы", minesweeper: "Сапер", minesweeperDesc: "Логикалық", turnX: "Сенің жүрісің (X)", turnO: "ДК жүрісі (O)", compThinking: "Ойлануда...", winX: "Жеңдің! 🎉", winO: "ДК жеңді! 😢", draw: "Тең! 🤝", chooseWeapon: "Таңдау жаса:", win: "Жеңдің! 🎉", lose: "Ұтылдың! 😢", tie: "Тең! 🤝", wins: "Жеңістер", losses: "Жеңілістер", draws: "Тең", easy: "Оңай", hard: "Қиын", online: "🌐 Онлайн", searching: "Іздеу...", opponentLeft: "Қарсылас шықты! 🎉", waitingTurn: "Қарсылас жүрісі", yourTurn: "Сенің жүрісің!", flags: "Жалаулар:", msWin: "Тазарттың! 🎉", msLose: "Бум! 💥", toggleMC: "MC: ӨШУЛІ", toggleMCon: "MC: ҚОСУЛЫ", leaderboard: "🏆 Рекордтар", loading: "Жүктелуде...", noRecords: "Жазбалар жоқ.", snake: "Жылан", snakeDesc: "Аркада", score: "Есеп", gameOver: "АЯҚТАЛДЫ!", tetris: "Тетрис", tetrisDesc: "Блоктар", nextPiece: "Келесі:", lines: "Жолдар", level: "Деңгей", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate.", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.", solitaire: "Пасьянс", solitaireDesc: "Карта", solWin: "Жеңдің! 🎉", solLose: "Қадам жоқ! 💀", solRule1Title: "Goal:", solRule1Desc: "Move to foundations Ace-King.", solRule2Title: "Tableau:", solRule2Desc: "Build down alt colors.", solRule3Title: "Stock:", solRule3Desc: "Click deck to draw.", solRule4Title: "Quick:", solRule4Desc: "Double-click to foundation.", tanks: "Танктер", tanksDesc: "Battle City", tanksKills: "Жаулар:", tanksBase: "Штаб:", tanksBaseAlive: "БҮТІН 🛡️", tanksBaseDead: "ҚИРАДЫ 💥", tankRule1Title: "Мақсат:", tankRule1Desc: "Барлық танктерді жойып, штабты қорғау.", tankRule2Title: "Басқару:", tankRule2Desc: "WASD қозғалу, Бос орын ату.", tankRule3Title: "Блоктар:", tankRule3Desc: "Кірпіш бұзылады, темір бұзылмайды." },
        be: { hubTitle: "🎮 Рэтра Хаб", chooseGame: "Выберыце:", backBtn: "⬅ Назад", restart: "Нанова", cancel: "Адмена", pause: "Паўза", resume: "Працягнуць", moves: "Хады", time: "Час", tictactoe: "Крыжыкі-нолікі", tictactoeDesc: "ПК або анлайн", rps: "Камень-Нажніцы-Папера", rpsDesc: "Супраць ПК", minesweeper: "Сапёр", minesweeperDesc: "Галаваломка", turnX: "Твой ход (X)", turnO: "Ход ПК (O)", compThinking: "Думае...", winX: "Перамог! 🎉", winO: "ПК перамог! 😢", draw: "Нічыя! 🤝", chooseWeapon: "Выбар:", win: "Перамог! 🎉", lose: "Прайграў! 😢", tie: "Нічыя! 🤝", wins: "Перамогі", losses: "Паражэнні", draws: "Нічыі", easy: "Лёгка", hard: "Складана", online: "🌐 Анлайн", searching: "Пошук...", opponentLeft: "Праціўнік выйшаў! 🎉", waitingTurn: "Ход праціўніка", yourTurn: "Твой ход!", flags: "Сцяжкі:", msWin: "Чыста! 🎉", msLose: "Бум! 💥", toggleMC: "MC: ВЫКЛ", toggleMCon: "MC: УКЛ", leaderboard: "🏆 Рэкорды", loading: "Загрузка...", noRecords: "Няма рэкордаў.", snake: "Змейка", snakeDesc: "Аркада", score: "Лік", gameOver: "СКОНЧАНА!", tetris: "Тэтрыс", tetrisDesc: "Галаваломка", nextPiece: "Наступная:", lines: "Лініі", level: "Узровень", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate.", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.", solitaire: "Пасьянс", solitaireDesc: "Карты", solWin: "Перамога! 🎉", solLose: "Няма хадоў! 💀", solRule1Title: "Goal:", solRule1Desc: "Move to foundations Ace-King.", solRule2Title: "Tableau:", solRule2Desc: "Build down alt colors.", solRule3Title: "Stock:", solRule3Desc: "Click deck to draw.", solRule4Title: "Quick:", solRule4Desc: "Double-click to foundation.", tanks: "Танчыкі", tanksDesc: "Battle City", tanksKills: "Ворагі:", tanksBase: "Штаб:", tanksBaseAlive: "ЦЭЛЫ 🛡️", tanksBaseDead: "ЗНІШЧАНЫ 💥", tankRule1Title: "Мэта:", tankRule1Desc: "Знішчыць танкі і абараніць штаб.", tankRule2Title: "Кіраванне:", tankRule2Desc: "WASD рух, Прабел стрэл.", tankRule3Title: "Блокі:", tankRule3Desc: "Цэгла разбураецца, сталь не." },
        uk: { hubTitle: "🎮 Ретро Хаб", chooseGame: "Оберіть гру:", backBtn: "⬅ Назад", restart: "Заново", cancel: "Скасувати", pause: "Пауза", resume: "Продовжити", moves: "Ходи", time: "Час", tictactoe: "Хрестики-нулики", tictactoeDesc: "ПК або онлайн", rps: "Камінь-Ножиці-Папір", rpsDesc: "Проти ПК", minesweeper: "Сапер", minesweeperDesc: "Головоломка", turnX: "Твій хід (X)", turnO: "Хід ПК (O)", compThinking: "Думає...", winX: "Перемога! 🎉", winO: "ПК переміг! 😢", draw: "Нічия! 🤝", chooseWeapon: "Вибір:", win: "Перемога! 🎉", lose: "Поразка! 😢", tie: "Нічия! 🤝", wins: "Перемоги", losses: "Поразки", draws: "Нічиї", easy: "Легко", hard: "Складно", online: "🌐 Онлайн", searching: "Пошук...", opponentLeft: "Суперник вийшов! 🎉", waitingTurn: "Хід суперника", yourTurn: "Твій хід!", flags: "Прапорці:", msWin: "Чисто! 🎉", msLose: "Бум! 💥", toggleMC: "MC: ВИМК", toggleMCon: "MC: УВІМК", leaderboard: "🏆 Рекорди", loading: "Завантаження...", noRecords: "Немає записів.", snake: "Змійка", snakeDesc: "Аркада", score: "Рахунок", gameOver: "КІНЕЦЬ!", tetris: "Тетріс", tetrisDesc: "Головоломка", nextPiece: "Наступна:", lines: "Лінії", level: "Рівень", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate.", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.", solitaire: "Пасьянс", solitaireDesc: "Карти", solWin: "Перемога! 🎉", solLose: "Немає ходів! 💀", solRule1Title: "Goal:", solRule1Desc: "Move to foundations Ace-King.", solRule2Title: "Tableau:", solRule2Desc: "Build down alt colors.", solRule3Title: "Stock:", solRule3Desc: "Click deck to draw.", solRule4Title: "Quick:", solRule4Desc: "Double-click to foundation.", tanks: "Танчики", tanksDesc: "Battle City", tanksKills: "Вороги:", tanksBase: "Штаб:", tanksBaseAlive: "ЦІЛИЙ 🛡️", tanksBaseDead: "ЗНИЩЕНИЙ 💥", tankRule1Title: "Мета:", tankRule1Desc: "Знищити танки та захистити штаб.", tankRule2Title: "Керування:", tankRule2Desc: "WASD рух, Пробіл постріл.", tankRule3Title: "Блоки:", tankRule3Desc: "Цегла ламається, сталь ні." },
        uz: { hubTitle: "🎮 Retro Xab", chooseGame: "Tanlang:", backBtn: "⬅ Orqaga", restart: "Qayta", cancel: "Bekor qilish", pause: "Pauza", resume: "Davom etish", moves: "Yurishlar", time: "Vaqt", tictactoe: "Tik-tak-toe", tictactoeDesc: "PK yoki onlayn", rps: "Tosh-Qaychi-Qog'oz", rpsDesc: "PK ga qarshi", minesweeper: "Sapyol", minesweeperDesc: "Boshqotirma", turnX: "Siz (X)", turnO: "PK (O)", compThinking: "O'ylamoqda...", winX: "Yutdingiz! 🎉", winO: "PK yutdi! 😢", draw: "Durang! 🤝", chooseWeapon: "Tanlov:", win: "Yutdingiz! 🎉", lose: "Yutqazdingiz! 😢", tie: "Durang! 🤝", wins: "G'alaba", losses: "Mag'lubiyat", draws: "Durang", easy: "Oson", hard: "Qiyin", online: "🌐 Onlayn", searching: "Qidirilmoqda...", opponentLeft: "Raqib chiqdi! 🎉", waitingTurn: "Raqib navbati", yourTurn: "Sizning navbatingiz!", flags: "Bayroqlar:", msWin: "Tozalandi! 🎉", msLose: "Bum! 💥", toggleMC: "MC: O'CHIQ", toggleMCon: "MC: YONIQ", leaderboard: "🏆 Rekordlar", loading: "Yuklanmoqda...", noRecords: "Yozuvlar yo'q.", snake: "Ilon", snakeDesc: "Arkada", score: "Hisob", gameOver: "TUGADI!", tetris: "Tetris", tetrisDesc: "Boshqotirma", nextPiece: "Keyingisi:", lines: "Qatorlar", level: "Daraja", allowRotation: "Rotation", rulesTitle: "Rules", rule1Title: "Goal:", rule1Desc: "Build solid horizontal rows.", rule2Title: "Controls:", rule2Desc: "Move left/right, rotate.", rule3Title: "Scoring:", rule3Desc: "More lines = more points.", rule4Title: "Progression:", rule4Desc: "Every 10 lines increases level.", rule5Title: "Game Over:", rule5Desc: "Game ends when grid fills.", solitaire: "Pasyans", solitaireDesc: "Kartalar", solWin: "Yutdingiz! 🎉", solLose: "Yurishlar yo'q! 💀", solRule1Title: "Goal:", solRule1Desc: "Move to foundations Ace-King.", solRule2Title: "Tableau:", solRule2Desc: "Build down alt colors.", solRule3Title: "Stock:", solRule3Desc: "Click deck to draw.", solRule4Title: "Quick:", solRule4Desc: "Double-click to foundation.", tanks: "Tanklar", tanksDesc: "Battle City", tanksKills: "Dushmanlar:", tanksBase: "Shtab:", tanksBaseAlive: "XAVFSIZ 🛡️", tanksBaseDead: "VAYRON BO'LDI 💥", tankRule1Title: "Maqsad:", tankRule1Desc: "Tanklarni yo'q qilish va shtabni himoya qilish.", tankRule2Title: "Boshqaruv:", tankRule2Desc: "WASD harakat, Probel o'q otish.", tankRule3Title: "Bloklar:", tankRule3Desc: "G'isht sinadi, po'lat sinmaydi." }
    };

    // =========================================
    // 3. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И НАСТРОЙКИ
    // =========================================
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const soundToggle = document.getElementById('soundToggle');
    const musicToggle = document.getElementById('musicToggle');
    const animToggle = document.getElementById('animToggle');
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
        updateThemeIcon(); updateSoundIcon(); updateMusicIcon(); updateAnimIcon(); updateAuthBtn();
        langSelect.value = currentLang; colorSelect.value = currentAccent;
        updateLanguage(); updateClock(); setInterval(updateClock, 1000);
        initFavorites(); initDragAndDrop(); 

        // Инициализация фоновой музыки по первому клику пользователя (политика браузеров)
        const startAudio = () => {
            if (AudioEngine.musicEnabled && !AudioEngine.isPlayingBGM) AudioEngine.playBGM();
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
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
    
    function updateMusicIcon() { 
        musicToggle.querySelector('.music-icon').textContent = AudioEngine.musicEnabled ? '🎵' : '⏸️'; 
        musicToggle.style.opacity = AudioEngine.musicEnabled ? '1' : '0.5';
    }
    
    function updateAnimIcon() { 
        animToggle.querySelector('.anim-icon').textContent = window.animEnabled ? '✨' : '⛔';
        animToggle.style.opacity = window.animEnabled ? '1' : '0.5';
        if (!window.animEnabled) document.body.classList.add('no-animations');
        else document.body.classList.remove('no-animations');
    }

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

    soundToggle.addEventListener('click', () => { AudioEngine.toggleSound(); updateSoundIcon(); });
    musicToggle.addEventListener('click', () => { AudioEngine.toggleMusic(); updateMusicIcon(); });
    
    animToggle.addEventListener('click', () => { 
        window.animEnabled = !window.animEnabled; 
        localStorage.setItem('hub_anim', window.animEnabled ? 'on' : 'off'); 
        updateAnimIcon(); 
    });

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
        else if (gameId === 'solitaire') activeGameInstance = initSolitaire();
        else if (gameId === 'tanks') activeGameInstance = initTanks();
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
            if (!window.signalR) { alert("Библиотека SignalR не загружена."); diffSelect.value = 'easy'; return; }
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
            catch (err) { console.error(err); alert("Не удалось подключиться к серверу!"); diffSelect.value = 'easy'; isOnline = false; overlay.style.display = 'none'; }
        }

        diffSelect.addEventListener('change', () => { 
            if (diffSelect.value === 'online') { startOnlineMatch(); } else { isOnline = false; overlay.style.display = 'none'; if (connection) connection.stop(); resetGame(); }
        });

        cancelBtn.addEventListener('click', () => { AudioEngine.play('pop'); if (connection) connection.stop(); diffSelect.value = 'easy'; isOnline = false; overlay.style.display = 'none'; resetGame(); });
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
            
            // Сбрасываем анимацию перед новым ходом (хак для перезапуска)
            pDisplay.style.animation = 'none'; cDisplay.style.animation = 'none';
            pDisplay.offsetHeight; 
            if(window.animEnabled) {
                pDisplay.style.animation = 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
                cDisplay.style.animation = 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            }
            
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
        let shake = 0;

        function updateThemeColors() {
            const styles = getComputedStyle(document.documentElement);
            snakeColor = styles.getPropertyValue('--accent-color').trim() || "#00ffcc"; foodColor = styles.getPropertyValue('--score-lose').trim() || "#ff0055";
        }

        function startGame() {
            snake = []; snakeLength = 4; headX = 10; headY = 10; xVelocity = 0; yVelocity = 0; score = 0; gameSpeed = 120; shake = 0;
            scoreElement.innerText = score; gameOverScreen.style.display = "none"; placeApple(); clearTimeout(gameLoop); updateThemeColors(); drawGame();
        }

        function drawGame() {
            headX += xVelocity; headY += yVelocity;
            if (isGameOver()) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const isShaken = applyShake(ctx, shake);
            if (shake > 0) shake *= 0.8;
            if (shake < 0.5) shake = 0;
            
            checkAppleCollision(); drawApple(); drawSnake();
            if (isShaken) ctx.restore();

            if (score > 5) gameSpeed = 100; if (score > 10) gameSpeed = 80; if (score > 20) gameSpeed = 60;
            gameLoop = setTimeout(drawGame, gameSpeed);
        }

        function isGameOver() {
            let over = false; if (yVelocity === 0 && xVelocity === 0) return false;
            if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) over = true;
            for (let i = 0; i < snake.length; i++) { if (snake[i].x === headX && snake[i].y === headY) { over = true; break; } }
            if (over) {
                AudioEngine.play('lose'); shake = 15;
                gameOverScreen.style.display = "flex"; finalScoreElement.innerText = score;
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

        function checkAppleCollision() { 
            if (appleX === headX && appleY == headY) { 
                AudioEngine.play('pop'); shake = 4; placeApple(); snakeLength++; score++; scoreElement.innerText = score; 
            } 
        }
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
    // 11. ИГРА 5: ТЕТРИС (Tetris)
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

                    <details class="game-rules">
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
        let shake = 0;

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
                isGameOver = true; shake = 15;
                cancelAnimationFrame(animationId); 
                AudioEngine.play('lose');
                finalScoreEl.innerText = player.score;
                gameOverScreen.style.display = 'flex';
                draw(); // Финальная отрисовка с тряской
            }
        }

        function arenaSweep() {
            let rowCount = 0;
            outer: for (let y = arena.length - 1; y >= 0; --y) {
                for (let x = 0; x < arena[y].length; ++x) { if (arena[y][x] === 0) continue outer; }
                const row = arena.splice(y, 1)[0].fill(0); arena.unshift(row); ++y; rowCount++;
            }
            if (rowCount > 0) {
                shake = rowCount * 3; // Тряска при сжигании
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
            
            const isShaken = applyShake(context, shake);
            if (shake > 0) shake *= 0.8;
            if (shake < 0.5) shake = 0;

            drawGrid();
            drawMatrix(arena, { x: 0, y: 0 }, context);
            if (player.matrix && !isGameOver) { drawGhost(); drawMatrix(player.matrix, player.pos, context); }
            
            if (isShaken) context.restore();
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
                if (rotationToggle && rotationToggle.checked) playerRotate(1);
            }
            else if (event.key === ' ') {
                shake = 5; // Легкая тряска при падении
                while (!collide(arena, player)) { player.pos.y++; }
                player.pos.y--; merge(arena, player); playerReset(); arenaSweep(); updateScoreUI();
            }
        }
        document.addEventListener('keydown', keydownHandler);

        document.getElementById('tetris-start-btn')?.addEventListener('click', () => {
            AudioEngine.play('pop');
            arena = createMatrix(COLS, ROWS); player.score = 0; player.lines = 0; player.level = 1; dropInterval = 1000;
            isGameOver = false; isPaused = false; gameOverScreen.style.display = 'none'; shake = 0;
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

    // =========================================
    // 12. ИГРА 6: ПАСЬЯНС (Косынка / Klondike)
    // =========================================
    function initSolitaire() {
        gameContainer.innerHTML = `
            <div class="game-top-bar" style="max-width: 700px;">
                <div class="scoreboard">
                    <div class="score-item score-w"><span data-i18n="moves">Moves</span>: <span id="solMoves" class="val">0</span></div>
                    <div class="score-item score-d"><span data-i18n="time">Time</span>: <span id="solTime" class="val">0:00</span></div>
                </div>
                <select id="solStyleSelect" class="difficulty-select" style="margin: 0 10px;">
                    <option value="classic">Стиль: Классика</option>
                    <option value="minecraft">Стиль: Майнкрафт</option>
                </select>
                <button id="solRestart" class="restart-btn" style="margin-top:0; width:auto;" data-i18n="restart">Restart</button>
            </div>
            
            <div class="game-status win" id="solStatus" style="display:none; width:100%; max-width:700px;" data-i18n="solWin">You Solved It! 🎉</div>

            <div class="solitaire-board" id="solBoard">
                <div class="sol-row solitaire-top">
                    <div class="sol-col" id="sol-stock"></div>
                    <div class="sol-col" id="sol-waste"></div>
                    <div class="sol-col" style="border:none; background:none;"></div>
                    <div class="sol-col" id="sol-found-0"></div>
                    <div class="sol-col" id="sol-found-1"></div>
                    <div class="sol-col" id="sol-found-2"></div>
                    <div class="sol-col" id="sol-found-3"></div>
                </div>
                <div class="sol-row solitaire-bottom" style="margin-top:20px;">
                    <div class="sol-col" id="sol-tab-0"></div>
                    <div class="sol-col" id="sol-tab-1"></div>
                    <div class="sol-col" id="sol-tab-2"></div>
                    <div class="sol-col" id="sol-tab-3"></div>
                    <div class="sol-col" id="sol-tab-4"></div>
                    <div class="sol-col" id="sol-tab-5"></div>
                    <div class="sol-col" id="sol-tab-6"></div>
                </div>

                <details class="game-rules" style="margin-top: 30px;">
                    <summary data-i18n="rulesTitle">Правила</summary>
                    <div class="rules-content">
                        <p><strong data-i18n="solRule1Title">Цель:</strong> <span data-i18n="solRule1Desc">...</span></p>
                        <p><strong data-i18n="solRule2Title">Стол:</strong> <span data-i18n="solRule2Desc">...</span></p>
                        <p><strong data-i18n="solRule3Title">Колода:</strong> <span data-i18n="solRule3Desc">...</span></p>
                        <p><strong data-i18n="solRule4Title">Быстрый ход:</strong> <span data-i18n="solRule4Desc">...</span></p>
                    </div>
                </details>
            </div>
        `;
        updateLanguage();

        const suits = ['♥', '♦', '♣', '♠'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        let deck = [];
        let state = { stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []] };
        
        let moves = 0; let timerSeconds = 0; let timerInterval = null;
        let isWon = false; let isLost = false; let stockCycles = 0;
        let selected = null;

        let currentSolStyle = localStorage.getItem('sol_style') || 'classic';
        const styleSelect = document.getElementById('solStyleSelect');
        styleSelect.value = currentSolStyle;
        
        styleSelect.addEventListener('change', (e) => {
            currentSolStyle = e.target.value;
            localStorage.setItem('sol_style', currentSolStyle);
            renderBoard();
        });

        function formatTime(sec) { const m = Math.floor(sec / 60); const s = sec % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; }

        function createDeck() {
            deck = [];
            for (let s of suits) {
                for (let i = 0; i < values.length; i++) {
                    deck.push({ suit: s, val: values[i], num: i + 1, color: (s === '♥' || s === '♦') ? 'red' : 'black', faceUp: false });
                }
            }
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        }

        function dealCards() {
            state = { stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []] };
            let cardIndex = 0;
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j <= i; j++) {
                    let card = deck[cardIndex++];
                    if (j === i) card.faceUp = true;
                    state.tableau[i].push(card);
                }
            }
            while (cardIndex < deck.length) { state.stock.push(deck[cardIndex++]); }
        }

        function renderCard(card, pile, colIndex, cardIndex, isInitialDeal) {
            const div = document.createElement('div');
            div.className = `sol-card ${card.faceUp ? card.color : 'face-down'}`;
            if (selected && selected.pile === pile && selected.col === colIndex && cardIndex >= selected.index) div.classList.add('selected');
            
            // Каскадная анимация раздачи
            if (isInitialDeal && window.animEnabled) {
                div.style.animation = `dealCard 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both`;
                div.style.animationDelay = `${(colIndex * 3 + cardIndex) * 0.04}s`;
            }

            if (pile === 'tableau') {
                let yOffset = 0;
                for(let i = 0; i < cardIndex; i++) yOffset += state.tableau[colIndex][i].faceUp ? 28 : 12;
                div.style.top = `${yOffset}px`;
            }

            if (card.faceUp) {
                let displayVal = card.val;
                if (currentLang === 'ru' || currentLang === 'be' || currentLang === 'uk' || currentLang === 'kk') {
                    if (card.val === 'J') displayVal = 'В';
                    if (card.val === 'Q') displayVal = 'Д';
                    if (card.val === 'K') displayVal = 'К';
                    if (card.val === 'A') displayVal = 'Т';
                }

                let centerHtml = `<div class="sol-center-suit">${card.suit}</div>`;
                const isMC = currentSolStyle === 'minecraft';
                
                if (card.val === 'J' || card.val === 'Q' || card.val === 'K') {
                    if (isMC) {
                        let mcIcon = card.val === 'J' ? '🧟' : (card.val === 'Q' ? '🐷' : '🐉');
                        centerHtml = `<div class="sol-center-face">${mcIcon}</div>`;
                    } else {
                        centerHtml = `
                            <div class="card-face-center ${card.color}">
                                <div class="face-half top"><span class="face-letter">${displayVal}</span><span class="face-bg-suit">${card.suit}</span></div>
                                <div class="face-half bottom"><span class="face-letter">${displayVal}</span><span class="face-bg-suit">${card.suit}</span></div>
                            </div>
                        `;
                    }
                }

                div.innerHTML = `
                    <div class="sol-card-inner">
                        <div class="card-corner top-left"><span class="sol-val">${displayVal}</span><span class="sol-suit">${card.suit}</span></div>
                        ${centerHtml}
                        <div class="card-corner bottom-right"><span class="sol-val">${displayVal}</span><span class="sol-suit">${card.suit}</span></div>
                    </div>
                `;
            }

            div.addEventListener('click', (e) => { e.stopPropagation(); handleCardClick(pile, colIndex, cardIndex); });
            div.addEventListener('dblclick', (e) => { e.stopPropagation(); handleDoubleClick(pile, colIndex, cardIndex); });
            return div;
        }

        function renderBoard(isInitialDeal = false) {
            document.getElementById('solBoard').className = `solitaire-board style-${currentSolStyle}`;

            const stockEl = document.getElementById('sol-stock');
            stockEl.innerHTML = '<div class="sol-slot"></div>';
            if (state.stock.length > 0) {
                const topStock = state.stock[state.stock.length - 1];
                topStock.faceUp = false;
                stockEl.appendChild(renderCard(topStock, 'stock', 0, state.stock.length - 1, isInitialDeal));
            }
            stockEl.onclick = () => handleStockClick();

            const wasteEl = document.getElementById('sol-waste');
            wasteEl.innerHTML = '<div class="sol-slot"></div>';
            if (state.waste.length > 0) wasteEl.appendChild(renderCard(state.waste[state.waste.length - 1], 'waste', 0, state.waste.length - 1, isInitialDeal));
            wasteEl.onclick = () => { if(selected) handleEmptySlotClick('waste', 0); };

            for (let i = 0; i < 4; i++) {
                const fEl = document.getElementById(`sol-found-${i}`);
                fEl.innerHTML = '<div class="sol-slot"></div>';
                if (state.foundations[i].length > 0) fEl.appendChild(renderCard(state.foundations[i][state.foundations[i].length - 1], 'foundation', i, state.foundations[i].length - 1, isInitialDeal));
                fEl.onclick = () => handleEmptySlotClick('foundation', i);
            }

            for (let i = 0; i < 7; i++) {
                const tEl = document.getElementById(`sol-tab-${i}`);
                tEl.innerHTML = '<div class="sol-slot"></div>';
                state.tableau[i].forEach((card, idx) => tEl.appendChild(renderCard(card, 'tableau', i, idx, isInitialDeal)));
                tEl.onclick = () => handleEmptySlotClick('tableau', i);
            }

            document.getElementById('solMoves').innerText = moves;
            checkGameState();
        }

        function handleStockClick() {
            if (isWon || isLost) return;
            AudioEngine.play('card');
            selected = null;
            if (state.stock.length > 0) {
                let card = state.stock.pop(); card.faceUp = true; state.waste.push(card);
            } else {
                if (state.waste.length === 0) return; 
                while (state.waste.length > 0) { let card = state.waste.pop(); card.faceUp = false; state.stock.push(card); }
                stockCycles++;
            }
            moves++; renderBoard();
        }

        function handleCardClick(pile, col, index) {
            if (isWon || isLost) return;
            if (pile === 'stock') { handleStockClick(); return; }

            AudioEngine.play('pop');
            let targetArray = getPileArray(pile, col);
            if (!targetArray[index].faceUp) return;

            if (!selected) { selected = { pile, col, index }; renderBoard(); return; }
            if (selected.pile === pile && selected.col === col && selected.index === index) { selected = null; renderBoard(); return; }
            attemptMove(pile, col);
        }

        function handleEmptySlotClick(pile, col) { if (!selected || isWon || isLost) return; attemptMove(pile, col); }

        function handleDoubleClick(pile, col, index) {
            if (isWon || isLost) return;
            let targetArray = getPileArray(pile, col);
            if (!targetArray[index].faceUp || index !== targetArray.length - 1) return;

            selected = { pile, col, index };
            for (let i = 0; i < 4; i++) { if (isValidMove('foundation', i)) { executeMove('foundation', i); return; } }
            selected = null; renderBoard();
        }

        function getPileArray(pile, col) {
            if (pile === 'waste') return state.waste;
            if (pile === 'foundation') return state.foundations[col];
            if (pile === 'tableau') return state.tableau[col];
            return [];
        }

        function attemptMove(destPile, destCol) {
            if (isValidMove(destPile, destCol)) { executeMove(destPile, destCol); } 
            else {
                let destArray = getPileArray(destPile, destCol);
                selected = (destArray.length > 0 && destPile !== 'foundation') ? { pile: destPile, col: destCol, index: destArray.length - 1 } : null;
                AudioEngine.play('move'); renderBoard();
            }
        }

        function isValidMove(destPile, destCol) {
            let sourceArray = getPileArray(selected.pile, selected.col);
            let movingCard = sourceArray[selected.index];
            let destArray = getPileArray(destPile, destCol);
            let topDestCard = destArray.length > 0 ? destArray[destArray.length - 1] : null;

            if (destPile === 'foundation') {
                if (selected.index !== sourceArray.length - 1) return false;
                if (!topDestCard) return movingCard.num === 1;
                return movingCard.suit === topDestCard.suit && movingCard.num === topDestCard.num + 1;
            }
            if (destPile === 'tableau') {
                if (!topDestCard) return movingCard.num === 13;
                return movingCard.color !== topDestCard.color && movingCard.num === topDestCard.num - 1;
            }
            return false;
        }

        function executeMove(destPile, destCol) {
            let sourceArray = getPileArray(selected.pile, selected.col);
            let destArray = getPileArray(destPile, destCol);
            destArray.push(...sourceArray.splice(selected.index, sourceArray.length - selected.index));

            if (selected.pile === 'tableau' && sourceArray.length > 0 && !sourceArray[sourceArray.length - 1].faceUp) {
                sourceArray[sourceArray.length - 1].faceUp = true;
            }

            AudioEngine.play('card'); moves++; stockCycles = 0; selected = null; renderBoard();
        }

        function hasAvailableMoves() {
            const originalSelected = selected; let foundMove = false;
            function checkCardMoves(pile, c, i) {
                selected = { pile, col: c, index: i };
                for (let f = 0; f < 4; f++) if (isValidMove('foundation', f)) return true;
                for (let t = 0; t < 7; t++) if (isValidMove('tableau', t)) return true;
                return false;
            }

            if (state.waste.length > 0 && checkCardMoves('waste', 0, state.waste.length - 1)) foundMove = true;
            if (!foundMove) {
                for (let c = 0; c < 7; c++) {
                    for (let i = 0; i < state.tableau[c].length; i++) {
                        if (state.tableau[c][i].faceUp && checkCardMoves('tableau', c, i)) { foundMove = true; break; }
                    }
                    if(foundMove) break;
                }
            }
            selected = originalSelected; return foundMove;
        }

        function checkGameState() {
            if (isWon || isLost) return;
            if (state.foundations.every(f => f.length === 13)) {
                isWon = true; clearInterval(timerInterval); AudioEngine.play('win');
                const statusEl = document.getElementById('solStatus');
                statusEl.className = 'game-status win'; statusEl.innerText = getTranslation('solWin'); statusEl.style.display = 'block';
                return;
            }

            let hasMoves = hasAvailableMoves();
            if ((state.stock.length === 0 && state.waste.length === 0 && !hasMoves) || (stockCycles >= 2 && !hasMoves)) {
                isLost = true; clearInterval(timerInterval); AudioEngine.play('lose');
                const statusEl = document.getElementById('solStatus');
                statusEl.className = 'game-status lose'; statusEl.innerText = getTranslation('solLose'); statusEl.style.display = 'block';
            }
        }

        function startGame() {
            clearInterval(timerInterval); timerSeconds = 0; moves = 0; stockCycles = 0; isWon = false; isLost = false; selected = null;
            document.getElementById('solTime').innerText = "0:00"; document.getElementById('solStatus').style.display = 'none';
            createDeck(); dealCards(); renderBoard(true); // true для каскадной анимации
            timerInterval = setInterval(() => { if(!isWon && !isLost) { timerSeconds++; document.getElementById('solTime').innerText = formatTime(timerSeconds); } }, 1000);
        }

        document.getElementById('solRestart').addEventListener('click', () => { AudioEngine.play('pop'); startGame(); });
        startGame();

        return { updateTexts: () => updateLanguage(), getStats: () => ({ w: isWon ? 1 : 0 }), destroy: () => clearInterval(timerInterval) };
    }

    // =========================================
    // 13. ИГРА 7: ТАНЧИКИ (Battle City 1985)
    // =========================================
    function initTanks() {
        gameContainer.innerHTML = `
            <div class="tanks-header">
                <div><span data-i18n="tanksKills">Enemies:</span> <span id="tankKills" style="color:var(--score-win);">0</span>/<span id="tankTotal">10</span></div>
                <div><span data-i18n="level">Level</span>: <span id="tankLevelDisplay" style="color:var(--accent-color);">1</span></div>
                <div><span data-i18n="tanksBase">Base:</span> <span id="tankBaseStatus" style="color:var(--score-win);" data-i18n="tanksBaseAlive">SECURE 🛡️</span></div>
            </div>

            <div style="position: relative;">
                <canvas id="tanksCanvas" width="416" height="416" class="tanks-canvas"></canvas>
                
                <!-- Экран Победы на уровне -->
                <div id="tanksVictoryScreen" class="tanks-overlay">
                    <h2 style="color:var(--score-win); font-size: 28px; text-shadow:0 0 15px var(--score-win); margin-bottom: 20px;">ПОБЕДА!</h2>
                    <button id="tanksNextLevelBtn" class="restart-btn" style="width: auto;">Следующий уровень</button>
                </div>
            </div>

            <div class="snake-controls" style="margin-top: 10px;">
                <div class="snake-btn" id="t-btn-up">▲</div>
                <div class="snake-control-row">
                    <div class="snake-btn" id="t-btn-left">◀</div>
                    <div class="snake-btn" id="t-btn-down">▼</div>
                    <div class="snake-btn" id="t-btn-right">▶</div>
                </div>
                <button class="restart-btn" id="t-btn-fire" style="margin-top: 10px; max-width: 200px;">🔥 ОГОНЬ</button>
            </div>

            <button id="tanksRestart" class="restart-btn" style="display:none; max-width: 416px;" data-i18n="restart">Play Again</button>

            <details class="game-rules" style="margin-top: 20px;">
                <summary data-i18n="rulesTitle">Правила</summary>
                <div class="rules-content">
                    <p><strong data-i18n="tankRule1Title">Цель:</strong> <span data-i18n="tankRule1Desc">...</span></p>
                    <p><strong data-i18n="tankRule2Title">Управление:</strong> <span data-i18n="tankRule2Desc">...</span></p>
                    <p><strong data-i18n="tankRule3Title">Блоки:</strong> <span data-i18n="tankRule3Desc">...</span></p>
                </div>
            </details>
        `;
        updateLanguage();

        const canvas = document.getElementById('tanksCanvas');
        const ctx = canvas.getContext('2d');
        const killsEl = document.getElementById('tankKills');
        const totalEl = document.getElementById('tankTotal');
        const baseStatusEl = document.getElementById('tankBaseStatus');
        const restartBtn = document.getElementById('tanksRestart');
        const victoryScreen = document.getElementById('tanksVictoryScreen');
        const levelDisplay = document.getElementById('tankLevelDisplay');

        const TILE = 32;
        const GRID_SIZE = 13;

        let map = [];
        let player = { x: 0, y: 0, w: 28, h: 28, dir: 'up', speed: 3, bullet: null };
        let enemies = [];
        let enemyBullets = [];
        
        let currentLevel = 1;
        let kills = 0;
        let totalEnemies = 10;
        let spawnedCount = 0;
        let isBaseAlive = true;
        let isGameOver = false;
        let isLevelComplete = false;
        let gameLoop = null;
        let shake = 0;

        const keys = {};

        function initMap() {
            map = [
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,1,0,1,0,1,1,1,0,1,0,1,0],
                [0,1,0,1,0,1,2,1,0,1,0,1,0],
                [0,1,0,1,0,0,0,0,0,1,0,1,0],
                [0,0,0,0,0,1,1,1,0,0,0,0,0],
                [1,1,0,2,0,0,0,0,0,2,0,1,1],
                [0,0,0,1,0,1,1,1,0,1,0,0,0],
                [1,1,0,2,0,0,0,0,0,2,0,1,1],
                [0,0,0,0,0,1,1,1,0,0,0,0,0],
                [0,1,0,1,0,0,0,0,0,1,0,1,0],
                [0,1,0,1,0,1,0,1,0,1,0,1,0],
                [0,0,0,0,0,1,1,1,0,0,0,0,0],
                [0,0,0,0,0,1,3,1,0,0,0,0,0],
            ];
        }

        function startLevel(level) {
            currentLevel = level;
            totalEnemies = 5 + (level * 5);
            kills = 0; spawnedCount = 0; isBaseAlive = true; isGameOver = false; isLevelComplete = false; shake = 0;
            enemies = []; enemyBullets = [];
            
            player.x = 4 * TILE; player.y = 12 * TILE; player.bullet = null;
            initMap();

            levelDisplay.innerText = currentLevel;
            killsEl.innerText = kills;
            totalEl.innerText = totalEnemies;
            victoryScreen.style.display = 'none';
            restartBtn.style.display = 'none';
            baseStatusEl.innerText = getTranslation('tanksBaseAlive');
            baseStatusEl.style.color = "var(--score-win)";

            cancelAnimationFrame(gameLoop); update();
        }

        function spawnEnemy() {
            if (spawnedCount >= totalEnemies || enemies.length >= 3) return;
            const spawnPoints = [{x: 0, y: 0}, {x: 6 * TILE, y: 0}, {x: 12 * TILE, y: 0}];
            const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            let baseSpeed = 1.5 + (currentLevel * 0.2); 
            
            enemies.push({ x: sp.x, y: sp.y, w: 28, h: 28, dir: 'down', speed: baseSpeed, changeDirTimer: 0, shootTimer: 0 });
            spawnedCount++;
        }

        function checkCollision(x, y, w, h) {
            if (x < 0 || y < 0 || x + w > canvas.width || y + h > canvas.height) return true;
            const left = Math.floor(x / TILE), right = Math.floor((x + w - 1) / TILE);
            const top = Math.floor(y / TILE), bottom = Math.floor((y + h - 1) / TILE);

            for (let r = top; r <= bottom; r++) {
                for (let c = left; c <= right; c++) {
                    if (map[r] && (map[r][c] === 1 || map[r][c] === 2 || map[r][c] === 3)) return { r, c, type: map[r][c] };
                }
            }
            return false;
        }

        function moveEntity(e, dir, speed) {
            let nextX = e.x, nextY = e.y;
            if (dir === 'up') nextY -= speed; if (dir === 'down') nextY += speed;
            if (dir === 'left') nextX -= speed; if (dir === 'right') nextX += speed;

            if (!checkCollision(nextX, nextY, e.w, e.h)) { e.x = nextX; e.y = nextY; }
            e.dir = dir;
        }

        function shoot(shooter, isPlayer) {
            if (isPlayer && shooter.bullet) return;
            let bx = shooter.x + shooter.w / 2 - 3, by = shooter.y + shooter.h / 2 - 3;
            let bullet = { x: bx, y: by, w: 6, h: 6, dir: shooter.dir, speed: 6, isPlayer };
            if (isPlayer) { shooter.bullet = bullet; shake = 2; AudioEngine.play('shoot'); } 
            else { enemyBullets.push(bullet); }
        }

        function updateBullets() {
            if (player.bullet) {
                for (let i = enemyBullets.length - 1; i >= 0; i--) {
                    let eb = enemyBullets[i];
                    if (player.bullet && player.bullet.x < eb.x + eb.w && player.bullet.x + player.bullet.w > eb.x && player.bullet.y < eb.y + eb.h && player.bullet.y + player.bullet.h > eb.y) {
                        player.bullet = null; enemyBullets.splice(i, 1); shake = 4; AudioEngine.play('pop'); break; 
                    }
                }
            }

            if (player.bullet) {
                let b = player.bullet;
                if (b.dir === 'up') b.y -= b.speed; if (b.dir === 'down') b.y += b.speed;
                if (b.dir === 'left') b.x -= b.speed; if (b.dir === 'right') b.x += b.speed;

                let hit = checkCollision(b.x, b.y, b.w, b.h);
                if (hit) {
                    if (hit.type === 1) map[hit.r][hit.c] = 0; 
                    if (hit.type === 3) destroyBase();
                    AudioEngine.play('explosion'); player.bullet = null;
                } else {
                    for (let i = enemies.length - 1; i >= 0; i--) {
                        let en = enemies[i];
                        if (b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y) {
                            enemies.splice(i, 1); player.bullet = null; kills++; killsEl.innerText = kills; shake = 8;
                            AudioEngine.play('explosion');
                            if (kills >= totalEnemies) winLevel();
                            break;
                        }
                    }
                }
            }

            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                let b = enemyBullets[i];
                if (b.dir === 'up') b.y -= b.speed; if (b.dir === 'down') b.y += b.speed;
                if (b.dir === 'left') b.x -= b.speed; if (b.dir === 'right') b.x += b.speed;

                let hit = checkCollision(b.x, b.y, b.w, b.h);
                if (hit) {
                    if (hit.type === 1) map[hit.r][hit.c] = 0;
                    if (hit.type === 3) destroyBase();
                    enemyBullets.splice(i, 1);
                } else if (b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y) {
                    enemyBullets.splice(i, 1); loseGame();
                }
            }
        }

        function updateEnemies() {
            const dirs = ['up', 'down', 'left', 'right'];
            enemies.forEach(en => {
                en.changeDirTimer++; en.shootTimer++;
                if (en.changeDirTimer > 60) { en.dir = dirs[Math.floor(Math.random() * dirs.length)]; en.changeDirTimer = 0; }
                moveEntity(en, en.dir, en.speed);
                if (en.shootTimer > 90) { shoot(en, false); en.shootTimer = 0; }
            });
        }

        function destroyBase() {
            isBaseAlive = false; map[12][6] = 0; shake = 20;
            baseStatusEl.innerText = getTranslation('tanksBaseDead');
            baseStatusEl.style.color = "var(--score-lose)";
            loseGame();
        }

        function winLevel() { isLevelComplete = true; AudioEngine.play('win'); victoryScreen.style.display = 'flex'; }
        function loseGame() { isGameOver = true; AudioEngine.play('lose'); restartBtn.style.display = 'block'; }

        function drawTank(t, color) {
            ctx.fillStyle = color; ctx.fillRect(t.x, t.y, t.w, t.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(t.x + t.w/4, t.y + t.h/4, t.w/2, t.h/2);
            ctx.fillStyle = color;
            if (t.dir === 'up') ctx.fillRect(t.x + t.w/2 - 2, t.y - 6, 4, 8);
            if (t.dir === 'down') ctx.fillRect(t.x + t.w/2 - 2, t.y + t.h - 2, 4, 8);
            if (t.dir === 'left') ctx.fillRect(t.x - 6, t.y + t.h/2 - 2, 8, 4);
            if (t.dir === 'right') ctx.fillRect(t.x + t.w - 2, t.y + t.h/2 - 2, 8, 4);
        }

        function drawMap() {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    let tile = map[r][c];
                    if (tile === 1) { 
                        ctx.fillStyle = '#c84c0c'; ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
                        ctx.strokeStyle = '#000'; ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
                    } else if (tile === 2) { 
                        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
                        ctx.fillStyle = '#fff'; ctx.fillRect(c * TILE + 4, r * TILE + 4, TILE - 8, TILE - 8);
                    } else if (tile === 3) { 
                        ctx.fillStyle = isBaseAlive ? '#fbbf24' : '#ef4444'; ctx.font = '24px Arial';
                        ctx.fillText(isBaseAlive ? '🦅' : '💥', c * TILE + 4, r * TILE + 24);
                    }
                }
            }
        }

        function update() {
            if (isGameOver || isLevelComplete) {
                // Если конец, но экран все еще трясется, дотрясем
                if (shake > 0) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const isShaken = applyShake(ctx, shake);
                    shake *= 0.8; if (shake < 0.5) shake = 0;
                    drawMap(); drawTank(player, 'var(--accent-color)'); enemies.forEach(en => drawTank(en, '#ef4444'));
                    if (isShaken) ctx.restore();
                    gameLoop = requestAnimationFrame(update);
                }
                return;
            }

            if (keys['KeyW'] || keys['ArrowUp']) moveEntity(player, 'up', player.speed);
            else if (keys['KeyS'] || keys['ArrowDown']) moveEntity(player, 'down', player.speed);
            else if (keys['KeyA'] || keys['ArrowLeft']) moveEntity(player, 'left', player.speed);
            else if (keys['KeyD'] || keys['ArrowRight']) moveEntity(player, 'right', player.speed);

            if (Math.random() < 0.02) spawnEnemy();

            updateEnemies(); updateBullets();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const isShaken = applyShake(ctx, shake);
            if (shake > 0) shake *= 0.8;
            if (shake < 0.5) shake = 0;

            drawMap(); drawTank(player, 'var(--accent-color)');
            enemies.forEach(en => drawTank(en, '#ef4444'));

            ctx.fillStyle = '#fde047';
            if (player.bullet) ctx.fillRect(player.bullet.x, player.bullet.y, player.bullet.w, player.bullet.h);
            enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

            if (isShaken) ctx.restore();

            gameLoop = requestAnimationFrame(update);
        }

        function handleKeyDown(e) { keys[e.code] = true; if (e.code === 'Space') { e.preventDefault(); shoot(player, true); } }
        function handleKeyUp(e) { keys[e.code] = false; }

        document.addEventListener('keydown', handleKeyDown); document.addEventListener('keyup', handleKeyUp);

        const addTouchEvent = (id, dir) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[dir] = true; });
            el.addEventListener('touchend', (e) => { e.preventDefault(); keys[dir] = false; });
            el.addEventListener('mousedown', () => { keys[dir] = true; });
            el.addEventListener('mouseup', () => { keys[dir] = false; });
        };
        addTouchEvent('t-btn-up', 'KeyW'); addTouchEvent('t-btn-down', 'KeyS');
        addTouchEvent('t-btn-left', 'KeyA'); addTouchEvent('t-btn-right', 'KeyD');

        document.getElementById('t-btn-fire')?.addEventListener('click', () => shoot(player, true));
        
        restartBtn.addEventListener('click', () => startLevel(1));
        document.getElementById('tanksNextLevelBtn').addEventListener('click', () => startLevel(currentLevel + 1));

        startLevel(1);

        return {
            updateTexts: () => updateLanguage(),
            getStats: () => ({ w: kills }),
            destroy: () => {
                cancelAnimationFrame(gameLoop);
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('keyup', handleKeyUp);
            }
        };
    }

    document.addEventListener('DOMContentLoaded', initApp);
})();