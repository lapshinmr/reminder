
var Modal = function (title, text) {
    this.template = $(`
        <div class="modal fade">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title">${title}</h4>
                    </div>
                    <div class="modal-body">
                        <p>${text}</p>
                    </div>
                    <div class="modal-footer">
                    </div>
                </div>
            </div>
        </div>
    `);
    this.addButton = function (text, type, func=null) {
        var type = type || 'default'
        var $button = $(`<button type="button" class="btn btn-${type}" data-dismiss="modal">${text}</button>`)
        if (func != null) {
            $button.on('click', function() { func() })
        }
        this.template.find('.modal-footer').append( $button )
    };
    this.run = function() {
        var $modal = $(this.template);
        $('#modal-box').append($modal);
        $modal.on('hidden.bs.modal', function() { $modal.remove() })
        $modal.modal('show');
    };
    this.run();
}


// LOGIN
function createModalForNavigationLoginButton () {
    $('#navigation-login-button').on('click', function(e) {
        e.preventDefault();
        var email = $('#login-form-horizontal input[name="email"]').val();
        var password = $('#login-form-horizontal input[name="password"]').val();
        if (email == '' || password == '') {
            $('#login-modal').modal('show');
        } else {
            $('#login-form-horizontal').submit();
        }
    })
}


function createModalForResendConfirmationLink() {
    $('#resend-confirmation-link').on('click', function(e) {
        e.preventDefault();
        var mh = new Modal(
            'Info',
            'A new confirmation email has been sent to you by email.'
        );
        mh.addButton('Okay', 'primary', function() {$.get("/resend_confirmation")});
    })
}


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
                if (response == true) {
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
                    url: '/settings/check-password',
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


function validateChangeEmailForm() {
    $('#change-email-form').validate({
        rules: {
            email: {
                required: true,
                remote: {
                    url: "/check_email_usage",
                    type: "post"
                }
            },
            password: {
                required: true
            }
        },
        messages: {
            email: {
                required: "email is required",
                remote: "email already in use"
            },
            password: {
                required: "password is required",
            }
        },
        errorClass: 'error',
        validClass: 'success',
        submitHandler: function(form, e) {
            var mh = new Modal(
                'Info',
                `Are you sure that you want to change email address?
                Confirmation information will be send to your new email.`
            );
            mh.addButton('No', 'primary');
            mh.addButton('Okay', 'primary', function() {
                $.post( '/settings/change-email-request', $(form).serialize() ).done(function() {
                    document.getElementById('change-email-form').reset();
                })
            })
        }
    })
}


function showFlashMessages(messages) {
    if (messages.length > 0) {
        message = messages[0];
        var category = message[0];
        var message = message[1];
        var mh = new Modal( category, message );
        mh.addButton('Okay', 'primary');
    }
}
