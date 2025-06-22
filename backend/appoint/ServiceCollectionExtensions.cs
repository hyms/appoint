using System.Data;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
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
using Serilog;

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
        services.AddControllers().AddJsonOptions(options =>
        {
            // Configura el serializador JSON.
            // JsonStringEnumConverter asegura que los enums se serialicen como strings, no como enteros.
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            // PropertyNameCaseInsensitive = true permite que la deserialización ignore mayúsculas/minúsculas.
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            // PropertyNamingPolicy = JsonNamingPolicy.CamelCase asegura que se esperen nombres de propiedades en camelCase.
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        });

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme; // Esquema por defecto para autenticación
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;   // Esquema por defecto para desafíos (respuestas 401)
        }).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true, // Validar el emisor del token
                    ValidateAudience = true, // Validar la audiencia del token
                    ValidateLifetime = true, // Validar la fecha de expiración del token
                    ValidateIssuerSigningKey = true, // Validar la firma del token

                    ValidIssuer = configuration["Jwt:Issuer"], // Leer del appsettings.json
                    ValidAudience = configuration["Jwt:Audience"], // Leer del appsettings.json
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)), // Clave secreta
            
                    ClockSkew = TimeSpan.Zero // No permite desviación de reloj, el token expira exactamente en el tiempo especificado
                };
            });

        // Configuración de políticas de autorización basadas en Claims ("Permission")
        services.AddAuthorization(options =>
        {
            // options.AddPolicy("RequireManageUsersPermission", policy =>
            //     policy.RequireClaim("Permission", "ManageUsers"));
            // options.AddPolicy("RequireViewLogsPermission", policy =>
            //     policy.RequireClaim("Permission", "ViewLogs"));
            // options.AddPolicy("RequireScheduleAppointmentsPermission", policy =>
            //     policy.RequireClaim("Permission", "ScheduleAppointments"));
            // options.AddPolicy("RequireViewPatientDataPermission", policy =>
            //     policy.RequireClaim("Permission", "ViewPatientData"));
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
        services.AddScoped<ISettingsRepository, SettingsRepository>();
        
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
                // En desarrollo, especificamos el origen exacto y permitimos credenciales.
                // Eliminar el "*" si se usa AllowCredentials().
                if (env.IsDevelopment())
                {
                    policy.WithOrigins("http://localhost:5173") // Origen exacto de tu frontend Vue
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials(); // Permitir credenciales para JWT en headers
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
        services.AddSerilog((s, lc) => lc
            .ReadFrom.Configuration(configuration)
            .ReadFrom.Services(s)
            .Enrich.FromLogContext()
        );
        return services;
    }
}