using System.Data;
using appoint.Migrations;
using appoint.Services;
using Microsoft.AspNetCore.OpenApi;
using MySqlConnector;

namespace appoint
{
    public static class ServiceExtensions
    {
        public static void ConfigureServices(this IServiceCollection services, string connectionString)
        {
            MigrationRunner.ConfigureMigrationServices(services, connectionString);

            // Add application services
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IDbConnection>(sp => new MySqlConnection(connectionString));
            services.AddScoped<IConfigurationService, ConfigurationService>();

            services.AddControllers();

            // Configure CORS
            services.AddCors(options =>
            {
                options.AddPolicy("AllowLocalhost",
                    builder =>
                    {
                        builder.WithOrigins("*")
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                    });
            });

            // Configure Authorization Policies
            services.AddAuthorization(options =>
            {
                options.AddPolicy("CrearPaciente", policy => policy.RequireClaim("permission", "crear_paciente"));
                options.AddPolicy("EditarCita", policy => policy.RequireClaim("permission", "editar_cita"));
                // ... más políticas
            });

            // Configure Swagger
            services.ConfigureSwagger();
        }

        public static void ConfigureSwagger(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
        }
    }
}