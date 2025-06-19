using System.Data;
using appoint.Domain.Response;
using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class DoctorRepository : IDoctorRepository
{
    private readonly ISqlDataAccess _db;

    public DoctorRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<DoctorListItemModel>> GetAllDoctorListItemsAsync(string? statusFilter = null)
    {
        // Consulta para obtener la lista de doctores con datos de usuario para el índice.
        // Se une con Users y Branches para obtener el BranchName.
        var sql = @"
            SELECT d.Id, d.UserId,
                   u.FirstName, u.LastName, u.Email, u.EmailVerifiedAt, u.CreatedAt, u.Type as UserType,
                   b.Name as BranchName, -- Obtener el nombre de la sucursal
                   CASE WHEN u.Type = 'Doctor' THEN TRUE ELSE FALSE END AS IsActive -- Mapeo simple del estado
            FROM Doctors d
            JOIN Users u ON d.UserId = u.Id
            JOIN Branches b ON u.BranchId = b.Id -- Unir con Branches
            WHERE u.Type = 'Doctor'"; // Filtrar por tipo de usuario 'Doctor'

        var parameters = new DynamicParameters();

        // Lógica de filtrado por estado (si 'status' es un campo booleano en Users)
        // O si 'Type' en Users es el indicador de estado.
        // Aquí asumimos que 'Type = Doctor' implica activo. Si hay otro campo de estado, se ajustaría.
        if (!string.IsNullOrEmpty(statusFilter))
        {
            if (statusFilter.Equals("active", StringComparison.OrdinalIgnoreCase))
            {
                // Si tienes una columna IsActive/Status en Users:
                // sql += " AND u.IsActive = TRUE";
            }
            else if (statusFilter.Equals("inactive", StringComparison.OrdinalIgnoreCase))
            {
                // sql += " AND u.IsActive = FALSE";
            }
        }

        var doctors = await _db.LoadData<dynamic, DynamicParameters>(sql, parameters);

        return doctors.Select(d => new DoctorListItemModel
        {
            Id = d.Id,
            UserId = d.UserId,
            FullName = $"{d.FirstName} {d.LastName}",
            Email = d.Email,
            IsActive = d.IsActive, // Mapeado de la columna IsActive (o lógica basada en Type)
            EmailVerifiedAt = d.EmailVerifiedAt,
            CreatedAt = d.CreatedAt,
        });
    }

    public async Task<DoctorModel?> GetDoctorByIdAsync(Guid doctorId)
    {
        // Consulta compleja para cargar Doctor, User, Branch y Specializations (muchos a muchos)
        const string sql = @"
            SELECT
                d.Id, d.UserId, d.Experience, d.TwitterUrl, d.LinkedinUrl, d.InstagramUrl,
                u.Id as UserId_Alias, u.Email, u.PasswordHash, u.Role, u.FirstName, u.LastName, u.Type, u.EmailVerifiedAt, u.Contact, u.RegionCode, u.BloodGroup, u.Gender, u.Dob,
                u.EmailNotificationEnabled, u.CreatedAt AS UserCreatedAt, u.UpdatedAt AS UserUpdatedAt, u.BranchId,
                b.Id AS BranchId_Alias, b.Name AS BranchName, b.AddressLine1 AS BranchAddress1, b.AddressLine2 AS BranchAddress2,
                b.City AS BranchCity, b.State AS BranchState, b.Country AS BranchCountry, b.PostalCode AS BranchPostalCode,
                b.PhoneNumber AS BranchPhoneNumber, b.Email AS BranchEmail, b.IsActive AS BranchIsActive, b.CreatedAt AS BranchCreatedAt, b.UpdatedAt AS BranchUpdatedAt,
                ds.SpecializationId, s.Id as SpecializationId_Alias, s.Name as SpecializationName -- Aliases para mapeo de Specialization
            FROM Doctors d
            JOIN Users u ON d.UserId = u.Id
            JOIN Branches b ON u.BranchId = b.Id -- Unir con Branches
            LEFT JOIN DoctorSpecializations ds ON d.Id = ds.DoctorId
            LEFT JOIN Specializations s ON ds.SpecializationId = s.Id
            WHERE d.Id = @DoctorId;";

        DoctorModel? doctor = null;
        using (IDbConnection connection = _db.GetConnection())
        {
            await connection.QueryAsync<DoctorModel, UserModel, BranchModel, SpecializationModel, DoctorModel>(
                sql,
                (doc, user, branch, specialization) =>
                {
                    if (doctor == null)
                    {
                        doctor = doc;
                        doctor.User = user;
                        doctor.User.Branch = branch; // Asigna la sucursal al usuario
                        doctor.IsActive = user?.Type == "Doctor"; // Mapeo de estado
                        doctor.Specializations = new List<SpecializationModel>();
                        doctor.Qualifications =
                            new List<QualificationModel>(); // Inicializa calificaciones si se cargan aquí
                    }

                    if (specialization != null && specialization.Id != Guid.Empty)
                    {
                        doctor.Specializations!.Add(specialization);
                    }

                    return doctor;
                },
                param: new { DoctorId = doctorId },
                splitOn: "UserId_Alias,BranchId_Alias,SpecializationId_Alias" // Puntos de división en la consulta
            );
        }

        return doctor;
    }

    public async Task<DoctorDetailsResponse?> GetDoctorDetailsAsync(Guid doctorId, Guid loggedInUserId)
    {
        var doctor = await GetDoctorByIdAsync(doctorId);
        if (doctor == null || doctor.User == null || doctor.User.Branch == null)
        {
            return null;
        }

        // Obtener conteos de citas (ejemplo simplificado)
        var totalAppointments = (await _db.LoadData<int, dynamic>(
                "SELECT COUNT(Id) FROM Appointments WHERE DoctorId = @DoctorId", new { DoctorId = doctorId }))
            .FirstOrDefault();
        var todayAppointments = (await _db.LoadData<int, dynamic>(
            "SELECT COUNT(Id) FROM Appointments WHERE DoctorId = @DoctorId AND Date = CURDATE()",
            new { DoctorId = doctorId })).FirstOrDefault();
        var upcomingAppointments = (await _db.LoadData<int, dynamic>(
            "SELECT COUNT(Id) FROM Appointments WHERE DoctorId = @DoctorId AND Date >= CURDATE() AND Status = 1",
            new { DoctorId = doctorId })).FirstOrDefault(); // Asumiendo Status = 1 es 'Booked'

        // Obtener calificaciones
        var qualifications = await GetUserQualificationsAsync(doctor.UserId);

        // Lógica para 'permission' y 'patient_role' del usuario logueado
        // Esto requerirá una inyección de un servicio de autenticación/autorización
        // Temporalmente, lo simulamos:
        using (var connection = _db.GetConnection())
        {
            var loggedInUser =
                await connection.QueryFirstOrDefaultAsync<UserModel>("SELECT Role, Type FROM Users WHERE Id = @UserId",
                    new { UserId = loggedInUserId });
            bool hasDoctorOrAdminPermission =
                loggedInUser != null &&
                (loggedInUser.Role == "Doctor" ||
                 loggedInUser.Role == "Admin"); // O un chequeo más granular de permisos
            bool isPatientRole = loggedInUser != null && loggedInUser.Role == "Patient";

            return new DoctorDetailsResponse
            {
                Id = doctor.Id,
                UserId = doctor.UserId,
                RoleName = doctor.User.Role,
                Email = doctor.User.Email,
                RegionCode = doctor.User.RegionCode,
                Contact = doctor.User.Contact,
                TotalAppointmentCount = totalAppointments,
                TodayAppointmentCount = todayAppointments,
                UpcomingAppointmentCount = upcomingAppointments,
                HasDoctorOrAdminPermission = hasDoctorOrAdminPermission,
                IsPatientRole = isPatientRole,
                Specializations = doctor.Specializations,
                BloodGroup = doctor.User.BloodGroup,
                Gender = doctor.User.Gender,
                Dob = doctor.User.Dob,
                BranchId = doctor.User.BranchId, // Incluir BranchId
                BranchName = doctor.User.Branch.Name, // Incluir BranchName
                BranchAddress1 = doctor.User.Branch.AddressLine1, // Incluir BranchAddress1
                CreatedAt = doctor.User.CreatedAt,
                UpdatedAt = doctor.User.UpdatedAt,
                TwitterUrl = doctor.TwitterUrl,
                LinkedinUrl = doctor.LinkedinUrl,
                InstagramUrl = doctor.InstagramUrl,
                Qualifications = qualifications.ToList()
            };
        }
    }

    public async Task<DoctorModel?> GetDoctorByUserIdAsync(Guid userId)
    {
        // Obtener el DoctorModel y los datos de usuario y sucursal.
        const string sql = @"
            SELECT
                d.Id, d.UserId, d.Experience, d.TwitterUrl, d.LinkedinUrl, d.InstagramUrl,
                u.Id AS UserId_Alias, u.Email, u.PasswordHash, u.Role, u.FirstName, u.LastName, u.Type, u.EmailVerifiedAt, u.Contact, u.RegionCode, u.BloodGroup, u.Gender, u.Dob,
                u.EmailNotificationEnabled, u.CreatedAt AS UserCreatedAt, u.UpdatedAt AS UserUpdatedAt, u.BranchId,
                b.Id AS BranchId_Alias, b.Name AS BranchName, b.AddressLine1 AS BranchAddress1
            FROM Doctors d
            JOIN Users u ON d.UserId = u.Id
            JOIN Branches b ON u.BranchId = b.Id
            WHERE u.Id = @UserId AND u.Type = 'Doctor'";

        DoctorModel? doctor = null;
        using (IDbConnection connection = _db.GetConnection())
        {
            await connection.QueryAsync<DoctorModel, UserModel, BranchModel, DoctorModel>(
                sql,
                (doc, user, branch) =>
                {
                    if (doctor == null)
                    {
                        doctor = doc;
                        doctor.User = user;
                        doctor.User.Branch = branch;
                    }

                    return doctor;
                },
                param: new { UserId = userId },
                splitOn: "UserId_Alias,BranchId_Alias"
            );
        }

        return doctor;
    }

    public async Task<Guid> AddDoctorAsync(DoctorModel doctor, UserModel user, IEnumerable<Guid>? specializationIds)
    {
        // Transacción para asegurar la consistencia entre Users y Doctors
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // 1. Insertar Usuario
                    user.Id = Guid.NewGuid();
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
                    user.Type = "Doctor"; // Asegurar el tipo
                    user.Role = "Doctor"; // Asignar rol por defecto
                    user.EmailVerifiedAt = DateTime.UtcNow; // Asumiendo verificación inmediata
                    user.EmailNotificationEnabled = true; // Por defecto activo
                    user.CreatedAt = DateTime.UtcNow;
                    user.UpdatedAt = DateTime.UtcNow;
                    // BranchId ya debería venir en el UserModel pasado

                    const string insertUserSql = @"
                        INSERT INTO Users (Id, Email, PasswordHash, Role, FirstName, LastName, Type, EmailVerifiedAt, Contact, RegionCode, BloodGroup, Gender, Dob, BranchId, EmailNotificationEnabled, CreatedAt, UpdatedAt)
                        VALUES (@Id, @Email, @PasswordHash, @Role, @FirstName, @LastName, @Type, @EmailVerifiedAt, @Contact, @RegionCode, @BloodGroup, @Gender, @Dob, @BranchId, @EmailNotificationEnabled, @CreatedAt, @UpdatedAt)";
                    await connection.ExecuteAsync(insertUserSql, user, transaction: transaction);

                    // 2. Asignar rol "Doctor" al usuario en la tabla UserRoles (si usas el sistema RBAC completo)
                    var doctorRole =
                        await connection.QueryFirstOrDefaultAsync<RoleModel>(
                            "SELECT Id, Name FROM Roles WHERE Name = 'Doctor'", transaction: transaction);
                    if (doctorRole == null)
                    {
                        throw new InvalidOperationException(
                            "Default 'Doctor' role not found. Please ensure it exists in the Roles table.");
                    }

                    await connection.ExecuteAsync("INSERT INTO UserRoles (UserId, RoleId) VALUES (@UserId, @RoleId)",
                        new { UserId = user.Id, RoleId = doctorRole.Id }, transaction: transaction);

                    // 3. Insertar Doctor
                    doctor.Id = Guid.NewGuid();
                    doctor.UserId = user.Id;
                    // CreatedAt/UpdatedAt para DoctorModel si existen en la migración
                    await connection.ExecuteAsync(
                        "INSERT INTO Doctors (Id, UserId, Experience, TwitterUrl, LinkedinUrl, InstagramUrl) VALUES (@Id, @UserId, @Experience, @TwitterUrl, @LinkedinUrl, @InstagramUrl)",
                        doctor, transaction: transaction);

                    // 4. Asignar Especializaciones
                    if (specializationIds != null && specializationIds.Any())
                    {
                        var sqlValues = string.Join(",", specializationIds.Select(id => $"('{doctor.Id}', '{id}')"));
                        var insertDoctorSpecializationsSql =
                            $"INSERT INTO DoctorSpecializations (DoctorId, SpecializationId) VALUES {sqlValues}";
                        await connection.ExecuteAsync(insertDoctorSpecializationsSql, transaction: transaction);
                    }

                    transaction.Commit();
                    return doctor.Id;
                }
                catch
                {
                    transaction.Rollback();
                    throw; // Re-lanzar la excepción
                }
            }
        }
    }

    public async Task UpdateDoctorAsync(DoctorModel doctor, UserModel user, IEnumerable<Guid>? specializationIds)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // 1. Actualizar Usuario
                    user.UpdatedAt = DateTime.UtcNow;
                    const string updateUserSql = @"
                        UPDATE Users SET
                            Email = @Email, FirstName = @FirstName, LastName = @LastName,
                            Contact = @Contact, RegionCode = @RegionCode, BloodGroup = @BloodGroup,
                            Gender = @Gender, Dob = @Dob, BranchId = @BranchId, UpdatedAt = @UpdatedAt
                        WHERE Id = @Id";
                    await connection.ExecuteAsync(updateUserSql, user, transaction: transaction);

                    // Si la contraseña ha sido cambiada y se proporciona
                    // El `user.PasswordHash` que viene del DTO ya debe estar hasheado si se cambió.
                    // Aquí la lógica de Laravel era `!Hash::check($input['current_password'], $user->password)`
                    // En .NET, si el PasswordHash no está vacío en el DTO, asumimos que es una nueva contraseña y la actualizamos.
                    // Podrías necesitar verificar si `user.PasswordHash` es diferente del actual en la DB.
                    if (!string.IsNullOrEmpty(user
                            .PasswordHash)) // Asumimos que si tiene valor, es nueva/actualizada y ya hasheada.
                    {
                        // Solo actualiza si el hash es diferente (para evitar re-hashear el mismo hash)
                        var currentPasswordHash = (await connection.QueryFirstOrDefaultAsync<string>(
                            "SELECT PasswordHash FROM Users WHERE Id = @Id", new { Id = user.Id },
                            transaction: transaction));
                        if (currentPasswordHash == null ||
                            !BCrypt.Net.BCrypt.Verify(user.PasswordHash,
                                currentPasswordHash)) // Compara el nuevo hash con el actual si existe
                        {
                            const string updatePasswordSql =
                                "UPDATE Users SET PasswordHash = @PasswordHash, UpdatedAt = @UpdatedAt WHERE Id = @Id";
                            await connection.ExecuteAsync(updatePasswordSql,
                                new { user.PasswordHash, UpdatedAt = DateTime.UtcNow, Id = user.Id },
                                transaction: transaction);
                        }
                    }

                    // 2. Actualizar Doctor
                    const string updateDoctorSql = @"
                        UPDATE Doctors SET
                            Experience = @Experience, TwitterUrl = @TwitterUrl, LinkedinUrl = @LinkedinUrl, InstagramUrl = @InstagramUrl
                        WHERE Id = @Id";
                    await connection.ExecuteAsync(updateDoctorSql, doctor, transaction: transaction);

                    // 3. Sincronizar Especializaciones
                    await AssignSpecializationsToDoctorInternalAsync(doctor.Id, specializationIds, transaction);

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


    public async Task DeleteDoctorAsync(Guid doctorId)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Obtener el UserId asociado al doctor
                    var doctor = await connection.QueryFirstOrDefaultAsync<DoctorModel>(
                        "SELECT UserId FROM Doctors WHERE Id = @DoctorId", new { DoctorId = doctorId },
                        transaction: transaction);
                    if (doctor == null) throw new InvalidOperationException("Doctor not found.");

                    // Verificar citas y visitas existentes antes de eliminar (replicando Laravel)
                    // (Esta lógica de conteo podría estar en AppointmentRepository y VisitRepository)
                    var existAppointment = await connection.QueryFirstOrDefaultAsync<int>(
                        "SELECT COUNT(Id) FROM Appointments WHERE DoctorId = @DoctorId", new { DoctorId = doctorId },
                        transaction: transaction) > 0;
                    var existVisit = await connection.QueryFirstOrDefaultAsync<int>(
                        "SELECT COUNT(Id) FROM Visits WHERE DoctorId = @DoctorId", new { DoctorId = doctorId },
                        transaction: transaction) > 0;

                    if (existAppointment || existVisit)
                    {
                        throw new InvalidOperationException(
                            "Doctor cannot be deleted as there are existing appointments or visits.");
                    }

                    // Eliminar registros dependientes
                    // Eliminar especializaciones del doctor
                    await connection.ExecuteAsync("DELETE FROM DoctorSpecializations WHERE DoctorId = @DoctorId",
                        new { DoctorId = doctorId }, transaction: transaction);

                    // Eliminar calificaciones del usuario/doctor (asumiendo FK a UserId)
                    await connection.ExecuteAsync("DELETE FROM Qualifications WHERE UserId = @UserId",
                        new { UserId = doctor.UserId }, transaction: transaction);

                    // Eliminar doctor
                    await connection.ExecuteAsync("DELETE FROM Doctors WHERE Id = @DoctorId",
                        new { DoctorId = doctorId }, transaction: transaction);

                    // Eliminar entradas en la tabla pivote UserRoles para este usuario
                    await connection.ExecuteAsync("DELETE FROM UserRoles WHERE UserId = @UserId",
                        new { UserId = doctor.UserId }, transaction: transaction);

                    // Finalmente, eliminar el usuario
                    await connection.ExecuteAsync("DELETE FROM Users WHERE Id = @UserId",
                        new { UserId = doctor.UserId }, transaction: transaction);

                    // NOTA: La funcionalidad de `doctor->user->media()->delete()` de Laravel
                    // NO SE HA INCLUIDO aquí porque no se ha definido un sistema de gestión de archivos/media.
                    // Si necesitas esto, deberías implementarlo aparte (tabla `Media`, lógica de almacenamiento).

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

    public async Task UpdateDoctorStatusAsync(Guid userId, bool isActive)
    {
        // Asumiendo que existe una columna 'IsActive' (bool) en tu tabla Users para controlar el estado.
        // Si no existe y 'Type = Doctor' es el indicador de activo, esta lógica sería diferente.
        const string sql = "UPDATE Users SET IsActive = @IsActive, UpdatedAt = @UpdatedAt WHERE Id = @UserId";
        await _db.SaveData(sql, new { IsActive = isActive, UpdatedAt = DateTime.UtcNow, UserId = userId });
    }

    public async Task<IEnumerable<SpecializationModel>> GetDoctorSpecializationsAsync(Guid doctorId)
    {
        const string sql = @"
            SELECT s.Id, s.Name
            FROM Specializations s
            JOIN DoctorSpecializations ds ON s.Id = ds.SpecializationId
            WHERE ds.DoctorId = @DoctorId";
        return await _db.LoadData<SpecializationModel, dynamic>(sql, new { DoctorId = doctorId });
    }

    public async Task<IEnumerable<QualificationModel>> GetUserQualificationsAsync(Guid userId)
    {
        const string sql =
            "SELECT Id, UserId, Name, Institute, CompletionDate FROM Qualifications WHERE UserId = @UserId";
        return await _db.LoadData<QualificationModel, dynamic>(sql, new { UserId = userId });
    }

    public async Task AssignSpecializationsToDoctorAsync(Guid doctorId, IEnumerable<Guid>? specializationIds)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    await AssignSpecializationsToDoctorInternalAsync(doctorId, specializationIds, transaction);
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

    // Método interno para reusar la lógica de asignación de especializaciones dentro de transacciones
    private async Task AssignSpecializationsToDoctorInternalAsync(Guid doctorId, IEnumerable<Guid>? specializationIds,
        IDbTransaction transaction)
    {
        // Eliminar asociaciones existentes para este doctor
        await transaction.Connection.ExecuteAsync("DELETE FROM DoctorSpecializations WHERE DoctorId = @DoctorId",
            new { DoctorId = doctorId }, transaction: transaction);

        if (specializationIds != null && specializationIds.Any())
        {
            var sqlValues = string.Join(",", specializationIds.Select(id => $"('{doctorId}', '{id}')"));
            var insertSql = $"INSERT INTO DoctorSpecializations (DoctorId, SpecializationId) VALUES {sqlValues}";
            await transaction.Connection.ExecuteAsync(insertSql, transaction: transaction);
        }
    }
}