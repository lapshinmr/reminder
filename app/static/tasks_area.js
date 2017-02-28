
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
        $(`#tab${CURRENT_TAB} ul.tasks_area`).prepend(response['task_item_html']);
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
  $.post('/close', {'task_id': id}).done(function(response) { $('#' + id).remove(); });
}


// COMPLETE TASK
function completeTask(id) {
  $.post("/complete", {'task_id': id}).done(
    function(response) {
      $('#' + id).replaceWith($(response['task_item_html']));
      attachJsToTask(id);
    }
  )
}


// TASK SORTING
function dragTask(tab_content) {
  var taskId, startIndex, changeIndex, currentIndex, marker, dragged;
  tab_content.sortable(
    {
      handle: ".draggable-area",
      //opacity: 0.5,
      placeholder: 'marker',
      connectWith: ".connectedSortable",
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
  ).disableSelection();
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
  this.lis = $(`div#tab${this.tab_id} > ul.tasks_area > li`);
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
      var $new_tab_header = $(
          `<li class="ui-droppable ui-sortable-handle">
              <a data-toggle="tab" href="#tab${tabId}" onclick="switchTab(this)">${newTabName}</a>
              <a class="tab-close" data-toggle="modal" data-target="#close-tab-confirmation">
                  <i class="fa fa-times" aria-hidden="true"></i>
              </a>
          </li>`
        )
      var $new_tab_content = $(
        `<div id="tab${tabId}" class="tab-pane fade">
            <ul class="tasks_area"></ul>
        </div>`
      )
      var $add_tab_button = $('ul.nav.nav-tabs li.add-button');
      $new_tab_header.insertBefore($add_tab_button);
      $('div.tab-content').append($new_tab_content);
      $(`ul.nav.nav-tabs a[href="#tab${tabId}"]`).trigger('click')
    }
  );
}


function switchTab(target) {
    if ($(target).hasClass('noclick')) {
        $(target).removeClass('noclick');
    } else {
        var id = $(target).attr('href').replace('#tab', '').replace('content', '');
        CURRENT_TAB = id;
        $.post('/switch_tab', {'current_tab_id': CURRENT_TAB})
    }
}


function modalOn() {
    $('#close-tab-confirmation').on('show.bs.modal', function(e) {
        var $closeLink = $(e.relatedTarget);
        var $modal = $(e.target);
        var $confirm = $modal.find('div.modal-footer button.btn-default')
        $confirm.on('click', function() {
            closeTab($closeLink);
            $confirm.off('click');
        });
    })
}


function closeTab(closeLink) {
  var tab = $(closeLink).parents().eq(0);
  var tabId = tab.children('a[href^="#tab"]').attr('href').replace('#tab', '');
  $.post('/close_tab', {'tab_id': tabId}).done(
    function() {
      $('div#tab' + tabId).remove();
      tab.remove();
      $('ul.nav.nav-tabs a[href]:not(.add-button):last').trigger('click')
    }
  )
}


function moveTaskToTab() {
  $("ul.nav.nav-tabs li").droppable({
    accept: ".connectedSortable li",
    hoverClass: 'ui-state-active',
    tolerance: 'pointer',
    drop: function (event, ui) {
       var tabHref = $(this).children('a').attr('href');
       var tabId = tabHref.replace('#tab', '');
       LAST_DROPPABLE_TAB = tabId;
       $(tabHref).find('.connectedSortable').prepend($(`li.ui-sortable-placeholder.marker`));
    }
  });
}


function dragTabs() {
    var marker, newTabOrderIdx, startIndex, tabId, a;
    var tabs = $('ul.nav.nav-tabs');
    tabs.sortable({
        placeholder: 'tabs-marker',
        opacity: 0.5,
        items: "li:not(.add-button)",
        start: function(e, ui) {
            dragged = ui.item;
            a = dragged.children('a').eq(0);
            a.addClass('noclick');
            tabId = dragged.children('a').eq(0).attr('href').replace('#tab', '');
            marker = ui.placeholder;
            marker.css({
                backgroundColor: 'black',
                width: '1px',
                height: dragged.outerHeight(),
            })
            startIndex = marker.index()
            newTabOrderIdx = startIndex;
        },
        change: function(e, ui) {
            newTabOrderIdx = marker.index();
            if (startIndex > newTabOrderIdx) {
              newTabOrderIdx += 1
            };
        },
        stop: function(e, ui) {
            $.post('/change_tab_order_idx', {'tab_id': tabId, 'new_tab_order_idx': newTabOrderIdx});
        }
    });
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
  moveTaskToTab();
  dragTabs();
  modalOn();
}


