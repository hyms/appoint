using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class UpdateChangePasswordRequest
{
    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; set; }

    [Required(ErrorMessage = "New password is required.")]
    [StringLength(255, MinimumLength = 6, ErrorMessage = "New password must be at least 6 characters long.")]
    public string NewPassword { get; set; }

    [Compare("NewPassword", ErrorMessage = "Confirm password does not match.")]
    public string ConfirmPassword { get; set; }
}