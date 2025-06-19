namespace appoint.Models;

public class PatientAppointmentListItemModel
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty; // Nombre completo del doctor
    public Guid DoctorId { get; set; }
    public string Email { get; set; } = string.Empty; // Email del doctor
    public string FromTime { get; set; } = string.Empty;
    public string FromTimeType { get; set; } = string.Empty;
    public string ToTime { get; set; } = string.Empty;
    public string ToTimeType { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty; // Fecha formateada
    public int Status { get; set; } // Estado de la cita (ej. 1:Booked, 2:CheckedIn)
}
