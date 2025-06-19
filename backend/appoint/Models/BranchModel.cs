using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class BranchModel
{
    public Guid Id { get; set; }

    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string AddressLine1 { get; set; } = string.Empty;

    [StringLength(255)]
    public string? AddressLine2 { get; set; }

    [Required]
    [StringLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string State { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Country { get; set; } = string.Empty;

    [StringLength(20)]
    public string? PostalCode { get; set; }

    [StringLength(50)]
    public string? PhoneNumber { get; set; }

    [EmailAddress]
    [StringLength(225)]
    public string? Email { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}