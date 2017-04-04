

function Notification(node) {
    var self = this;
    self.node = node;
    self.icons = {
        success: 'glyphicon-ok',
        warning: 'glyphicon-warning-sign',
        error: 'glyphicon-remove'
    }
}

Notification.prototype.make = function(notificationType, message) {
    var self = this;
    var isAnotherType = $(self.node).attr('class').indexOf(notificationType) == -1
    var isAnotherMessage = $(self.node).find('div.popover-content').text() != message
    if (isAnotherType) {
        self.removeNotification(true, false);
        $(self.node).addClass(`has-${notificationType} has-feedback`);
        $('<span>', {class: `glyphicon ${self.icons[notificationType]} form-control-feedback`})
            .appendTo($(self.node));
    }
    if (isAnotherType || isAnotherMessage) {
        self.removeNotification(false, true);
        $(self.node + ' input')
            .popover({ content: message, trigger: 'manual', animation: false})
            .popover('show');
        $(self.node + ' div.popover').addClass(`popover-${notificationType}`)
    }
}

Notification.prototype.removeNotification = function(highlight, popover) {
    var self = this;
    if (highlight) {
        $(self.node).removeClass('has-error has-success has-warning has-feedback');
        $(self.node + ' span').remove();
    }
    if (popover) {
        $(self.node + ' input').popover('destroy');
    }
}


function Email(node) {
    var self = this;
    self.node = node;
    self.notification = new Notification(node);

    self.validate = function(email) {
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return regex.test(email)
    }

    self.run = function() {
        $(self.node + ' input').on('blur', function() {
            var email = $(self.node + ' input').val();
            var answer = self.validate(email);
            if (email == '') {
                self.notification.make('warning', 'Email address is required.')
            } else if (!self.validate(email)) {
                self.notification.make('warning', 'Email address scheme is wrong.')
            } else {
                $.post('/check_email_usage', {'email': email}).done(
                    function(response) {
                        if (response['email_exist']) {
                            self.notification.make('error', 'This email address is already being used.')
                        } else {
                            self.notification.make('success')
                        }
                    }
                )
            }
        });
        $(self.node + ' input').on('keyup', function() {
            self.notification.removeNotification(true, true);
        });
    }
}


function Name(node) {
    var self = this;
    self.node = node;
    self.notification = new Notification(node);

    self.validate = function(username) {
        return username
    }

    self.run = function() {
        $(self.node + ' input').on('blur', function() {
            var username = $(self.node + ' input').val();
            if (!self.validate(username)) {
                self.notification.make('error', 'Name is required.')
            } else {
                self.notification.make('success')
            }
        });
        $(self.node + ' input').on('keyup', function() {
            self.notification.removeNotification(true, true);
        });
    }
}


function Passwords(node1, node2) {
    var self = this;
    self.node1 = node1
    self.node2 = node2
    self.psw1 = new Notification(node1);
    self.psw2 = new Notification(node2);
    self.requiredLength = 8;

    self.validate_psw1 = function(psw1) {
        var regex_numbers = /[0-9]+/;
        var regex_letters = /[a-zA-Z]+/;
        var length = psw1.length
        if (length == 0) {
            return 'Password is required.'
        } else if (length < self.requiredLength) {
            return 'Password should contain at list 8 signs.'
        } else if (!regex_numbers.test(psw1)) {
            return 'Password should contain at list one number.'
        } else if (!regex_letters.test(psw1)) {
            return 'Password should contain at list one letter.'
        } else {
            return ''
        }
    }

    self.validate_psw2 = function(psw1, psw2) {
        if (psw1 == '') {
            return 'Please enter first password'
        } else if (psw2 == '') {
            return 'Please repeat password'
        } else if (psw1 != psw2) {
            return 'Passwords are not equal'
        } else {
            return ''
        }
    }

    self.run = function() {
        $(self.node1 + ' input').add(self.node2 + ' input').on('keyup', function(e) {
            self.psw2.removeNotification(true, true);
            var psw1 = $(self.node1 + ' input').val();
            var psw2 = $(self.node2 + ' input').val();
            var isMainInput = $(e.target).parents(self.node1).length == 1
            if (isMainInput) {
                var message1 = self.validate_psw1(psw1);
                if (message1 != '') {
                    self.psw1.make('error', message1)
                } else {
                    self.psw1.make('success')
                }
                var message2 = self.validate_psw2(psw1, psw2)
                if (message2 == '' && psw2.length >= self.requiredLength) {
                    self.psw2.make('success')
                }
            } else {
                var message2 = self.validate_psw2(psw1, psw2)
                if (message2 != '') {
                    self.psw2.make('error', message2)
                } else if (psw2.length >= self.requiredLength) {
                    self.psw2.make('success')
                }
            }
        });
        $(self.node1 + ' input').add(self.node2 + ' input').on('blur', function(e) {
            self.psw1.removeNotification(false, true);
            self.psw2.removeNotification(false, true);
        });
    }
}


function Password(node) {
    var self = this;
    self.node = node;
    self.notification = new Notification(node);

    self.run = function() {
        $(self.node + ' input').on('blur', function() {
            var password = $(self.node + ' input').val();
            $.post('/settings/check_password', {'password': password}).done(
                function(response) {
                    console.log(response['password_is_right'])
                    if (response['password_is_right']) {
                        self.notification.make('success')
                    } else {
                        self.notification.make('error', 'Invalid password.')
                    }
                }
            )
        });
        $(self.node + ' input').on('keyup', function() {
            self.notification.removeNotification(true, true);
        });
    }
}


function SignUpButtonListener(node) {
    var self = this;
    self.node = node;
    self.sources = [];

    self.addSources = function(sources) {
        self.sources.push.apply(self.sources, sources);
    }

    self.activate = function() {
        $(self.node).children('button').prop('disabled', false)
    }

    self.deactivate = function() {
        $(self.node).children('button').prop('disabled', true)
    }

    self.check = function() {
        var all_done = true;
        for (var i = 0, length = self.sources.length; i < length; i++) {
            var notSuccess = $(self.sources[i]).attr('class').indexOf('success') == -1
            if (notSuccess) {
                all_done = false;
            }
        }
        if (all_done) {
            self.activate();
        } else {
            self.deactivate();
        }
    }
}

