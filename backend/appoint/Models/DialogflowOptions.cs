    namespace appoint.Models;

    public class DialogflowOptions
    {
        public const string SectionName = "Dialogflow"; // Usado para la configuración en appsettings.json o prefijos de variables de entorno

        public string ProjectId { get; set; }

        /// <summary>
        /// Ruta opcional al archivo JSON de credenciales de la cuenta de servicio.
        /// Si está vacío o no se proporciona, el servicio intentará usar
        /// las credenciales predeterminadas de la aplicación (GOOGLE_APPLICATION_CREDENTIALS).
        /// </summary>
        public string CredentialsPath { get; set; }
    }