namespace appoint.Services;

public interface IDialogflowService
{
    Task<Google.Cloud.Dialogflow.V2.QueryResult> DetectIntentAsync(string text, string sessionId, string languageCode = "es-ES");

}