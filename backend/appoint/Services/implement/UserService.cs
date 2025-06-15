using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using appoint.Domain;
using appoint.Infrastructure;
using appoint.Models;
using Dapper;
using Microsoft.IdentityModel.Tokens;
// Asegúrate de que User (entidad de dominio) esté aquí
// Añadir este using para IConfiguration

// Asegúrate de que BCrypt.Net esté instalado y referenciado correctamente

namespace appoint.Services.implement;

public class UserService : IUserService
{
    private readonly ISqlDataAccess _sqlDataAccess; 
    private readonly IConfiguration _configuration;

    public UserService(ISqlDataAccess sqlDataAccess, IConfiguration configuration)
    {
        _sqlDataAccess = sqlDataAccess;
        _configuration = configuration;
    }
    public async Task<UserModel> Authenticate(string username, string password) // Cambiar modelUsername a Username
    {
        // Obtener el usuario por Username
        var user = await GetUserByUsernameAsync(username); // Cambiar GetUserByUsernameAsync a GetUserByUsernameAsync

        // Check if user exists and password is correct
        if (user == null || !VerifyPassword(password, user.PasswordHash)) // Usar PasswordHash de UserModel
        {
            return null; // Authentication failed
        }

        // Authentication successful, return the user (sin el PasswordHash)
        return new UserModel() { Id = user.Id, Username = user.Username, Role = user.Role };
    }

    public string GenerateJwtToken(UserModel user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username), // Usar ClaimTypes.Username
            new Claim(ClaimTypes.Role, user.Role)
            // Puedes añadir más claims aquí, como los permisos del usuario
        };

        // Asumiendo que has ajustado appsettings.json a la sección "Jwt"
        var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!)); // Leer de Jwt:Key
        var signingCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(2), // Adjust the expiration time as needed
            SigningCredentials = signingCredentials,
            Issuer = _configuration["Jwt:Issuer"],    // Asegúrate de que esto esté en tu appsettings.json
            Audience = _configuration["Jwt:Audience"] // Asegúrate de que esto esté en tu appsettings.json
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public async Task<IEnumerable<UserModel>> GetAllUsersAsync()
    {
        // Seleccionar solo las columnas necesarias, incluyendo Username
        const string sql = "SELECT Id, Username, Role, FirstName, LastName FROM Users";
        return await _sqlDataAccess.QueryAsync<UserModel,object>(sql,new{});
    }

    public async Task<UserModel> GetUserByIdAsync(Guid id) // Cambio de int a Guid
    {
        const string sql = "SELECT Id, Username, Role, PasswordHash FROM Users WHERE Id = @Id"; // Incluir PasswordHash para Authenticate
        return await _sqlDataAccess.QueryFirstOrDefaultAsync<UserModel,object>(sql, new { Id = id });
    }

    public async Task<UserModel> GetUserByUsernameAsync(string username) // Nuevo método para buscar por Username
    {
        const string sql = "SELECT Id, Username, PasswordHash, Role FROM Users WHERE Username = @Username";
        return await _sqlDataAccess.QueryFirstOrDefaultAsync<UserModel,object>(sql, new { Username = username });
    }

    public async Task<UserModel> CreateUserAsync(UserRequest request)
    {
        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
        Guid newUserId = Guid.NewGuid(); // Generar un nuevo GUID para el ID

        // Ajustar la consulta SQL para insertar un GUID y usar Username en lugar de Username
        const string sql = @"
            INSERT INTO Users (Id, Username, PasswordHash, Role, CreatedAt, UpdatedAt, FirstName, LastName, Type, Contact, RegionCode, BloodGroup, Gender, Dob)
            VALUES (@Id, @Username, @PasswordHash, @Role, @CreatedAt, @UpdatedAt, @FirstName, @LastName, @Type, @Contact, @RegionCode, @BloodGroup, @Gender, @Dob);";

        // Asegúrate de que tu UserRequest tenga todas las propiedades que necesita el INSERT
        // O pasa un objeto anónimo con todos los campos requeridos
        await _sqlDataAccess.ExecuteAsync(sql, new 
        { 
            Id = newUserId, 
            Username = request.Username, 
            PasswordHash = hashedPassword, 
            Role = request.Role, 
            CreatedAt = DateTime.UtcNow, 
            UpdatedAt = DateTime.UtcNow,
            // Aquí debes añadir los valores para FirstName, LastName, Type, Contact, RegionCode, BloodGroup, Gender, Dob.
            // Si UserRequest no los tiene, deberás ajustarlo o pasarlos como null/valores por defecto.
            FirstName = "Default", // Placeholder, ajusta esto
            LastName = "User",     // Placeholder, ajusta esto
            Type = request.Role,   // A menudo el tipo es el mismo que el rol, si no, ajusta
            Contact = (string)null!,
            RegionCode = (string)null!,
            BloodGroup = (string)null!,
            Gender = (int?)null,
            Dob = (DateTime?)null
        });
        
        return new UserModel() { Id = newUserId, Username = request.Username, Role = request.Role };
    }

    public async Task<UserModel> UpdateUserAsync(Guid id, UserRequest request) // Cambio de int a Guid
    {
        var existingUser = await GetUserByIdAsync(id); // Usa Guid

        string passwordToUpdate = existingUser.PasswordHash; // Usa PasswordHash
        if (!string.IsNullOrEmpty(request.Password))
        {
            passwordToUpdate = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        // Ajustar SQL para usar Username en lugar de Username
        const string sql = @"
            UPDATE Users 
            SET Username = @Username, PasswordHash = @PasswordHash, Role = @Role, UpdatedAt = @UpdatedAt
            WHERE Id = @Id;";

        await _sqlDataAccess.ExecuteAsync(sql, new 
        { 
            Username = request.Username, 
            PasswordHash = passwordToUpdate, 
            Role = request.Role, 
            UpdatedAt = DateTime.UtcNow, 
            Id = id 
        });
        return new UserModel() { Id = id, Username = request.Username!, Role = request.Role };
    }

    public async Task<bool> DeleteUserAsync(Guid id) // Cambio de int a Guid
    {
        const string sql = "DELETE FROM Users WHERE Id = @Id;";
        int rowsAffected = await _sqlDataAccess.ExecuteAsync(sql, new { Id = id });
        return rowsAffected > 0;
    }

    // Método para verificar la contraseña durante el login
    public bool VerifyPassword(string plainTextPassword, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(plainTextPassword, hashedPassword);
    }
}