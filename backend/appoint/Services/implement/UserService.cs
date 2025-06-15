using System.Data;
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

    public async Task<UserModel> Authenticate(string Email, string password) // Cambiar modelEmail a Email
    {
        // Obtener el usuario por Email
        var user = await GetUserByEmailAsync(Email); // Cambiar GetUserByEmailAsync a GetUserByEmailAsync

        // Check if user exists and password is correct
        if (user == null || !VerifyPassword(password, user.PasswordHash)) // Usar PasswordHash de UserModel
        {
            return null; // Authentication failed
        }

        // Authentication successful, return the user (sin el PasswordHash)
        return new UserModel() { Id = user.Id, Email = user.Email, Role = user.Role };
    }

    public string GenerateJwtToken(UserModel user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Email), // Usar ClaimTypes.Email
            new Claim(ClaimTypes.Role, user.Role)
            // Puedes añadir más claims aquí, como los permisos del usuario
        };

        // Asumiendo que has ajustado appsettings.json a la sección "Jwt"
        var secretKey =
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!)); // Leer de Jwt:Key
        var signingCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(2), // Adjust the expiration time as needed
            SigningCredentials = signingCredentials,
            Issuer = _configuration["Jwt:Issuer"], // Asegúrate de que esto esté en tu appsettings.json
            Audience = _configuration["Jwt:Audience"] // Asegúrate de que esto esté en tu appsettings.json
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public async Task<IEnumerable<UserModel>> GetAllUsersAsync()
    {
        // Seleccionar solo las columnas necesarias, incluyendo Email
        const string sql = "SELECT Id, Email, Role, FirstName, LastName FROM Users";
        using (IDbConnection connection = _sqlDataAccess.GetConnection())
        {
            return await connection.QueryAsync<UserModel>(sql, new { });
        }
    }

    public async Task<UserModel> GetUserByIdAsync(Guid id) // Cambio de int a Guid
    {
        const string
            sql =
                "SELECT Id, Email, Role, PasswordHash FROM Users WHERE Id = @Id"; // Incluir PasswordHash para Authenticate
        using (IDbConnection connection = _sqlDataAccess.GetConnection())
        {
            return (await connection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Id = id }))!;
        }
    }

    public async Task<UserModel> GetUserByEmailAsync(string Email) // Nuevo método para buscar por Email
    {
        const string sql = "SELECT Id, Email, PasswordHash, Role FROM Users WHERE Email = @Email";
        using (IDbConnection connection = _sqlDataAccess.GetConnection())
        {
            return (await connection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Email = Email }))!;
        }
    }

    public async Task<UserModel> CreateUserAsync(UserRequest request)
    {
        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
        Guid newUserId = Guid.NewGuid(); // Generar un nuevo GUID para el ID

        // Ajustar la consulta SQL para insertar un GUID y usar Email en lugar de Email
        const string sql = @"
            INSERT INTO Users (Id, Email, PasswordHash, Role, CreatedAt, UpdatedAt, FirstName, LastName, Type, Contact, RegionCode, BloodGroup, Gender, Dob)
            VALUES (@Id, @Email, @PasswordHash, @Role, @CreatedAt, @UpdatedAt, @FirstName, @LastName, @Type, @Contact, @RegionCode, @BloodGroup, @Gender, @Dob);";

        // Asegúrate de que tu UserRequest tenga todas las propiedades que necesita el INSERT
        // O pasa un objeto anónimo con todos los campos requeridos
        using (IDbConnection connection = _sqlDataAccess.GetConnection())
        {
            await connection.ExecuteAsync(sql, new
            {
                Id = newUserId,
                Email = request.Email,
                PasswordHash = hashedPassword,
                Role = request.Role,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                // Aquí debes añadir los valores para FirstName, LastName, Type, Contact, RegionCode, BloodGroup, Gender, Dob.
                // Si UserRequest no los tiene, deberás ajustarlo o pasarlos como null/valores por defecto.
                FirstName = "Default", // Placeholder, ajusta esto
                LastName = "User", // Placeholder, ajusta esto
                Type = request.Role, // A menudo el tipo es el mismo que el rol, si no, ajusta
                Contact = (string)null!,
                RegionCode = (string)null!,
                BloodGroup = (string)null!,
                Gender = (int?)null,
                Dob = (DateTime?)null
            });

            return new UserModel() { Id = newUserId, Email = request.Email, Role = request.Role };
        }
    }

    public async Task<UserModel> UpdateUserAsync(Guid id, UserRequest request) // Cambio de int a Guid
    {
        var existingUser = await GetUserByIdAsync(id); // Usa Guid

        string passwordToUpdate = existingUser.PasswordHash; // Usa PasswordHash
        if (!string.IsNullOrEmpty(request.Password))
        {
            passwordToUpdate = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        // Ajustar SQL para usar Email en lugar de Email
        const string sql = @"
            UPDATE Users 
            SET Email = @Email, PasswordHash = @PasswordHash, Role = @Role, UpdatedAt = @UpdatedAt
            WHERE Id = @Id;";
        using (IDbConnection connection = _sqlDataAccess.GetConnection())
        {
            await connection.ExecuteAsync(sql, new
            {
                Email = request.Email,
                PasswordHash = passwordToUpdate,
                Role = request.Role,
                UpdatedAt = DateTime.UtcNow,
                Id = id
            });
            return new UserModel() { Id = id, Email = request.Email!, Role = request.Role };
        }
    }

    public async Task<bool> DeleteUserAsync(Guid id) // Cambio de int a Guid
    {
        const string sql = "DELETE FROM Users WHERE Id = @Id;";
        using (IDbConnection connection = _sqlDataAccess.GetConnection())
        {
            int rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }
    }

    // Método para verificar la contraseña durante el login
    public bool VerifyPassword(string plainTextPassword, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(plainTextPassword, hashedPassword);
    }
}