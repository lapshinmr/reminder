

function TimeUnit(id, maxValue, totalSeconds, zeroes) {
    var self = this;
    self.id = id;
    self.value = 0;
    self.minValue = 0;
    self.maxValue = maxValue;
    self.totalSeconds = totalSeconds;
    self.zeroes = zeroes;
    self.$unit = $(
        `<div id="${self.id}" class="col-md-3 text-center">
            <div class="arrow up"></div>
            <div class="value" contenteditable="true"></div>
            <div class="arrow down"></div>
        </div>`
    );
    self.$value = self.$unit.find('.value');
    self.$up = self.$unit.find('.arrow.up')
    self.$down = self.$unit.find('.arrow.down')

    self.updateValue = function() {
        var value = self.value;
        if (self.zeroes && self.value < 10) {
          value = "0" + value;
        }
        self.$value.text(value);
        self.$value.trigger('valueChanged')
    }
    self.updateValue();

    self.decrease = function() {
      if (self.value > 0) {
        self.value--;
        self.updateValue();
      }
    };

    self.increase = function() {
      if (self.maxValue === undefined || self.value < self.maxValue) {
        self.value++;
        self.updateValue();
      }
    }

    self.animateArrow = function(element) {
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
    };

    self.treatArrowsClicking = function() {
        self.$up.click(function() {
            self.increase();
            self.animateArrow(self.$up);
        });
        self.$down.click(function() {
            self.decrease();
            self.animateArrow(self.$down);
        });
    };

    self.treatScrolling = function() {
        self.$unit.on('wheel mousewheel', function(e) {
            e.preventDefault();
            var delta = e.originalEvent.deltaY;
            if (delta > 0) {
                self.decrease();
                self.animateArrow(self.$down);
            } else if (delta < 0) {
                self.increase();
                self.animateArrow(self.$up);
            };
        })
    };

    self.treatValueEditing =  function() {
        self.$value.on('keypress',
            function(e) {
                if (e.which == 13) {
                    self.$value.blur()
                }
            }
        );
        self.$value.on('focusout',
            function() {
                var curValue = self.$value.text();
                if (!isNaN(curValue)) {
                    if (curValue > self.maxValue) {
                        curValue = self.maxValue;
                    } else if (curValue < self.minValue) {
                        curValue = self.minValue;
                    }
                    self.value = Number(curValue);
                };
                self.updateValue();
            }
        );
    };
    self.treatArrowsClicking();
    self.treatScrolling();
    self.treatValueEditing();
}


//controller
function DurationPicker(id) {
    var self = this;
    self.$input = $(id);
    self.id = id.replace('#', '');
    self.$replacer = $(`<div id="${self.id}-replacer" class="row">`);
    self.$replacer.insertAfter(self.$input);
    self.$input.hide();
    self.units = [];
    self.getTime = function() {
      var time = 0;
      for (var i = 0; i < self.units.length; i++) {
        time += self.units[i].value * self.units[i].totalSeconds;
      }
      return time
    };
    self.append = function( timeUnit ) {
        self.units.push( timeUnit );
        self.$replacer.append(timeUnit.$unit);
    }
    self.append( new TimeUnit('days', undefined, 86400, false) );
    self.append( new TimeUnit('hours', 23, 3600, true) );
    self.append( new TimeUnit('minutes', 59, 60, true) );
    self.append( new TimeUnit('seconds', 59, 1, true) );
    
    $('#duration-picker-replacer div.value').on("valueChanged",
        function(e){
            $('#duration-picker').val(self.getTime());
        }
    );
}

