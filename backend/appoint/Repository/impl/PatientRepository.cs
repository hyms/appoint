using System.Data;
using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class PatientRepository : IPatientRepository
{
    private readonly ISqlDataAccess _db;

    public PatientRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<PatientListItemModel>> GetAllPatientListItemsAsync()
    {
        // Consulta para obtener la lista de pacientes con datos de usuario y conteo de citas.
        const string sql = @"
            SELECT
                p.Id, p.UserId, p.CreatedAt,
                u.FirstName, u.LastName, u.Email, u.EmailVerifiedAt, u.Type,
                (SELECT COUNT(Id) FROM Appointments WHERE PatientId = p.Id) AS TotalAppointments
            FROM Patients p
            JOIN Users u ON p.UserId = u.Id
            WHERE u.Type = 'Patient'"; // Filtrar por tipo de usuario 'Patient'

        var patients = await _db.LoadData<dynamic, dynamic>(sql, new { });

        return patients.Select(p => new PatientListItemModel
        {
            Id = p.Id,
            UserId = p.UserId,
            FullName = $"{p.FirstName} {p.LastName}",
            Email = p.Email,
            TotalAppointments = p.TotalAppointments,
            EmailVerifiedAt = p.EmailVerifiedAt,
            CreatedAt = ((DateTime)p.CreatedAt).ToString("dd MMM yyyy hh:mm tt") // Formateo de fecha como Laravel
        });
    }

    public async Task<PatientModel?> GetPatientByIdAsync(Guid patientId)
    {
        // Consulta compleja para cargar Patient, User y Branch (a través de User)
        const string sql = @"
            SELECT
                p.Id, p.UserId, p.PatientUniqueId, p.CreatedAt, p.UpdatedAt,
                u.Id AS UserId_Alias, u.Email, u.PasswordHash, u.Role, u.FirstName, u.LastName,
                u.Type, u.EmailVerifiedAt, u.Contact, u.RegionCode, u.BloodGroup, u.Gender, u.Dob,
                u.EmailNotificationEnabled, u.CreatedAt AS UserCreatedAt, u.UpdatedAt AS UserUpdatedAt,
                b.Id AS BranchId_Alias, b.Name AS BranchName, b.AddressLine1 AS BranchAddress1, b.AddressLine2 AS BranchAddress2,
                b.City AS BranchCity, b.State AS BranchState, b.Country AS BranchCountry,
                b.PostalCode AS BranchPostalCode, b.PhoneNumber AS BranchPhoneNumber, b.Email AS BranchEmail,
                b.IsActive AS BranchIsActive, b.CreatedAt AS BranchCreatedAt, b.UpdatedAt AS BranchUpdatedAt
            FROM Patients p
            JOIN Users u ON p.UserId = u.Id
            JOIN Branches b ON u.BranchId = b.Id
            WHERE p.Id = @PatientId AND u.Type = 'Patient'";

        PatientModel? patient = null;
        using (IDbConnection connection = _db.GetConnection())
        {
            await connection.QueryAsync<PatientModel, UserModel, BranchModel, PatientModel>(
                sql,
                (pat, user, branch) =>
                {
                    if (patient == null)
                    {
                        patient = pat;
                        patient.User = user;
                        patient.User.Branch = branch;
                    }

                    return patient;
                },
                param: new { PatientId = patientId },
                splitOn: "UserId_Alias,BranchId_Alias" // Puntos de división en la consulta
            );
        }

        return patient;
    }

    public async Task<PatientModel?> GetPatientByUniqueIdAsync(string patientUniqueId)
    {
        const string sql = "SELECT Id, UserId, PatientUniqueId FROM Patients WHERE PatientUniqueId = @PatientUniqueId";
        using (var connection = _db.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<PatientModel>(sql,
                new { PatientUniqueId = patientUniqueId });
        }
    }

    public async Task<UserModel?> GetUserByEmailAsync(string email)
    {
        const string sql = "SELECT Id, Email, Contact FROM Users WHERE Email = @Email";
        using (var connection = _db.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Email = email });
        }
    }

    public async Task<UserModel?> GetUserByContactAsync(string contact)
    {
        const string sql = "SELECT Id, Email, Contact FROM Users WHERE Contact = @Contact";
        using (var connection = _db.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<UserModel>(sql, new { Contact = contact });
        }
    }


    public async Task<Guid> AddPatientAsync(PatientModel patient, UserModel user)
    {
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
                    user.Type = "Patient"; // Aseguramos el tipo de usuario
                    user.Role = "Patient"; // Asigna el rol "Patient" por defecto
                    user.EmailVerifiedAt = DateTime.UtcNow; // Asumimos verificación inmediata
                    user.EmailNotificationEnabled = true; // Por defecto activo
                    user.CreatedAt = DateTime.UtcNow;
                    user.UpdatedAt = DateTime.UtcNow;

                    const string insertUserSql = @"
                        INSERT INTO Users (Id, Email, PasswordHash, Role, FirstName, LastName, Type, EmailVerifiedAt, Contact, RegionCode, BloodGroup, Gender, Dob, BranchId, EmailNotificationEnabled, CreatedAt, UpdatedAt)
                        VALUES (@Id, @Email, @PasswordHash, @Role, @FirstName, @LastName, @Type, @EmailVerifiedAt, @Contact, @RegionCode, @BloodGroup, @Gender, @Dob, @BranchId, @EmailNotificationEnabled, @CreatedAt, @UpdatedAt)";
                    await connection.ExecuteAsync(insertUserSql, user, transaction: transaction);

                    // 2. Asignar rol "Patient" al usuario en la tabla UserRoles (si usas el sistema RBAC completo)
                    // Necesitamos obtener el GUID del rol 'Patient'
                    var patientRole = await connection.QueryFirstOrDefaultAsync<RoleModel>(
                        "SELECT Id, Name FROM Roles WHERE Name = 'Patient'", transaction: transaction);
                    if (patientRole == null)
                    {
                        throw new InvalidOperationException(
                            "Default 'Patient' role not found. Please ensure it exists in the Roles table.");
                    }

                    await connection.ExecuteAsync("INSERT INTO UserRoles (UserId, RoleId) VALUES (@UserId, @RoleId)",
                        new { UserId = user.Id, RoleId = patientRole.Id }, transaction: transaction);

                    // 3. Insertar Paciente
                    patient.Id = Guid.NewGuid();
                    patient.UserId = user.Id;
                    patient.CreatedAt = DateTime.UtcNow;
                    patient.UpdatedAt = DateTime.UtcNow;

                    const string insertPatientSql = @"
                        INSERT INTO Patients (Id, UserId, PatientUniqueId, CreatedAt, UpdatedAt)
                        VALUES (@Id, @UserId, @PatientUniqueId, @CreatedAt, @UpdatedAt)";
                    await connection.ExecuteAsync(insertPatientSql, patient, transaction: transaction);

                    transaction.Commit();
                    return patient.Id;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    public async Task UpdatePatientAsync(PatientModel patient, UserModel user)
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

                    // Opcional: Actualizar PasswordHash si se proporcionó una nueva contraseña (no en este DTO)
                    // Si el request de actualización permite cambiar la contraseña, la lógica iría aquí.

                    // 2. Actualizar Paciente
                    patient.UpdatedAt = DateTime.UtcNow;
                    const string updatePatientSql = @"
                        UPDATE Patients SET
                            PatientUniqueId = @PatientUniqueId, UpdatedAt = @UpdatedAt
                        WHERE Id = @Id";
                    await connection.ExecuteAsync(updatePatientSql, patient, transaction: transaction);

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

    public async Task DeletePatientAsync(Guid patientId)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Obtener el UserId asociado al paciente
                    var patient = await connection.QueryFirstOrDefaultAsync<PatientModel>(
                        "SELECT UserId FROM Patients WHERE Id = @PatientId", new { PatientId = patientId },
                        transaction: transaction);
                    if (patient == null) throw new InvalidOperationException("Patient not found.");

                    // Validaciones de existencia de citas/visitas activas (replicando lógica Laravel)
                    // Appointment::CANCELLED, Appointment::CHECK_OUT
                    var hasPendingAppointments =
                        await HasPendingAppointmentsAsync(patientId, new[] { 3, 4 }); // Asumo 3=CANCELLED, 4=CHECK_OUT
                    var hasVisits = await HasVisitsAsync(patientId);

                    if (hasPendingAppointments || hasVisits)
                    {
                        throw new InvalidOperationException(
                            "Patient cannot be deleted as there are existing active appointments or visits.");
                    }

                    // Eliminar registros dependientes
                    // 1. Eliminar citas asociadas al paciente (si no se eliminan en cascada por FK)
                    // Considera que si hay citas finalizadas, no deberían borrarse.
                    await connection.ExecuteAsync("DELETE FROM Appointments WHERE PatientId = @PatientId",
                        new { PatientId = patientId }, transaction: transaction);

                    // 2. Eliminar visitas asociadas al paciente
                    await connection.ExecuteAsync("DELETE FROM Visits WHERE PatientId = @PatientId",
                        new { PatientId = patientId }, transaction: transaction);

                    // 3. Eliminar entradas en la tabla pivote UserRoles para este usuario
                    await connection.ExecuteAsync("DELETE FROM UserRoles WHERE UserId = @UserId",
                        new { UserId = patient.UserId }, transaction: transaction);

                    // 4. Eliminar el registro del paciente
                    await connection.ExecuteAsync("DELETE FROM Patients WHERE Id = @PatientId",
                        new { PatientId = patientId }, transaction: transaction);

                    // 5. Eliminar el usuario asociado
                    await connection.ExecuteAsync("DELETE FROM Users WHERE Id = @UserId",
                        new { UserId = patient.UserId }, transaction: transaction);

                    // NOTA: La funcionalidad de `patient->media()->delete()` de Laravel
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

    public async Task<bool> HasPendingAppointmentsAsync(Guid patientId, IEnumerable<int> excludedStatuses)
    {
        // Excluye los estados CANCELLED y CHECK_OUT (3 y 4 respectivamente en Laravel)
        var sql = "SELECT COUNT(Id) FROM Appointments WHERE PatientId = @PatientId AND Status NOT IN @ExcludedStatuses";
        var count = await _db.LoadData<int, dynamic>(sql,
            new { PatientId = patientId, ExcludedStatuses = excludedStatuses });
        return count.FirstOrDefault() > 0;
    }

    public async Task<bool> HasVisitsAsync(Guid patientId)
    {
        const string sql = "SELECT COUNT(Id) FROM Visits WHERE PatientId = @PatientId";
        var count = await _db.LoadData<int, dynamic>(sql, new { PatientId = patientId });
        return count.FirstOrDefault() > 0;
    }

    public async Task<IEnumerable<PatientAppointmentListItemModel>> GetPatientAppointmentsAsync(
        Guid patientId,
        string? statusFilter = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        Guid? loggedInDoctorId = null)
    {
        var sql = @"
            SELECT
                a.Id, a.DoctorId, a.FromTime, a.FromTimeType, a.ToTime, a.ToTimeType, a.Date, a.Status,
                d.Id AS DoctorId_Alias, du.FirstName AS DoctorFirstName, du.LastName AS DoctorLastName, du.Email AS DoctorEmail
            FROM Appointments a
            JOIN Doctors d ON a.DoctorId = d.Id
            JOIN Users du ON d.UserId = du.Id
            WHERE a.PatientId = @PatientId";

        var parameters = new DynamicParameters();
        parameters.Add("PatientId", patientId);

        // Si el usuario logueado es un doctor, filtrar citas por ese doctor
        if (loggedInDoctorId.HasValue && loggedInDoctorId.Value != Guid.Empty)
        {
            sql += " AND a.DoctorId = @LoggedInDoctorId";
            parameters.Add("LoggedInDoctorId", loggedInDoctorId.Value);
        }

        // Filtro por estado
        if (!string.IsNullOrEmpty(statusFilter) && !statusFilter.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            // Asumo que el statusFilter de Laravel (ej. Appointment::ALL_STATUS) se mapea a un int aquí
            // Si el statusFilter es un string ("booked", "checked_in"), necesitarás un mapeo.
            // Por ejemplo, puedes pasar el valor entero directo si tu frontend lo envía.
            // Para la migración, asumo que 'statusFilter' es el valor entero directamente.
            if (int.TryParse(statusFilter, out int statusIntValue))
            {
                sql += " AND a.Status = @Status";
                parameters.Add("Status", statusIntValue);
            }
        }

        // Filtro por rango de fechas
        if (startDate.HasValue && endDate.HasValue)
        {
            sql += " AND a.Date BETWEEN @StartDate AND @EndDate";
            parameters.Add("StartDate", startDate.Value.Date); // Solo la fecha
            parameters.Add("EndDate", endDate.Value.Date); // Solo la fecha
        }
        else // Si no se proporcionan fechas, usar el mes actual como en Laravel
        {
            // Similar a getMonthDate() de Laravel
            var today = DateTime.Today;
            var firstDayOfMonth = new DateTime(today.Year, today.Month, 1);
            var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);
            sql += " AND a.Date BETWEEN @DefaultStartDate AND @DefaultEndDate";
            parameters.Add("DefaultStartDate", firstDayOfMonth);
            parameters.Add("DefaultEndDate", lastDayOfMonth);
        }

        // Ordenar por fecha o alguna otra columna relevante
        sql += " ORDER BY a.Date DESC";

        var appointments = await _db.LoadData<dynamic, DynamicParameters>(sql, parameters);

        return appointments.Select(a => new PatientAppointmentListItemModel
        {
            Id = a.Id,
            FullName = $"{a.DoctorFirstName} {a.DoctorLastName}",
            DoctorId = a.DoctorId,
            Email = a.DoctorEmail,
            FromTime = a.FromTime,
            FromTimeType = a.FromTimeType,
            ToTime = a.ToTime,
            ToTimeType = a.ToTimeType,
            Date = ((DateTime)a.Date).ToString("dd MMM yyyy"), // Formateo de fecha
            Status = (int)a.Status
        });
    }
}