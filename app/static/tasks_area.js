

// ANIMATE TASK BAR
function animateProgressBar(task) {
    var width = task.style.width.replace("%", "");
    var width_step = 0.5;
    var leftTime = task.getAttribute("data-left-time");
    var updateTime = leftTime / (width / width_step) * 1000;
    var interval_id = setInterval(
        function() {
            if (width <= 0) {
                clearInterval(interval_id);
            } else {
                width -= width_step;
                task.setAttribute("style", "width: " + width + "%");
            }
        },
        updateTime
    )
}


function addProgressBarsAnimation() {
    var tasks = document.getElementsByClassName("progress-bar");
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var leftBarWidth = task.style.width.replace("%", "");
        if (leftBarWidth > 0) {
            animateProgressBar(task);
        }
    }
}


// ADD TASK
function addNewTask() {
  $('#add-task-button').click(
    function() {
      var duration = $('#duration').val();
      var taskName = $('#task-name').val();
      if (duration == 0) {
        alert('Please choose duration more then ZERO')
      } else {
        $.post('/reminder/add_task', {'duration': duration, 'task-name': taskName}).done(
          function(tasksAreaHtml) {
            $('#tasks_area').html(tasksAreaHtml['tasks_area_html']);
            addProgressBarsAnimation();
            addFuncToTasks(editTaskName);
            addFuncToTasks(closeTask);
            addFuncToTasks(completeTask);
          }
        )
      }
    }
  )
}


function addFuncToTasks(func) {
  var tasks = document.getElementsByClassName("task");
  for (var i = 0; i < tasks.length; i++) {
    func(tasks[i].id);
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
      var url = "/reminder/" + id + "/edit";
      var cur_value = $(element).text();
      $.post(url, {'new_task_name': cur_value});
    }
  );
}


// CLOSE TASK
function closeTask(id) {
  var element = $('#' + id).find('.task-close');
  $(element).click(
    function() {
      var url = "/reminder/" + id + "/close";
      $.post(url);
      $('#' + id).remove();
    }
  )
}


// COMPLETE TASK
function completeTask(id) {
  var element = $('#' + id).find('.task-complete');
  $(element).click(
    function() {
      var url = "/reminder/" + id + "/complete";
      $.post(url).done(
        function(htmls) {
          $('#history_section').html(htmls['history_area_html']);
          $('#tasks_area').html(htmls['tasks_area_html']);
          addProgressBarsAnimation();
          addFuncToTasks(editTaskName);
          addFuncToTasks(closeTask);
          addFuncToTasks(completeTask);
        }
      )
    }
  )
}


function initTasksFunctions() {
  addNewTask();
  addProgressBarsAnimation();
  addFuncToTasks(editTaskName);
  addFuncToTasks(closeTask);
  addFuncToTasks(completeTask);
}


