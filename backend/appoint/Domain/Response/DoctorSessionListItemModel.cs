namespace appoint.Domain.Response;

public class DoctorSessionListItemModel
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public string FullName { get; set; } = string.Empty; // Nombre del doctor
    public string Email { get; set; } = string.Empty; // Email del doctor
    public string SessionName { get; set; } = string.Empty; // Nombre de la sesión
    public string SessionMeetingTimeDisplay { get; set; } = string.Empty; // Tiempo de reunión (ej. "30 minutos")
    public string SessionGapDisplay { get; set; } = string.Empty; // Gap (ej. "15 minutos")
    public string SessionTimeRange { get; set; } = string.Empty; // Rango de tiempo de la sesión (ej. "09:00 - 17:00")
}