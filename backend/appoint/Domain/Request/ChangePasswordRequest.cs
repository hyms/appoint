using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    [MinLength(6, ErrorMessage = "New password must be at least 6 characters long.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password confirmation is required.")]
    [Compare("NewPassword", ErrorMessage = "New password and confirmation do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}