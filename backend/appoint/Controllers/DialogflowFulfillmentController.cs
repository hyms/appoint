using System.Globalization;
using appoint.Models;
using appoint.Services;
using Google.Cloud.Dialogflow.V2;
using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.Mvc;

namespace appoint.Controllers
{
    [ApiController]
    [Route("api/dialogflow-fulfillment")] // Esta es la URL que configurarás en la sección "Fulfillment" de Dialogflow
    public class DialogflowFulfillmentController : ControllerBase
    {
        // private readonly ILocationService _locationService;
        // private readonly IDoctorService _doctorService;
        // private readonly IAppointmentDataService _appointmentDataService;
        // private readonly ILogger<DialogflowFulfillmentController> _logger; // Para logging
        //
        // public DialogflowFulfillmentController(
        //     ILocationService locationService,
        //     IDoctorService doctorService,
        //     IAppointmentDataService appointmentDataService,
        //     ILogger<DialogflowFulfillmentController> logger)
        // {
        //     _locationService = locationService;
        //     _doctorService = doctorService;
        //     _appointmentDataService = appointmentDataService;
        //     _logger = logger;
        // }
        //
        // /// <summary>
        // /// Maneja las peticiones de webhook de Dialogflow para Fulfillment.
        // /// Aquí es donde se procesa la lógica de negocio dinámica y se consulta la base de datos.
        // /// </summary>
        // /// <returns>Una respuesta de WebhookResponse para Dialogflow.</returns>
        // [HttpPost]
        // public async Task<IActionResult> HandleDialogflowFulfillment()
        // {
        //     // Lee el cuerpo de la petición como JSON
        //     using var reader = new StreamReader(Request.Body);
        //     var json = await reader.ReadToEndAsync();
        //     
        //     // Parsea la petición de Dialogflow
        //     WebhookRequest request;
        //     try
        //     {
        //         request = WebhookRequest.Parser.ParseJson(json);
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError(ex, "Error al parsear WebhookRequest de Dialogflow.");
        //         return BadRequest(new WebhookResponse { FulfillmentText = "Hubo un error interno al procesar tu solicitud." }.ToString());
        //     }
        //
        //     var intentDisplayName = request.QueryResult.Intent?.DisplayName;
        //     _logger.LogInformation($"Dialogflow Webhook recibido para Intent: {intentDisplayName}");
        //
        //     // Crea una respuesta para Dialogflow
        //     var response = new WebhookResponse();
        //     string fulfillmentText = "No pude procesar tu solicitud. Por favor, intenta de nuevo."; // Mensaje por defecto
        //
        //     try
        //     {
        //         switch (intentDisplayName)
        //         {
        //             case "CheckAvailability":
        //                 // --- Lógica para la intención de verificar disponibilidad ---
        //                 DateTime? requestedDate = GetDateParameter(request.QueryResult.Parameters, "date");
        //                 string doctorName = GetStringParameter(request.QueryResult.Parameters, "doctor");
        //                 string locationName = GetStringParameter(request.QueryResult.Parameters, "location");
        //
        //                 Doctor doctor = null;
        //                 Location location = null;
        //
        //                 if (!string.IsNullOrEmpty(doctorName))
        //                 {
        //                     doctor = await _doctorService.GetDoctorByNameAsync(doctorName);
        //                     if (doctor == null)
        //                     {
        //                         fulfillmentText = $"Lo siento, no encontré al doctor '{doctorName}'. ¿Puedes verificar el nombre?";
        //                         break;
        //                     }
        //                 }
        //
        //                 if (!string.IsNullOrEmpty(locationName))
        //                 {
        //                     location = await _locationService.GetLocationByNameAsync(locationName);
        //                     if (location == null)
        //                     {
        //                         fulfillmentText = $"Lo siento, no encontré la ubicación '{locationName}'. ¿Puedes verificar el nombre?";
        //                         break;
        //                     }
        //                 }
        //
        //                 if (requestedDate.HasValue)
        //                 {
        //                     // Llama al servicio de citas para obtener horas disponibles
        //                     var availableHours = await _appointmentDataService.GetAvailableHoursAsync(
        //                         requestedDate.Value, doctor?.Id, location?.Id);
        //                 
        //                     if (availableHours != null && availableHours.Any())
        //                     {
        //                         string doctorInfo = doctor != null ? $" con el Dr. {doctor.Name}" : "";
        //                         string locationInfo = location != null ? $" en {location.Name}" : "";
        //                         fulfillmentText = $"La disponibilidad para el {requestedDate.Value.ToShortDateString()}{doctorInfo}{locationInfo} es: {string.Join(", ", availableHours)}.";
        //                     }
        //                     else
        //                     {
        //                         fulfillmentText = $"Lo siento, no hay disponibilidad para el {requestedDate.Value.ToShortDateString()}{doctor?.Name}{location?.Name}. Por favor, intenta con otra fecha.";
        //                     }
        //                 }
        //                 else
        //                 {
        //                     fulfillmentText = "Por favor, especifica la fecha para la que quieres revisar la disponibilidad.";
        //                 }
        //                 break;
        //
        //             case "ListDoctors":
        //                 // --- Lógica para listar doctores ---
        //                 string specialty = GetStringParameter(request.QueryResult.Parameters, "specialty");
        //                 IEnumerable<Doctor> doctors;
        //             
        //                 if (!string.IsNullOrEmpty(specialty))
        //                 {
        //                     doctors = await _doctorService.GetDoctorsBySpecialtyAsync(specialty);
        //                     if (doctors.Any())
        //                     {
        //                         fulfillmentText = $"Los doctores de {specialty} disponibles son: {string.Join(", ", doctors.Select(d => d.Name))}.";
        //                     }
        //                     else
        //                     {
        //                         fulfillmentText = $"Lo siento, no encontré doctores en la especialidad de {specialty}.";
        //                     }
        //                 }
        //                 else
        //                 {
        //                     doctors = await _doctorService.GetAllDoctorsAsync();
        //                     if (doctors.Any())
        //                     {
        //                         fulfillmentText = $"Nuestros doctores son: {string.Join(", ", doctors.Select(d => $"{d.Name} ({d.Specialty})"))}.";
        //                     }
        //                     else
        //                     {
        //                         fulfillmentText = "Lo siento, no hay doctores registrados en este momento.";
        //                     }
        //                 }
        //                 break;
        //
        //             case "ListLocations":
        //                 // --- Lógica para listar ubicaciones/agencias ---
        //                 var locations = await _locationService.GetAllLocationsAsync();
        //                 if (locations.Any())
        //                 {
        //                     fulfillmentText = $"Nuestras ubicaciones son: {string.Join(", ", locations.Select(l => $"{l.Name} en {l.Address}"))}.";
        //                 }
        //                 else
        //                 {
        //                     fulfillmentText = "Lo siento, no hay ubicaciones registradas en este momento.";
        //                 }
        //                 break;
        //
        //             case "BookAppointment":
        //                 // --- Lógica para reservar una cita ---
        //                 // Aquí extraerías todos los parámetros necesarios (fecha, hora, doctor, ubicación, etc.)
        //                 // y llamarías a tu servicio para guardar la cita en la base de datos.
        //                 // Ejemplo:
        //                 // var bookingResult = await _appointmentService.CreateAppointment(userId, date, time, doctorId, locationId);
        //                 // if (bookingResult.Success) {
        //                 //     fulfillmentText = "¡Excelente! Tu cita ha sido confirmada.";
        //                 // } else {
        //                 //     fulfillmentText = $"Lo siento, no pude reservar la cita: {bookingResult.Message}";
        //                 // }
        //                 fulfillmentText = "Estoy procesando tu solicitud de reserva. Un momento por favor...";
        //                 break;
        //
        //             default:
        //                 // Si la intención no tiene una lógica de negocio específica en el backend,
        //                 // Dialogflow ya habrá proporcionado un fulfillmentText predeterminado.
        //                 // Aquí podrías usar request.QueryResult.FulfillmentText si no quieres sobrescribirlo.
        //                 fulfillmentText = request.QueryResult.FulfillmentText;
        //                 break;
        //         }
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError(ex, $"Error al procesar la intención '{intentDisplayName}' en el fulfillment webhook.");
        //         fulfillmentText = "Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.";
        //     }
        //
        //     response.FulfillmentText = fulfillmentText;
        //     return Ok(response.ToString());
        // }
        //
        // /// <summary>
        // /// Ayudante para extraer un parámetro de fecha de Dialogflow.
        // /// </summary>
        // private DateTime? GetDateParameter(Struct parameters, string paramName)
        // {
        //     if (parameters?.Fields != null && parameters.Fields.TryGetValue(paramName, out var value) && value.KindCase == Value.KindOneofCase.StringValue)
        //     {
        //         // Dialogflow envía fechas en formato ISO 8601 (ej. "2025-05-22T12:00:00Z")
        //         if (DateTime.TryParse(value.StringValue, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal, out var parsedDate))
        //         {
        //             return parsedDate.Date; // Solo la parte de la fecha
        //         }
        //     }
        //     return null;
        // }
        //
        // /// <summary>
        // /// Ayudante para extraer un parámetro de cadena de Dialogflow.
        // /// </summary>
        // private string GetStringParameter(Struct parameters, string paramName)
        // {
        //     if (parameters?.Fields != null && parameters.Fields.TryGetValue(paramName, out var value) && value.KindCase == Value.KindOneofCase.StringValue)
        //     {
        //         return value.StringValue;
        //     }
        //     return null;
        // }
    }
}
