

function extendLastTabPadding() {
    var $lastTab = $('#tabs-navigation a:not(#add-new-tab):not():last');
    $lastTab.addClass('extended');
}


function narrowLastTabPadding() {
    var $lastTab = $('#tabs-navigation a:not(#add-new-tab)');
    $lastTab.removeClass('extended');
}


function treatTabNameEdition() {
    $('#tabs-navigation').on({
        'keypress': function(e) {
            if (e.which == 13) {
                $(this).blur();
            } else {
                var newTabName = $(this).text();
                $(this).prev().text(newTabName);
            }
        },
        'focusout': function(e) {
            var e = $.Event('keypress');
            e.keyCode = 27;
            $(this).trigger(e)
            var newTabName = $(this).text();
            if (newTabName == '') {
                newTabName = 'empty';
                $(this).text(newTabName);
                $(this).prev().text(newTabName);
                new Modal(
                    'Warning',
                    'Please, don\'t leave empty tab name field.'
                ).addButton('Okay', 'primary');
            }
            var tabId = $(this).parents('a[href^="#tab"]').attr('href').replace('#tab', '')
            $.post('/edit_tab_name', {'new_tab_name': newTabName, 'tab_id': tabId});
        },
    }, '.moved-text');
}


function treatNewTabButton() {
    extendLastTabPadding();
    $('#add-new-tab').on('click', function(e) {
        e.stopPropagation();
        var newTabName = 'new tab'
        $.post('/add_new_tab', {'new_tab_name': newTabName}).done(
            function(response) {
                var tabId = response['tab_id'];
                var $newTab = $(response['tab']).hide();
                var $newTabContent = $(response['tab_content']);
                var $addNewTab = $('#add-new-tab').parents('li');
                narrowLastTabPadding();
                $('#add-new-tab').hide();
                $newTab.insertBefore($addNewTab).fadeIn(600);
                $('#add-new-tab').fadeIn(600);
                extendLastTabPadding();
                $('div.tab-content').append($newTabContent);
                $newTab.trigger('turnOnTabDroppable');
                $(`#tab${tabId} .tab-tasks`).trigger('turnOnTaskDragging');
                $newTab.children('a').trigger('click');
            }
        );
    })
}


function treatAddNewTabActivation() {
    if ($('li:has(#add-new-tab)').prev('li').children('a').is('.active')) {
        $('#add-new-tab').addClass('active');
    }
}


function treatTabActivation() {
    $('#tabs-navigation').on('click', 'a', function() {
        $('#tabs-navigation a.active').removeClass('active')
        $(this).addClass('active');
        treatAddNewTabActivation();
        CURRENT_TAB = $(this).attr('href').replace('#tab', '').replace('content', '');
        $.post('/activate_tab', {'current_tab_id': CURRENT_TAB})
    })
}




function closeTab(tabId, $tab) {
    $.post('/close_tab', {'tab_id': tabId}).done(
        function(response) {
            var activeTabIdx = response['active_tab_idx']
            $('#tab' + tabId).remove();
            if ($tab.is('.extended')) {
                $('#add-new-tab').fadeOut(600);
            }
            $tab.parents('li').fadeOut(600, function() {
                $(this).remove();
                extendLastTabPadding();
                if (activeTabIdx >= 0) {
                    $('#tabs-navigation a:not(#add-new-tab)').eq(activeTabIdx).trigger('click')
                }
                $('#add-new-tab').fadeIn(600);
            });
        }
    )
}


function treatTabClosing() {
    $('#tabs-navigation').on({
        'mouseenter': function() {
            var $span = $(this).find('span.moved-text');
            if (!$span.is(':focus')) {
                $span.css({"left": "calc(50% - 10px)"}, 300);
                $(this).find('i').stop().fadeIn(300);
            }
        },
        'mouseleave': function() {
            $(this).find('span.moved-text').css({"left": "50%"}, 300);
            $(this).find('i').stop().fadeOut(300);
        }
    }, 'a.btn:not(#add-new-tab)');
    $('#tabs-navigation').on('click', 'span.moved-text', function(e) {
        $(this).mouseleave();
    })
    $('#tabs-navigation').on('click', 'i', function(e) {
        e.stopPropagation();
        var $tab = $(this).parents('a[href^="#tab"]');
        var tabId = $tab.attr('href').replace('#tab', '');
        var tab_content_length = $(`div.tab-content div#tab${tabId} ul li.task`).length;
        var $tabs = $('#tabs-navigation a:not(#add-new-tab)');
        if ($tabs.length == 1) {
            new Modal(
                'Warning',
                'You can\'t close this tab, because it is your last tab.'
            ).addButton('Okay', 'primary');
        } else if (tab_content_length == 0) {
            closeTab(tabId, $tab);
        } else {
            var mh = new Modal(
                'Warning',
                'If you close this tab you will lost all your tasks for this tab.'
            );
            mh.addButton('Yes, close', 'default', function() { closeTab(tabId, $tab) });
            mh.addButton('No', 'primary');
        }
    });
}

function treatTabsDroppable() {
    $("#tabs-navigation").on('turnOnTabDroppable', 'li', function() {
        $(this).droppable({
            accept: ".connected-sortable li",
            hoverClass: 'tab-droppable-hover',
            tolerance: 'pointer',
            drop: function (event, ui) {
                var tabHref = $(this).children('a').attr('href');
                var tabId = tabHref.replace('#tab', '');
                LAST_DROPPABLE_TAB = tabId;
                $(tabHref).find('.connected-sortable').prepend($(`li.ui-sortable-placeholder.task-marker`));
            }
        });
    });
    $('#tabs-navigation > li').trigger('turnOnTabDroppable');
}


function treatTabsDragging() {
    var newTabOrderIdx, startIndex, tabId, placeholder, dragged;
    $('#tabs-navigation').on('turnOnTabDragging', function() {
        $(this).sortable({
            placeholder: 'tabs-placeholder',
            cancel: 'span, i',
            items: 'li',
            start: function(e, ui) {
                dragged = ui.item;
                dragged.children('a').trigger('click');
                dragged.fadeTo('medium', 0.33);
                var placeholder_width = dragged.children('a').outerWidth();
                if (dragged.children('a').is('.extended')) {
                    narrowLastTabPadding();
                    $('#add-new-tab').hide();
                    placeholder_width -= 40;
                }
                ui.placeholder.css({
                    'width': placeholder_width
                });
                tabId = dragged.children('a').attr('href').replace('#tab', '');
                startIndex = ui.placeholder.index()
                newTabOrderIdx = startIndex;
            },
            change: function(e, ui) {
                var tabs_total = $('#tabs-navigation li a:not(#add-new-tab)').length;
                newTabOrderIdx = ui.placeholder.index();
                if (newTabOrderIdx == tabs_total) {
                    narrowLastTabPadding();
                    $('#add-new-tab').hide();
                }
                if (startIndex > newTabOrderIdx) {
                  newTabOrderIdx += 1
                };
            },
            stop: function(e, ui) {
                $('#add-new-tab').show();
                extendLastTabPadding();
                dragged.fadeTo('medium', 1);
                $.post('/change_tab_order_idx', {'tab_id': tabId, 'new_tab_order_idx': newTabOrderIdx});
            }
        });
    });
    $('#tabs-navigation').trigger('turnOnTabDragging');
}



