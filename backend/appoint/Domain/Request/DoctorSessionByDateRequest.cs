using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class DoctorSessionByDateRequest
{
    [Required(ErrorMessage = "Date is required.")]
    [DataType(DataType.Date)]
    public DateTime Date { get; set; }

    [Required(ErrorMessage = "Doctor ID is required.")]
    public Guid DoctorId { get; set; }

    [Required(ErrorMessage = "Timezone offset minutes is required.")]
    public int TimezoneOffsetMinutes { get; set; }

    // Si tu lógica requiere adminAppointmentDoctorId, añádelo
    public Guid? AdminAppointmentDoctorId { get; set; }
}