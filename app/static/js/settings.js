

// SUBSCRIBE BUTTON
function subscribe(button) {
    var subscribe = true;
    var checkboxes = $(button).next('div').find('input');
    $(button).toggleClass('btn-default').toggleClass('btn-success');
    if ($(button).hasClass('btn-default')) {
        $(button).text('Unsubscribe')
        subscribe = false;
        $(checkboxes).prop('disabled', false);
    } else {
        $(button).text('Subscribe');
        $(checkboxes).each(function() {
            $(this).prop('disabled', true);
        });
    }
    $.post('/settings/subscribe', {'subscribe': subscribe})
    button.blur();
}


// SCHEDULE CHECKBOX
function schedule(checkbox) {
    var value = $(checkbox).attr('value')
    var checked = $(checkbox).prop('checked')
    $.post('/settings/schedule', {'value': value, 'checked': checked});
}


// CHANGE NAME
function editUserName() {
  var element = $('#username');
  $(element).keypress(function(e) {
    if (e.which == 13) {
      $(element).blur();
    }
    return e.which != 13;
  });
  $(element).on('focusout',
    function(event) {
      var new_username = $(element).text();
      $.post('/settings-change-username', {'new_username': new_username});
    }
  );
}

