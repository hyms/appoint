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

    public bool HasDoctorOrAdminPermission { get; set; } // Indica si el usuario logueado tiene rol de doctor o admin
    public bool IsPatientRole { get; set; } // Indica si el usuario logueado tiene rol de paciente

    public ICollection<SpecializationModel>? Specializations { get; set; } // Especializaciones asociadas
    public string? BloodGroup { get; set; }
    public int? Gender { get; set; }
    public DateTime? Dob { get; set; }
    public int? Experience { get; set; }
    public AddressModel? Address { get; set; } // Detalles de la dirección anidada

    public DateTime CreatedAt { get; set; } // Fecha de creación del Usuario
    public DateTime UpdatedAt { get; set; } // Fecha de última actualización del Usuario

    // URLs de redes sociales (de DoctorModel)
    public string? TwitterUrl { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? InstagramUrl { get; set; }

    // Calificaciones (si se cargan con los detalles del doctor)
    public ICollection<QualificationModel>? Qualifications { get; set; }
}