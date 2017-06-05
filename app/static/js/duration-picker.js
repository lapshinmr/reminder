

function TimeUnit(id, maxValue, totalSeconds, zeroes) {
    var self = this;
    self.id = id;
    self.value = 0;
    self.minValue = 0;
    self.maxValue = maxValue;
    self.totalSeconds = totalSeconds;
    self.zeroes = zeroes;
    self.$unit = $(
        `<div id="${self.id}" class="time-unit col-md-3">
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

    self.treatArrowsClicking = function() {
        self.$up.on({
            'mousedown': function() {self.$up.addClass('active'); self.increase()},
            'mouseup': function() {self.$up.removeClass('active')}
        })
        self.$down.on({
            'mousedown': function() {self.$down.addClass('active'); self.decrease()},
            'mouseup': function() {self.$down.removeClass('active')}
        })
    };

    self.treatScrolling = function() {
        self.$unit.on('wheel mousewheel', function(e) {
            e.preventDefault();
            var delta = e.originalEvent.deltaY;
            if (delta > 0) {
                self.decrease();
                self.$down.addClass('active').delay(50).queue(function() {
                    $(this).removeClass("active").dequeue();
                });
            } else if (delta < 0) {
                self.increase();
                self.$up.addClass('active').delay(50).queue(function() {
                    $(this).removeClass("active").dequeue();
                });
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

    self.reset = function() {
        self.value = 0;
        self.updateValue();
    };

    self.treatArrowsClicking();
    self.treatScrolling();
    self.treatValueEditing();
}


//controller
function DurationPicker(id) {
    var self = this;
    self.id = id.replace('#', '');
    self.$input = $('#' + self.id);
    self.$replacer = $(`<div id="${self.id}-replacer" class="row">`);
    self.$replacer.insertAfter(self.$input);
    self.$input.hide();

    self.units = [];

    self.append = function( timeUnit ) {
        self.units.push( timeUnit );
        self.$replacer.append(timeUnit.$unit);
    }

    self.append( new TimeUnit('days', undefined, 86400, false) );
    self.append( new TimeUnit('hours', 23, 3600, true) );
    self.append( new TimeUnit('minutes', 59, 60, true) );
    self.append( new TimeUnit('seconds', 59, 1, true) );

    $(`#${self.id}-replacer div.value`).on("valueChanged",
        function(){
            var timeTotal = 0;
            for (var i = 0; i < self.units.length; i++) {
              timeTotal += self.units[i].value * self.units[i].totalSeconds;
            }
            $('#' + self.id).val(timeTotal);
        }
    );

    $(`#${self.id}`).on('valueReset',
        function() {
            for (var i = 0; i < self.units.length; i++) {
                self.units[i].reset();
            }
        }
    )
}

