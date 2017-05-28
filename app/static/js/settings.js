

// SUBSCRIBE BUTTON
function treatSubscribeButton(subscribed) {
    var $button = $('#settings-subscribe');
    if (subscribed) {
        $button.addClass('btn-default')
        $button.text('Unsubscribe')
    } else {
        $button.addClass('btn-success')
        $button.text('Subscribe')
    };
    $button.on('click', function(e) {
        e.preventDefault();
        $button.toggleClass('btn-default').toggleClass('btn-success');
        var isSubscribed = $button.hasClass('btn-default')
        if (isSubscribed) {
            $button.text('Unsubscribe')
        } else {
            $button.text('Subscribe');
        }
        $.post('/settings/subscribe', {'subscribe': isSubscribed})
        $('')
        $button.blur();
    });
}


// SCHEDULE
function treatSubscribeSchedule(schedule) {
    for (var i = 0, length = schedule.length; i < length; i++) {
        var $timestamp = $(`.schedule-timestamp[value="${schedule[i]}"]`)
        $timestamp.prop('checked', true)
        $timestamp.parents('label').addClass('active');
    };
    $('#settings-schedule').on('click', 'label', function() {
        var value = $(this).children('input').attr('value');
        var checked = !$(this).children('input').prop('checked');
        $.post('/settings/treat-timestamp', {'value': value, 'checked': checked});
    })
}


// CHANGE NAME
function editUserName() {
  var $element = $('#username');
  $element.keypress(function(e) {
    if (e.which == 13) {
      $element.blur();
    }
    return e.which != 13;
  });
  $element.on('focusout',
    function(event) {
      var newUserName = $element.val();
      $.post('/settings/change-username', {'new_username': newUserName}).done(function(response) {
        if (response['response']) {
          var mh = new Modal(
              'Success',
              "You have been changed your name"
          );
          mh.addButton('ok', 'primary');
          mh.run()
        }
      });
    }
  );
}


// CHANGE EMAIL FORM
function changeEmailForm() {
    var listener = new SignUpButtonListener('#change-email-form');
    listener.addSources([
        '#change-email',
        '#change-email-password',
    ]);
    var current = Notification.prototype.make;
    Notification.prototype.make = function() {
        current.apply(this, arguments);
        listener.check();
    }
    var email = new Email('div#change-email');
    email.run();
    var password = new Password('div#change-email-password');
    password.run();
}


// CHANGE PASSWORD FORM
function changePasswordForm() {
    var listener = new SignUpButtonListener('#change-password-form');
    listener.addSources([
        '#change-password-old',
        '#change-password-new1',
        '#change-password-new2'
    ]);
    // decorate "make" method by the listener
    var current = Notification.prototype.make;
    Notification.prototype.make = function() {
        current.apply(this, arguments);
        listener.check();
    }
    var password = new Password('div#change-password-old');
    password.run();
    var passwords = new Passwords('div#change-password-new1', 'div#change-password-new2');
    passwords.run();
    $('#change-password-form').submit(function(event) {
        event.preventDefault();
        $.post('/settings/change-password', {
            'old': $('#change-password-old input').val(),
            'new': $('#change-password-new1 input').val()
        }).done(function(response) {
          var mh = new Modal(
              'Success',
              "You have been changed your password."
          );
          mh.addButton('ok', 'primary');
          mh.run();
          $('#change-password-old input').val('');
          $('#change-password-new1 input').val('');
          $('#change-password-new2 input').val('');
          $('#change-password-form button').prop('disabled', true);
        })
    })
}

