
function attachJsToTask(id) {
    animateProgressBar(id);
    editTaskName(id);
}


function generateWarning(message) {
  var warning_markup = (
    `<div class="alert alert-warning alert-dismissable fade in">
        <a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>
        <strong>Warning!</strong> ${message}
    </div>`
  );
  $('#message-box').html( warning_markup )
}


// ADD TASK
function addNewTask() {
  var duration = $('#duration').val();
  var taskName = $('#task-name').val();
  if (duration == 0) {
    //alert('Please choose duration more then ZERO')
    generateWarning('Please choose duration more then ZERO')
  } else {
    $.post('/add_task', {'duration': duration, 'task-name': taskName}).done(
      function(response) {
        $('#tasks_area').prepend(response['task_item_html']);
        attachJsToTask(response['task_id']);
      }
    )
  }
}


// ANIMATE TASK BAR
function animateProgressBar(id) {
  var progressBar = $('#' + id).find('.progress-bar');
  var width = $(progressBar).attr('style')
  width = width.split(' ')[1].replace("%", "");
  if (width > 0) {
    var width_step = 0.5;
    var leftTime = $(progressBar).attr("data-left-time");
    var updateTime = leftTime / (width / width_step) * 1000;
    var interval_id = setInterval(
      function() {
        if (width <= 0) {
          clearInterval(interval_id);
        } else {
          width -= width_step;
          $(progressBar).css("width", width + "%");
        }
      },
      updateTime
    )
  }
}


// EDIT TASK
function editTaskName(id) {
  var element = $('#' + id).find('.task-name');
  $(element).keypress(function(e) {
    if (e.which == 13) {
      $(element).blur();
    }
    return e.which != 13;
  });
  $(element).on('focusout',
    function(event) {
      var url = "/" + id + "/edit";
      var cur_value = $(element).text();
      $.post(url, {'new_task_name': cur_value});
    }
  );
}


// CLOSE TASK
function closeTask(id) {
  var url = "/" + id + "/close";
  $.post(url).done(function(response) {
    $('#' + id).remove();
    $('#history_section').html(response['history_area_html']);
  });
}


// COMPLETE TASK
function completeTask(id) {
  var url = "/" + id + "/complete";
  $.post(url).done(
    function(response) {
      $('#history_section').prepend($(response['history_item_html']));
      $('#' + id).replaceWith($(response['task_item_html']));
      attachJsToTask(id);
    }
  )
}


// REMOVE HISTORY ITEM
function removeHistoryItem(close_button, id, time_complete) {
  var history_item = $(close_button).parents('div.history-row').get(0);
  $(history_item).remove()
  $.post('/' + id + '/' + time_complete + '/remove')
}


// RESTORE TASK
function restoreTask(id) {
  $.post('/' + id + '/restore').done(
     function(response) {
       $('#tasks_area').prepend(response['task_item_html']);
       attachJsToTask(response['task_id']);
       $('#history_section').html(response['history_area_html']);
     }
  )
}


function attachJsToTasksWithClass(func) {
  var tasks = document.getElementsByClassName("task");
  for (var i = 0; i < tasks.length; i++) {
    func(tasks[i].id);
  }
}


function initTasksJs() {
  attachJsToTasksWithClass(animateProgressBar);
  attachJsToTasksWithClass(editTaskName);
}


