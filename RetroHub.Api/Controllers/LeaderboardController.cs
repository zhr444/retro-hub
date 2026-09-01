using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Dapper;

namespace RetroHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public LeaderboardController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // Модель данных, которую мы будем получать от нашего JavaScript
    public class RecordDto
    {
        public string PlayerName { get; set; } = string.Empty;
        public string GameName { get; set; } = string.Empty;
        public int Wins { get; set; }
    }

    // 1. Сохранение результата (POST-запрос)
    [HttpPost]
    public async Task<IActionResult> SaveRecord([FromBody] RecordDto record)
    {
        using var connection = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
        var sql = @"
            INSERT INTO Leaderboard (PlayerName, GameName, Wins) 
            VALUES (@PlayerName, @GameName, @Wins)";
        
        await connection.ExecuteAsync(sql, record);
        return Ok(new { message = "Рекорд успешно сохранен!" });
    }

    // 2. Получение топ-10 игроков по конкретной игре (GET-запрос)
    [HttpGet("{gameName}")]
    public async Task<IActionResult> GetTopPlayers(string gameName)
    {
        using var connection = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
        var sql = @"
            SELECT PlayerName, Wins 
            FROM Leaderboard 
            WHERE GameName = @GameName 
            ORDER BY Wins DESC 
            LIMIT 10";
        
        var topPlayers = await connection.QueryAsync(sql, new { GameName = gameName });
        return Ok(topPlayers);
    }
}