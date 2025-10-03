const NoteForm = function(form,values = {},modal = null){

    // Initialize Values
    var Values = {
        subject: null,
        content: null,
        isPublic: 1,
    };

    // Set Values
    if(values){
        for(const [key, value] of Object.entries(values)){
            if(typeof Values[key] !== 'undefined'){
                switch(key){
                    default:
                        Values[key] = value;
                        break;
                }
            }
        }
    }

    // subject
    form.add(
        {
            name: 'subject',
            label: builder.Locale.get('Subject'),
            icon: 'sticky',
            type: 'text',
            modal: modal,
            value: Values.subject,
            class: {
                field: 'col-12',
                label: 'text-bg-primary',
            },
        },
    );

    // content
    form.add(
        {
            name: 'content',
            label: builder.Locale.get('Content'),
            icon: 'sticky',
            type: 'mce',
            modal: modal,
            value: Values.content,
            class: {
                field: 'col-12',
                label: 'text-bg-primary',
            },
        },
    );

    // privacy
    form.add(
        {
            name: 'isPublic',
            label: builder.Locale.get('Make Private'),
            icon: 'person-lock',
            type: 'switch',
            modal: modal,
            value: (Values.isPublic == 1 ? false : true),
            class: {
                field: 'col-12',
            },
        },
        function(input,form){
            input.removeClass('mb-3');
        },
    );
};
const NoteFormat = function(element, note){

    // Find the list component
    const list = element.parent();

    // Find the first note item in the list
    const first = list.find('[data-type="note"]').first();

    // Insert the note before the first note item
    if(first.length){
        element.insertBefore(first);
    }

    // Save the note in the element
    element.note = note;

    // Set attributes
    element.attr({
        "data-id": note.id,
        "data-type": "note",
    });

    // Set Styling
    if(typeof element.field !== 'undefined'){
        element.field.removeClass('px-1 py-2 ps-2 pe-0').addClass('p-2');
    } else {
        element.field = $(document.createElement('div')).addClass('p-2').appendTo(element);
    }
    if(typeof element.container !== 'undefined'){
        element.container.addClass('px-3');
    }
    element.removeClass('cursor-pointer').css('transition', '0.5s ease-in-out');

    // Add a container for the subject
    element.field.subject = $(document.createElement('div')).addClass('d-flex justify-content-between align-items-center border-bottom mb-2 py-2').appendTo(element.field);
    element.field.subject.line = $(document.createElement('div')).addClass('note-subject').html(builder.Parser.parse(note.subject)).attr('style','font-size: 28px; font-weight: 100;').appendTo(element.field.subject);

    // Add a container for the meta
    element.field.meta = $(document.createElement('div')).addClass('btn-group').appendTo(element.field.subject);
    element.field.meta.user = $(document.createElement('button')).addClass('btn btn-sm btn-info').html('<i class="me-1 bi bi-person"></i>'+note.owner.username).appendTo(element.field.meta);
    element.field.meta.share = $(document.createElement('button')).addClass('btn btn-sm btn-light').html('<i class="bi bi-share"></i>').appendTo(element.field.meta);
    element.field.meta.archive = $(document.createElement('button')).addClass('btn btn-sm btn-dark').html('<i class="bi bi-archive"></i>').appendTo(element.field.meta);
    // element.field.meta.delete = $(document.createElement('button')).addClass('btn btn-sm btn-danger').html('<i class="bi bi-trash"></i>').appendTo(element.field.meta);
    element.field.meta.date = $(document.createElement('button')).attr({
        'data-bs-toggle': 'tooltip',
        'data-bs-placement': 'top',
        'title': note.created,
        'class': 'btn btn-sm btn-secondary cursor-default',
    }).appendTo(element.field.meta);
    element.field.meta.date.icon = $(document.createElement('i')).addClass('bi bi-clock me-1').prependTo(element.field.meta.date);
    element.field.meta.date.ago = $(document.createElement('time')).attr({
        'datetime': note.created,
        'class': 'cursor-default',
    }).appendTo(element.field.meta.date);
    element.field.meta.date.ago.timeago();
    element.field.meta.date.tooltip();

    // Open the vcard modal
    element.field.meta.user.click(function(){
        vCardModal(note.owner.vcard,note.owner.username);
    });

    // Open the share modal
    element.field.meta.share.click(function(){
        NoteModalShare(note);
    });

    // Open the archive modal
    element.field.meta.archive.click(function(){
        NoteModalArchive(note);
    });

    // // Open the delete modal
    // element.field.meta.delete.click(function(){
    //     NoteModalDelete(note);
    // });

    // Add an extract of the content in a hidden div
    element.field.content = $(document.createElement('div')).attr({
        'class': 'note-extract',
    }).html(note.content).appendTo(element.field);

    // Add additonnal styling to the content area
    if(typeof element.container !== 'undefined'){
        element.field.content.css({
            "max-height": "16em",
            "overflow": "hidden",
        }).addClass('pb-3');
    }

    // Check if we are already in a modal
    if(typeof element.container !== 'undefined'){

        // Add cursor pointer
        element.field.subject.line.addClass('cursor-pointer');
        element.field.content.addClass('cursor-pointer');

        // Open modal when clicking on the note
        element.field.subject.line.click(function(){
            NoteModal(note.id, note.subject);
        });
        element.field.content.click(function(){
            NoteModal(note.id, note.subject);
        });

        // on hover Add text-bg-secondary to the element
        element.field.content.hover(
            function(){
                element.addClass('text-bg-secondary');
            },
            function(){
                element.removeClass('text-bg-secondary');
            },
        );
    }

    // Check if the content is overflowing
    if(typeof element.container !== 'undefined'){
        var pollVisibility = setInterval(() => {
            if(element.field.content.is(':visible')){
                if(builder.Helper.isOverflowing(element.field.content)){
                    element.field.content.more = $(document.createElement('div')).addClass('d-flex justify-content-center cursor-pointer align-elements-center pt-2 fs-5 border-top').appendTo(element.field);
                    element.field.content.more.icon = $(document.createElement('i')).addClass('bi bi-chevron-down').appendTo(element.field.content.more);
                    element.field.content.more.click(function(){
                        NoteModal(note.id, note.subject);
                    });
                }
                clearInterval(pollVisibility);
            }
        }, 100);
    }

    // Check if note is Public
    setTimeout(function(){
        if(note.isPublic == 1 || note.owner.id !== USER_ID){
            element.field.meta.share.hide();
        }
        if(note.owner.id !== USER_ID){
            if(typeof element.field.meta.archive !== 'undefined'){
                element.field.meta.archive.hide();
            }
            if(typeof element.field.meta.delete !== 'undefined'){
                element.field.meta.delete.hide();
            }
        }
        if(typeof element.container !== 'undefined'){
            if(typeof element.container.icon !== 'undefined'){
                element.container.icon.remove();
            }
        }
        if(typeof element.actions !== 'undefined'){
            element.actions.remove();
        }
    }, 100);
};
const NoteModal = function(id, title){
    API.endpoint('/notes/fetch?id='+id).execute(function(response){
        builder.Component(
            "modal",
            null,
            {
                onEnter: false,
                destroy: true,
                icon: "sticky",
                title: title,
                cancel: false,
                submit: false,
                size: "xl",
            },
            function(modal,component){

                // Set attributes
                component.attr({
                    "data-id": id,
                    "data-type": "note",
                })

                // Set styling
                component.addClass('modal-primary');
                component.footer.remove();

                // Check if response.record.category is in the list of categories [Lead, Customer, Supplier, Contact]
                if(response.record.owner.id === USER_ID){
                    $(document.createElement('button'))
                        .addClass('btn btn-lg btn-link')
                        .html('<i class="bi bi-pencil"></i>')
                        .prependTo(component.header.tools)
                        .click(function(){
                            modal.hide();
                            NoteModalEdit(response.record);
                        });
                }

                // Format the note
                NoteFormat(component.body, response.record);

                // Show the modal
                modal.show();
            },
        );
    });
};
const NoteModalEdit = function(note){
    builder.Component(
        "modal",
        null,
        {
            onEnter: false,
            destroy: true,
            icon: "sticky",
            title: note.subject,
            cancel: false,
            submit: true,
            size: "xl",
            callback: {
                submit: function(element,modal){
                    element.form.submit();
                },
                onHide: function(component,modal){
                    NoteModal(note.id, note.subject);
                },
            },
        },
        function(modal,component){
            const componentModal = component;
            component.addClass('modal-warning');
            component.footer.submit.addClass('btn-success').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            });
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-save me-1').prependTo(component.footer.submit);
            component.form = builder.Component(
                'form',
                component.body,
                {
                    class:{
                        form: 'row row-cols-3',
                        field: 'mb-3 col',
                    },
                    callback:{
                        val: function(values){
                            values.isPublic = (values.isPublic === false ? 1 : 0);
                            return values;
                        },
                        submit: function(form){
                            API.endpoint('/notes/update?id='+note.id).data(form.val()).execute(function(response){

                                // Update the note from the list
                                $('[data-type="note"][data-id="'+note.id+'"]').each(function(){

                                    // Update the subject note
                                    $(this).find('.note-subject').text(response.record.subject);

                                    // Update the content note
                                    $(this).find('.note-extract').html(response.record.content);
                                });
                                modal.hide();
                            },function(xhr, status, error){
                                modal.hide();
                            });
                        },
                    },
                },
                function(form,component){
                    NoteForm(form,note,componentModal);
                    modal.show();
                },
            );
        },
    );
};
const NoteModalCreate = function(list = null, fields = {}, callback = null){
    builder.Component(
        "modal",
        null,
        {
            onEnter: false,
            destroy: true,
            icon: "plus-lg",
            title: builder.Locale.get("Write a Note"),
            cancel: false,
            submit: true,
            size: "xl",
            callback: {
                submit: function(element,modal){
                    element.form.submit();
                },
                onHide: function(component,modal){
                    if(typeof component.record !== 'undefined'){
                        NoteModal(component.record.id, component.record.subject);
                    }
                },
            },
        },
        function(modal,component){
            const componentModal = component;
            component.addClass('modal-success');
            component.footer.submit.addClass('btn-success').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Create'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-stars me-1').prependTo(component.footer.submit);
            component.form = builder.Component(
                'form',
                component.body,
                {
                    class:{
                        form: 'row row-cols-3',
                        field: 'mb-3 col',
                    },
                    callback:{
                        val: function(values){
                            values.isPublic = (values.isPublic === false ? 1 : 0);
                            for(const [key, value] of Object.entries(fields)){
                                if(typeof values[key] === 'undefined'){
                                    values[key] = value;
                                }
                            }
                            return values;
                        },
                        submit: function(form){
                            API.endpoint('/notes/create').data(form.val()).execute(function(response){

                                // Set the record
                                const note = response.record;

                                // Check if the list is defined
                                if(list){

                                    // Add the note to the list
                                    list.add(
                                        {},
                                        function(item,list){

                                            // Format the note
                                            NoteFormat(item, note);

                                            // Execute Callback
                                            if(typeof callback === "function"){
                                                callback(note);
                                            }
                                        },
                                    );
                                } else {

                                    // Execute Callback
                                    if(typeof callback === "function"){
                                        callback(note);
                                    }
                                }

                                // Close the modal
                                modal.hide();
                            },function(xhr, status, error){
                                modal.hide();
                            });
                        },
                    },
                },
                function(form,component){
                    NoteForm(form,fields,componentModal);
                    modal.show();
                },
            );
        },
    );
};
const NoteModalShare = function(note){
    API.endpoint('/auth/users').execute(function(response){
        var members = response.records;
        var options = [];
        for(const [id, member] of Object.entries(members)){
            if(member.id === USER_ID){
                continue;
            }
            options.push({id: id, text: member.username});
        }
        builder.Component(
            "modal",
            null,
            {
                onEnter: false,
                destroy: true,
                icon: "share",
                title: builder.Locale.get("Share Note"),
                cancel: false,
                submit: true,
                callback: {
                    submit: function(element,modal){
                        element.form.submit();
                    },
                },
            },
            function(modal,component){
                const componentModal = component;
                component.addClass('modal-light');
                component.header.tools.find('button').addClass('text-bg-light');
                component.footer.submit.addClass('btn-light').removeClass('btn-link').attr({
                    "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
                }).text(builder.Locale.get('Share'));
                component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-share me-1').prependTo(component.footer.submit);
                component.form = builder.Component(
                    "form",
                    component.body,
                    {
                        callback:{
                            val: function(values){
                                let users = [];
                                for(const [key, value] of Object.entries(values.sharedWith)){
                                    users.push(parseInt(value));
                                }
                                return users;
                            },
                            submit: function(form){
                                API.endpoint('/notes/update?id='+note.id).data({sharedWith: form.val()}).execute(function(response){
                                    if(typeof callback === "function"){
                                        callback(response);
                                    }
                                    modal.hide();
                                },function(xhr, status, error){
                                    modal.hide();
                                });
                            },
                        },
                    },
                    function(form,component){
                        form.add(
                            {
                                name: 'sharedWith',
                                label: builder.Locale.get('Share Width'),
                                icon: 'person',
                                type: 'select2',
                                multiple: true,
                                options: options,
                                value: note.sharedWith,
                            },
                        );
                        modal.show();
                    },
                );
            }
        );
    });
};
const NoteModalDelete = function(note){
    builder.Component(
        "modal",
        null,
        {
            onEnter: false,
            destroy: true,
            icon: "exclamation-triangle",
            title: builder.Locale.get("Are you sure?"),
            body: builder.Locale.get("You are about to delete this note. This action cannot be undone. Are you sure you want to continue?"),
            cancel: false,
            submit: true,
            callback: {
                submit: function(element,modal){
                    API.endpoint('/notes/delete?id='+note.id).execute(function(response){
                        // Remove the note from the list
                        $('[data-type="note"][data-id="'+note.id+'"]').each(function(){

                            // Check if element is a modal
                            if($(this).hasClass('modal')){

                                // Remove the backdrop which should be the element directly after the modal
                                if($(this).next().hasClass('modal-backdrop')){
                                    $(this).next().remove();
                                }
                            }

                            // Remove the element
                            $(this).remove();
                        });
                        modal.hide();
                    },function(xhr, status, error){
                        modal.hide();
                    });
                },
            },
        },
        function(modal,component){
            component.addClass('modal-danger');
            component.footer.submit.addClass('btn-danger').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Delete'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-trash me-1').prependTo(component.footer.submit);
            modal.show();
        },
    );
};
const NoteModalArchive = function(note){
    builder.Component(
        "modal",
        null,
        {
            onEnter: false,
            destroy: true,
            icon: "exclamation-triangle",
            title: builder.Locale.get("Are you sure?"),
            body: builder.Locale.get("You are about to archive this note. Are you sure you want to continue?"),
            cancel: false,
            submit: true,
            callback: {
                submit: function(element,modal){
                    API.endpoint('/notes/archive?id='+note.id).execute(function(response){

                        // Remove the note from the list
                        $('[data-type="note"][data-id="'+note.id+'"]').each(function(){

                            // Check if element is a modal
                            if($(this).hasClass('modal')){

                                // Remove the backdrop which should be the element directly after the modal
                                if($(this).next().hasClass('modal-backdrop')){
                                    $(this).next().remove();
                                }
                            }

                            // Remove the element
                            $(this).remove();
                        });
                        modal.hide();
                    },function(xhr, status, error){
                        modal.hide();
                    });
                },
            },
        },
        function(modal,component){
            component.addClass('modal-dark');
            component.footer.submit.addClass('btn-dark').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Archive'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-archive me-1').prependTo(component.footer.submit);
            modal.show();
        },
    );
};
const NotesFeed = function(notes, container, $table = null, $id = null, callback = null){

    // Initialize the list's tools and actions
    var Tools = {
        add: {
            icon: "plus-lg",
            label: builder.Locale.get("Write something..."),
            color: "success",
            callback: function(tool,list){
                var fields = {};
                if($table && $id){
                    fields = {targetTable: $table, targetId: $id};
                }
                NoteModalCreate(list, fields);
            },
        },
    };

    // Get the keys as numbers, sort them in reverse order
    // const sortedKeys = Object.keys(notes).map(Number).sort((a, b) => b - a);

    // Create the list
    builder.Component(
        "list",
        container,
        {
            class: {
                component: "w-100 rounded bg-transparent border-0 shadow-none",
                item: "rounded-top-0",
            },
            tools: Tools,
            icon: null,
        },
        function(list,component){

            // Loop through the notes
            // for(const [key, id] of Object.entries(sortedKeys)){
            for(const [id, note] of Object.entries(notes)){

                // Add the note to the list
                list.add(
                    {},
                    function(item,list){

                        // Format the note
                        NoteFormat(item, note);
                    },
                );
            }
        },
    );
};

// Create a note
function process_function_NoteCreate(task, value, callback = null){

    var targetTable = task.targetTable;
    var targetId = task.targetId;

    // Check if the task has a target
    if(typeof task.target !== 'undefined'){
        if(typeof task.target.targetTable !== 'undefined'){
            targetTable = task.target.targetTable;
        }
        if(typeof task.target.targetId !== 'undefined'){
            targetId = task.target.targetId;
        }
    }

    // Open the Create Note Modal
    builder.Widget('notes',{render: false,targetTable: targetTable,targetId: targetId}).create(function(note){

        // Execute Callback
        if(typeof callback === "function"){
            callback(task, note);
        }
    });
};
function process_meta_NoteCreate(key = null){
    const metadata = {
        label: "Create a Note",
        description: "Create a Note from a Task",
        type: "none",
    };
    return metadata[key] ? metadata[key] : metadata;
}
