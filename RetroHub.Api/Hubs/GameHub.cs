using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace RetroHub.Api.Hubs;

public class GameHub : Hub
{
    // Очередь игроков, которые ищут матч
    private static readonly ConcurrentQueue<string> _waitingPlayers = new();
    // Словарь активных сессий (Связь: ID игрока -> ID оппонента)
    private static readonly ConcurrentDictionary<string, string> _activeGames = new();

    public async Task FindOpponent()
    {
        // Пытаемся забрать игрока из очереди
        if (_waitingPlayers.TryDequeue(out var opponentId))
        {
            // Защита от соединения с самим собой
            if (opponentId == Context.ConnectionId)
            {
                _waitingPlayers.Enqueue(Context.ConnectionId);
                return;
            }

            // Оппонент найден! Связываем их
            _activeGames[Context.ConnectionId] = opponentId;
            _activeGames[opponentId] = Context.ConnectionId;

            // Бросаем монетку: кто играет крестиками (ходит первым)
            var isCallerX = new Random().Next(2) == 0;
            
            // Отправляем сигнал обоим клиентам, что игра началась
            await Clients.Client(Context.ConnectionId).SendAsync("GameStarted", isCallerX ? "X" : "O");
            await Clients.Client(opponentId).SendAsync("GameStarted", isCallerX ? "O" : "X");
        }
        else
        {
            // Если очередь пуста, встаем в режим ожидания
            _waitingPlayers.Enqueue(Context.ConnectionId);
            await Clients.Caller.SendAsync("WaitingForOpponent");
        }
    }

    public async Task MakeMove(int index, string playerSign)
    {
        // Находим оппонента и пересылаем ему индекс кликнутой клетки
        if (_activeGames.TryGetValue(Context.ConnectionId, out var opponentId))
        {
            await Clients.Client(opponentId).SendAsync("ReceiveMove", index, playerSign);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Если игрок отключился (закрыл вкладку), сообщаем оппоненту о технической победе
        if (_activeGames.TryRemove(Context.ConnectionId, out var opponentId))
        {
            _activeGames.TryRemove(opponentId, out _);
            await Clients.Client(opponentId).SendAsync("OpponentDisconnected");
        }
        await base.OnDisconnectedAsync(exception);
    }
}