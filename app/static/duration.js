

//view
var view = {
  createTimeUnit: function(id) {
    var unit = document.createElement('div');
    unit.setAttribute('id', id);
    unit.innerHTML = (
      '\
      <p class="arrow up"></p> \
      <p class="count"></p> \
      <p class="arrow down"></p> \
      '
    );
    return unit
  },

  updateTimeUnitValue: function(id, value, zeroes) {
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
    $(unitView).on('mousewheel DOMMouseScroll', function(event) {
      event.preventDefault();
      if (event.originalEvent.wheelDelta < 0) {
        unitModel.decrease();
        view.animateArrow(down);
      } else if (event.originalEvent.wheelDelta > 0) {
        unitModel.increase();
        view.animateArrow(up);
      };
      $('#duration').val(model.getTime());
    })
  },

  switchFromParToInput: function(id) {
    var element = $('#' + id).find('.count');
    var new_element = $('<input>', {
        type: 'text',
        class: $(element).attr('class'),
        value: $(element).text()
      }
    );
    element.replaceWith($(new_element));
    var value = new_element.val();
    var value_length = value.length;
    new_element.focus();
    new_element[0].setSelectionRange(value_length, value_length);
    $(new_element).focusout(
      function() {
        if (isNaN($(new_element).val())) {
          $(new_element).val(value);
        };
        model.switchFromInputToPar(id);
      }
    );
    $(new_element).keypress(
      function(e) {
        if (e.which == 13) {
          if (isNaN($(new_element).val())) {
            $(new_element).val(value);
          };
          model.switchFromInputToPar(id);
        }
      }
    );
    $(new_element).on('mousewheel DOMMouseScroll',
      function(event) {
        if (isNaN($(new_element).val())) {
          $(new_element).val(value);
        };
        model.switchFromInputToPar(id);
      }
    );
  },

  switchFromInputToPar: function(id) {
    var element = $('#' + id).find('.count');
    var new_element = $('<p>', {
      class: $(element).attr('class'),
    });
    var value = element.val();
    for (var i = 0; i < this.units.length; i++) {
      var unit = this.units[i];
      if (unit.id == id) {
        if (value > unit.maxValue) {
          var value = unit.maxValue;
        }
        this.units[i].value = value;
      }
    };
    $(new_element).text(value);
    element.replaceWith($(new_element));
    $(new_element).click(
      function() {
        model.switchFromParToInput(id);
      }
    )
  },

  attachClickToCount: function(id) {
      $('#' + id).find('.count').click(
        function(){
          model.switchFromParToInput(id)
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
      this.attachClickToCount(id);
      view.updateTimeUnitValue(id, value, zeroes);
      view.createSeparator(id, value, after);
    }
  }
}


//controller
var controller = {
  start: function() {
    model.createTimeTable(
      {id: 'days', initValue: 0, minValue: 0, maxValue: undefined, totalSeconds: 86400, zeroes: false, after: ' '},
      {id: 'hours', initValue: 0, minValue: 0, maxValue: 23, totalSeconds: 3600, zeroes: true, after: ':'},
      {id: 'minutes', initValue: 0, minValue: 0, maxValue: 59, totalSeconds: 60, zeroes: true, after: ':'},
      {id: 'seconds', initValue: 0, minValue: 0, maxValue: 59, totalSeconds: 1, zeroes: true, after: ''}
    );
  }
}


window.onload = function() {
  controller.start()
}
