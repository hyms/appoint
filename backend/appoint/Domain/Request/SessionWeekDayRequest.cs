using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class SessionWeekDayRequest
{
    [Required]
    [Range(0, 6, ErrorMessage = "DayOfWeek must be between 0 (Sunday) and 6 (Saturday).")]
    public int DayOfWeek { get; set; }

    [Required]
    [RegularExpression(@"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Start time must be in HH:mm format.")]
    public string StartTime { get; set; } = string.Empty; // "HH:mm"

    [Required]
    [RegularExpression(@"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "End time must be in HH:mm format.")]
    public string EndTime { get; set; } = string.Empty; // "HH:mm"
}