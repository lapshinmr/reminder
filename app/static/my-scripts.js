
function changeProgress(taskId, width, updateTime) {
    var task = document.getElementById(taskId);
    var id = setInterval(frame, updateTime);
    function frame() {
        if (width <= 0) {
            clearInterval(id);
        } else {
            width--;
            task.setAttribute("style", "width: " + width + "%");
        }
    }
}

changeProgress(14, 100, 100)
