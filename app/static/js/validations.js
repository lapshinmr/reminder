

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
                    mh.addButton('Okay', 'primary', function() {
                        document.getElementById('signup-form').reset();
                    });
                } else {
                    var mh = new Modal(
                        'Error',
                        'Sorry, something goes wrong :-('
                    );
                    mh.addButton('Okay', 'primary');
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
            cur_password: {
                required: true,
                remote: {
                    url: '/settings/check_password',
                    type: 'post'
                }
            },
            new_password: {
                required: true
            },
            confirm_password: {
                equalTo: '#change-password-form input[name="new_password"]'
            }
        },
        messages: {
            cur_password: {
                required: "password is required",
                remote: "wrong password"
            },
            new_password: {
                required: "password is required",
            },
            confirm_password: {
                equalTo: "password is not equal",
            }
        },
        errorClass: 'error',
        validClass: 'success',
        submitHandler: function(form) {
            $.post('/settings/change-password', $(form).serialize()).done(function(response) {
                if (response == true) {
                    var mh = new Modal(
                        'Info',
                        'Password has been changed.'
                    );
                    mh.addButton('Okay', 'primary', function() {
                        document.getElementById('change-password-form').reset();
                    });
                }
            })
        }
    });

}
