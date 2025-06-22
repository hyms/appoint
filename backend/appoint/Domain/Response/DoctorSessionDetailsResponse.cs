namespace appoint.Domain.Response;

public class DoctorSessionDetailsResponse
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorFullName { get; set; } = string.Empty;
    public string DoctorEmail { get; set; } = string.Empty;
    public string SessionName { get; set; } = string.Empty;
    public int SessionGap { get; set; }
    public int SessionMeetingTime { get; set; }
    public bool IsActive { get; set; }

    // Días de la semana con sus horarios específicos para esta sesión
    public List<SessionWeekDayDetails> SessionWeekDays { get; set; } = new List<SessionWeekDayDetails>();
}
public class SessionWeekDayDetails
{
    public int DayOfWeek { get; set; }
    public List<string> StartTimes { get; set; } = new List<string>(); // "HH:mm AM/PM"
    public List<string> EndTimes { get; set; } = new List<string>();   // "HH:mm AM/PM"
}