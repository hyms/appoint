using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class AddressModel
{
    public Guid Id { get; set; }
    
    [Required(ErrorMessage = "Address line 1 is required.")]
    [StringLength(255)]
    public string Address1 { get; set; }

    [StringLength(255)]
    public string? Address2 { get; set; }

    public Guid? CountryId { get; set; }
    public Guid? StateId { get; set; }
    public Guid? CityId { get; set; }

    [StringLength(20)]
    public string? PostalCode { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}