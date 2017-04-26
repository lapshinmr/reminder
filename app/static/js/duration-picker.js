

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

