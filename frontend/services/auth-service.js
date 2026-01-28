/**
 * AuthService - Handles user authentication (login, register, logout)
 */
var AuthService = {
    init: function () {
        var token = localStorage.getItem("user_token");
        if (token && token !== undefined) {
            window.location.hash = "#homepage";
            toastr.info("You are already logged in.", "", { positionClass: "toast-top-right" });
            return;
        }
        $("#login-form").on("submit", function (e) {
            e.preventDefault();
            $("#login-error").addClass("d-none").text("");
            AuthService.login(Object.fromEntries(new FormData(this).entries()));
            return false;
        });
        $("#login-form input").on("focus input", function () { $("#login-error").addClass("d-none").text(""); });
    },

    login: function (entity) {
        $.ajax({
            url: Constants.PROJECT_BASE_URL + "auth/login",
            type: "POST",
            data: JSON.stringify(entity),
            contentType: "application/json",
            dataType: "json",
            success: function (result) {
                if (result.data && result.data.token) {
                    localStorage.setItem("user_token", result.data.token);
                    localStorage.setItem("user", JSON.stringify(result.data.user));
                    window.location.replace("index.html#homepage");
                    return;
                }
                AuthService.showLoginError(result.error || "Invalid email or password.");
            },
            error: function (xhr) {
                var msg = "Invalid email or password.";
                if (xhr.responseJSON && xhr.responseJSON.error) msg = xhr.responseJSON.error;
                else if (xhr.responseText) {
                    try { var p = JSON.parse(xhr.responseText); if (p && p.error) msg = p.error; } catch (e) { if (xhr.responseText.trim()) msg = xhr.responseText; }
                }
                AuthService.showLoginError(msg);
            },
        });
    },

    showLoginError: function (msg) {
        $("#login-error").text(msg).removeClass("d-none");
    },

    showRegisterError: function (msg) {
        $("#register-error").text(msg).removeClass("d-none");
    },

    logout: function () {
        // Clear all authentication data
        localStorage.removeItem("user_token");
        localStorage.removeItem("user");
        // Force a full page reload to reset all state and navigation
        window.location.hash = '#homepage';
        window.location.reload();
    },


    register: function (entity) {
        $.ajax({
            url: Constants.PROJECT_BASE_URL + "auth/register",
            type: "POST",
            data: JSON.stringify(entity),
            contentType: "application/json",
            dataType: "json",
            success: function (result) {
                toastr.success('Registration successful! Please log in.');
                setTimeout(function () {
                    window.location.replace("index.html#login");
                }, 1500);
            },
            error: function (xhr) {
                var msg = "Registration failed.";
                if (xhr.responseJSON && xhr.responseJSON.error) msg = xhr.responseJSON.error;
                else if (xhr.responseText) {
                    try { var p = JSON.parse(xhr.responseText); if (p && p.error) msg = p.error; } catch (e) { msg = xhr.responseText.trim() || msg; }
                }
                AuthService.showRegisterError(msg);
            }
        });
    },

    initRegister: function () {
        $("#register-form").on("submit", function (e) {
            e.preventDefault();
            $("#register-error").addClass("d-none").text("");
            var entity = Object.fromEntries(new FormData(this).entries());
            entity.gender = $("input[name='papa']:checked").val();
            delete entity.papa;
            AuthService.register(entity);
            return false;
        });
        $("#register-form input").on("focus input", function () {
            $("#register-error").addClass("d-none").text("");
        });
    }
}; 