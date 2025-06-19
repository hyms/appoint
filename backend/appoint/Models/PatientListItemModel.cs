namespace appoint.Models;

public class PatientListItemModel
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TotalAppointments { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public string CreatedAt { get; set; } = string.Empty; // Formato de fecha
}
