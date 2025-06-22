using System.Globalization;
using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Repository;

namespace appoint.Services.implement;

public class DoctorSessionService : IDoctorSessionService
{
    private readonly IDoctorSessionRepository _doctorSessionRepository;
    private readonly IDoctorRepository _doctorRepository; // Para obtener DoctorModel del user (si necesario)
    // private readonly IUserRepository _userRepository; // Para obtener UserModel
    private readonly ILogger<DoctorSessionService> _logger;

    // Constantes para GAPS y SESSION_MEETING_TIME (similar a Laravel)
    private static readonly Dictionary<int, string> Gaps = new Dictionary<int, string>
    {
        { 15, "15 Minutos" },
        { 30, "30 Minutos" },
        { 45, "45 Minutos" },
        { 60, "1 Hora" }
    };

    private static readonly Dictionary<int, string> MeetingTimes = new Dictionary<int, string>
    {
        { 5, "5 Minutos" },
        { 10, "10 Minutos" },
        { 15, "15 Minutos" },
        { 20, "20 Minutos" },
        { 25, "25 Minutos" },
        { 30, "30 Minutos" },
        { 35, "35 Minutos" },
        { 40, "40 Minutos" },
        { 45, "45 Minutos" },
        { 50, "50 Minutos" },
        { 55, "55 Minutos" },
        { 60, "1 Hora" }
    };

    public DoctorSessionService(
        IDoctorSessionRepository doctorSessionRepository,
        IDoctorRepository doctorRepository,
        // IUserRepository userRepository, // Inyectar UserRepository
        ILogger<DoctorSessionService> logger)
    {
        _doctorSessionRepository = doctorSessionRepository;
        _doctorRepository = doctorRepository;
        // _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<DoctorSessionListItemModel>> GetAllDoctorSessionsAsync(Guid? loggedInDoctorId = null)
    {
        _logger.LogInformation("Fetching all doctor sessions. Filter by Doctor ID: {DoctorId}", loggedInDoctorId);
        return await _doctorSessionRepository.GetAllDoctorSessionListItemsAsync(loggedInDoctorId);
    }

    public async Task<DoctorSessionDetailsResponse?> GetDoctorSessionDetailsAsync(Guid doctorSessionId, Guid? loggedInDoctorUserId = null)
    {
        _logger.LogInformation("Fetching doctor session details for ID: {SessionId}", doctorSessionId);
        var session = await _doctorSessionRepository.GetDoctorSessionByIdAsync(doctorSessionId);

        if (session == null || session.DoctorId == Guid.Empty)
        {
            _logger.LogWarning("Doctor session with ID {SessionId} not found or has no associated doctor.", doctorSessionId);
            return null;
        }

        var doctor = await _doctorRepository.GetDoctorByIdAsync(session.DoctorId);
        if (doctor == null || doctor.User == null)
        {
            _logger.LogWarning("Associated doctor or user not found for session ID: {SessionId}", doctorSessionId);
            return null;
        }
        
        // Laravel's `show` method had a check for `getLogInUser()->hasRole('doctor')`
        // and if so, it filtered by `whereDoctorId(getLogInUser()->doctor->id)`.
        // This logic is best handled in the controller before calling the service,
        // or ensure `GetDoctorSessionDetailsAsync` in repository already handles it
        // by passing `loggedInDoctorUserId` as filter.
        if (loggedInDoctorUserId.HasValue && doctor.User.Id != loggedInDoctorUserId.Value)
        {
            _logger.LogWarning("Access denied: User {UserId} attempted to view session {SessionId} belonging to another doctor.", loggedInDoctorUserId.Value, doctorSessionId);
            return null; // Or throw a specific access denied exception
        }

        // Transformar SessionWeekDays a SessionWeekDayDetails
        var sessionWeekDayDetails = session.SessionWeekDays?.GroupBy(swd => swd.WeekDay)
            .Select(g => new SessionWeekDayDetails
            {
                DayOfWeek = g.Key,
                StartTimes = g.Select(swd => swd.DayStartTime.ToString(@"hh\:mm tt", CultureInfo.InvariantCulture)).ToList(),
                EndTimes = g.Select(swd => swd.DayEndTime.ToString(@"hh\:mm tt", CultureInfo.InvariantCulture)).ToList()
            }).ToList() ?? new List<SessionWeekDayDetails>();

        return new DoctorSessionDetailsResponse
        {
            Id = session.Id,
            DoctorId = session.DoctorId,
            DoctorFullName = $"{doctor.User.FirstName} {doctor.User.LastName}",
            DoctorEmail = doctor.User.Email,
            SessionName = session.SessionName,
            SessionGap = session.SessionGap,
            SessionMeetingTime = session.SessionMeetingTime,
            IsActive = session.IsActive,
            SessionWeekDays = sessionWeekDayDetails
        };
    }

    public async Task<Guid> CreateDoctorSessionAsync(DoctorSessionCreateRequest request)
    {
        _logger.LogInformation("Creating new doctor session for Doctor ID: {DoctorId}", request.DoctorId);

        // Validar la existencia del doctor
        var doctor = await _doctorRepository.GetDoctorByIdAsync(request.DoctorId);
        if (doctor == null)
        {
            throw new InvalidOperationException($"Doctor with ID {request.DoctorId} not found.");
        }

        // Validar y transformar SessionWeekDays a modelos
        var sessionWeekDaysModels = new List<SessionWeekDayModel>();
        foreach (var swdRequest in request.SessionWeekDays)
        {
            if (!TimeSpan.TryParseExact(swdRequest.StartTime, "hh\\:mm", CultureInfo.InvariantCulture, out TimeSpan startTime))
            {
                throw new ArgumentException($"Invalid StartTime format for Day {swdRequest.DayOfWeek}: {swdRequest.StartTime}. Expected HH:mm.");
            }
            if (!TimeSpan.TryParseExact(swdRequest.EndTime, "hh\\:mm", CultureInfo.InvariantCulture, out TimeSpan endTime))
            {
                throw new ArgumentException($"Invalid EndTime format for Day {swdRequest.DayOfWeek}: {swdRequest.EndTime}. Expected HH:mm.");
            }

            if (startTime >= endTime)
            {
                throw new InvalidOperationException($"Day {swdRequest.DayOfWeek}: Start time ({swdRequest.StartTime}) cannot be greater than or equal to end time ({swdRequest.EndTime}).");
            }

            sessionWeekDaysModels.Add(new SessionWeekDayModel
            {
                WeekDay = swdRequest.DayOfWeek,
                DayStartTime = startTime,
                DayEndTime = endTime
            });
        }

        var doctorSessionModel = new DoctorSessionModel
        {
            DoctorId = request.DoctorId,
            SessionName = request.SessionName,
            SessionMeetingTime = request.SessionMeetingTime,
            SessionGap = request.SessionGap,
            IsActive = true, // Nueva sesión es activa por defecto
            // StartTime y EndTime de DoctorSessionModel no se usan directamente desde el Request si es por día.
            // Si Laravel los rellenaba, se necesitaría una lógica de cálculo aquí.
            // Por ahora, asumimos que se derivan de los SessionWeekDays o tienen un valor por defecto.
            StartTime = sessionWeekDaysModels.Any() ? sessionWeekDaysModels.Min(s => s.DayStartTime) : TimeSpan.Zero,
            EndTime = sessionWeekDaysModels.Any() ? sessionWeekDaysModels.Max(s => s.DayEndTime) : TimeSpan.Zero,
        };

        return await _doctorSessionRepository.AddDoctorSessionAsync(doctorSessionModel, sessionWeekDaysModels);
    }

    public async Task UpdateDoctorSessionAsync(Guid id, DoctorSessionUpdateRequest request)
    {
        _logger.LogInformation("Updating doctor session ID: {SessionId}", id);

        var existingSession = await _doctorSessionRepository.GetDoctorSessionByIdAsync(id);
        if (existingSession == null)
        {
            throw new InvalidOperationException($"Doctor session with ID {id} not found.");
        }

        // Validar y transformar SessionWeekDays a modelos
        var sessionWeekDaysModels = new List<SessionWeekDayModel>();
        foreach (var swdRequest in request.SessionWeekDays)
        {
            if (!TimeSpan.TryParseExact(swdRequest.StartTime, "hh\\:mm", CultureInfo.InvariantCulture, out TimeSpan startTime))
            {
                throw new ArgumentException($"Invalid StartTime format for Day {swdRequest.DayOfWeek}: {swdRequest.StartTime}. Expected HH:mm.");
            }
            if (!TimeSpan.TryParseExact(swdRequest.EndTime, "hh\\:mm", CultureInfo.InvariantCulture, out TimeSpan endTime))
            {
                throw new ArgumentException($"Invalid EndTime format for Day {swdRequest.DayOfWeek}: {swdRequest.EndTime}. Expected HH:mm.");
            }

            if (startTime >= endTime)
            {
                throw new InvalidOperationException($"Day {swdRequest.DayOfWeek}: Start time ({swdRequest.StartTime}) cannot be greater than or equal to end time ({swdRequest.EndTime}).");
            }

            sessionWeekDaysModels.Add(new SessionWeekDayModel
            {
                WeekDay = swdRequest.DayOfWeek,
                DayStartTime = startTime,
                DayEndTime = endTime
            });
        }

        // Actualizar propiedades de la sesión principal
        existingSession.SessionName = request.SessionName;
        existingSession.SessionMeetingTime = request.SessionMeetingTime;
        existingSession.SessionGap = request.SessionGap;
        // Re-calcular StartTime/EndTime de la sesión principal si se derivan de los días de la semana
        existingSession.StartTime = sessionWeekDaysModels.Any() ? sessionWeekDaysModels.Min(s => s.DayStartTime) : TimeSpan.Zero;
        existingSession.EndTime = sessionWeekDaysModels.Any() ? sessionWeekDaysModels.Max(s => s.DayEndTime) : TimeSpan.Zero;

        await _doctorSessionRepository.UpdateDoctorSessionAsync(existingSession, sessionWeekDaysModels);
        _logger.LogInformation("Doctor session ID {SessionId} updated successfully.", id);
    }

    public async Task DeleteDoctorSessionAsync(Guid doctorSessionId)
    {
        _logger.LogInformation("Deleting doctor session ID: {SessionId}", doctorSessionId);
        // Aquí podrías añadir una verificación de dependencias (citas activas) antes de eliminar
        // similar a como se hace en otros controladores.
        var existingSession = await _doctorSessionRepository.GetDoctorSessionByIdAsync(doctorSessionId);
        if (existingSession == null)
        {
            throw new InvalidOperationException($"Doctor session with ID {doctorSessionId} not found.");
        }

        // TODO: Verificar si hay citas asociadas a esta sesión antes de eliminarla.
        // Esto podría implicar consultar la tabla Appointments y SessionWeekDays para ver si hay conflictos.
        // Similar a ClinicScheduleController::checkRecord
        // O: Podrías hacer que la FK en Appointments a DoctorSessions sea en cascada.

        await _doctorSessionRepository.DeleteDoctorSessionAsync(doctorSessionId);
        _logger.LogInformation("Doctor session ID {SessionId} deleted successfully.", doctorSessionId);
    }

    public Dictionary<int, string> GetSessionGaps()
    {
        return Gaps;
    }

    public Dictionary<int, string> GetSessionMeetingTimes()
    {
        return MeetingTimes;
    }

    public async Task<IEnumerable<DoctorModel>> GetDoctorSyncListAsync()
    {
        return await _doctorSessionRepository.GetSyncListDoctorsAsync();
    }

    public async Task<DoctorSessionTimeSlotsResponse> GetDoctorSessionAvailableSlotsAsync(DoctorSessionByDateRequest request, Guid loggedInUserId)
    {
        _logger.LogInformation("Getting doctor session available slots for doctor {DoctorId} on {Date}", request.DoctorId, request.Date.ToShortDateString());

        // 1. Verificar si el doctor tiene vacaciones en la fecha
        // var doctorHolidays = await _doctorSessionRepository.GetDoctorHolidaysAsync(request.DoctorId, request.Date);
        // if (doctorHolidays.Any())
        // {
        //     throw new InvalidOperationException("Doctor is not available on this date due to holiday.");
        // }

        // 2. Obtener las sesiones del doctor para ese día de la semana
        // Laravel usa `WeekDay::whereDayOfWeek($date->dayOfWeek - 1)->whereDoctorId($doctorId)->with('doctorSession')->get();`
        // `date->dayOfWeek - 1` es porque en PHP el domingo es 0, y en .NET es 0. MySQL WeekDay 0 es Lunes, 6 es Domingo.
        // Asegúrate que tu DayOfWeek en la DB (SessionWeekDays) coincida con el DayOfWeek de .NET (0=Sunday, 6=Saturday).
        // Si tu DB DayOfWeek empieza en 1, necesitarás ajustar el `request.Date.DayOfWeek`.
        // Asumiendo que DayOfWeek en DB es 0=Sunday, 1=Monday...
        var dotNetDayOfWeek = (int)request.Date.DayOfWeek; 
        var doctorWeekDaySessions = await _doctorSessionRepository.GetDoctorWeekDaySessionsAsync(request.DoctorId, dotNetDayOfWeek);

        if (!doctorWeekDaySessions.Any())
        {
            _logger.LogInformation("No sessions found for doctor {DoctorId} on {Date} ({DayOfWeek}).", request.DoctorId, request.Date.ToShortDateString(), dotNetDayOfWeek);
            return new DoctorSessionTimeSlotsResponse { AvailableSlots = new List<string>() };
        }

        // 3. Obtener citas ya reservadas
        // var bookedAppointments = await _doctorSessionRepository.GetBookedAppointmentsAsync(request.DoctorId, request.Date);
        // var bookedSlotStrings = bookedAppointments.Select(a => $"{a.FromTime.ToString(@"hh\:mm tt", CultureInfo.InvariantCulture)} - {a.ToTime.ToString(@"hh\:mm tt", CultureInfo.InvariantCulture)}").ToList();

        // 4. Generar slots disponibles
        var availableSlots = new List<string>();
        var now = DateTime.UtcNow; // Usar UTC para comparaciones consistentes

        // Obtener la zona horaria del cliente (si es posible) o usar la del servidor/configuración
        TimeZoneInfo clientTimeZone;
        try
        {
             // Esto es una simplificación. En un caso real, el cliente enviaría el nombre IANA de su TZ.
             // Para offset, se podría intentar mapear o buscar.
             clientTimeZone = TimeZoneInfo.CreateCustomTimeZone("ClientTimeZone", TimeSpan.FromMinutes(-request.TimezoneOffsetMinutes), "Client Time", "Client Time");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not create custom time zone for offset {Offset}. Using UTC.", request.TimezoneOffsetMinutes);
            clientTimeZone = TimeZoneInfo.Utc;
        }

        foreach (var doctorWeekDaySession in doctorWeekDaySessions)
        {
            // Convertir StartTime y EndTime de TimeSpan a DateTime para cálculos con fechas
            // Usamos la fecha de la solicitud para crear DateTime con la hora correcta
            var sessionStartDateTime = request.Date.Date.Add(doctorWeekDaySession.DayStartTime);
            var sessionEndDateTime = request.Date.Date.Add(doctorWeekDaySession.DayEndTime);

            // Convertir a la zona horaria del cliente para comparaciones de "ahora"
            var sessionStartDateTimeInClientTz = TimeZoneInfo.ConvertTimeFromUtc(sessionStartDateTime, clientTimeZone);
            var sessionEndDateTimeInClientTz = TimeZoneInfo.ConvertTimeFromUtc(sessionEndDateTime, clientTimeZone);
            var nowInClientTz = TimeZoneInfo.ConvertTimeFromUtc(now, clientTimeZone);

            var doctorSessionModel = await _doctorSessionRepository.GetDoctorSessionByIdAsync(doctorWeekDaySession.DoctorSessionId);
            if (doctorSessionModel == null) continue;

            var slotsForThisSession = GetTimeSlot(
                doctorSessionModel.SessionMeetingTime,
                sessionStartDateTimeInClientTz.TimeOfDay, // Pasar TimeSpan
                sessionEndDateTimeInClientTz.TimeOfDay,   // Pasar TimeSpan
                doctorSessionModel.SessionGap // Pasar el gap
            );
            
            foreach (var slotEntry in slotsForThisSession)
            {
                // slotEntry contiene "HH:mm AM" y "HH:mm AM"
                var slotStartTimeStr = slotEntry.Split(" - ")[0];
                var slotEndTimeStr = slotEntry.Split(" - ")[1];

                // Convertir las strings de HH:mm AM/PM a DateTime para una comparación precisa con 'nowInClientTz'
                DateTime parsedSlotStartTime;
                DateTime parsedSlotEndTime;

                // Intentar parsear con formato específico (hh:mm tt para AM/PM)
                if (!DateTime.TryParseExact(slotStartTimeStr, "hh:mm tt", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedSlotStartTime) ||
                    !DateTime.TryParseExact(slotEndTimeStr, "hh:mm tt", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedSlotEndTime))
                {
                    _logger.LogWarning("Failed to parse time slot string: {SlotStart} - {SlotEnd}. Skipping.", slotStartTimeStr, slotEndTimeStr);
                    continue;
                }
                
                // Combinar con la fecha de la solicitud para tener la fecha completa del slot
                parsedSlotStartTime = request.Date.Date.Add(parsedSlotStartTime.TimeOfDay);
                parsedSlotEndTime = request.Date.Date.Add(parsedSlotEndTime.TimeOfDay);

                // Comprobar si el slot es en el mismo día que 'now' y si ya pasó la hora
                bool isSameDayAsNow = (nowInClientTz.Date == request.Date.Date); // Comparar solo la fecha
                bool isSlotInFuture = (parsedSlotStartTime > nowInClientTz);

                if ((isSameDayAsNow && isSlotInFuture) || !isSameDayAsNow)
                {
                    var formattedSlot = $"{parsedSlotStartTime.ToString(@"hh\:mm tt", CultureInfo.InvariantCulture)} - {parsedSlotEndTime.ToString(@"hh\:mm tt", CultureInfo.InvariantCulture)}";

                    // if (!bookedSlotStrings.Contains(formattedSlot) && !availableSlots.Contains(formattedSlot))
                    // {
                    //     availableSlots.Add(formattedSlot);
                    // }
                }
            }
        }

        // Ordenar los slots disponibles si es necesario
        availableSlots = availableSlots.OrderBy(s => TimeSpan.Parse(s.Split(" - ")[0].Replace(" AM", "").Replace(" PM", ""), CultureInfo.InvariantCulture)).ToList();

        return new DoctorSessionTimeSlotsResponse
        {
            // BookedSlots = bookedSlotStrings,
            AvailableSlots = availableSlots
        };
    }


    /// <summary>
    /// Helper para generar slots de tiempo.
    /// Simula el getTimeSlot de Laravel.
    /// </summary>
    /// <param name="intervalMinutes">Duración de cada slot en minutos.</param>
    /// <param name="startTime">Hora de inicio de la sesión.</param>
    /// <param name="endTime">Hora de fin de la sesión.</param>
    /// <param name="gapMinutes">Minutos de 'gap' entre slots.</param>
    /// <returns>Lista de strings con formato "HH:mm AM/PM - HH:mm AM/PM".</returns>
    private List<string> GetTimeSlot(int intervalMinutes, TimeSpan startTime, TimeSpan endTime, int gapMinutes)
    {
        var slots = new List<string>();
        TimeSpan currentSlotStart = startTime;

        while (currentSlotStart.Add(TimeSpan.FromMinutes(intervalMinutes)) <= endTime)
        {
            TimeSpan currentSlotEnd = currentSlotStart.Add(TimeSpan.FromMinutes(intervalMinutes));

            // Asegurarse de que el slot completo no exceda el EndTime de la sesión
            if (currentSlotEnd > endTime)
            {
                break;
            }

            // Formato "HH:mm AM/PM"
            string formattedStartTime = DateTime.MinValue.Add(currentSlotStart).ToString("hh:mm tt", CultureInfo.InvariantCulture);
            string formattedEndTime = DateTime.MinValue.Add(currentSlotEnd).ToString("hh:mm tt", CultureInfo.InvariantCulture);

            slots.Add($"{formattedStartTime} - {formattedEndTime}");

            currentSlotStart = currentSlotEnd.Add(TimeSpan.FromMinutes(gapMinutes));
        }

        return slots;
    }
}
