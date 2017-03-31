var CURRENT_TAB = 0; // current active tab
var LAST_DROPPABLE_TAB = CURRENT_TAB; // last tab where element was moved


// DURATION PICKER
//view
var view = {
  createTimeUnit: function(id) {
    var unit = document.createElement('div');
    unit.setAttribute('id', id);
    unit.innerHTML = (
      '\
      <p class="arrow up"></p> \
      <p class="count" contenteditable="true"></p> \
      <p class="arrow down"></p> \
      '
    );
    return unit
  },

  updateTimeUnitValue: function(id, value, zeroes) {
    value = Number(value);
    if (zeroes && value < 10) {
      value = "0" + value;
    }
    $('#' + id).find('.count').text(value);
  },

  animateArrow: function(element) {
    $( element ).css({
      color: "#0ac2f9",
      transition: "text-shadow 0.5s ease-in-out;",
      fontWeight: "900"
    });
    $( element ).stop().animate({
        color: "rgb(100, 100, 100)",
        fontWeight: "400",
        queue: false
      }, 300
    );
  },

  createSeparator: function(id, value, separator) {
    $('#' + id).after('<p class="separator">' + separator + '</p>');
  }
}


//model
function TimeUnit(id, initValue, minValue, maxValue, totalSeconds, zeroes) {
  this.id = id;
  this.value = initValue;
  this.minValue = minValue;
  this.maxValue = maxValue;
  this.totalSeconds = totalSeconds;
  this.zeroes = zeroes
}

TimeUnit.prototype.decrease = function() {
  if (this.value > this.minValue) {
    this.value--;
    view.updateTimeUnitValue(this.id, this.value, this.zeroes);
  }
};

TimeUnit.prototype.increase = function() {
  if (this.maxValue === undefined || this.value < this.maxValue) {
    this.value++;
    view.updateTimeUnitValue(this.id, this.value, this.zeroes);
  }
};


var model = {
  units: [ ],

  getTime: function() {
    var time = 0;
    for (var i = 0; i < this.units.length; i++) {
      time += this.units[i].value * this.units[i].totalSeconds;
    }
    return time
  },

  attachClicksToArrows: function(unitModel, unitView) {
    var up = $(unitView).find('.arrow.up');
    var down = $(unitView).find('.arrow.down');
    up.click(function() {
      unitModel.increase();
      view.animateArrow(up);
      $('#duration').val(model.getTime());
    });
    down.click(function() {
      unitModel.decrease();
      view.animateArrow(down);
      $('#duration').val(model.getTime());
    });
  },

  attachScrollToUnit: function(unitModel, unitView) {
    var up = $(unitView).find('.arrow.up');
    var down = $(unitView).find('.arrow.down');
    $(unitView).on('wheel mousewheel', function(event) {
      event.preventDefault();
      var delta = event.originalEvent.deltaY;
      if (delta > 0) {
        unitModel.decrease();
        view.animateArrow(down);
      } else if (delta < 0) {
        unitModel.increase();
        view.animateArrow(up);
      };
      $('#duration').val(model.getTime());
    })
  },

  attachHandlerToCount: function(unitModel, unitView) {
    var element = $(unitView).find('.count');
    $(element).keypress(function(e) {
      if (e.which == 13) {
        $(element).blur();
      }
      return e.which != 13;
    });
    $(element).on('focusout',
      function(event) {
        var cur_value = $(element).text();
        if (!isNaN(cur_value)) {
          var maxValue = unitModel.maxValue;
          var minValue = unitModel.minValue;
          if (cur_value > maxValue) {
            var cur_value = maxValue;
          } else if (cur_value < minValue) {
            var cur_value = minValue;
          }
          unitModel.value = cur_value;
        };
        view.updateTimeUnitValue(
          unitModel.id, unitModel.value, unitModel.zeroes);
      $('#duration').val(model.getTime());
      }
    );
  },


  createTimeTable: function() {
    var duration = document.getElementById("duration-picker");
    var input = document.createElement('input');
    input.setAttribute('id', 'duration');
    input.setAttribute('name', 'duration');
    duration.appendChild(input)
    for (var i = 0; i < arguments.length; i++) {
      var id = arguments[i].id;
      var value = arguments[i].initValue;
      var minValue = arguments[i].minValue;
      var maxValue = arguments[i].maxValue;
      var totalSeconds = arguments[i].totalSeconds;
      var zeroes = arguments[i].zeroes;
      var after = arguments[i].after;
      var unitModel = new TimeUnit(id, value, minValue, maxValue, totalSeconds, zeroes);
      var unitView = view.createTimeUnit(id, value);
      this.units.push(unitModel);
      this.attachClicksToArrows(unitModel, unitView);
      this.attachScrollToUnit(unitModel, unitView);
      duration.appendChild(unitView);
      this.attachHandlerToCount(unitModel, unitView);
      view.updateTimeUnitValue(id, value, zeroes);
      view.createSeparator(id, value, after);
      $('#duration').val(model.getTime());
    }
  }
}


//controller
var durationPicker = {
  show: function() {
    model.createTimeTable(
      {id: 'days', initValue: 0, minValue: 0, maxValue: 999, totalSeconds: 86400, zeroes: false, after: ' '},
      {id: 'hours', initValue: 0, minValue: 0, maxValue: 23, totalSeconds: 3600, zeroes: true, after: ':'},
      {id: 'minutes', initValue: 0, minValue: 0, maxValue: 59, totalSeconds: 60, zeroes: true, after: ':'},
      {id: 'seconds', initValue: 0, minValue: 0, maxValue: 59, totalSeconds: 1, zeroes: true, after: ''}
    );
  }
}


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


// TOOLTIPS
function turnOnTooltips() {
  $('[data-toggle="tooltip"]').tooltip();
}


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
    $.post('/subscribe', {'subscribe': subscribe})
    button.blur();
}


// SCHEDULE CHECKBOX
function schedule(checkbox) {
    var value = $(checkbox).attr('value')
    var checked = $(checkbox).prop('checked')
    $.post('/settings/schedule', {'value': value, 'checked': checked});
}


// FORM VALIDATION
function Notification(node) {
    var self = this;
    self.node = node;
    self.icons = {
        success: 'glyphicon-ok',
        warning: 'glyphicon-warning-sign',
        error: 'glyphicon-remove'
    }
}

Notification.prototype.make = function(notificationType, message) {
    var self = this;
    var isAnotherType = $(self.node).attr('class').indexOf(notificationType) == -1
    var isAnotherMessage = $(self.node).find('div.popover-content').text() != message
    if (isAnotherType) {
        self.removeNotification(true, false);
        $(self.node).addClass(`has-${notificationType} has-feedback`);
        $('<span>', {class: `glyphicon ${self.icons[notificationType]} form-control-feedback`})
            .appendTo($(self.node));
    }
    if (isAnotherType || isAnotherMessage) {
        self.removeNotification(false, true);
        $(self.node + ' input')
            .popover({ content: message, trigger: 'manual', animation: false})
            .popover('show')
        $(self.node + ' div.popover').addClass(`popover-${notificationType}`)
    }
}

Notification.prototype.removeNotification = function(highlight, popover) {
    var self = this;
    if (highlight) {
        $(self.node).removeClass('has-error has-success has-warning has-feedback');
        $(self.node + ' span').remove();
    }
    if (popover) {
        $(self.node + ' input').popover('destroy');
    }
}


function Email(node) {
    var self = this;
    self.node = node;
    self.notification = new Notification(node);

    self.validate = function(email) {
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return regex.test(email)
    }

    self.run = function() {
        $(self.node + ' input').on('blur', function() {
            var email = $(self.node + ' input').val();
            var answer = self.validate(email);
            if (email == '') {
                self.notification.make('warning', 'Email address is required.')
            } else if (!self.validate(email)) {
                self.notification.make('warning', 'Email address scheme is wrong.')
            } else {
                $.post('/check_email_usage', {'email': email}).done(
                    function(response) {
                        if (response['email_exist']) {
                            self.notification.make('error', 'This email address is already being used.')
                        } else {
                            self.notification.make('success')
                        }
                    }
                )
            }
        });
        $(self.node + ' input').on('keyup', function() {
            self.notification.removeNotification(true, true);
        });
    }
}


function Name(node) {
    var self = this;
    self.node = node;
    self.notification = new Notification(node);

    self.validate = function(username) {
        return username
    }

    self.run = function() {
        $(self.node + ' input').on('blur', function() {
            var username = $(self.node + ' input').val();
            if (!self.validate(username)) {
                self.notification.make('error', 'Name is required.')
            } else {
                self.notification.make('success')
            }
        });
        $(self.node + ' input').on('keyup', function() {
            self.notification.removeNotification(true, true);
        });
    }
}


function Passwords(node1, node2) {
    var self = this;
    self.node1 = node1
    self.node2 = node2
    self.psw1 = new Notification(node1);
    self.psw2 = new Notification(node2);
    self.requiredLength = 8;

    self.validate_psw1 = function(psw1) {
        var regex_numbers = /[0-9]+/;
        var regex_letters = /[a-zA-Z]+/;
        var length = psw1.length
        if (length == 0) {
            return 'Password is required.'
        } else if (length < self.requiredLength) {
            return 'Password should contain at list 8 signs.'
        } else if (!regex_numbers.test(psw1)) {
            return 'Password should contain at list one number.'
        } else if (!regex_letters.test(psw1)) {
            return 'Password should contain at list one letter.'
        } else {
            return ''
        }
    }

    self.validate_psw2 = function(psw1, psw2) {
        if (psw1 == '') {
            return 'Please enter first password'
        } else if (psw2 == '') {
            return 'Please repeat password'
        } else if (psw1 != psw2) {
            return 'Passwords are not equal'
        } else {
            return ''
        }
    }

    self.run = function() {
        $(self.node1 + ' input').add(self.node2 + ' input').on('keyup', function(e) {
            self.psw2.removeNotification(true, true);
            var psw1 = $(self.node1 + ' input').val();
            var psw2 = $(self.node2 + ' input').val();
            var isMainInput = $(e.target).parents(self.node1).length == 1
            if (isMainInput) {
                var message1 = self.validate_psw1(psw1);
                if (message1 != '') {
                    self.psw1.make('error', message1)
                } else {
                    self.psw1.make('success')
                }
                var message2 = self.validate_psw2(psw1, psw2)
                if (message2 == '' && psw2.length >= self.requiredLength) {
                    self.psw2.make('success')
                }
            } else {
                var message2 = self.validate_psw2(psw1, psw2)
                if (message2 != '') {
                    self.psw2.make('error', message2)
                } else if (psw2.length >= self.requiredLength) {
                    self.psw2.make('success')
                }
            }
        });
        $(self.node1 + ' input').add(self.node2 + ' input').on('blur', function(e) {
            self.psw1.removeNotification(false, true);
            self.psw2.removeNotification(false, true);
        });
    }
}


function SignUpButtonListener(node) {
    var self = this;
    self.node = node;
    self.sources = [];

    self.addSources = function(sources) {
        self.sources.push.apply(self.sources, sources);
    }

    self.activate = function() {
        $(self.node).children('button').prop('disabled', false)
    }

    self.deactivate = function() {
        $(self.node).children('button').prop('disabled', true)
    }

    self.check = function() {
        var all_done = true;
        for (var i = 0, length = self.sources.length; i < length; i++) {
            var notSuccess = $(self.sources[i]).attr('class').indexOf('success') == -1
            if (notSuccess) {
                all_done = false;
            }
        }
        if (all_done) {
            self.activate();
        } else {
            self.deactivate();
        }
    }
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
  dragTasks();
  dragTabs();
  turnOnTooltips();
}


