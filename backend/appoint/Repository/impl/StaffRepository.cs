using System.Data;
using appoint.Domain.Response;
using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class StaffRepository : IStaffRepository
{
    private readonly ISqlDataAccess _db;

    public StaffRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<StaffListItemModel>> GetAllStaffAsync(Guid loggedInUserId)
    {
        // NOTA: La columna 'Type' en Users es la que determina si es Staff (User::STAFF en Laravel).
        // Si tu tabla Users tiene una columna 'Role' y además una tabla 'UserRoles'
        // para manejar muchos a muchos, esta consulta necesitará un JOIN a 'UserRoles' y 'Roles'.
        // Por ahora, asumimos que 'Type = "Staff"' identifica a los miembros del personal.
        // También filtramos para excluir al usuario logueado, replicando getLogInUserId().
        const string sql = @"
            SELECT
                u.Id, u.FirstName, u.LastName, u.Email, u.EmailVerifiedAt, u.CreatedAt,
                r.Name as RoleName -- Asumiendo que 'Role' en Users puede mapearse o que haces JOIN a Roles
            FROM Users u
            LEFT JOIN UserRoles ur ON u.Id = ur.UserId -- Solo si tienes tabla UserRoles
            LEFT JOIN Roles r ON ur.RoleId = r.Id      -- Solo si tienes tabla UserRoles
            WHERE u.Type = 'Staff' AND u.Id != @LoggedInUserId;";
            // Si 'RoleName' es un campo directo en Users, usa 'u.Role as RoleName' y quita los JOINs a UserRoles/Roles.
            // Para la migración que tenemos de Users, 'Role' es un string, así que la segunda opción sería:
            // "SELECT u.Id, u.FirstName, u.LastName, u.Email, u.EmailVerifiedAt, u.CreatedAt, u.Role as RoleName FROM Users u WHERE u.Type = 'Staff' AND u.Id != @LoggedInUserId;"

        var staffs = await _db.LoadData<dynamic, dynamic>(sql, new { LoggedInUserId = loggedInUserId });

        return staffs.Select(s => new StaffListItemModel
        {
            Id = s.Id,
            FullName = $"{s.FirstName} {s.LastName}",
            Email = s.Email,
            RoleName = s.RoleName ?? "N/A", // Asegúrate de que el mapeo de RoleName sea correcto
            EmailVerifiedAt = s.EmailVerifiedAt,
            CreatedAt = s.CreatedAt
        });
    }

    public async Task<StaffDetailsResponse?> GetStaffDetailsAsync(Guid staffId)
    {
        // Esta consulta debe cargar los detalles del usuario y sus permisos
        const string sql = @"
            SELECT
                u.Id, u.FirstName, u.LastName, u.Email, u.RegionCode, u.Contact, u.Gender, u.CreatedAt, u.UpdatedAt,
                r.Name as RoleName, -- Nombre del rol principal del usuario
                p.Id as PermissionId, p.Name as PermissionName, p.GuardName as PermissionGuardName -- Detalles de los permisos
            FROM Users u
            LEFT JOIN UserRoles ur ON u.Id = ur.UserId
            LEFT JOIN Roles r ON ur.RoleId = r.Id
            LEFT JOIN RolePermissions rp ON r.Id = rp.RoleId
            LEFT JOIN Permissions p ON rp.PermissionId = p.Id
            WHERE u.Id = @StaffId AND u.Type = 'Staff';";
            // Si la columna 'Role' es string en Users: 'u.Role as RoleName' y quita JOINs a Roles/RolePermissions/Permissions

        var staffDictionary = new Dictionary<Guid, StaffDetailsResponse>();

        using (IDbConnection connection = _db.GetConnection())
        {
            var result = await connection.QueryAsync<UserModel, PermissionModel, StaffDetailsResponse>(
                sql,
                (user, permission) =>
                {
                    // Si el StaffDetailsResponse ya ha sido creado para este usuario
                    if (!staffDictionary.TryGetValue(user.Id, out var currentStaffDetails))
                    {
                        currentStaffDetails = new StaffDetailsResponse
                        {
                            Id = user.Id,
                            FullName = $"{user.FirstName} {user.LastName}",
                            Email = user.Email,
                            RoleName = user.Role, // Si 'Role' es string en Users
                            RegionCode = user.RegionCode,
                            Contact = user.Contact,
                            Gender = user.Gender,
                            CreatedAt = user.CreatedAt,
                            UpdatedAt = user.UpdatedAt,
                            Permissions = new List<PermissionModel>()
                        };
                        staffDictionary.Add(currentStaffDetails.Id, currentStaffDetails);
                    }

                    if (permission != null && permission.Id != Guid.Empty)
                    {
                        currentStaffDetails.Permissions!.Add(permission);
                    }
                    return currentStaffDetails;
                },
                param: new { StaffId = staffId },
                splitOn: "PermissionId" // Punto de división para el mapeo
            );
        }

        return staffDictionary.Values.FirstOrDefault();
    }
    
    public async Task<UserModel?> GetUserByIdAsync(Guid userId)
    {
        // Utiliza el método existente en UserRepository o duplica la lógica si UserRepository no existe/no es accesible
        // En un proyecto más grande, User/Staff podrían usar un UserRepository común para operaciones de usuario base.
        const string sql = "SELECT Id, Email, PasswordHash, Role, FirstName, LastName, Type, EmailVerifiedAt, Contact, RegionCode, BloodGroup, Gender, Dob, CreatedAt, UpdatedAt FROM Users WHERE Id = @Id";
        using (var connection = _db.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Id = userId });
        }
    }

    public async Task<Guid> AddStaffAsync(UserModel user, Guid roleId)
    {
        // Asumiendo que UserModel ya tiene PasswordHash (contraseña encriptada) y otras propiedades
        user.Id = Guid.NewGuid();
        user.Type = "Staff"; // Establecer el tipo de usuario como "Staff"
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Insertar el usuario
                    const string insertUserSql = @"
                        INSERT INTO Users (Id, Email, PasswordHash, Role, FirstName, LastName, Type, EmailVerifiedAt, Contact, RegionCode, BloodGroup, Gender, Dob, CreatedAt, UpdatedAt)
                        VALUES (@Id, @Email, @PasswordHash, @Role, @FirstName, @LastName, @Type, @EmailVerifiedAt, @Contact, @RegionCode, @BloodGroup, @Gender, @Dob, @CreatedAt, @UpdatedAt)";
                    await connection.ExecuteAsync(insertUserSql, user, transaction: transaction);

                    // Asignar el rol al usuario en la tabla pivote UserRoles
                    // (Esta parte es CRÍTICA y asume que tienes una tabla UserRoles con FKs a Users y Roles)
                    const string assignRoleSql = "INSERT INTO UserRoles (UserId, RoleId) VALUES (@UserId, @RoleId)";
                    await connection.ExecuteAsync(assignRoleSql, new { UserId = user.Id, RoleId = roleId }, transaction: transaction);

                    transaction.Commit();
                    return user.Id;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    public async Task UpdateStaffAsync(UserModel user, Guid roleId)
    {
        user.UpdatedAt = DateTime.UtcNow;

        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Actualizar el usuario
                    const string updateUserSql = @"
                        UPDATE Users SET
                            Email = @Email, FirstName = @FirstName, LastName = @LastName,
                            Contact = @Contact, RegionCode = @RegionCode, Gender = @Gender,
                            UpdatedAt = @UpdatedAt, Role = @Role -- Asumiendo que Role es string en Users
                        WHERE Id = @Id";
                    await connection.ExecuteAsync(updateUserSql, user, transaction: transaction);

                    // Si la contraseña ha sido proporcionada, actualizarla.
                    if (!string.IsNullOrEmpty(user.PasswordHash) && BCrypt.Net.BCrypt.Verify(user.PasswordHash, ((await connection.QueryFirstOrDefaultAsync<UserModel>("SELECT PasswordHash FROM Users WHERE Id = @Id", new { Id = user.Id }))!).PasswordHash))
                    {
                        const string updatePasswordSql = "UPDATE Users SET PasswordHash = @PasswordHash, UpdatedAt = @UpdatedAt WHERE Id = @Id";
                        await connection.ExecuteAsync(updatePasswordSql, new { user.PasswordHash, UpdatedAt = DateTime.UtcNow, Id = user.Id }, transaction: transaction);
                    }

                    // Actualizar el rol del usuario en la tabla pivote UserRoles
                    // Primero, eliminar los roles existentes para este usuario (para simplificar la sincronización)
                    const string deleteExistingRolesSql = "DELETE FROM UserRoles WHERE UserId = @UserId";
                    await connection.ExecuteAsync(deleteExistingRolesSql, new { UserId = user.Id }, transaction: transaction);
                    
                    // Luego, asignar el nuevo rol
                    const string assignNewRoleSql = "INSERT INTO UserRoles (UserId, RoleId) VALUES (@UserId, @RoleId)";
                    await connection.ExecuteAsync(assignNewRoleSql, new { UserId = user.Id, RoleId = roleId }, transaction: transaction);

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    public async Task DeleteStaffAsync(Guid staffId)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Eliminar registros dependientes del usuario (si los hay)
                    // (Ej. citas, visitas, etc. - si tienen FK a Users o si el Staff tiene tablas propias)
                    // Basado en el controlador Laravel, solo se elimina el User.
                    
                    // Eliminar entradas en la tabla pivote UserRoles
                    await connection.ExecuteAsync("DELETE FROM UserRoles WHERE UserId = @UserId", new { UserId = staffId }, transaction: transaction);

                    // Eliminar el usuario
                    await connection.ExecuteAsync("DELETE FROM Users WHERE Id = @UserId", new { UserId = staffId }, transaction: transaction);

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    public async Task<IEnumerable<RoleModel>> GetAvailableRolesAsync()
    {
        // Obtiene todos los roles, excluyendo "paciente" y "doctor" si son roles exclusivos de otros flujos.
        // Asumimos que los roles de Staff son los que no son 'Patient' o 'Doctor'.
        const string sql = "SELECT Id, Name FROM Roles WHERE Name != 'Patient' AND Name != 'Doctor'";
        return await _db.LoadData<RoleModel, dynamic>(sql, new { });
    }

    public async Task UpdateEmailVerifiedStatusAsync(Guid userId, bool isVerified)
    {
        const string sql = "UPDATE Users SET EmailVerifiedAt = @EmailVerifiedAt, UpdatedAt = @UpdatedAt WHERE Id = @UserId";
        await _db.SaveData(sql, new { EmailVerifiedAt = isVerified ? DateTime.UtcNow : (DateTime?)null, UpdatedAt = DateTime.UtcNow, UserId = userId });
    }

    public async Task UpdateEmailNotificationAsync(Guid userId, bool enableNotification)
    {
        // Asumiendo que existe una columna 'EmailNotification' (bool) en tu tabla Users
        const string sql = "UPDATE Users SET EmailNotification = @EmailNotification, UpdatedAt = @UpdatedAt WHERE Id = @UserId";
        await _db.SaveData(sql, new { EmailNotification = enableNotification, UpdatedAt = DateTime.UtcNow, UserId = userId });
    }

    public async Task<bool> IsEmailVerifiedAsync(Guid userId)
    {
        const string sql = "SELECT COUNT(Id) FROM Users WHERE Id = @UserId AND EmailVerifiedAt IS NOT NULL";
        var count = await _db.LoadData<int, dynamic>(sql, new { UserId = userId });
        return count.FirstOrDefault() > 0;
    }
}