namespace appoint.Domain.Response;

public class DoctorSessionTimeSlotsResponse
{
    public List<string>? BookedSlots { get; set; } = new List<string>(); // Slots ya reservados (e.g., "HH:mm AM - HH:mm AM")
    public List<string> AvailableSlots { get; set; } = new List<string>(); // Slots disponibles (e.g., "HH:mm AM - HH:mm AM")
}