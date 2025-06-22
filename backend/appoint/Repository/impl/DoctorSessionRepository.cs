using System.Data;
using appoint.Domain.Response;
using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class DoctorSessionRepository : IDoctorSessionRepository
{
    private readonly ISqlDataAccess _db;

    public DoctorSessionRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<DoctorSessionListItemModel>> GetAllDoctorSessionListItemsAsync(Guid? doctorIdFilter = null)
    {
        var sql = @"
            SELECT
                ds.Id,
                ds.DoctorId,
                u.FirstName,
                u.LastName,
                u.Email,
                ds.SessionName,
                ds.SessionMeetingTime,
                ds.SessionGap,
                ds.StartTime,
                ds.EndTime
            FROM DoctorSessions ds
            JOIN Doctors d ON ds.DoctorId = d.Id
            JOIN Users u ON d.UserId = u.Id";

        var parameters = new DynamicParameters();
        if (doctorIdFilter.HasValue)
        {
            sql += " WHERE ds.DoctorId = @DoctorIdFilter";
            parameters.Add("DoctorIdFilter", doctorIdFilter.Value);
        }

        var results = await _db.LoadData<dynamic, DynamicParameters>(sql, parameters);

        // Mapear a DoctorSessionListItemModel, incluyendo la lógica de display
        return results.Select(x => new DoctorSessionListItemModel
        {
            Id = x.Id,
            DoctorId = x.DoctorId,
            FullName = $"{x.FirstName} {x.LastName}",
            Email = x.Email,
            SessionName = x.SessionName,
            SessionMeetingTimeDisplay = $"{x.SessionMeetingTime} minutos", // Formato de display
            SessionGapDisplay = $"{x.SessionGap} minutos", // Formato de display
            SessionTimeRange = $"{((TimeSpan)x.StartTime).ToString(@"hh\:mm")} - {((TimeSpan)x.EndTime).ToString(@"hh\:mm")}"
        });
    }

    public async Task<DoctorSessionDetailsResponse?> GetDoctorSessionDetailsAsync(Guid doctorSessionId, Guid? doctorUserIdFilter = null)
    {
        // Consulta para obtener DoctorSession, Doctor, User y SessionWeekDays
        string sql = @"
            SELECT
                ds.Id, ds.DoctorId, ds.SessionName, ds.SessionGap, ds.SessionMeetingTime, ds.IsActive,
                d.Id AS DoctorId_Alias, d.UserId,
                u.Id AS UserId_Alias, u.FirstName, u.LastName, u.Email,
                swd.Id AS SessionWeekDayId_Alias, swd.WeekDay, swd.DayStartTime, swd.DayEndTime
            FROM DoctorSessions ds
            JOIN Doctors d ON ds.DoctorId = d.Id
            JOIN Users u ON d.UserId = u.Id
            LEFT JOIN SessionWeekDays swd ON ds.Id = swd.DoctorSessionId
            WHERE ds.Id = @DoctorSessionId";
        
        var parameters = new DynamicParameters();
        parameters.Add("DoctorSessionId", doctorSessionId);

        if (doctorUserIdFilter.HasValue)
        {
            // Si hay un filtro de doctor (para cuando un doctor solo ve sus propias sesiones)
            sql += " AND d.UserId = @DoctorUserIdFilter";
            parameters.Add("DoctorUserIdFilter", doctorUserIdFilter.Value);
        }

        DoctorSessionDetailsResponse? result = null;
        var sessionWeekDaysMap = new Dictionary<int, SessionWeekDayDetails>();

        using (IDbConnection connection = _db.GetConnection())
        {
            await connection.QueryAsync<DoctorSessionDetailsResponse, DoctorModel, UserModel, SessionWeekDayModel, DoctorSessionDetailsResponse>(
                sql,
                (session, doctor, user, sessionWeekDay) =>
                {
                    if (result == null)
                    {
                        result = session;
                        result.DoctorFullName = $"{user.FirstName} {user.LastName}";
                        result.DoctorEmail = user.Email;
                        result.SessionWeekDays = new List<SessionWeekDayDetails>(); // Inicializar lista
                    }

                    if (sessionWeekDay != null && sessionWeekDay.Id != Guid.Empty)
                    {
                        if (!sessionWeekDaysMap.TryGetValue(sessionWeekDay.WeekDay, out var details))
                        {
                            details = new SessionWeekDayDetails { DayOfWeek = sessionWeekDay.WeekDay };
                            sessionWeekDaysMap[sessionWeekDay.WeekDay] = details;
                            result.SessionWeekDays.Add(details);
                        }
                        details.StartTimes.Add(sessionWeekDay.DayStartTime.ToString(@"hh\:mm tt")); // Formato "HH:mm AM/PM"
                        details.EndTimes.Add(sessionWeekDay.DayEndTime.ToString(@"hh\:mm tt"));   // Formato "HH:mm AM/PM"
                    }
                    return result;
                },
                param: parameters,
                splitOn: "DoctorId_Alias,UserId_Alias,SessionWeekDayId_Alias"
            );
        }
        
        // Ordenar los SessionWeekDays por DayOfWeek
        if (result != null)
        {
            result.SessionWeekDays = result.SessionWeekDays.OrderBy(swd => swd.DayOfWeek).ToList();
        }

        return result;
    }

    public async Task<DoctorSessionModel?> GetDoctorSessionByIdAsync(Guid id)
    {
        // Obtener la sesión de doctor y sus SessionWeekDays asociados
        const string sql = @"
            SELECT ds.Id, ds.DoctorId, ds.SessionName, ds.StartTime, ds.EndTime, ds.SessionMeetingTime, ds.SessionGap, ds.IsActive,
                   swd.Id AS SessionWeekDayId_Alias, swd.WeekDay, swd.DayStartTime, swd.DayEndTime
            FROM DoctorSessions ds
            LEFT JOIN SessionWeekDays swd ON ds.Id = swd.DoctorSessionId
            WHERE ds.Id = @Id";
        
        var doctorSessionDictionary = new Dictionary<Guid, DoctorSessionModel>();

        using (IDbConnection connection = _db.GetConnection())
        {
            var results = await connection.QueryAsync<DoctorSessionModel, SessionWeekDayModel, DoctorSessionModel>(
                sql,
                (doctorSession, sessionWeekDay) =>
                {
                    if (!doctorSessionDictionary.TryGetValue(doctorSession.Id, out var currentSession))
                    {
                        currentSession = doctorSession;
                        currentSession.SessionWeekDays = new List<SessionWeekDayModel>();
                        doctorSessionDictionary.Add(currentSession.Id, currentSession);
                    }

                    if (sessionWeekDay != null && sessionWeekDay.Id != Guid.Empty)
                    {
                        currentSession.SessionWeekDays!.Add(sessionWeekDay);
                    }
                    return currentSession;
                },
                param: new { Id = id },
                splitOn: "SessionWeekDayId_Alias"
            );
        }

        return doctorSessionDictionary.Values.FirstOrDefault();
    }


    public async Task<Guid> AddDoctorSessionAsync(DoctorSessionModel doctorSession, IEnumerable<SessionWeekDayModel> sessionWeekDays)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // 1. Insertar DoctorSession
                    doctorSession.Id = Guid.NewGuid();
                    const string insertSessionSql = @"
                        INSERT INTO DoctorSessions (Id, DoctorId, SessionName, StartTime, EndTime, SessionMeetingTime, SessionGap, IsActive)
                        VALUES (@Id, @DoctorId, @SessionName, @StartTime, @EndTime, @SessionMeetingTime, @SessionGap, @IsActive);";
                    await connection.ExecuteAsync(insertSessionSql, doctorSession, transaction: transaction);

                    // 2. Insertar SessionWeekDays
                    foreach (var swd in sessionWeekDays)
                    {
                        swd.Id = Guid.NewGuid();
                        swd.DoctorSessionId = doctorSession.Id; // Relacionar con la sesión recién creada
                        const string insertWeekDaySql = @"
                            INSERT INTO SessionWeekDays (Id, DoctorSessionId, WeekDay, DayStartTime, DayEndTime)
                            VALUES (@Id, @DoctorSessionId, @WeekDay, @DayStartTime, @DayEndTime);";
                        await connection.ExecuteAsync(insertWeekDaySql, swd, transaction: transaction);
                    }

                    transaction.Commit();
                    return doctorSession.Id;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    public async Task UpdateDoctorSessionAsync(DoctorSessionModel doctorSession, IEnumerable<SessionWeekDayModel> sessionWeekDays)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // 1. Actualizar DoctorSession principal
                    const string updateSessionSql = @"
                        UPDATE DoctorSessions SET
                            SessionName = @SessionName, StartTime = @StartTime, EndTime = @EndTime,
                            SessionMeetingTime = @SessionMeetingTime, SessionGap = @SessionGap, IsActive = @IsActive
                        WHERE Id = @Id;";
                    await connection.ExecuteAsync(updateSessionSql, doctorSession, transaction: transaction);

                    // 2. Eliminar SessionWeekDays existentes para esta sesión
                    const string deleteWeekDaysSql = "DELETE FROM SessionWeekDays WHERE DoctorSessionId = @DoctorSessionId;";
                    await connection.ExecuteAsync(deleteWeekDaysSql, new { DoctorSessionId = doctorSession.Id }, transaction: transaction);

                    // 3. Insertar nuevos SessionWeekDays
                    foreach (var swd in sessionWeekDays)
                    {
                        swd.Id = Guid.NewGuid();
                        swd.DoctorSessionId = doctorSession.Id; // Relacionar con la sesión
                        const string insertWeekDaySql = @"
                            INSERT INTO SessionWeekDays (Id, DoctorSessionId, WeekDay, DayStartTime, DayEndTime)
                            VALUES (@Id, @DoctorSessionId, @WeekDay, @DayStartTime, @DayEndTime);";
                        await connection.ExecuteAsync(insertWeekDaySql, swd, transaction: transaction);
                    }

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

    public async Task DeleteDoctorSessionAsync(Guid doctorSessionId)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // 1. Eliminar SessionWeekDays asociados
                    const string deleteWeekDaysSql = "DELETE FROM SessionWeekDays WHERE DoctorSessionId = @DoctorSessionId;";
                    await connection.ExecuteAsync(deleteWeekDaysSql, new { DoctorSessionId = doctorSessionId }, transaction: transaction);

                    // 2. Eliminar DoctorSession principal
                    const string deleteSessionSql = "DELETE FROM DoctorSessions WHERE Id = @Id;";
                    await connection.ExecuteAsync(deleteSessionSql, new { Id = doctorSessionId }, transaction: transaction);

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

    public async Task<IEnumerable<DoctorModel>> GetSyncListDoctorsAsync()
    {
        // Obtiene una lista simplificada de doctores para selectores (Id, FullName)
        const string sql = @"
            SELECT d.Id, u.FirstName, u.LastName
            FROM Doctors d
            JOIN Users u ON d.UserId = u.Id
            WHERE u.Type = 'Doctor' AND d.IsActive = TRUE"; // Asumiendo que DoctorModel tiene IsActive
        
        var results = await _db.LoadData<dynamic, dynamic>(sql, new { });
        return results.Select(x => new DoctorModel { Id = x.Id, User = new UserModel { FirstName = x.FirstName, LastName = x.LastName } });
    }

    public async Task<IEnumerable<SessionWeekDayModel>> GetDoctorWeekDaySessionsAsync(Guid doctorId, int dayOfWeek)
    {
        const string sql = @"
            SELECT swd.Id, swd.DoctorSessionId, swd.WeekDay, swd.DayStartTime, swd.DayEndTime
            FROM SessionWeekDays swd
            JOIN DoctorSessions ds ON swd.DoctorSessionId = ds.Id
            WHERE ds.DoctorId = @DoctorId AND swd.WeekDay = @DayOfWeek";
        return await _db.LoadData<SessionWeekDayModel, dynamic>(sql, new { DoctorId = doctorId, DayOfWeek = dayOfWeek });
    }

    // public async Task<IEnumerable<AppointmentModel>> GetBookedAppointmentsAsync(Guid doctorId, DateTime date)
    // {
    //     const string sql = @"
    //         SELECT Id, AppointmentUniqueId, PatientId, DoctorId, ServiceId, Date, FromTime, ToTime, Status, PayableAmount, PaymentType, PaymentMethod, CreatedAt, UpdatedAt
    //         FROM Appointments
    //         WHERE DoctorId = @DoctorId AND Date = @Date AND Status IN (1, 2, 3)"; // 1: BOOKED, 2: CHECK_IN, 3: CHECK_OUT
    //     return await _db.LoadData<AppointmentModel, dynamic>(sql, new { DoctorId = doctorId, Date = date.Date });
    // }

    public async Task<UserModel?> GetUserByIdAsync(Guid userId)
    {
        const string sql = "SELECT Id, Email, PasswordHash, Role, FirstName, LastName, Type, EmailVerifiedAt, Contact, RegionCode, BloodGroup, Gender, Dob, BranchId, EmailNotificationEnabled, CreatedAt, UpdatedAt FROM Users WHERE Id = @Id";
        return await _db.QueryFirstOrDefaultAsync<UserModel, dynamic>(sql, new { Id = userId });
    }
}