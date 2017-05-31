

// SUBSCRIBE BUTTON
function treatSubscribeButton(subscribed) {
    var $button = $('#settings-subscribe');
    if (subscribed) {
        $button.addClass('btn-inverse')
        $button.text('Unsubscribe')
    } else {
        $button.addClass('btn-success')
        $button.text('Subscribe')
    };
    $button.on('click', function(e) {
        e.preventDefault();
        $button.toggleClass('btn-inverse').toggleClass('btn-success');
        var isSubscribed = $button.hasClass('btn-inverse')
        if (isSubscribed) {
            $button.text('Unsubscribe')
        } else {
            $button.text('Subscribe');
        }
        $.post('/settings/subscribe', {'subscribe': isSubscribed})
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


