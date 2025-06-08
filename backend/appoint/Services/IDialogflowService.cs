using Google.Cloud.Dialogflow.V2;

namespace appoint.Services;

public interface IDialogflowService
{
    Task<QueryResult> DetectIntentAsync(string messageText, string sessionId, string languageCode = "es");
}