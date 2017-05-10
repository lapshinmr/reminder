

function extendLastTabPadding() {
    var $lastTab = $('#tabs-navigation > a:not(#add-new-tab):last');
    $lastTab.css('padding-right', '75px');
}


function narrowLastTabPadding() {
    var $lastTab = $('#tabs-navigation > a:not(#add-new-tab):last');
    $lastTab.css('padding-right', '25px');
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
            var tabId = $(this).parents('a[href^="#tab"]').attr('href').replace('#tab', '')
            $.post('/edit_tab_name', {'new_tab_name': newTabName, 'tab_id': tabId});
        }
    }, 'a div span.moved-text');
}


function treatNewTabButton() {
    extendLastTabPadding();
    $('#add-new-tab').on('click', function(e) {
        e.stopPropagation();
        var newTabName = 'new tab'
        $.post('/add_new_tab', {'new_tab_name': newTabName}).done(
            function(response) {
                var tabId = response['tab_id'];
                var $newTab = $(response['tab']);
                var $newTabContent = $(response['tab_content']);
                var $addNewTab = $('a#add-new-tab')
                narrowLastTabPadding();
                $newTab.insertBefore($addNewTab);
                extendLastTabPadding();
        //        makeTabDroppable($newTab);
                $('div.tab-content').append($newTabContent);
        //        dragTask($newTabContent.children('ul.tasks_area').eq(0));
                $newTab.trigger('click')
            }
        );
    })
}


function treatTabActivation() {
    $('#tabs-navigation').on('click', 'a', function() {
        if ($(this).hasClass('noclick')) {
            $(this).removeClass('noclick');
        } else {
            var id = $(this).attr('href').replace('#tab', '').replace('content', '');
            CURRENT_TAB = id;
            $.post('/activate_tab', {'current_tab_id': CURRENT_TAB})
        }
    })
}


function closeTab(tabId, $tab) {
    $.post('/close_tab', {'tab_id': tabId}).done(
        function(response) {
            var activeTabIdx = response['active_tab_idx']
            $('div#tab' + tabId).remove();
            $tab.remove();
            extendLastTabPadding();
            if (activeTabIdx >= 0) {
                $('div#tabs-navigation > a[href]:not(#add-new-tab)').eq(activeTabIdx).trigger('click')
            }
        }
    )
}


function treatTabClosing() {
    $('#tabs-navigation').on({
        'mouseenter': function() {
            var $span = $(this).find('span.moved-text');
            if (!$span.is(':focus')) {
                $span.stop().animate({"left": "-=10"}, 300);
                $(this).find('i').stop().fadeIn(300);
            }
        },
        'mouseleave': function() {
            $(this).find('span.moved-text').stop().animate({"left": "50%"}, 300);
            $(this).find('i').stop().fadeOut(300);
        }
    }, 'a.btn:not(#add-new-tab)');
    $('#tabs-navigation').on('click', 'span.moved-text', function(e) {
        $(this).mouseleave();
    })
    $('#tabs-navigation').on('click', 'i', function(event) {
        event.stopPropagation();
        var $tab = $(this).parents().eq(1);
        var tabId = $tab.attr('href').replace('#tab', '');
        var tab_content_length = $(`div.tab-content div#tab${tabId} ul li.task`).length;
        var $tabs = $('#tabs-navigation > a:not(#add-new-tab)');
        if ($tabs.length == 1) {
            var mh = new Modal(
                'Warning',
                'You can\'t close this tab, because it is your last tab.'
            );
            mh.addButton('Ok', 'primary');
        } else if (tab_content_length == 0) {
            closeTab(tabId, $tab);
        } else {
            var mh = new Modal(
                'Warning',
                'If you close this tab you will lost all your tasks for this tab.'
            );
            mh.addButton('Yes, close', 'default', function() { closeTab(tabId, $tab) });
            mh.addButton('no', 'primary');
        }
    });
}


function makeTabDroppable(tab) {
    $(tab).droppable({
        accept: ".connectedSortable li",
        hoverClass: 'ui-state-active',
        tolerance: 'pointer',
        drop: function (event, ui) {
             var tabHref = $(this).children('a').attr('href');
             var tabId = tabHref.replace('#tab', '');
             LAST_DROPPABLE_TAB = tabId;
             $(tabHref).find('.connectedSortable').prepend($(`li.ui-sortable-placeholder.marker`));
        }
    });
}


function dragTabs() {
    var marker, newTabOrderIdx, startIndex, tabId, a;
    var tabs = $('ul.nav.nav-tabs');
    tabs.sortable({
        placeholder: 'tabs-marker',
        opacity: 0.5,
        items: "li:not(.add-button)",
        start: function(e, ui) {
            dragged = ui.item;
            a = dragged.children('a').eq(0);
            a.addClass('noclick');
            tabId = dragged.children('a').eq(0).attr('href').replace('#tab', '');
            marker = ui.placeholder;
            marker.css({
                width: dragged.outerWidth(true),
                height: dragged.outerHeight()
            })
            startIndex = marker.index()
            newTabOrderIdx = startIndex;
        },
        change: function(e, ui) {
            newTabOrderIdx = marker.index();
            if (startIndex > newTabOrderIdx) {
              newTabOrderIdx += 1
            };
        },
        stop: function(e, ui) {
            $.post('/change_tab_order_idx', {'tab_id': tabId, 'new_tab_order_idx': newTabOrderIdx});
        }
    });
}


function makeTabsDroppable() {
    var tabs = $("ul.nav.nav-tabs li");
    for (var i = 0; i < tabs.length; i++) {
        makeTabDroppable(tabs[i]);
    }
}


