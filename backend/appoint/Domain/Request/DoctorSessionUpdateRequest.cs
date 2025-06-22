using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class DoctorSessionUpdateRequest
{
    [Required(ErrorMessage = "Session name is required.")]
    [StringLength(255)]
    public string SessionName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Session meeting time is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Session meeting time must be a positive integer.")]
    public int SessionMeetingTime { get; set; }

    [Required(ErrorMessage = "Session gap is required.")]
    [Range(0, int.MaxValue, ErrorMessage = "Session gap must be a non-negative integer.")]
    public int SessionGap { get; set; }

    [Required(ErrorMessage = "At least one session week day is required.")]
    public List<SessionWeekDayRequest> SessionWeekDays { get; set; } = new List<SessionWeekDayRequest>();
}