using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class ServiceCreateRequest
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
    public List<Guid>? DoctorIds { get; set; } = new List<Guid>(); // IDs de los doctores que ofrecen este servicio

    [Required(ErrorMessage = "Short description is required.")]
    [StringLength(60)]
    public string ShortDescription { get; set; }

    // El estado inicial podría ser "Active" por defecto en el servicio, o ser configurable.
    // [Required(ErrorMessage = "Status is required.")]
    // [StringLength(50)]
    // public string Status { get; set; }

    // Opcional: Si los iconos se cargan directamente con la creación del servicio
    // public IFormFile? IconFile { get; set; }
}