using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;


public class ChangeDoctorStatusRequest
{
    [Required]
    public Guid DoctorId { get; set; } // O UserId, dependiendo del ID que Laravel usaba. Asumiendo DoctorId.
    
    [Required(ErrorMessage = "Status value is required.")]
    public bool IsActive { get; set; } // True para activo, false para inactivo
}
