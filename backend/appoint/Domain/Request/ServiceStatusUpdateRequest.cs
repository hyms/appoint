using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class ServiceStatusUpdateRequest
{
    [Required(ErrorMessage = "Service ID is required.")]
    public Guid ServiceId { get; set; }

    [Required(ErrorMessage = "Status value is required.")]
    [StringLength(50)]
    public string Status { get; set; } // Ej. "Active", "Inactive"
}