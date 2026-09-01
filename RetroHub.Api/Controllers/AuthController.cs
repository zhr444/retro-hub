using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Dapper;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RetroHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public class AuthDto { public string Username { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthDto dto)
    {
        using var connection = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
        var exists = await connection.QueryFirstOrDefaultAsync<int>("SELECT 1 FROM Users WHERE Username = @Username", new { dto.Username });
        if (exists == 1) return BadRequest(new { message = "Имя пользователя уже занято." });

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        await connection.ExecuteAsync("INSERT INTO Users (Username, PasswordHash) VALUES (@Username, @Hash)", new { dto.Username, Hash = hash });
        
        return Ok(new { message = "Регистрация успешна!" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthDto dto)
    {
        using var connection = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
        var user = await connection.QueryFirstOrDefaultAsync("SELECT Username, PasswordHash FROM Users WHERE Username = @Username", new { dto.Username });
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, (string)user.passwordhash))
            return Unauthorized(new { message = "Неверный логин или пароль." });

        var tokenHandler = new JwtSecurityTokenHandler();
        
        // Получаем секретный ключ из конфигурации
        var jwtSecret = _configuration["JwtSecret"];
        if (string.IsNullOrEmpty(jwtSecret)) return StatusCode(500, new { message = "Ошибка конфигурации сервера: отсутствует JwtSecret." });

        var key = Encoding.UTF8.GetBytes(jwtSecret);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, (string)user.username) }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return Ok(new { token = tokenHandler.WriteToken(token), username = user.username });
    }
}