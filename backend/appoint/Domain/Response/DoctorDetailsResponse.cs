using appoint.Models;

namespace appoint.Domain.Response;

public class DoctorDetailsResponse
{
    public Guid Id { get; set; } // ID del Doctor
    public Guid UserId { get; set; } // ID del Usuario
    public string RoleName { get; set; } // Asumiendo que el nombre del rol viene del rol del usuario
    public string Email { get; set; }
    public string? RegionCode { get; set; }
    public string? Contact { get; set; }

    public int TotalAppointmentCount { get; set; }
    public int TodayAppointmentCount { get; set; }
    public int UpcomingAppointmentCount { get; set; }

    public bool HasDoctorOrAdminPermission { get; set; }
    public bool IsPatientRole { get; set; }

    public ICollection<SpecializationModel>? Specializations { get; set; }
    public string? BloodGroup { get; set; }
    public int? Gender { get; set; }
    public DateTime? Dob { get; set; }
    public int? Experience { get; set; }

    // --- INFORMACIÓN DE LA SUCURSAL ASOCIADA AL USUARIO ---
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BranchAddress1 { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string? TwitterUrl { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? InstagramUrl { get; set; }

    public ICollection<QualificationModel>? Qualifications { get; set; }
}
