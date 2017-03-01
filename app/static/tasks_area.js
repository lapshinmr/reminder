
// POPUP
var Modal = function (title, text) {
    this.template = $(`
        <div class="modal fade" id="modal-window" role="dialog">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title">${title}</h4>
                    </div>
                    <div class="modal-body">
                        <p>${text}</p>
                    </div>
                    <div class="modal-footer">
                    </div>
                </div>
            </div>
        </div>
    `);
    this.addButton = function (text, type, func=null) {
        var type = type || 'default'
        var $button = $(`<button type="button" class="btn btn-${type}" data-dismiss="modal">${text}</button>`)
        if (func != null) {
            $button.on('click', function() { func() })
        }
        this.template.find('.modal-footer').append( $button )
    };
    this.run = function() {
        var $modal = $(this.template);
        $('#message-box').append($modal);
        $modal.on('hidden.bs.modal', function() { $modal.remove() })
        $modal.modal('show');
    };
}


// ADD TASK
function addNewTask() {
  var duration = $('#duration').val();
  var taskName = $('#task-name').val();
  if (duration == 0) {
      var mh = new Modal(
          'Warning',
          'Please choose duration more then ZERO'
      );
      mh.addButton('ok', 'primary');
      mh.run()
  } else {
      if ($('ul.nav.nav-tabs > li:not(.add-button)').length > 0) {
          $.post('/add_task', {'duration': duration, 'task_name': taskName, 'tab_id': CURRENT_TAB}).done(
              function(response) {
                $(`#tab${CURRENT_TAB} ul.tasks_area`).prepend(response['task_item_html']);
                attachJsToTask(response['task_id']);
              }
          )
      } else {
          var mh = new Modal(
              'Warning',
              "You can't add task because you need have at list one tab"
          );
          mh.addButton('ok', 'primary');
          mh.run()
      }
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
    console.log('add task edition')
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
  );
}


function dragTasks() {
  var tab_contents = $('div ul.tasks_area')
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
  if (!newTabName) {
    return
  }
  $.post('/add_new_tab', {'new_tab_name': newTabName}).done(
    function(response) {
      var tabId = response['tab_id'];
      var $newTab = $(response['tab']);
      var $newTabContent = $(response['tab_content']);
      var tabs = $('ul.nav.nav-tabs li')
      var $addButton = $('ul.nav.nav-tabs li.add-button');
      $newTab.insertBefore($addButton);
      makeTabDroppable($newTab);
      $('div.tab-content').append($newTabContent);
      dragTask($newTabContent.children('ul.tasks_area').eq(0));
      $(`ul.nav.nav-tabs a[href="#tab${tabId}"]`).trigger('click')
    }
  );
}


function activateTab(target) {
    if ($(target).hasClass('noclick')) {
        $(target).removeClass('noclick');
    } else {
        var id = $(target).attr('href').replace('#tab', '').replace('content', '');
        CURRENT_TAB = id;
        $.post('/activate_tab', {'current_tab_id': CURRENT_TAB})
    }
}


function closeTab(tabId, $tab) {
    $.post('/close_tab', {'tab_id': tabId}).done(
        function(response) {
            var activeTabIdx = response['active_tab_idx']
            $('div#tab' + tabId).remove();
            $tab.remove();
            if (activeTabIdx >= 0) {
                $('ul.nav.nav-tabs a[href]:not(.add-button)').eq(activeTabIdx).trigger('click')
            }
        }
    )
}


function attachCloseTab(closeLink) {
    var $tab = $(closeLink).parents().eq(0);
    var tabId = $tab.children('a[href^="#tab"]').attr('href').replace('#tab', '');
    var tab_content_length = $(`div.tab-content div#tab${tabId} ul li.task`).length;
    if (tab_content_length == 0) {
        closeTab(tabId, $tab);
    } else {
        var mh = new Modal(
            'Warning',
            'If you close this tab you will lost all your tasks'
        );
        mh.addButton('Yes, close', 'default', function() { closeTab(tabId, $tab) });
        mh.addButton('no', 'primary');
        mh.run()
    }
}


function makeTabDroppable(tab) {
    $(tab).droppable({
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
                width: dragged.outerWidth(true),
                height: dragged.outerHeight()
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
function makeTabsDroppable() {
    var tabs = $("ul.nav.nav-tabs li");
    for (var i = 0; i < tabs.length; i++) {
        makeTabDroppable(tabs[i]);
    }
}


function attachJsToTask(id) {
    animateProgressBar(id);
    editTaskName(id);
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
  makeTabsDroppable();
  dragTasks()
  dragTabs();
}


