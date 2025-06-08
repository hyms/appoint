// File: Program.cs
// Descripción: Archivo principal de configuración y arranque de la aplicación ASP.NET Core.
// Actualizado para registrar los nuevos servicios de datos y el IDialogflowService.

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Dialogflow.V2;
using System.IO;
using appoint.Services;
using appoint.Services.implement;
using AppointmentApp.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuración de los servicios de la aplicación.
builder.Services.AddControllers(); //.AddNewtonsoftJson();

// Configuración de la autenticación JWT.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

builder.Services.AddAuthorization();

// Configuración de Dialogflow SessionsClient.
builder.Services.AddSingleton(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var authFilePath = config["Dialogflow:AuthFilePath"];

    if (!File.Exists(authFilePath))
    {
        throw new FileNotFoundException($"El archivo de credenciales de Dialogflow no se encontró en: {authFilePath}");
    }

    var credentials = GoogleCredential.FromFile(authFilePath);
    
    // Se corrige la forma de crear SessionsClient para aceptar GoogleCredential.
    // Se utiliza SessionsClientBuilder para una configuración explícita de credenciales.
    var sessionsClient = new SessionsClientBuilder
    {
        Credential = credentials
    }.Build();

    return sessionsClient;
});

// Registrar el servicio de Dialogflow (IDialogflowService y su implementación).
builder.Services.AddScoped<IDialogflowService, DialogflowService>();

// Registrar los nuevos servicios de datos (simulados por ahora).
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<IAppointmentDataService, AppointmentDataService>(); // Para disponibilidad de horas

// Configuración de Twilio.
// builder.Services.AddSingleton<ITwilioRestClient>(provider =>
// {
//     var config = provider.GetRequiredService<IConfiguration>();
//     var accountSid = config["Twilio:AccountSid"];
//     var authToken = config["Twilio:AuthToken"];
//
//     TwilioClient.Init(accountSid, authToken);
//     return new TwilioRestClient(accountSid, authToken);
// });

//services.Configure<Models.WhatsAppOptions>(options =>
//{
//    options.ApiKey = "YOUR_WHATSAPP_API_KEY"; // Reemplaza con tu API Key de WhatsApp
//});

//services.Configure<Models.OneSignalOptions>(options =>
//{
//    options.AppId = "YOUR_ONESIGNAL_APP_ID"; // Reemplaza con tu App ID de OneSignal
//    options.RestApiKey = "YOUR_ONESIGNAL_REST_API_KEY"; // Reemplaza con tu REST API Key de OneSignal
//});

// Configuración de CORS para permitir peticiones desde el frontend Vue.js.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:8080") // Permite peticiones desde el origen de tu frontend Vue.js
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configuración del pipeline de solicitudes HTTP.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseRouting();

app.UseCors(); // Usa la política CORS definida

app.UseAuthentication();
app.UseAuthorization();

app.UseEndpoints(endpoints => { endpoints.MapControllers(); });

app.Run();