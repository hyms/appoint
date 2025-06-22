using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using appoint.Domain;
using appoint.Domain.Request;
using appoint.Domain.Response;
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
                Type = user.Type,
                Role = user.Type,
                Permissions = user.Permissions
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

            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:key"]!)); // Leer de Jwt:Key (consistente)
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
            Guid newUserId = Guid.NewGuid();

            const string sql = @"
                INSERT INTO Users (Id, Email, PasswordHash, FirstName, LastName, Type, Contact, RegionCode, BloodGroup, Gender, Dob, BranchId, EmailNotificationEnabled, CreatedAt, UpdatedAt)
                VALUES (@Id, @Email, @PasswordHash, @FirstName, @LastName, @Type, @Contact, @RegionCode, @BloodGroup, @Gender, @Dob, @BranchId, @EmailNotificationEnabled, @CreatedAt, @UpdatedAt);";

            await _db.SaveData(sql, new
            {
                Id = newUserId,
                Email = request.Email,
                PasswordHash = hashedPassword,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Type = request.Role,
                Contact = request.Contact,
                RegionCode = request.RegionCode,
                BloodGroup = request.BloodGroup,
                Gender = request.Gender,
                Dob = request.Dob,
                BranchId = request.BranchId,
                EmailNotificationEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            var createdUser = new UserModel
            {
                Id = newUserId,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Type = request.Role,
                Role = request.Role,
                Permissions = (await GetPermissionsForUserAsync(newUserId)).ToList()
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
    
    public async Task<UserModel?> UpdateUserAsync(Guid id, UserRequest request)
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
            if (!string.IsNullOrEmpty(request.Password))
            {
                if (!BCrypt.Net.BCrypt.Verify(request.Password, existingUser.PasswordHash))
                {
                    passwordToUpdateHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                }
            }

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
            
            await _db.SaveData(sql, new
            {
                Email = request.Email,
                PasswordHash = passwordToUpdateHash,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Type = request.Role,
                Contact = request.Contact,
                RegionCode = request.RegionCode,
                BloodGroup = request.BloodGroup,
                Gender = request.Gender,
                Dob = request.Dob,
                BranchId = request.BranchId,
                EmailNotificationEnabled = true,
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
                Role = request.Role,
                Permissions = (await GetPermissionsForUserAsync(id)).ToList()
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
    
    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        _logger.LogInformation("Attempting to change password for user ID: {UserId}", userId);
        
        var user = await GetUserByIdAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("Password change failed: User with ID {UserId} not found.", userId);
            throw new InvalidOperationException("User not found.");
        }

        // 1. Verificar la contraseña actual
        if (!VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            _logger.LogWarning("Password change failed for user {UserId}: Invalid current password.", userId);
            throw new UnauthorizedAccessException("Invalid current password.");
        }

        // 2. Hashear la nueva contraseña
        string newHashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        // 3. Actualizar la contraseña en la base de datos
        const string sql = @"
            UPDATE Users
            SET PasswordHash = @NewPasswordHash, UpdatedAt = @UpdatedAt
            WHERE Id = @Id;";
        
        var parameters = new {
            NewPasswordHash = newHashedPassword,
            UpdatedAt = DateTime.UtcNow,
            Id = userId
        };

        int rowsAffected = await _db.SaveData(sql, parameters);

        if (rowsAffected == 0)
        {
            _logger.LogError("Password change failed: No rows affected for user ID: {UserId}", userId);
            throw new InvalidOperationException("Failed to update password.");
        }

        _logger.LogInformation("Password changed successfully for user ID: {UserId}", userId);
    }

 
    private async Task<IEnumerable<string>> GetPermissionsForUserAsync(Guid userId)
    {
        var userType = (await _db.QueryFirstOrDefaultAsync<string, dynamic>("SELECT Type FROM Users WHERE Id = @UserId", new { UserId = userId }));

        var permissions = new List<string>();

        if (userType == "Admin")
        {
            permissions.Add("manage_admin_dashboard");
            permissions.Add("manage_staff");
            permissions.Add("manage_doctors");
            permissions.Add("manage_patients");
            permissions.Add("manage_appointments");
            permissions.Add("manage_services");
            permissions.Add("manage_settings");
        }
        else if (userType == "Doctor")
        {
            permissions.Add("view_doctor_dashboard");
            permissions.Add("manage_appointments");
            permissions.Add("view_my_schedule");
            permissions.Add("manage_holidays");
        }
        else if (userType == "Patient")
        {
            permissions.Add("view_patient_dashboard");
            permissions.Add("manage_appointments");
        }
        else if (userType == "Staff")
        {
            permissions.Add("view_staff_dashboard");
        }

        _logger.LogInformation("Loaded permissions for user {UserId}: {Permissions}", userId, string.Join(", ", permissions));
        return permissions;
    }
    
    /// <summary>
    /// Actualiza el perfil de un usuario.
    /// </summary>
    /// <param name="userId">ID del usuario a actualizar.</param>
    /// <param name="request">DTO con los datos actualizados del perfil.</param>
    public async Task UpdateUserProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        _logger.LogInformation("Attempting to update profile for User ID: {UserId}", userId);

        var existingUser = await GetUserByIdAsync(userId);
        if (existingUser == null)
        {
            _logger.LogWarning("Profile update failed: User with ID {UserId} not found.", userId);
            throw new InvalidOperationException("User not found.");
        }

        // Si el email es diferente y ya existe, lanzar error
        if (!existingUser.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var userWithSameEmail = await GetUserByEmailAsync(request.Email);
            if (userWithSameEmail != null && userWithSameEmail.Id != userId)
            {
                throw new InvalidOperationException("Email already taken by another user.");
            }
        }
        
        // Ajustar la consulta SQL para MySQL con backticks
        const string sql = @"
            UPDATE `Users`
            SET FirstName = @FirstName,
                LastName = @LastName,
                Email = @Email,
                Contact = @Contact,
                RegionCode = @RegionCode,
                UpdatedAt = @UpdatedAt
            WHERE Id = @Id;";

        var parameters = new {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Contact = request.Contact,
            RegionCode = request.RegionCode,
            UpdatedAt = DateTime.UtcNow,
            Id = userId
        };

        int rowsAffected = await _db.SaveData(sql, parameters);

        if (rowsAffected == 0)
        {
            _logger.LogError("Profile update failed: No rows affected for User ID: {UserId}", userId);
            throw new InvalidOperationException("Failed to update user profile.");
        }

        _logger.LogInformation("User profile updated successfully for User ID: {UserId}", userId);
    }
    
    /// <summary>
    /// Obtiene los detalles del perfil de un usuario específico.
    /// </summary>
    /// <param name="userId">ID del usuario.</param>
    /// <returns>UserProfileDetailsResponse con los datos del perfil.</returns>
    public async Task<UserProfileDetailsResponse?> GetUserProfileAsync(Guid userId)
    {
        _logger.LogInformation("Fetching user profile for User ID: {UserId}", userId);
        // Usar GetUserByIdAsync para obtener el modelo completo del usuario
        var user = await GetUserByIdAsync(userId);

        if (user == null)
        {
            _logger.LogWarning("User profile not found for User ID: {UserId}", userId);
            return null;
        }

        return new UserProfileDetailsResponse
        {
            UserId = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Contact = user.Contact,
            RegionCode = user.RegionCode
            // Añade otros campos que quieras exponer en el perfil
        };
    }
}
