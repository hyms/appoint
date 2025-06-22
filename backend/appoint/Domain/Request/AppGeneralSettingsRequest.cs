using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class AppGeneralSettingsRequest
{
    [Required(ErrorMessage = "Clinic name is required.")]
    public string Clinic_Name { get; set; } = string.Empty; // Coincide con clinic_name del frontend

    [Required(ErrorMessage = "Contact number is required.")]
    public string Contact_No { get; set; } = string.Empty; // Coincide con contact_no del frontend

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty; // Coincide con email del frontend

    // La propiedad viene como 'email_verified' desde el frontend (boolean)
    [Required(ErrorMessage = "Email verification preference is required.")]
    public bool Email_Verified { get; set; }

    [Required(ErrorMessage = "Currency is required.")]
    public string Currency { get; set; } = string.Empty; // Coincide con currency del frontend
    
    [MaxLength(255)]
    public string? WhatsappApiKey { get; set; }

    [MaxLength(255)]
    public string? OnesignalAppId { get; set; }

}