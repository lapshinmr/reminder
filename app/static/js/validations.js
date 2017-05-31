

function treatSingUpValidation() {
    $('#signup-form').validate({
        rules: {
            email: {
                required: true,
                email: true,
                remote: {
                    url: "/check_email_usage",
                    type: "post"
                }
            },
            username: {
                required: true
            },
            password: {
                required: true,
                minlength: 8
            },
            confirm_password: {
                equalTo: '#signup-password'
            }
        },
        messages: {
            email: {
                required: "email is required",
                email: "email is incorrect",
                remote: "email already in use"
            },
            username: {
                required: "name is required"
            },
            password: {
                required: "password is required",
                minlength: "password should be longer then 8"
            },
            confirm_password: {
                equalTo: "password is not equal"
            }
        },
        errorClass: 'error',
        validClass: 'success',
    });
}

