using Google.Cloud.Dialogflow.V2;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options; // Para IOptions
using appoint.Models;

namespace appoint.Services
{
    public class DialogflowService : IDialogflowService
    {
        private readonly SessionsClient _sessionsClient;
        private readonly string _projectId;
        private readonly ILogger<DialogflowService> _logger;

        public DialogflowService(IOptions<DialogflowOptions> options, ILogger<DialogflowService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            var dialogflowOptions = options?.Value ??
                                    throw new ArgumentNullException(nameof(options),
                                        "DialogflowOptions no puede ser null.");

            if (string.IsNullOrWhiteSpace(dialogflowOptions.ProjectId))
            {
                throw new ArgumentException("Dialogflow ProjectId debe estar configurado.",
                    nameof(dialogflowOptions.ProjectId));
            }

            _projectId = dialogflowOptions.ProjectId;

            try
            {
                if (!string.IsNullOrWhiteSpace(dialogflowOptions.CredentialsPath))
                {
                    _logger.LogInformation(
                        "Inicializando DialogflowService con credenciales desde la ruta: {CredentialsPath}",
                        dialogflowOptions.CredentialsPath);
                    var credentials = GoogleCredential.FromFile(dialogflowOptions.CredentialsPath);
                    _sessionsClient = new SessionsClientBuilder
                    {
                        Credential = credentials
                    }.Build();
                }
                else
                {
                    _logger.LogInformation(
                        "Inicializando DialogflowService usando las credenciales predeterminadas de la aplicación (GOOGLE_APPLICATION_CREDENTIALS).");
                    // SessionsClient.Create() usará automáticamente GOOGLE_APPLICATION_CREDENTIALS si está configurada,
                    // o otras formas de Application Default Credentials (ADC).
                    _sessionsClient = SessionsClient.Create();
                }

                _logger.LogInformation("DialogflowService inicializado para el proyecto: {ProjectId}", _projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error al crear Dialogflow SessionsClient. ProjectId: {ProjectId}. CredentialsPath: {CredentialsPath}. Asegúrate de que las credenciales estén configuradas correctamente.",
                    _projectId, dialogflowOptions.CredentialsPath);
                throw; // Re-lanzar para que la aplicación falle al inicio si la configuración es incorrecta.
            }
        }

        public async Task<QueryResult> DetectIntentAsync(string text, string sessionId, string languageCode = "es-ES")
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                _logger.LogWarning("El texto para DetectIntentAsync no puede estar vacío.");
                throw new ArgumentNullException(nameof(text));
            }

            if (string.IsNullOrWhiteSpace(sessionId))
            {
                _logger.LogWarning("SessionId para DetectIntentAsync no puede estar vacío.");
                throw new ArgumentNullException(nameof(sessionId));
            }

            var sessionName = SessionName.FromProjectSession(_projectId, sessionId);
            var queryInput = new QueryInput
            {
                Text = new TextInput
                {
                    Text = text,
                    LanguageCode = languageCode
                }
            };

            try
            {
                _logger.LogDebug(
                    "Enviando solicitud de detección de intención a Dialogflow. Sesión: {SessionId}, Texto: '{Text}'",
                    sessionId, text);
                DetectIntentResponse response = await _sessionsClient.DetectIntentAsync(sessionName, queryInput);
                _logger.LogInformation(
                    "Respuesta recibida de Dialogflow. Intención: {IntentName}, Confianza: {Confidence}",
                    response.QueryResult?.Intent?.DisplayName,
                    response.QueryResult?.IntentDetectionConfidence);
                return response.QueryResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al detectar la intención para la sesión {SessionId}", sessionId);
                throw;
            }
        }
    }
}