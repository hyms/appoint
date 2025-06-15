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
        // Consulta para obtener la lista de doctores con datos de usuario para el índice
        var sql = @"
            SELECT d.Id, d.UserId,
                   u.FirstName, u.LastName, u.Email, u.EmailVerifiedAt, u.CreatedAt, u.Type as UserType,
                   CASE WHEN u.Type = 'Doctor' THEN TRUE ELSE FALSE END AS IsActive -- Mapeo simple del estado
            FROM Doctors d
            JOIN Users u ON d.UserId = u.Id
            WHERE u.Type = 'Doctor'"; // Filtrar por tipo de usuario 'Doctor'

        if (!string.IsNullOrEmpty(statusFilter))
        {
            // Nota: Laravel tenía User::STATUS, aquí asumimos '1' para activo y '0' para inactivo.
            // En tu base de datos actual, 'status' en User es un string ('Active', 'Inactive').
            // Si 'statusFilter' viene como "active" o "inactive", deberás mapearlo al valor correcto de la columna Type en Users
            // Para la migración actual, 'user.status == 1' en Laravel se mapeó a 'IsActive' en UserModel, que es booleano.
            // Si tu columna 'Type' de Users es el status, entonces sería:
            if (statusFilter.Equals("active", StringComparison.OrdinalIgnoreCase))
            {
                sql += " AND u.Type = 'Doctor'"; // Asumiendo que 'Doctor' significa activo
            }
            else if (statusFilter.Equals("inactive", StringComparison.OrdinalIgnoreCase))
            {
                // Esto dependerá de cómo manejes "inactivo". Podría ser otra columna o un tipo diferente de usuario.
                // Si el estado se basa en la columna Type, necesitarías un tipo diferente para inactivos.
                // Para la migración actual, DoctorModel.IsActive mapea user.status == 1,
                // si user.status no es una columna real y Type es el status, entonces esta lógica necesita refinarse.
                // Por simplicidad, por ahora no aplicamos un filtro de estado aquí hasta clarificar cómo se gestiona el estado 'inactivo' de un Doctor.
            }
        }

        // Asumiendo que `LoadData` puede manejar el mapeo de `u.FirstName`, `u.LastName` a `FullName` en `DoctorListItemModel`
        var doctors = await _db.LoadData<dynamic, dynamic>(sql, new { });

        // Mapeo manual para asegurar que FullName y IsActive se configuren correctamente
        return doctors.Select(d => new DoctorListItemModel
        {
            Id = d.Id,
            UserId = d.UserId,
            FullName = $"{d.FirstName} {d.LastName}",
            Email = d.Email,
            IsActive = d.UserType == "Doctor", // Asumiendo que 'Doctor' type en Users implica activo
            EmailVerifiedAt = d.EmailVerifiedAt,
            CreatedAt = d.CreatedAt
        });
    }

    public async Task<DoctorModel?> GetDoctorByIdAsync(Guid doctorId)
    {
        // Consulta compleja para cargar Doctor, User y Specializations (muchos a muchos)
        const string sql = @"
            SELECT
                d.Id, d.UserId, d.Experience, d.TwitterUrl, d.LinkedinUrl, d.InstagramUrl,
                u.Id as UserId, u.Email, u.PasswordHash, u.Role, u.FirstName, u.LastName, u.Type, u.EmailVerifiedAt, u.Contact, u.RegionCode, u.BloodGroup, u.Gender, u.Dob, u.CreatedAt, u.UpdatedAt,
                ds.SpecializationId, s.Id as SpecializationId_Alias, s.Name as SpecializationName, -- Aliases para mapeo
                a.Id as AddressId, a.Address1, a.Address2, a.CountryId, a.StateId, a.CityId, a.PostalCode, a.CreatedAt as AddressCreatedAt, a.UpdatedAt as AddressUpdatedAt
            FROM Doctors d
            JOIN Users u ON d.UserId = u.Id
            LEFT JOIN DoctorSpecializations ds ON d.Id = ds.DoctorId
            LEFT JOIN Specializations s ON ds.SpecializationId = s.Id
            LEFT JOIN Addresses a ON u.AddressId = a.Id -- Asumiendo que Users tiene un AddressId
            WHERE d.Id = @DoctorId;";

        var doctorDictionary = new Dictionary<Guid, DoctorModel>();

        using (IDbConnection connection = _db.GetConnection())
        {
            var result =
                await connection.QueryAsync<DoctorModel, UserModel, SpecializationModel, AddressModel, DoctorModel>(
                    sql,
                    (doctor, user, specialization, address) =>
                    {
                        if (!doctorDictionary.TryGetValue(doctor.Id, out var currentDoctor))
                        {
                            currentDoctor = doctor;
                            currentDoctor.User = user; // Asigna el usuario
                            currentDoctor.IsActive = user?.Type == "Doctor"; // Mapeo de estado
                            // currentDoctor.User.Address = address; // Asigna la dirección al usuario
                            currentDoctor.Specializations = new List<SpecializationModel>();
                            currentDoctor.Qualifications =
                                new List<QualificationModel>(); // Inicializa calificaciones si se cargan aquí
                            doctorDictionary.Add(currentDoctor.Id, currentDoctor);
                        }

                        if (specialization != null &&
                            specialization.Id != Guid.Empty) // Asegúrate de que no sea un permiso nulo o default Guid
                        {
                            currentDoctor.Specializations!.Add(specialization);
                        }

                        return currentDoctor;
                    },
                    param: new { DoctorId = doctorId },
                    splitOn: "UserId,SpecializationId_Alias,AddressId" // Puntos de división en la consulta
                );
        }

        return doctorDictionary.Values.FirstOrDefault();
    }

    public async Task<DoctorDetailsResponse?> GetDoctorDetailsAsync(Guid doctorId, Guid loggedInUserId)
    {
        // Esta será una consulta más compleja que incluye conteos de citas y permisos del usuario logueado.
        // Podría implicar múltiples consultas o un procedimiento almacenado.
        // Por simplicidad, en este ejemplo, obtendremos primero el DoctorModel completo
        // y luego complementaremos con la información adicional.

        var doctor = await GetDoctorByIdAsync(doctorId);
        if (doctor == null || doctor.User == null)
        {
            return null;
        }

        // Obtener conteos de citas (ejemplo simplificado)
        // Esto debería ir en un AppointmentRepository o similar.
        var totalAppointments = await _db.LoadData<int, dynamic>(
            "SELECT COUNT(Id) FROM Appointments WHERE DoctorId = @DoctorId", new { DoctorId = doctorId });
        var todayAppointments = await _db.LoadData<int, dynamic>(
            "SELECT COUNT(Id) FROM Appointments WHERE DoctorId = @DoctorId AND Date = CURDATE()",
            new { DoctorId = doctorId });
        var upcomingAppointments = await _db.LoadData<int, dynamic>(
            "SELECT COUNT(Id) FROM Appointments WHERE DoctorId = @DoctorId AND Date >= CURDATE() AND Status = 1",
            new { DoctorId = doctorId }); // Asumiendo Status = 1 es 'Booked'

        // Obtener calificaciones
        var qualifications = await GetUserQualificationsAsync(doctor.UserId);

        // Lógica para 'permission' y 'patient_role' del usuario logueado
        // Esto requerirá una inyección de un servicio de autenticación/autorización
        // Temporalmente, lo simulamos:
        using (var conection = _db.GetConnection())
        {
            var loggedInUser =
                await conection.QueryFirstOrDefaultAsync<UserModel>("SELECT Role, Type FROM Users WHERE Id = @UserId",
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
                RoleName = doctor.User.Role, // Usar el rol del usuario
                Email = doctor.User.Email,
                RegionCode = doctor.User.RegionCode,
                Contact = doctor.User.Contact,
                TotalAppointmentCount = totalAppointments.FirstOrDefault(),
                TodayAppointmentCount = todayAppointments.FirstOrDefault(),
                UpcomingAppointmentCount = upcomingAppointments.FirstOrDefault(),
                HasDoctorOrAdminPermission = hasDoctorOrAdminPermission,
                IsPatientRole = isPatientRole,
                Specializations = doctor.Specializations,
                BloodGroup = doctor.User.BloodGroup,
                Gender = doctor.User.Gender,
                Dob = doctor.User.Dob,
                Experience = doctor.Experience,
                // Address = doctor.User.Address,
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
        const string sql =
            "SELECT Id, UserId, Experience, TwitterUrl, LinkedinUrl, InstagramUrl FROM Doctors WHERE UserId = @UserId";
        using (var conection = _db.GetConnection())
        {
        return await conection.QueryFirstOrDefaultAsync<DoctorModel>(sql, new { UserId = userId });
    }
    }

    public async Task<Guid> AddDoctorAsync(DoctorModel doctor, UserModel user, AddressModel? address,
        IEnumerable<Guid>? specializationIds)
    {
        // Transacción para asegurar la consistencia entre Users, Addresses y Doctors
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open(); // Abre la conexión explícitamente
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // 1. Insertar Dirección (si existe)
                    if (address != null)
                    {
                        address.Id = Guid.NewGuid();
                        const string insertAddressSql = @"
                            INSERT INTO Addresses (Id, Address1, Address2, CountryId, StateId, CityId, PostalCode, CreatedAt, UpdatedAt)
                            VALUES (@Id, @Address1, @Address2, @CountryId, @StateId, @CityId, @PostalCode, @CreatedAt, @UpdatedAt)";
                        await connection.ExecuteAsync(insertAddressSql, new
                        {
                            address.Id, address.Address1, address.Address2, address.CountryId, address.StateId,
                            address.CityId, address.PostalCode, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
                        }, transaction: transaction);
                    }

                    // 2. Insertar Usuario
                    user.Id = Guid.NewGuid();
                    user.PasswordHash =
                        BCrypt.Net.BCrypt.HashPassword(user.PasswordHash); // La contraseña se pasa en PasswordHash
                    user.EmailVerifiedAt = DateTime.UtcNow; // Asumiendo verificación inmediata al crear
                    user.CreatedAt = DateTime.UtcNow;
                    user.UpdatedAt = DateTime.UtcNow;

                    const string insertUserSql = @"
                        INSERT INTO Users (Id, Email, PasswordHash, Role, FirstName, LastName, Type, EmailVerifiedAt, Contact, RegionCode, BloodGroup, Gender, Dob, CreatedAt, UpdatedAt, AddressId)
                        VALUES (@Id, @Email, @PasswordHash, @Role, @FirstName, @LastName, @Type, @EmailVerifiedAt, @Contact, @RegionCode, @BloodGroup, @Gender, @Dob, @CreatedAt, @UpdatedAt, @AddressId)";
                    await connection.ExecuteAsync(insertUserSql, user, transaction: transaction);

                    // 3. Insertar Doctor
                    doctor.Id = Guid.NewGuid();
                    doctor.UserId = user.Id;
                    const string insertDoctorSql = @"
                        INSERT INTO Doctors (Id, UserId, Experience, TwitterUrl, LinkedinUrl, InstagramUrl)
                        VALUES (@Id, @UserId, @Experience, @TwitterUrl, @LinkedinUrl, @InstagramUrl)";
                    await connection.ExecuteAsync(insertDoctorSql, doctor, transaction: transaction);

                    // 4. Asignar Especializaciones
                    if (specializationIds != null && specializationIds.Any())
                    {
                        // Esta lógica se podría mover al servicio para mayor abstracción
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
                    throw; // Re-lanzar la excepción para que sea manejada por la capa superior
                }
            }
        }
    }

    public async Task UpdateDoctorAsync(DoctorModel doctor, UserModel user, AddressModel? address,
        IEnumerable<Guid>? specializationIds)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // 1. Actualizar Usuario
                    const string updateUserSql = @"
                        UPDATE Users SET
                            Email = @Email, FirstName = @FirstName, LastName = @LastName,
                            Type = @Type, Contact = @Contact, RegionCode = @RegionCode,
                            BloodGroup = @BloodGroup, Gender = @Gender, Dob = @Dob, UpdatedAt = @UpdatedAt,
                            AddressId = @AddressId, Role = @Role
                        WHERE Id = @Id";
                    await connection.ExecuteAsync(updateUserSql, user, transaction: transaction);

                    // Si la contraseña ha sido cambiada, actualizarla.
                    if (!string.IsNullOrEmpty(user.PasswordHash) && BCrypt.Net.BCrypt.Verify(user.PasswordHash,
                            (await connection.QueryFirstOrDefaultAsync<UserModel>(
                                "SELECT PasswordHash FROM Users WHERE Id = @Id", new { Id = user.Id })).PasswordHash))
                    {
                        const string updatePasswordSql =
                            "UPDATE Users SET PasswordHash = @PasswordHash, UpdatedAt = @UpdatedAt WHERE Id = @Id";
                        await connection.ExecuteAsync(updatePasswordSql,
                            new { user.PasswordHash, UpdatedAt = DateTime.UtcNow, Id = user.Id },
                            transaction: transaction);
                    }

                    // 2. Actualizar Dirección (o insertarla si no existía y ahora se proporciona)
                    if (address != null)
                    {
                        if (address.Id != Guid.Empty) // Si la dirección ya tiene un ID, se actualiza
                        {
                            const string updateAddressSql = @"
                                UPDATE Addresses SET
                                    Address1 = @Address1, Address2 = @Address2, CountryId = @CountryId,
                                    StateId = @StateId, CityId = @CityId, PostalCode = @PostalCode, UpdatedAt = @UpdatedAt
                                WHERE Id = @Id";
                            await connection.ExecuteAsync(updateAddressSql, new
                            {
                                address.Address1, address.Address2, address.CountryId, address.StateId,
                                address.CityId, address.PostalCode, UpdatedAt = DateTime.UtcNow, Id = address.Id
                            }, transaction: transaction);
                        }
                        else // Si no tiene ID y se proporcionó una dirección, se inserta una nueva y se asocia al usuario
                        {
                            address.Id = Guid.NewGuid();
                            const string insertAddressSql = @"
                                INSERT INTO Addresses (Id, Address1, Address2, CountryId, StateId, CityId, PostalCode, CreatedAt, UpdatedAt)
                                VALUES (@Id, @Address1, @Address2, @CountryId, @StateId, @CityId, @PostalCode, @CreatedAt, @UpdatedAt)";
                            await connection.ExecuteAsync(insertAddressSql, new
                            {
                                address.Id, address.Address1, address.Address2, address.CountryId, address.StateId,
                                address.CityId, address.PostalCode, CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            }, transaction: transaction);
                            // Actualiza el AddressId en la tabla Users
                            await connection.ExecuteAsync("UPDATE Users SET AddressId = @AddressId WHERE Id = @UserId",
                                new { AddressId = address.Id, UserId = user.Id }, transaction: transaction);
                        }
                    }


                    // 3. Actualizar Doctor
                    const string updateDoctorSql = @"
                        UPDATE Doctors SET
                            Experience = @Experience, TwitterUrl = @TwitterUrl, LinkedinUrl = @LinkedinUrl, InstagramUrl = @InstagramUrl
                        WHERE Id = @Id";
                    await connection.ExecuteAsync(updateDoctorSql, doctor, transaction: transaction);

                    // 4. Sincronizar Especializaciones
                    await AssignSpecializationsToDoctorAsync(doctor.Id, specializationIds, transaction);

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

                    // Verificar citas y visitas existentes antes de eliminar
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

                    // Finalmente, eliminar el usuario
                    await connection.ExecuteAsync("DELETE FROM Users WHERE Id = @UserId",
                        new { UserId = doctor.UserId }, transaction: transaction);

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
        // El campo 'Type' en Users es lo que representa el rol/estado del usuario en tu migración.
        // Asumo que 'Doctor' significa activo y otra cosa (ej. 'InactiveDoctor' o eliminación) significa inactivo.
        // Si 'status' es una columna booleana en Users, el mapeo sería directo.
        // Basado en el Laravel: 'status' => !$doctor->status, donde status era 1/0.
        // En tu UserModel, IsActive se mapea de user.status == 1.
        // Si tu tabla Users tiene una columna 'IsActive' o 'Status' (int/bool), úsala.
        // Sino, esta lógica podría implicar cambiar el 'Type' de 'Doctor' a algo más.
        // Para este escenario, asumo que quieres una columna 'Status' (bool) en Users.
        // Si no existe, deberías añadirla con una migración.

        // Si tienes una columna 'Status' (bool) en tu tabla Users:
        const string sql = "UPDATE Users SET Status = @Status, UpdatedAt = @UpdatedAt WHERE Id = @UserId";
        await _db.SaveData(sql, new { Status = isActive, UpdatedAt = DateTime.UtcNow, UserId = userId });
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
        // Reutiliza la lógica de eliminación y asignación del RoleRepository
        await RemoveAllSpecializationsFromDoctorAsync(doctorId);

        if (specializationIds != null && specializationIds.Any())
        {
            var sql = "INSERT INTO DoctorSpecializations (DoctorId, SpecializationId) VALUES ";
            var parameters = new DynamicParameters();
            var valuePairs = new List<string>();

            for (int i = 0; i < specializationIds.Count(); i++)
            {
                var specializationId = specializationIds.ElementAt(i);
                valuePairs.Add($"(@DoctorId{i}, @SpecializationId{i})");
                parameters.Add($"@DoctorId{i}", doctorId);
                parameters.Add($"@SpecializationId{i}", specializationId);
            }

            sql += string.Join(", ", valuePairs);

            await _db.SaveData(sql, parameters);
        }
    }

    // Sobrecarga privada para uso dentro de transacciones
    private async Task AssignSpecializationsToDoctorAsync(Guid doctorId, IEnumerable<Guid>? specializationIds,
        IDbTransaction transaction)
    {
        await transaction.Connection.ExecuteAsync("DELETE FROM DoctorSpecializations WHERE DoctorId = @DoctorId",
            new { DoctorId = doctorId }, transaction: transaction);

        if (specializationIds != null && specializationIds.Any())
        {
            var sqlValues = string.Join(",", specializationIds.Select(id => $"('{doctorId}', '{id}')"));
            var insertSql = $"INSERT INTO DoctorSpecializations (DoctorId, SpecializationId) VALUES {sqlValues}";
            await transaction.Connection.ExecuteAsync(insertSql, transaction: transaction);
        }
    }

    private async Task RemoveAllSpecializationsFromDoctorAsync(Guid doctorId)
    {
        const string sql = "DELETE FROM DoctorSpecializations WHERE DoctorId = @DoctorId";
        await _db.SaveData(sql, new { DoctorId = doctorId });
    }
}