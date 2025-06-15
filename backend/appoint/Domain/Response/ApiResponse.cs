namespace appoint.Domain.Response;

public class ApiResponse<T>
{
    public int? ErrorCode { get; set; }
    public string Message { get; set; }
    public T Data { get; set; }

    public ApiResponse(T data, string message = "Success", int? errorCode = null)
    {
        ErrorCode = errorCode;
        Message = message;
        Data = data;
    }

    public ApiResponse(string message, int errorCode)
    {
        ErrorCode = errorCode;
        Message = message;
        Data = default!; // O puedes establecerlo en null según tu preferencia
    }

    // Constructor para respuestas exitosas sin datos específicos
    public ApiResponse(string message = "Success", int? errorCode = null)
    {
        ErrorCode = errorCode;
        Message = message;
        Data = default!;
    }
}
public class ApiResponse : ApiResponse<object>
{
    public ApiResponse(object data, int? errorCode = null,string message = "Error") : base(data, message, errorCode) { }
    public ApiResponse(object data, string message = "Success", int? errorCode = null) : base(data, message, errorCode) { }
    public ApiResponse(string message, int errorCode) : base(message, errorCode) { }
    public ApiResponse(string message = "Success", int? errorCode = null) : base(message, errorCode) { }
}
