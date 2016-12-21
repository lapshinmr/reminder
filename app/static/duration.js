

//view
var view = {
  createTimeUnit: function(name, value) {
    var unit = document.createElement('div');
    unit.setAttribute('id', name);
    unit.innerHTML = (
      '<div class="value"> \
          <p class="count">' + value + '</p> \
          <p class="description">' + name + '</p> \
        </div> \
        <div class="arrows"> \
          <i class="fa fa-angle-up" aria-hidden="true"></i> \
          <i class="fa fa-angle-down" aria-hidden="true"></i> \
      </div>'
    );
    return unit
  },

  updateTimeUnitValue: function(name, value) {
    var unit = $('#' + name);
    $(unit).find('.count').text(value);
  },

  addButton: function() {
    var button = document.createElement('button');
  }
}


//model
function TimeUnit(name, initValue, minValue, maxValue, totalSeconds) {
  this.name = name;
  this.value = initValue;
  this.minValue = minValue;
  this.maxValue = maxValue;
  this.totalSeconds = totalSeconds;
}

TimeUnit.prototype.decrease = function() {
  if (this.value > this.minValue) {
    this.value--;
    view.updateTimeUnitValue(this.name, this.value);
  }
};

TimeUnit.prototype.increase = function() {
  if (this.value < this.maxValue) {
    this.value++;
    view.updateTimeUnitValue(this.name, this.value);
  }
};


var model = {
  units: [ ],

  attachClicksToArrows: function(unitModel, unitView) {
    $(unitView).find('.fa.fa-angle-up').click(function() {
      unitModel.increase()
      console.log(model.getTime());
    });
    $(unitView).find('.fa.fa-angle-down').click(function() {
      unitModel.decrease()
      console.log(model.getTime());
    });
  },

  createTimeTable: function() {
    var duration = document.getElementById("duration");
    for (var i = 0; i < arguments.length; i++) {
      var name = arguments[i][0];
      var value = arguments[i][1];
      var minValue = arguments[i][2];
      var maxValue = arguments[i][3];
      var totalSeconds = arguments[i][4];
      var unitModel = new TimeUnit(name, value, minValue, maxValue, totalSeconds);
      var unitView = view.createTimeUnit(name, value);
      this.units.push(unitModel);
      this.attachClicksToArrows(unitModel, unitView);
      duration.appendChild(unitView);
    }
  },

  getTime: function() {
    var time = 0;
    for (var i = 0; i < this.units.length; i++) {
      time += this.units[i].value * this.units[i].totalSeconds;
    }
    return time
  }
}


//controller
var controller = {
  start: function() {
    model.createTimeTable(
      ['days', 0, 0, 300, 86400],
      ['hours', 0, 0, 23, 3600],
      ['minutes', 0, 0, 59, 60],
      ['seconds', 0, 0, 59, 1]
    );
  }
}


window.onload = function() {
  controller.start()
}
