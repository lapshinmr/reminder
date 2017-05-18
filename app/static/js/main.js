var CURRENT_TAB = 0; // current active tab
var LAST_DROPPABLE_TAB = CURRENT_TAB; // last tab where element was moved


function print(string) {
    console.log(string)
}


// ADD TASK
function treatAddNewTask() {
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
                    var $task = $(response['task_item_html']).hide();
                    $(`#tab${CURRENT_TAB} div.tasks`).prepend($task);
                    $task.fadeIn(600);
                    $task.find('.task-progress-bar').trigger('click');
                }
            )
        }
    })
}


// TASK BAR ANIMATION
function treatTaskProgressBarAnimation() {
    $('.tasks').on('click', 'div.task-progress-bar', function(e) {
        var leftTime = $(this).attr("data-left-time");
        var timeLoop = $(this).attr("data-time-loop");
        var timeInit = new Date().getTime() / 1000;
        $(this).attr('data-init-time', timeInit);
        $(this).css({width: leftTime / timeLoop * 100 + "%"}).animate({width: '0%'}, leftTime * 1000, 'linear')
    });
    $('.tasks .task-progress-bar').trigger('click');
}


// TASK EDITION
function treatTaskNameEdition() {
    $('.tasks').on({
        'keypress': function(e) {
            if (e.which == 13) {
                $(this).blur();
            } else {
                var newTaskName = $(this).text();
                $(this).prev().text(newTaskName);
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
    });
    $('.tasks').on('click', 'div.task-name i', function(e) {
        e.stopPropagation();
        var taskId = $(this).parents('div[id^="task"]').attr('id').replace('task', '')
        $.post('/close', {'task_id': taskId}).done(
            function() {
                $('#task' + taskId).fadeOut( 600, function() { $(this).remove() } )
            }
        )
    });
}


// TASK COMPLETING
function treatTaskCompleting() {
    $('.tasks').on('click', 'div.task-complete i', function() {
        var taskId = $(this).parents('div[id^="task"]').attr('id').replace('task', '')
        $.post("/complete", {'task_id': taskId}).done(
            function() {
                var $progressBar = $('#task' + taskId + ' .task-progress-bar');
                var loopTime = $progressBar.attr('data-time-loop');
                var $newProgressBar = $(
                    `<div class="task-progress-bar" data-time-loop="${loopTime}" data-left-time="${loopTime}">
                        <div class="progress-bar-tooltip" style="display: none;">
                            <div class="tooltip-arrow"></div>
                            <div class="tooltip-content"></div>
                        </div>
                    </div>`
                );
                var curWidth = $progressBar.outerWidth();
                var totalWidth = $progressBar.parents('.task-name').outerWidth()
                $newProgressBar.css({'width': curWidth / totalWidth * 100}).animate({'width': '100%'}, 600);
                $progressBar.after($newProgressBar);
                $progressBar.remove()
                $newProgressBar.trigger('click');
            }
        )
    })
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

function formatTime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / 3600 / 24);
    var h = Math.floor(seconds / 3600 % 24);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 3600 % 60);
    return (d ? `${d} ` : ``) +
            `00${h}`.slice(-2) + ":" +
            `00${m}`.slice(-2) + ":" +
            `00${s}`.slice(-2);
}


// TOOLTIP
function treatTaskProgressBarTooltip() {
    var id;
    $('.tasks').on(
        {
            'mouseover': function(e) {
                var $progressBar = $(this).find('.task-progress-bar');
                $(this).find('.progress-bar-tooltip').stop().fadeIn(600);
                var timeLeft = $progressBar.attr('data-left-time')
                var curTime = new Date().getTime() / 1000;
                var initTime = $(this).find('.task-progress-bar').attr('data-init-time');
                var seconds = timeLeft - (curTime - initTime);
                if (seconds < 0) { seconds = 0 };
                $progressBar.find('.tooltip-content').text(formatTime(seconds));
                id = setInterval(function() {
                    if (seconds >= 1) {
                        seconds--;
                        $progressBar.find('.tooltip-content').text(formatTime(seconds));
                    } else {
                        clearInterval(id);
                    }
                }, 1000)
            },
            'mouseout': function() {
                $(this).find('.progress-bar-tooltip').stop().fadeOut(600)
                clearInterval(id);
            }
        }, '.task-name'
    )
}

  //dragTasks();
  //dragTabs();


