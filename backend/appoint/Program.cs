using System.Text.Json;
using System.Text.Json.Serialization;
using appoint;
using appoint.Migrations;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configuración de los servicios de la aplicación.
// Llamada al método de extensión para registrar todos los servicios de Appoint.
builder.Services.AddAppointServices(builder.Configuration, builder.Environment);

var app = builder.Build();

// --- Configuración del pipeline de solicitudes HTTP ---

// Middleware de logging de solicitudes HTTP de Serilog.
// Es crucial que vaya ANTES de UseRouting y UseEndpoints para que capture la información de la solicitud.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
app.UseSerilogRequestLogging();
// app.UseHttpsRedirection(); // Descomentar si usas HTTPS en producción

app.UseRouting(); // Habilita el enrutamiento para que los endpoints se puedan mapear.

app.UseCors(); // Usa la política CORS definida (asegúrate de que esté configurada en AddAppointServices)

app.UseAuthentication(); // Habilita el middleware de autenticación.
app.UseAuthorization(); // Habilita el middleware de autorización.

// Ejecuta las migraciones. Se recomienda hacerlo después de que la aplicación esté construida
// y los servicios estén disponibles.
var serviceProvider = app.Services.CreateScope().ServiceProvider;
MigrationRunner.RunMigrations(serviceProvider);

// Mapea los controladores. Este es el punto donde los controladores se registran en el pipeline.
app.MapControllers(); // Reemplaza UseEndpoints para versiones más nuevas de .NET Core

// Inicia la aplicación.
app.Run();