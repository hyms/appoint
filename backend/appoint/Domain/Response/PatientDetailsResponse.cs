namespace appoint.Domain.Response;

public class PatientDetailsResponse
{
    public Guid Id { get; set; } // ID del Paciente
    public Guid UserId { get; set; } // ID del Usuario asociado al paciente
    public string RoleName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? RegionCode { get; set; }
    public string? Contact { get; set; }
    
    // Contadores de citas
    public int TodayAppointmentCount { get; set; }
    public int UpcomingAppointmentCount { get; set; }
    public int CompletedAppointmentCount { get; set; }

    public string? BloodGroup { get; set; }
    public int? Gender { get; set; }
    public DateTime? Dob { get; set; }

    // --- INFORMACIÓN DE LA SUCURSAL ASOCIADA AL USUARIO ---
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BranchAddress1 { get; set; } = string.Empty; // Podrías añadir más detalles de la sucursal si se necesitan

    public DateTime CreatedAt { get; set; } // Fecha de creación del usuario
    public DateTime UpdatedAt { get; set; } // Fecha de última actualización del usuario
}
