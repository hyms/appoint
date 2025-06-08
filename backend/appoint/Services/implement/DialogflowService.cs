using Google.Cloud.Dialogflow.V2;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System;
using appoint.Services;

namespace AppointmentApp.Backend.Services
{
    public class DialogflowService : IDialogflowService
    {
        private readonly SessionsClient _sessionsClient;
        private readonly IConfiguration _configuration;

        public DialogflowService(SessionsClient sessionsClient, IConfiguration configuration)
        {
            _sessionsClient = sessionsClient;
            _configuration = configuration;
        }

        public async Task<QueryResult> DetectIntentAsync(string messageText, string sessionId, string languageCode = "es")
        {
            var projectId = _configuration["Dialogflow:ProjectId"];
            if (string.IsNullOrEmpty(projectId))
            {
                throw new InvalidOperationException("El ID del proyecto de Dialogflow no está configurado en appsettings.json.");
            }

            var sessionName = SessionName.FromProjectSession(projectId, sessionId);
            var queryInput = new QueryInput
            {
                Text = new TextInput { Text = messageText, LanguageCode = languageCode }
            };

            DetectIntentResponse response;
            try
            {
                response = await _sessionsClient.DetectIntentAsync(sessionName, queryInput);
                return response.QueryResult;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inesperado al comunicarse con Dialogflow: {ex.Message}");
                throw new ApplicationException("Error inesperado en el servicio de Dialogflow.", ex);
            }
        }
    }
}