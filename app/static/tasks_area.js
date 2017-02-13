
// WARNING MESSAGE
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
  var $progressBar = $('#' + id).find('.progress-bar');
  var width = $progressBar.attr('style')
  width = width.split(' ')[1].replace("%", "");
  if (width > 0) {
    var width_step = 0.5;
    var leftTime = $progressBar.attr("data-left-time");
    var updateTime = leftTime / (width / width_step) * 1000;
    var interval_id = setInterval(
      function() {
        if (width <= 0) {
          clearInterval(interval_id);
        } else {
          width -= width_step;
          $progressBar.css("width", width + "%");
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
      var cur_value = $(element).text();
      $.post('/edit', {'new_task_name': cur_value, 'task_id': id});
    }
  );
}


// CLOSE TASK
function closeTask(id) {
  $.post('/close', {'task_id': id}).done(function(response) {
    $('#' + id).remove();
    $('#history_section').html(response['history_area_html']);
  });
}


// COMPLETE TASK
function completeTask(id) {
  $.post("/complete", {'task_id': id}).done(
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
  $.post('/remove', {'task_id': id, 'time_complete': time_complete})
}


// RESTORE TASK
function restoreTask(id) {
  $.post('/restore', {'task_id': id}).done(
     function(response) {
       $('#tasks_area').prepend(response['task_item_html']);
       attachJsToTask(response['task_id']);
       $('#history_section').html(response['history_area_html']);
     }
  )
}


// SORT TASK
function dragTask() {
  var taskId, startIndex, changeIndex, currentIndex, uiHeight;
  $('ul#tasks_area').sortable(
    {
      handle: ".draggable-area",
      opacity: 0.75,
      placeholder: 'marker',
      start: function(e, ui) {
          startIndex = ui.placeholder.index();
          uiHeight = ui.item.outerHeight(true);
          taskId = ui.item[0].id;
          ui.item.nextAll('li.task:not(.marker)').css({
              transform: `translateY(${uiHeight}px)`
          });
      },
      change: function(e, ui) {
          changeIndex = ui.placeholder.index();
          if (startIndex > changeIndex) {
              var slice = $('ul#tasks_area li.task').slice(changeIndex, $('ul#tasks_area li.task').length);
              slice.not('.ui-sortable-helper').each(function() {
                  $(this).css({
                      transform: `translateY(${uiHeight}px)`
                  });
              });
              changeIndex += 1
          } else if (startIndex < changeIndex) {
              var slice = $('ul#tasks_area li.task').slice(startIndex, changeIndex);
              slice.not('.ui-sortable-helper').each(function() {
                  $(this).css({
                      transform: 'translateY(0px)'
                  });
              });
          }
          currentIndex = changeIndex
      },
      stop: function(e, ui) {
          $('ul#tasks_area li.task').css({
              transform: 'translateY(0px)'
          });
          $.post('/change_order_idx', {'task_id': taskId, 'order_idx': currentIndex});
      }
    }
  );
}


// ANIMATE TASKS SORTING
function animateTasksSorting(old_order, new_order){
  animations = []
  var lis = $('ul#tasks_area li');
  var old_heights = [];
  for (var i = 0; i < lis.length; i++) {
    old_heights.push(lis.eq(i).outerHeight(true));
  }
  var new_heights = [];
  for (var i = 0; i < old_heights.length; i++) {
    new_heights.push(old_heights[old_order.indexOf(new_order[i])])
  }
  for (var i = 0; i < old_order.length; i++) {
    var id = old_order[i];
    var $li = $('li#' + id);
    var $li_clone = $li.clone();
    $li_clone.insertAfter($li);
    $li.insertAfter($('li#' + old_order[new_order.indexOf(id)]));
    $li.hide();
    var heights1 = old_heights.slice(0, old_order.indexOf(id));
    var heights2 = new_heights.slice(0, new_order.indexOf(id));
    h1 = 0;
    for (var j = 0; j < heights1.length; j++) {
      h1 += heights1[j]
    }
    h2 = 0;
    for (var j = 0; j < heights2.length; j++) {
      h2 += heights2[j]
    }
    var delta = h2 - h1;
    var animation = function(li, li_clone, delta) {
      return function() {
        li_clone.animate({top: delta}, 'slow',
          function() {
            li_clone.remove();
            li.show();
          }
        )
      }
    }
    animations.push(animation($li, $li_clone, delta))
  }
  for (var i = 0; i < animations.length; i++) {
    animations[i]();
  }
}


// MAKE ORDER
function makeOrder(order_option) {
  var value = $(order_option).attr('data-value');
  $.post('/make_order', {'order_type': value}).done(
    function(response) {
      animateTasksSorting(response['old_order'], response['new_order']);
    }
  )
}


function attachJsToTask(id) {
    animateProgressBar(id);
    editTaskName(id);
    dragTask();
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
  attachJsToTasksWithClass(dragTask);
}


