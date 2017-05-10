

var Modal = function (title, text) {
    this.template = $(`
        <div class="modal fade" id="modal-window" role="dialog">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title">${title}</h4>
                    </div>
                    <div class="modal-body">
                        <p>${text}</p>
                    </div>
                    <div class="modal-footer">
                    </div>
                </div>
            </div>
        </div>
    `);
    this.addButton = function (text, type, func=null) {
        var type = type || 'default'
        var $button = $(`<button type="button" class="btn btn-${type}" data-dismiss="modal">${text}</button>`)
        if (func != null) {
            $button.on('click', function() { func() })
        }
        this.template.find('.modal-footer').append( $button )
    };
    this.run = function() {
        var $modal = $(this.template);
        $('#message-box').append($modal);
        $modal.on('hidden.bs.modal', function() { $modal.remove() })
        $modal.modal('show');
    };
    this.run();
}

