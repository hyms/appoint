// File: Program.cs
// Descripción: Archivo principal de configuración y arranque de la aplicación ASP.NET Core.

using appoint;
using appoint.Migrations;
using Serilog;

// Usaremos una extensión para organizar los servicios
Log.Logger = new LoggerConfiguration()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

// Configuración de los servicios de la aplicación.
// Llamada al método de extensión para registrar todos los servicios
builder.Services.AddAppointServices(builder.Configuration, builder.Environment);

var app = builder.Build();

// Configuración del pipeline de solicitudes HTTP.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// app.UseHttpsRedirection(); // Si usas HTTPS en producción
app.UseRouting();

app.UseCors(); // Usa la política CORS definida

app.UseAuthentication();
app.UseAuthorization();

// migrations
var serviceProvider = app.Services.CreateScope().ServiceProvider;
MigrationRunner.RunMigrations(serviceProvider);

app.UseEndpoints(endpoints => { endpoints.MapControllers(); });

app.Run();