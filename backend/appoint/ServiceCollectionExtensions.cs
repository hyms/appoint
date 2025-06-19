using System.Data;
using System.Text;
using appoint.Infrastructure;
using appoint.Infrastructure.Data;
using appoint.Migrations;
using appoint.Repository;
using appoint.Repository.impl;
using appoint.Services;
using appoint.Services.implement;
using AppointmentApp.Backend.Services;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Dialogflow.V2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;

// Si estás usando Twilio, deberás descomentar estas líneas y añadir el paquete NuGet.
// using Twilio.Clients;
// using Twilio;

namespace appoint; // Ajusta el namespace según la estructura de tu proyecto

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppointServices(this IServiceCollection services, 
                                                        IConfiguration configuration,
                                                        IWebHostEnvironment env)
    {
        // Añadir controladores
        services.AddControllers(); //.AddNewtonsoftJson(); // Si lo necesitas, descomenta .AddNewtonsoftJson()

        // Configuración de la autenticación JWT.
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtSettings:SecretKey"]!))
                };
            });

        // Configuración de políticas de autorización basadas en Claims ("Permission")
        services.AddAuthorization(options =>
        {
            options.AddPolicy("RequireManageUsersPermission", policy =>
                policy.RequireClaim("Permission", "ManageUsers"));
            options.AddPolicy("RequireViewLogsPermission", policy =>
                policy.RequireClaim("Permission", "ViewLogs"));
            options.AddPolicy("RequireScheduleAppointmentsPermission", policy =>
                policy.RequireClaim("Permission", "ScheduleAppointments"));
            options.AddPolicy("RequireViewPatientDataPermission", policy =>
                policy.RequireClaim("Permission", "ViewPatientData"));
            // Agrega más políticas según tus necesidades.
        });
        // services.AddAuthorization(); // Esto ya se incluye con AddAuthentication y las políticas, puedes omitirlo.

        MigrationRunner.ConfigureMigrationServices(services,configuration.GetConnectionString("DefaultConnection")!);
        // Configuración de Dialogflow SessionsClient.
        services.AddSingleton(provider =>
        {
            var config = provider.GetRequiredService<IConfiguration>();
            var authFilePath = config["Dialogflow:AuthFilePath"];
    
            GoogleCredential credentials;

            if (!string.IsNullOrEmpty(authFilePath))
            {
                // Si se proporciona una ruta, intenta cargar desde el archivo
                if (!File.Exists(authFilePath))
                {
                    throw new FileNotFoundException($"El archivo de credenciales de Dialogflow no se encontró en: {authFilePath}");
                }
                credentials = GoogleCredential.FromFile(authFilePath);
            }
            else
            {
                // Si AuthFilePath está vacío, usa las credenciales por defecto (desde GOOGLE_APPLICATION_CREDENTIALS)
                try
                {
                    credentials = GoogleCredential.GetApplicationDefault();
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException(
                        "No se pudo cargar las credenciales de Dialogflow. " +
                        "Asegúrate de que la variable de entorno GOOGLE_APPLICATION_CREDENTIALS esté configurada " +
                        "o proporciona una ruta válida en Dialogflow:AuthFilePath en appsettings.json.", ex);
                }
            }
    
            var sessionsClient = new SessionsClientBuilder
            {
                Credential = credentials
            }.Build();

            return sessionsClient;
        });

        // Registrar el servicio de Dialogflow (IDialogflowService y su implementación).
        services.AddScoped<IDialogflowService, DialogflowService>();
        
        services.AddScoped<IDbConnection>(sp => {
            var config = sp.GetRequiredService<IConfiguration>();
            var connectionString = config.GetConnectionString("DefaultConnection");
            return new MySqlConnection(connectionString); // Asegúrate de usar MySqlConnection si es MySQL
        });
        // Configuración de Dapper y SqlDataAccess
        services.AddSingleton<ISqlDataAccess, SqlDataAccess>();

        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IServiceService, ServiceService>();
        services.AddScoped<IServiceCategoryRepository, ServiceCategoryRepository>();
        services.AddScoped<IServiceRepository, ServiceRepository>();
        services.AddScoped<IStaffService, StaffService>();
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<IBranchRepository, BranchRepository>();
        services.AddScoped<IUserService, UserService>();
        
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IDoctorRepository, DoctorRepository>();
        services.AddScoped<IQualificationRepository, QualificationRepository>();
        services.AddScoped<IServiceCategoryRepository, ServiceCategoryRepository>();
        services.AddScoped<IServiceRepository, ServiceRepository>();
        services.AddScoped<IStaffRepository, StaffRepository>();
        services.AddScoped<IBranchRepository, BranchRepository>();
        services.AddScoped<IPatientRepository, PatientRepository>();
        
        // Configuración de Twilio (descomentar si se usa).
        // services.AddSingleton<ITwilioRestClient>(provider =>
        // {
        //     var config = provider.GetRequiredService<IConfiguration>();
        //     var accountSid = config["Twilio:AccountSid"];
        //     var authToken = config["Twilio:AuthToken"];
        //
        //     TwilioClient.Init(accountSid, authToken);
        //     return new TwilioRestClient(accountSid, authToken);
        // });

        // Configuración de WhatsApp/OneSignal (si se usan).
        // services.Configure<Models.WhatsAppOptions>(configuration.GetSection("WhatsApp"));
        // services.Configure<Models.OneSignalOptions>(configuration.GetSection("OneSignal"));

        // Configuración de CORS para permitir peticiones desde el frontend Vue.js.
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                // En desarrollo, puedes permitir localhost:8080.
                // En producción, asegúrate de especificar el dominio real de tu frontend.
                if (env.IsDevelopment())
                {
                    policy.WithOrigins("http://localhost:8080", "http://127.0.0.1:8080") // Asegura que 127.0.0.1 también esté cubierto
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                }
                else
                {
                    // Para producción, especifica el dominio(s) exacto(s) de tu frontend
                    policy.WithOrigins("https://tudominiofrontend.com") // REEMPLAZAR CON TU DOMINIO REAL
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials(); // Si manejas cookies o autenticación basada en credenciales
                }
            });
        });

        return services;
    }
}