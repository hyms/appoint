using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class AppGeneralSettingsRequest
{
    [MaxLength(255)]
    public string? NombreEmpresa { get; set; }

    [MaxLength(255)]
    public string? DireccionEmpresa { get; set; }

    [MaxLength(50)]
    public string? TelefonoEmpresa { get; set; }

    [MaxLength(255)]
    public string? WhatsappApiKey { get; set; }

    [MaxLength(255)]
    public string? OnesignalAppId { get; set; }

    // Puedes añadir más propiedades según las configuraciones que quieras gestionar
    // Por ejemplo:
    [MaxLength(255)]
    public string? EmailSoporte { get; set; }

    [MaxLength(50)]
    public string? MonedaPorDefecto { get; set; }
}