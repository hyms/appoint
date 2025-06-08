using Dapper;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using appoint.Domain;
using appoint.Models;
using Microsoft.IdentityModel.Tokens;

namespace appoint.Services;
public class UserService : IUserService
{
    private readonly IDbConnection _dbConnection;
    private readonly IConfiguration _configuration;
    public UserService(IDbConnection dbConnection, IConfiguration configuration)
    {
        _dbConnection = dbConnection;
        _configuration = configuration;
    }

    public async Task<UserModel> Authenticate(string modelUsername, string modelPassword)
    {
        var user = await GetUserByUsernameAsync(modelUsername);

        // Check if user exists and password is correct
        if (user == null || !VerifyPassword(modelPassword, user.Password))
        {
            return null; // Authentication failed
        }

        // Authentication successful, return the user (without the password for security)
        return new UserModel() { Id = user.Id, Username = user.Username, Role = user.Role };
    }

    public string GenerateJwtToken(UserModel user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
            // Puedes añadir más claims aquí, como los permisos del usuario
        };

        var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]));
        var signingCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(2), // Adjust the expiration time as needed
            SigningCredentials = signingCredentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public async Task<IEnumerable<UserModel>> GetAllUsersAsync()
    {
        const string sql = "SELECT id, username, role FROM users"; 
        return await _dbConnection.QueryAsync<UserModel>(sql);
    }

    public async Task<UserModel> GetUserByIdAsync(int id)
    {
        const string sql = "SELECT id, username, role FROM users WHERE id = @Id";
        return await _dbConnection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Id = id });
    }

    public async Task<UserModel> GetUserByUsernameAsync(string username)
    {
        const string sql = "SELECT id, username, password, role FROM users WHERE username = @Username"; 
        return await _dbConnection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Username = username });
    }

    public async Task<UserModel> CreateUserAsync(UserRequest request)
    {
        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
        const string sql = "INSERT INTO users (username, password, role, created_at, updated_at) VALUES (@Username, @Password, @Role, NOW(), NOW()); SELECT LAST_INSERT_ID();";
        int newUserId = await _dbConnection.ExecuteScalarAsync<int>(sql, new { request.Username, Password = hashedPassword, request.Role });
        return new UserModel() { Id = newUserId, Username = request.Username, Role = request.Role };
    }

    public async Task<UserModel> UpdateUserAsync(int id, UserRequest request)
    {
        var existingUser = await GetUserByIdAsync(id);
        if (existingUser == null)
        {
            return null;
        }

        string passwordToUpdate = existingUser.Password;
        if (!string.IsNullOrEmpty(request.Password))
        {
            passwordToUpdate = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        const string sql = "UPDATE users SET username = @Username, password = @Password, role = @Role, updated_at = NOW() WHERE id = @Id;";
        await _dbConnection.ExecuteAsync(sql, new { request.Username, Password = passwordToUpdate, request.Role, Id = id });
        return new UserModel() { Id = id, Username = request.Username, Role = request.Role };
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        const string sql = "DELETE FROM users WHERE id = @Id;";
        int rowsAffected = await _dbConnection.ExecuteAsync(sql, new { Id = id });
        return rowsAffected > 0;
    }

    // Método para verificar la contraseña durante el login
    public bool VerifyPassword(string plainTextPassword, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(plainTextPassword, hashedPassword);
    }
}