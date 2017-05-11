

function TimeUnit(id, maxValue, totalSeconds, zeroes) {
    var self = this;
    self.id = id;
    self.value = 0;
    self.minValue = 0;
    self.maxValue = maxValue;
    self.totalSeconds = totalSeconds;
    self.zeroes = zeroes;
    self.$unit = $(
        `<div id="${self.id}" class="time-unit col-md-3 text-center">
            <div class="arrow up" style="display: none;"></div>
            <div class="value" contenteditable="true"></div>
            <div class="arrow down" style="display: none;"></div>
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
        $( element ).css({color: '#3498db', fontSize: 40, top: '-25px'});
        $( element ).stop().animate({color: '#2c3e50', fontSize: 32, top: '-20px'}, 400 );
    };

    self.treatArrowsFading = function() {
        self.$unit.on(
            {
                'mouseenter': function(e) {
                    $(this).find('div.arrow').stop().fadeIn(600);
                },
                'mouseleave': function(e) {
                    $(this).find('div.arrow').stop().fadeOut(600);
                }
            }
        )
    }

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

    self.treatArrowsHovering = function() {
        self.$up.on(
            {
                'mouseenter': function() {
                    $(this).stop().animate({color: '#34495e'}, 400 );
                },
                'mouseleave': function() {
                    $(this).stop().animate({color: '#2c3e50'}, 400 );
                }
            }
        )
    }

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
    self.treatArrowsFading();
    self.treatArrowsHovering();
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

    $('#duration-picker-replacer div.value').on("valueChanged",
        function(){
            var timeTotal = 0;
            for (var i = 0; i < self.units.length; i++) {
              timeTotal += self.units[i].value * self.units[i].totalSeconds;
            }
            $('#' + self.id).val(timeTotal);
        }
    );
}

