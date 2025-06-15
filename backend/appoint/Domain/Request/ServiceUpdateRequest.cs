using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class ServiceUpdateRequest
{
    [Required(ErrorMessage = "Service name is required.")]
    [StringLength(255)]
    public string Name { get; set; }

    [Required(ErrorMessage = "Category ID is required.")]
    public Guid CategoryId { get; set; }

    [Required(ErrorMessage = "Charges are required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Charges must be greater than 0.")]
    public decimal Charges { get; set; } // Price del servicio

    [Required(ErrorMessage = "Doctors are required.")]
    public List<Guid>? DoctorIds { get; set; } = new List<Guid>();

    [Required(ErrorMessage = "Short description is required.")]
    [StringLength(60)]
    public string ShortDescription { get; set; }

    [Required(ErrorMessage = "Status is required.")]
    [StringLength(50)]
    public string Status { get; set; } // Permite actualizar el estado

    // Opcional: Si los iconos se actualizan con el servicio
    // public IFormFile? IconFile { get; set; }
}