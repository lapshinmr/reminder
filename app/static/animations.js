

function animateProgressBar(task) {
    var width = task.style.width.replace("%", "");
    var width_step = 0.5;
    var leftTime = task.getAttribute("data-left-time");
    var updateTime = leftTime / (width / width_step) * 1000;
    var interval_id = setInterval(
        function() {
            if (width <= 0) {
                console.log('delete interval');
                clearInterval(interval_id);
            } else {
                console.log(interval_id);
                width -= width_step;
                task.setAttribute("style", "width: " + width + "%");
            }
        },
        updateTime
    )
}


function animateProgressBars() {
    var tasks = document.getElementsByClassName("progress-bar");
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var leftBarWidth = task.style.width.replace("%", "");
        if (leftBarWidth > 0) {
            animateProgressBar(task);
        }
    }
}

