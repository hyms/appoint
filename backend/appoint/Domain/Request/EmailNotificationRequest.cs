using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class EmailNotificationRequest
{
    // El campo 'email_notification' en Laravel era 0 o 1. Un booleano es más idiomático en .NET.
    [Required(ErrorMessage = "Email notification preference is required.")]
    public bool EmailNotificationEnabled { get; set; } 
}
