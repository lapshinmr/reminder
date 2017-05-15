var CURRENT_TAB = 0; // current active tab
var LAST_DROPPABLE_TAB = CURRENT_TAB; // last tab where element was moved


function print(string) {
    console.log(string)
}


// ADD TASK
function treatAddNewTaskSubmit() {
    $('form#create-task').submit(function(e) {
        e.preventDefault();
        var duration = $('#duration-picker').val();
        var taskName = $('#task-name').val();
        if (duration == 0) {
            var mh = new Modal(
                'Warning',
                'Please choose duration more then ZERO'
            );
            mh.addButton('ok', 'primary');
        } else {
            $.post('/add_task', {'duration': duration, 'task_name': taskName, 'tab_id': CURRENT_TAB}).done(
                function(response) {
                  $(`#tab${CURRENT_TAB} div.tasks`).prepend(response['task_item_html']);
                  attachJsToTask(response['task_id']);
                }
            )
        }
    })
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
function treatTaskNameEdition() {
    $('.tasks').on({
        'keypress': function(e) {
            if (e.which == 13) {
                $(this).blur();
            }
        },
        'focusout': function(e) {
            var e = $.Event('keypress');
            e.keyCode = 27;
            $(this).trigger(e)
            var newTaskName = $(this).text();
            var taskId = $(this).parents('div[id^="task"]').attr('id').replace('task', '')
            $.post('/edit', {'new_task_name': newTaskName, 'task_id': taskId});
        }
    }, 'div.task-name span.moved-text');
}


// TASK CLOSING
function treatTaskClosing() {
    $('.tasks').on({
        'mouseenter': function() {
            var $span = $(this).find('span.moved-text');
            if (!$span.is(':focus')) {
                $span.stop().animate({"left": "-=10"}, 300);
                $(this).find('i').stop().fadeIn(300);
            }
        },
        'mouseleave': function() {
            $(this).find('span.moved-text').stop().animate({"left": "50%"}, 300);
            $(this).find('i').stop().fadeOut(300);
        }
    }, 'div.task-name');
    $('.tasks').on('click', 'span.moved-text', function(e) {
        $(this).mouseleave();
    })
    $('.tasks').on('click', 'div.task-name i', function(e) {
        e.stopPropagation();
        var $task = $(this).parents().eq(1);
        var taskId = $task.attr('id').replace('task', '');
        $.post('/close', {'task_id': taskId}).done(function() { $('#task' + taskId).remove(); });
    });
}


// COMPLETE TASK
function completeTask(element) {
    $().on('click', )
  $.post("/complete", {'task_id': id}).done(
    function(response) {
      $('#' + id).replaceWith($(response['task_item_html']));
      attachJsToTask(id);
    }
  )
}


// TASKS SORTING
function dragTask(tab_content) {
  var taskId, startIndex, changeIndex, currentIndex, marker, dragged;
  tab_content.sortable(
    {
      handle: ".draggable-area",
      placeholder: 'marker',
      connectWith: ".connected-sortable",
      start: function(e, ui) {
          dragged = ui.item;
          marker = ui.placeholder;
          marker.height(dragged.outerHeight(true));
          dragged.fadeTo('medium', 0.33);
          startIndex = marker.index();
          taskId = ui.item[0].id;
          LAST_DROPPABLE_TAB = marker.parents().eq(1).attr('id').replace('tab', '')
          currentIndex = startIndex;
      },
      change: function(e, ui) {
          changeIndex = marker.index();
          if (startIndex > changeIndex) {
            changeIndex += 1
          } else if (startIndex < changeIndex) {
          }
          currentIndex = changeIndex
      },
      stop: function(e, ui) {
          dragged.fadeTo('medium', 1);
          $.post('/change_task_idx', {'tab_id': LAST_DROPPABLE_TAB, 'task_id': taskId, 'order_idx': currentIndex});
      }
    }
  );
}


function dragTasks() {
  var tab_contents = $('div ul.tasks')
  for (var i = 0; i < tab_contents.length; i++) {
    dragTask(tab_contents.eq(i));
  }
}


function AnimateTasksSorting(tab_id, old_order, new_order) {
  this.old_order = old_order;
  this.new_order = new_order;
  this.tab_id = tab_id;
  this.lis = $(`div#tab${this.tab_id} > ul.tasks > li`);
  this.animations = [];
  this.old_heights = [];
  this.new_heights = [];

  this.sum = function(list) {
    var s = 0;
    for (var i = 0; i < list.length; i++) {
      s += list[i]
    }
    return s
  }

  this.calcHeights = function() {
    for (var i = 0; i < this.lis.length; i++) {
      this.old_heights.push(this.lis.eq(i).outerHeight(true));
    }
    for (var i = 0; i < this.old_heights.length; i++) {
      this.new_heights.push(this.old_heights[this.old_order.indexOf(this.new_order[i])])
    }
  }

  this.animation = function(id, li, li_clone, delta) {
    return function() {
      li_clone.animate({top: delta}, 'slow',
        function() {
          li_clone.remove();
          li.attr('id', id).removeAttr('style').show();
        }
      )
    }
  }

  this.createAnimations = function() {
    for (var i = 0; i < this.old_order.length; i++) {
      var id = this.old_order[i];
      var old_idx = this.old_order.indexOf(id);
      var new_idx = this.new_order.indexOf(id);
      var $li = $('li#' + id);
      var $li_clone = $li.clone();
      $li_clone.insertAfter($li);
      $li.removeAttr('id').insertAfter($('li#' + this.old_order[new_idx])).hide();
      var delta = this.sum(this.new_heights.slice(0, new_idx)) - this.sum(this.old_heights.slice(0, old_idx));
      this.animations.push(this.animation(id, $li, $li_clone, delta))
    }
  }

  this.activateAnimations = function() {
    for (var i = 0; i < this.animations.length; i++) {
      this.animations[i]();
    }
  }

  this.calcHeights();
  this.createAnimations();
  this.activateAnimations();
}


// ORDER BUTTON
function treatOrderButton() {
    $('#order-button').on('click', 'ul > li > a',
        function() {
            var value = $(this).attr('data-value');
            $.post('/make_order', {'tab_id': CURRENT_TAB, 'order_type': value}).done(
              function(response) {
                new AnimateTasksSorting(CURRENT_TAB, response['old_order'], response['new_order']);
              }
            )
        }
    )
}


// CONTROLLER

function attachJsToTask(id) {
    animateProgressBar(id);
}


function attachJsToTasksWithClass(func) {
  var tasks = document.getElementsByClassName("task");
  for (var i = 0; i < tasks.length; i++) {
    func(tasks[i].id);
  }
}


function initTasksJs() {
  attachJsToTasksWithClass(animateProgressBar);
  //makeTabsDroppable();
  //dragTasks();
  //dragTabs();
}


