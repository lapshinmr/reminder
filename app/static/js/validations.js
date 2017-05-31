

function validateSignUp() {
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
        submitHandler: function(form) {
            $.post('/signup', $(form).serialize()).done(function(response) {
                if (response['signup']) {
                    var mh = new Modal(
                        'Info',
                        'Email with confirmation has been sent to your email address. Please go to your mailbox and use link to confirm your account.'
                    );
                    mh.addButton('ok', 'primary', function() {location.reload()});
                } else {
                    var mh = new Modal(
                        'Error',
                        'Sorry, something goes wrong :-('
                    );
                    mh.addButton('ok', 'primary');
                }
            })
        }
    });
}


function validateSignIn() {
    $('#login-form').validate({
        rules: {
            email: {
                required: true,
                email: true,
            },
            password: {
                required: true,
            }
        },
        messages: {
            email: {
                required: "email is required",
                email: "email is incorrect",
            },
            password: {
                required: "password is required",
            }
        },
        errorClass: 'error',
        validClass: 'success',
    });
}


function validateChangePasswordForm() {
    $('#change-password-form').validate({
        rules: {
            old-password: {
                required: true
                remote: '/settings/check_password'
            },
            password: {
                required: true
            },
            confirm-password: {
                required: true
            }
        },
        messages: {
            email: {
                required: "password is required",
            },
            password: {
                required: "password is required",
            },
            confirm-password: {
                required: "password is required",
            }
        },
        errorClass: 'error',
        validClass: 'success',
    });

}
