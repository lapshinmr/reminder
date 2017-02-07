
function attachJsToTask(id) {
    animateProgressBar(id);
    editTaskName(id);
    dragTask();
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


// ANIMATE TASKS SORTING
function makeReplaceFunction(li1, li2, li1offset, li2offset, clone_to_replace, clone_to_move) {
  return function() {
    clone_to_replace.insertAfter(li2);
    clone_to_replace.css({'visibility': 'hidden'});
    li1.hide();
    clone_to_move.appendTo('ul#tasks_area');
    clone_to_move.css({
      'position': 'absolute',
      'top': li1offset.top,
      //'left': li1offset.left,
      'z-index': 1000,
      'width': 'inherit'
    });
    clone_to_move.animate(
      {
        'top': li2offset.top,
        //'left': li2offset.left
      },
      'slow',
      function(){
        clone_to_move.remove();
        clone_to_replace.removeAttr('style');
        li1.remove();
      }
    );
  }
}

function animateTaskSorting(ids){
  var replaceFunctions = []
  for (var i = 0; i < ids.length; i++) {
    var $li1 = $('li#' + ids[i][0]);
    var $li2 = $('li#' + ids[i][1]);
    var li1offset = $li1.offset();
    var li2offset = $li2.offset();
    var $clone_to_replace = $li1.clone();
    var $clone_to_move = $li1.clone();
    replaceFunctions.push(makeReplaceFunction($li1, $li2, li1offset, li2offset, $clone_to_replace, $clone_to_move));
  }
  for (var i = 0; i < replaceFunctions.length; i++) {
    replaceFunctions[i]();
  }
}


// MAKE ORDER
function makeOrder(order_option) {
  var value = $(order_option).attr('value')
  $.post('/make_order', {'order_type': value}).done(
    function(response) {
      console.log(response['ids_couples']);
      animateTaskSorting(response['ids_couples']);
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
  attachJsToTasksWithClass(dragTask);
}


