
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
    $.post('/add_task', {'duration': duration, 'task_name': taskName, 'tab_id': CURRENT_TAB}).done(
      function(response) {
        $(`#tab${CURRENT_TAB}content ul.tasks_area`).prepend(response['task_item_html']);
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


// TASK SORTING
function dragTask(tab_content) {
  var taskId, startIndex, changeIndex, currentIndex, uiHeight;
  tab_content.sortable(
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
              var slice = $('ul.tasks_area li.task').slice(changeIndex, $('ul.tasks_area li.task').length);
              slice.not('.ui-sortable-helper').each(function() {
                  $(this).css({
                      transform: `translateY(${uiHeight}px)`
                  });
              });
              changeIndex += 1
          } else if (startIndex < changeIndex) {
              var slice = $('ul.tasks_area li.task').slice(startIndex, changeIndex);
              slice.not('.ui-sortable-helper').each(function() {
                  $(this).css({
                      transform: 'translateY(0px)'
                  });
              });
          }
          currentIndex = changeIndex
      },
      stop: function(e, ui) {
          $('ul.tasks_area li.task').css({
              transform: 'translateY(0px)'
          });
          $.post('/change_order_idx', {'tab_id': CURRENT_TAB, 'task_id': taskId, 'order_idx': currentIndex});
      }
    }
  );
}

function dragTasks() {
  var tab_contents = $('ul.tasks_area')
  for (var i = 0; i < tab_contents.length; i++) {
    dragTask(tab_contents.eq(i));
  }
}


function AnimateTasksSorting(tab_id, old_order, new_order) {
  this.old_order = old_order;
  this.new_order = new_order;
  this.tab_id = tab_id;
  this.lis = $(`div#tab${this.tab_id}content > ul.tasks_area > li`);
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

  this.calc_heights = function() {
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

  this.create_animations = function() {
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

  this.activate_animations = function() {
    for (var i = 0; i < this.animations.length; i++) {
      this.animations[i]();
    }
  }

  this.calc_heights();
  this.create_animations();
  this.activate_animations();
}


function makeOrder(order_option) {
  var value = $(order_option).attr('data-value');
  $.post('/make_order', {'tab_id': CURRENT_TAB, 'order_type': value}).done(
    function(response) {
      new AnimateTasksSorting(CURRENT_TAB, response['old_order'], response['new_order']);
    }
  )
}


// TABS
function addNewTab() {
  var newTabName = $('#new-tab-name').val();
  $.post('/add_new_tab', {'new_tab_name': newTabName}).done(
    function(response) {
      var tabId = response['tab_id']
      var tabs = $('ul.nav.nav-tabs li')
      for (var i = 0; i < tabs.length; i++) {
        tabs.eq(i).removeClass('active')
      }
      var new_tab_title = $(
          `<li id="tab${tabId}title">
          <a data-toggle="tab" href="#tab${tabId}content" onclick="switchTab(this)">${newTabName}</a>
          <a class="tab-close" onclick="closeTab(this)">
              <i class="fa fa-times" aria-hidden="true"></i>
          </a>
          </li>`
        )
      var new_tab_content = $(`<div id="tab${tabId}content" class="tab-pane fade"><ul class="tasks_area"></ul></div>`)
      $(new_tab_title).insertBefore($('ul.nav.nav-tabs li.add-button'));
      $('div.tab-content').append(new_tab_content);
      $(`ul.nav.nav-tabs li#tab${tabId}title > a:first`).trigger('click')
    }
  );
}


function switchTab(target) {
    var id = $(target).attr('href').replace('#tab', '').replace('content', '');
    CURRENT_TAB = id;
    $.post('/switch_tab', {'current_tab_id': CURRENT_TAB})
}


function closeTab(target) {
  var tab = $(target).parents().eq(0);
  var tabId = tab.attr('id').replace('tab', '').replace('title', '')
  $.post('/close_tab', {'tab_id': tabId}).done(
    function() {
      $('div#tab' + tabId + 'content').remove();
      $('li#tab' + tabId + 'title').remove();
      //switch tab
    }
  )
}


// CONTROLLER
function attachJsToTask(id) {
    animateProgressBar(id);
    editTaskName(id);
    dragTasks();
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
  attachJsToTasksWithClass(dragTasks);
}


