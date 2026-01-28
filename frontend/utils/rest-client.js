/**
 * RestClient - AJAX wrapper for API calls
 * Automatically adds authentication header from localStorage
 */
let RestClient = {
    get: function (url, callback, error_callback) {
        $.ajax({
            url: Constants.PROJECT_BASE_URL + url,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader(
                    "Authentication",
                    localStorage.getItem("user_token")
                );
            },
            success: function (response) {
                if (callback) callback(response);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (error_callback) error_callback(jqXHR);
            },
        });
    },
    request: function (url, method, data, callback, error_callback) {
        $.ajax({
            url: Constants.PROJECT_BASE_URL + url,
            type: method,
            contentType: 'application/json',
            dataType: 'json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader(
                    "Authentication",
                    localStorage.getItem("user_token")
                );
            },
            data: JSON.stringify(data),
        })
            .done(function (response, status, jqXHR) {
                if (callback) callback(response);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                if (error_callback) {
                    error_callback(jqXHR);
                } else {
                    toastr.error(jqXHR.responseJSON?.message || 'An error occurred');
                }
            });
    },
    post: function (url, data, callback, error_callback) {
        RestClient.request(url, "POST", data, callback, error_callback);
    },
    delete: function (url, data, callback, error_callback) {
        // Support (url, callback, error_callback) when data is omitted
        if (typeof data === "function") {
            error_callback = callback;
            callback = data;
            data = null;
        }
        RestClient.request(url, "DELETE", data, callback, error_callback);
    },
    patch: function (url, data, callback, error_callback) {
        RestClient.request(url, "PATCH", data, callback, error_callback);
    },
    put: function (url, data, callback, error_callback) {
        RestClient.request(url, "PUT", data, callback, error_callback);
    },
}; 