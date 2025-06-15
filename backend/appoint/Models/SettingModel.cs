namespace appoint.Models;

public class SettingModel
{
    public Guid Id { get; set; }
    public string Key { get; set; } // Anteriormente setting_name
    public string Value { get; set; } // Anteriormente setting_value
    // Basado en tu migración, no hay CreatedAt ni UpdatedAt en la tabla Settings.
    // Si los añades a la migración, también deberías añadirlos aquí.
}