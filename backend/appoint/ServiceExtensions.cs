using System.Data;
using appoint.Migrations;
using appoint.Services;
using MySqlConnector;

namespace appoint
{
    public static class ServiceExtensions
    {
        private static IConfiguration _config = null!;

        public static void ConfigureServices(this IServiceCollection services, string connectionString)
        {
            MigrationRunner.ConfigureMigrationServices(services, connectionString);
            // Load configuration
            _config = services.BuildServiceProvider().GetRequiredService<IConfiguration>();

            // Add application services
            services.AddScoped<IDbConnection>(sp => new MySqlConnection(connectionString));
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IConfigurationService, ConfigurationService>();
            services.AddScoped<IPermissionService, PermissionService>();
            
            //services.AddScoped<IRoleService, RoleService>();
            //services.AddScoped<IPatientService, PatientService>();
            //services.AddScoped<IDoctorService, DoctorService>();
            //services.AddScoped<IAppointmentService, AppointmentService>();
            //services.AddScoped<IReportService, ReportService>();
            //services.AddScoped<INotificationService, NotificationService>();
            //services.AddScoped<IWhatsAppService, WhatsAppService>();
            //services.AddScoped<IOneSignalService, OneSignalService>();
            services.AddScoped<IDialogflowService, DialogflowService>(); // Registrar DialogflowService

            // Configure Options
            services.Configure<Models.DialogflowOptions>(options =>
            {
                options.ProjectId = _config.GetSection(Models.DialogflowOptions.SectionName)["ProjectId"] ?? "appoint-429515"; // Reemplaza con tu Project ID
                options.CredentialsPath = _config.GetSection(Models.DialogflowOptions.SectionName)["CredentialsPath"] ?? ""; // Deja vacío para usar GOOGLE_APPLICATION_CREDENTIALS
            });


            //services.Configure<Models.WhatsAppOptions>(options =>
            //{
            //    options.ApiKey = "YOUR_WHATSAPP_API_KEY"; // Reemplaza con tu API Key de WhatsApp
            //});

            //services.Configure<Models.OneSignalOptions>(options =>
            //{
            //    options.AppId = "YOUR_ONESIGNAL_APP_ID"; // Reemplaza con tu App ID de OneSignal
            //    options.RestApiKey = "YOUR_ONESIGNAL_REST_API_KEY"; // Reemplaza con tu REST API Key de OneSignal
            //});

            
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
            // Configure Authentication
            services.AddAuthentication();
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