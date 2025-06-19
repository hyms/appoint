using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using appoint.Domain;
using appoint.Domain.Request;
using appoint.Infrastructure;
using appoint.Models;
using Dapper;
using Microsoft.IdentityModel.Tokens;

namespace appoint.Services.implement;

public class UserService : IUserService
{
    private readonly ISqlDataAccess _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<UserService> _logger; // Inyectar ILogger

    public UserService(ISqlDataAccess db, IConfiguration configuration, ILogger<UserService> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<UserModel?> Authenticate(string email, string password) // Cambiado a Task<UserModel?>
    {
        _logger.LogInformation("Attempting to authenticate user with email: {Email}", email);
        try
        {
            // Obtener el usuario por email
            var user = await GetUserByEmailAsync(email);

            // Verificar si el usuario existe y la contraseña es correcta
            if (user == null || !VerifyPassword(password, user.PasswordHash))
            {
                _logger.LogWarning("Authentication failed for email '{Email}': Invalid credentials.", email);
                return null; // Autenticación fallida
            }

            _logger.LogInformation("Authentication successful for user ID: {UserId}", user.Id);
            // Autenticación exitosa, devolver el usuario (sin el PasswordHash)
            return new UserModel
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Type = user.Type, // Devolver el 'Type' que es el rol principal del usuario
                // Rol (siempre es el mismo que el tipo en este contexto, pero podría venir de UserRoles)
                Role = user.Type // Usamos Type como Role para compatibilidad con JWT claim.
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during authentication for email: {Email}", email);
            throw; // Re-lanzar la excepción
        }
    }

    public string GenerateJwtToken(UserModel user)
    {
        _logger.LogInformation("Generating JWT token for user ID: {UserId}", user.Id);
        try
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.GivenName, user.FirstName),
                new Claim(ClaimTypes.Surname, user.LastName),
                new Claim(ClaimTypes.Role, user.Type) // Usar el 'Type' del usuario como rol en el token
                // Puedes añadir más claims aquí, como los permisos del usuario si los recuperas
            };

            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]!)); // Leer de Jwt:Key (consistente)
            var signingCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(24), // Ajusta la expiración según sea necesario
                SigningCredentials = signingCredentials,
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            _logger.LogInformation("JWT token generated successfully for user ID: {UserId}", user.Id);
            return tokenHandler.WriteToken(token);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating JWT token for user ID: {UserId}", user.Id);
            throw;
        }
    }

    public async Task<IEnumerable<UserModel>> GetAllUsersAsync()
    {
        _logger.LogInformation("Attempting to retrieve all users.");
        try
        {
            // Seleccionar todas las columnas necesarias.
            // Asegúrate de que el nombre de la columna "Type" en la base de datos se mapee correctamente a "Role" en el UserModel,
            // o usa "Type" en UserModel.
            const string sql = "SELECT Id, Email, PasswordHash, FirstName, LastName, Type, EmailVerifiedAt, Contact, RegionCode, BloodGroup, Gender, Dob, BranchId, EmailNotificationEnabled, CreatedAt, UpdatedAt FROM Users";
            var users = await _db.LoadData<UserModel, dynamic>(sql, new { });
            _logger.LogInformation("Successfully retrieved {UserCount} users.", users.Count());
            return users;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all users.");
            throw;
        }
    }

    public async Task<UserModel?> GetUserByIdAsync(Guid id) // Cambio a Task<UserModel?>
    {
        _logger.LogInformation("Attempting to retrieve user with ID: {UserId}", id);
        try
        {
            // Incluir PasswordHash si es necesario para autenticación interna
            const string sql = "SELECT Id, Email, PasswordHash, FirstName, LastName, Type FROM Users WHERE Id = @Id";
            using (var connection = _db.GetConnection())
            {
                var user = await connection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Id = id });
                if (user == null)
                {
                    _logger.LogWarning("User with ID: {UserId} not found.", id);
                }
                else
                {
                    _logger.LogInformation("Successfully retrieved user with ID: {UserId}", id);
                }

                return user;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user with ID: {UserId}", id);
            throw;
        }
    }

    public async Task<UserModel?> GetUserByEmailAsync(string email) // Cambio a Task<UserModel?>
    {
        _logger.LogInformation("Attempting to retrieve user by email: {Email}", email);
        try
        {
            const string sql = "SELECT Id, Email, PasswordHash, FirstName, LastName, Type FROM Users WHERE Email = @Email";
            using (var connection = _db.GetConnection())
            {
                var user = await connection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Email = email });
                if (user == null)
                {
                    _logger.LogWarning("User with email: {Email} not found.", email);
                }
                else
                {
                    _logger.LogInformation("Successfully retrieved user by email: {Email}", email);
                }

                return user;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by email: {Email}", email);
            throw;
        }
    }

    public async Task<UserModel> CreateUserAsync(UserRequest request)
    {
        _logger.LogInformation("Attempting to create a new user with email: {Email}", request.Email);
        try
        {
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
            Guid newUserId = Guid.NewGuid(); // Generar un nuevo GUID para el ID

            // Asegúrate de que UserRequest tenga todos los campos necesarios para la inserción
            // y que los nombres de las columnas en SQL coincidan con las propiedades del objeto anónimo
            const string sql = @"
                INSERT INTO Users (Id, Email, PasswordHash, FirstName, LastName, Type, Contact, RegionCode, BloodGroup, Gender, Dob, BranchId, EmailNotificationEnabled, CreatedAt, UpdatedAt)
                VALUES (@Id, @Email, @PasswordHash, @FirstName, @LastName, @Type, @Contact, @RegionCode, @BloodGroup, @Gender, @Dob, @BranchId, @EmailNotificationEnabled, @CreatedAt, @UpdatedAt);";

            // Se asume que UserRequest contiene los datos completos para crear un usuario.
            // Si BranchId no viene en UserRequest, necesitarás un valor por defecto o pasarlo de otra forma.
            // Si no estás usando BranchId en tu UserRequest, necesitarás modificar esto.
            // Por simplicidad, asumimos que UserRequest ahora incluye BranchId.
            // Y que el Role de UserRequest mapea directamente al Type de UserModel
            await _db.SaveData(sql, new
            {
                Id = newUserId,
                Email = request.Email,
                PasswordHash = hashedPassword,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Type = request.Role, // Usar el Role de Request como Type de UserModel
                Contact = request.Contact,
                RegionCode = request.RegionCode,
                BloodGroup = request.BloodGroup,
                Gender = request.Gender,
                Dob = request.Dob,
                // Si UserRequest no tiene BranchId, necesitarás obtenerlo o asignarlo aquí.
                // Asumiendo que BranchId es obligatorio y viene de UserRequest.
                BranchId = request.BranchId, // ESTO ES CRÍTICO: Debe venir del request o ser un valor por defecto.
                EmailNotificationEnabled = true, // Por defecto activado
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            // Retorna un UserModel que no contiene el hash de la contraseña
            var createdUser = new UserModel
            {
                Id = newUserId,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Type = request.Role, // El tipo de usuario creado
                Role = request.Role // Para compatibilidad
            };
            _logger.LogInformation("Successfully created user with ID: {UserId} and email: {Email}", createdUser.Id, createdUser.Email);
            return createdUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user with email: {Email}", request.Email);
            throw;
        }
    }

    public async Task<UserModel?> UpdateUserAsync(Guid id, UserRequest request) // Cambio a Task<UserModel?>
    {
        _logger.LogInformation("Attempting to update user with ID: {UserId}", id);
        try
        {
            var existingUser = await GetUserByIdAsync(id);
            if (existingUser == null)
            {
                _logger.LogWarning("User update failed: User with ID: {UserId} not found.", id);
                return null;
            }

            string passwordToUpdateHash = existingUser.PasswordHash;
            // Solo actualiza la contraseña si se proporciona una nueva y es diferente de la actual.
            if (!string.IsNullOrEmpty(request.Password))
            {
                if (!BCrypt.Net.BCrypt.Verify(request.Password, existingUser.PasswordHash))
                {
                    passwordToUpdateHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                }
            }

            // Actualizar SQL para incluir todos los campos del UserRequest
            const string sql = @"
                UPDATE Users 
                SET Email = @Email, 
                    PasswordHash = @PasswordHash, 
                    FirstName = @FirstName, 
                    LastName = @LastName, 
                    Type = @Type, 
                    Contact = @Contact, 
                    RegionCode = @RegionCode, 
                    BloodGroup = @BloodGroup, 
                    Gender = @Gender, 
                    Dob = @Dob, 
                    BranchId = @BranchId,
                    EmailNotificationEnabled = @EmailNotificationEnabled,
                    UpdatedAt = @UpdatedAt
                WHERE Id = @Id;";
            
            // Asegúrate de que UserRequest tenga BranchId y EmailNotificationEnabled
            // Si tu UserRequest no tiene BranchId, necesitarás obtener el BranchId existente
            // y pasarlo, o ajustarlo si la actualización de BranchId no está permitida por este DTO.
            await _db.SaveData(sql, new
            {
                Email = request.Email,
                PasswordHash = passwordToUpdateHash,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Type = request.Role, // Usar el Role de Request como Type de UserModel
                Contact = request.Contact,
                RegionCode = request.RegionCode,
                BloodGroup = request.BloodGroup,
                Gender = request.Gender,
                Dob = request.Dob,
                BranchId = request.BranchId, // CRÍTICO: Debe venir del request o del existingUser.BranchId
                EmailNotificationEnabled = true, // Asumimos que no cambia por este DTO
                UpdatedAt = DateTime.UtcNow,
                Id = id
            });

            var updatedUser = new UserModel
            {
                Id = id,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Type = request.Role,
                Role = request.Role
            };
            _logger.LogInformation("Successfully updated user with ID: {UserId}", id);
            return updatedUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user with ID: {UserId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        _logger.LogInformation("Attempting to delete user with ID: {UserId}", id);
        try
        {
            // Antes de eliminar el usuario, debes considerar eliminar registros dependientes en otras tablas
            // para evitar errores de integridad referencial. Esto debe hacerse en una transacción.
            // Por ejemplo: UserRoles, Patients, Doctors, Staff, Notifications, Qualifications.
            // Para una eliminación completa del usuario, la lógica de negocio debería estar en un servicio
            // de más alto nivel que coordine la eliminación de todas las entidades relacionadas.
            // Por ahora, solo elimina el usuario directamente.

            const string sql = "DELETE FROM Users WHERE Id = @Id;";
            await _db.SaveData(sql, new { Id = id });
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user with ID: {UserId}", id);
            throw;
        }
    }

    public bool VerifyPassword(string plainTextPassword, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(plainTextPassword, hashedPassword);
    }
}
