builder.add('widgets','notes', class extends builder.ComponentClass {

    #count = 0;
    _feed = null;

    _init(){
        this._properties = {
            class: {
                component: null,
            },
            data: {},
            targetTable: null,
            targetId: null,
            iframed: false,
            callback: {},
        };
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'notes' + this._id,
            'class': '',
        });
        this._component.id = this._component.attr('id');

        // Set an Update Callback
        this._properties.callback.update = function(feed, post){
            console.log('Notes updated:', feed, post);
            if(post.data.isPublic){
                post.controls.share.hide();
            } else {
                post.controls.share.show();
            }
        }

        // Create the Feed
        this._builder.Component(
            'feed',
            this._component,
            this._properties,
            function(feed, component){

                // Set _feed
                self.feed(feed);

                // Check if a target is set
                if(self._properties.targetTable !== null && self._properties.targetId !== null){

                    // Add a clickable form input
                    component.inputGroup = $(document.createElement('div')).addClass('bg-gray-200 p-3 py-2 border-bottom cursor-pointer').prependTo(component);
                    component.inputGroup.input = $(document.createElement('input')).attr({
                        'type': 'text',
                        'class': 'form-control cursor-pointer',
                        'placeholder': self._builder.Locale.get('Write something...'),
                    }).appendTo(component.inputGroup);
                    component.inputGroup.input.click(function(){
                        self.create();
                    });
                }

                // Add Feed Controls
                feed.control('Share','share',function(post){
                    self.share(post);
                });
                feed.control('Edit','pencil-square',function(post){
                    self.edit(post);
                });
                feed.control('Archive','archive',function(post){
                    self.archive(post);
                });

                // Add Feed Posts
                for(const [key, record] of Object.entries(self._properties.data)){
                    self.add(record);
                }
            },
        );
    }

    feed(feed = null){
        if(feed){
            this._feed = feed;
        }
        return this._feed;
    }

    add(record){

        // Set Self
        const self = this;

        // Add Record
        this.feed().add(record,function(post){
            post.find('.avatar').addClass('cursor-pointer')
            post.find('.owner').click(function(e){
                e.preventDefault();
                e.stopPropagation();
                self._builder.Widget('vcard',{data: record.owner.vcard});
            });
            if(record.isPublic){
                post.controls.share.hide();
            }
            if(USER_ID !== record.owner.id){
                post.controls.archive.remove();
                delete post.controls.archive;
                post.controls.share.remove();
                delete post.controls.share;
                post.controls.edit.remove();
                delete post.controls.edit;
            }
        })
    }

    create(){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "pencil-square",
                title: this._builder.Locale.get("Write a note"),
                color: 'success',
                size: 'lg',
            },
            function(modal,component){

                // Set the parent
                const parent = component.dialog;

                // Styling
                component.body.addClass('p-0');

                // Create the Form
                self._builder.Utility(
                    'form',
                    component.body,
                    {
                        callback: {
                            val: function(values){
                                values.isPublic = values.isPublic ? 0 : 1;
                                values.targetTable = self._properties.targetTable;
                                values.targetId = self._properties.targetId;
                                return values;
                            },
                            submit: function(form){

                                // Show the modal spinner
                                modal.spinner(true);

                                // AJAX Request - Create the note
                                $.ajax({
                                    url: '/api/notes/create',
                                    headers: {'X-CSRF-Authorization': CSRF_KEY},
                                    type: 'POST',dataType: 'json',
                                    data: form.val(),
                                    success: function(response) {

                                        // Add the note
                                        self.add(response.record);

                                        // Close the modal
                                        modal.hide();
                                    }
                                });
                            },
                        }
                    },
                    function(form,component){

                        // Add event listener on the modal submit button
                        parent.content.footer.submit.click(function(e){
                            e.preventDefault();
                            e.stopPropagation();
                            form.submit();
                        });

                        // subject
                        form.add(
                            'text',
                            {
                                name: 'subject',
                                placeholder: self._builder.Locale.get('Enter subject'),
                                class: {
                                    component: 'bg-gray-200 p-3 py-2 rounded-0 border-bottom',
                                },
                            },
                        );

                        // content
                        form.add(
                            'mce',
                            {
                                name: 'content',
                                placeholder: self._builder.Locale.get('Write your note here...'),
                                class: {
                                    component: 'rounded-0',
                                },
                            },
                        );

                        // isPublic
                        form.add(
                            'switch',
                            {
                                name: 'isPublic',
                                label: builder.Locale.get('Private'),
                                class: {
                                    component: 'bg-gray-200 p-3 py-2 rounded-0 border-top',
                                },
                            },
                        );

                        // Show the modal
                        modal.show();
                    },
                );
            },
        );
    }

    edit(post){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                onEnter: false,
                icon: "pencil-square",
                title: this._builder.Locale.get("Edit note"),
                color: 'warning',
                size: "lg",
                callback: {
                    load: function(component, modal){
                        return new Promise((resolve, reject) => {
                            try {
                                // Set the parent
                                const parent = component.dialog;

                                // Retrieve the note data
                                $.ajax({
                                    url: '/api/notes/fetch?id='+post.data.id,
                                    type: 'GET',dataType: 'json',
                                    success: function(response) {

                                        // Reset post data
                                        post.data = response.record;

                                        // Create the Form
                                        self._builder.Utility(
                                            'form',
                                            component.body,
                                            {
                                                callback: {
                                                    val: function(values){
                                                        values.isPublic = values.isPublic ? 0 : 1;
                                                        return values;
                                                    },
                                                    submit: function(form){

                                                        // Show the modal spinner
                                                        modal.spinner(true);

                                                        // Update the note
                                                        $.ajax({
                                                            url: '/api/notes/update?id='+response.record.id,
                                                            headers: {'X-CSRF-Authorization': CSRF_KEY},
                                                            type: 'POST',dataType: 'json',
                                                            data: form.val(),
                                                            success: function(response) {

                                                                // Update the post data
                                                                post.data = response.record;

                                                                // Update the post
                                                                post.header.title.html(response.record.subject);
                                                                post.content.html(response.record.content);
                                                                post.controls.share.toggle(post.data.isPublic);

                                                                // Hide the modal
                                                                modal.hide();
                                                            }
                                                        });
                                                    },
                                                }
                                            },
                                            function(form,component){

                                                // Add event listener on the modal submit button
                                                parent.content.footer.submit.click(function(e){
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    form.submit();
                                                });

                                                // subject
                                                form.add(
                                                    'text',
                                                    {
                                                        name: 'subject',
                                                        placeholder: self._builder.Locale.get('Enter subject'),
                                                        value: response.record.subject,
                                                        class: {
                                                            component: 'bg-gray-200 p-3 py-2 rounded-0 border-bottom',
                                                        },
                                                    },
                                                );

                                                // content
                                                form.add(
                                                    'mce',
                                                    {
                                                        name: 'content',
                                                        placeholder: self._builder.Locale.get('Write your note here...'),
                                                        value: response.record.content,
                                                        class: {
                                                            component: 'rounded-0',
                                                        },
                                                    },
                                                );

                                                // isPublic
                                                form.add(
                                                    'switch',
                                                    {
                                                        name: 'isPublic',
                                                        label: builder.Locale.get('Private'),
                                                        value: response.record.isPublic ? false : true,
                                                        class: {
                                                            component: 'bg-gray-200 p-3 py-2 rounded-0 border-top',
                                                        },
                                                    },
                                                );

                                                // Resolve the promise
                                                resolve();
                                            },
                                        );
                                    }
                                });
                            } catch(e) { reject(e); }
                        });
                    },
                },
            },
            function(modal,component){

                // Styling
                component.body.addClass('p-0');

                // Show the modal
                modal.show();
            },
        );
    }

    share(post){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                onEnter: false,
                icon: "share",
                title: this._builder.Locale.get("Share note"),
                color: 'info',
                callback: {
                    load: function(component, modal){
                        return new Promise((resolve, reject) => {
                            try {
                                // Set the parent
                                const parent = component.dialog;

                                // Retrieve the note data
                                $.ajax({
                                    url: '/api/auth/users',
                                    type: 'GET',dataType: 'json',
                                    success: function(response) {

                                        // Generate options from users
                                        var members = response.records;
                                        var options = [];
                                        for(const [id, member] of Object.entries(members)){
                                            if(member.id === USER_ID){
                                                continue;
                                            }
                                            options.push({id: id, text: member.username});
                                        }

                                        // Retrieve the note data
                                        $.ajax({
                                            url: '/api/notes/fetch?id='+post.data.id,
                                            type: 'GET',dataType: 'json',
                                            success: function(response) {

                                                // Reset post data
                                                post.data = response.record;

                                                // Create the Form
                                                self._builder.Utility(
                                                    'form',
                                                    component.body,
                                                    {
                                                        callback: {
                                                            val: function(values){
                                                                let users = [];
                                                                for(const [key, value] of Object.entries(values.sharedWith)){
                                                                    users.push(parseInt(value));
                                                                }
                                                                return users.length > 0 ? {sharedWith: users} : {sharedWith: '[]'};
                                                            },
                                                            submit: function(form){

                                                                // Show the modal spinner
                                                                modal.spinner(true);

                                                                console.log(form.val());

                                                                // Update the note
                                                                $.ajax({
                                                                    url: '/api/notes/update?id='+response.record.id,
                                                                    headers: {'X-CSRF-Authorization': CSRF_KEY},
                                                                    type: 'POST',dataType: 'json',
                                                                    data: form.val(),
                                                                    success: function(response) {

                                                                        // Update the post data
                                                                        post.data = response.record;

                                                                        // Hide the modal
                                                                        modal.hide();
                                                                    }
                                                                });
                                                            },
                                                        }
                                                    },
                                                    function(form,component){

                                                        // Add event listener on the modal submit button
                                                        parent.content.footer.submit.click(function(e){
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            form.submit();
                                                        });

                                                        // sharedWith
                                                        form.add(
                                                            'select2',
                                                            {
                                                                name: 'sharedWith',
                                                                placeholder: self._builder.Locale.get('Select user(s) to share with'),
                                                                value: response.record.sharedWith,
                                                                options: options,
                                                                multiple: true,
                                                                allowClear: true,
                                                                class: {
                                                                    component: 'bg-gray-200 p-3 py-2 rounded-0',
                                                                },
                                                            },
                                                        );

                                                        // Resolve the promise
                                                        resolve();
                                                    },
                                                );
                                            }
                                        });
                                    },
                                });
                            } catch(e) { reject(e); }
                        });
                    },
                },
            },
            function(modal,component){

                // Styling
                component.body.addClass('p-0');

                // Show the modal
                modal.show();
            },
        );
    }

    archive(post){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "archive",
                title: this._builder.Locale.get("Are you sure?"),
                body: this._builder.Locale.get("You are about to archive this note. Are you sure you want to continue?"),
                color: 'dark',
                callback: {
                    submit: function(element,modal){

                        // Show the modal spinner
                        modal.spinner(true);

                        // AJAX Request - Archive the note
                        $.ajax({
                            url: '/api/notes/archive?id='+post.data.id,
                            type: 'GET',dataType: 'json',
                            success: function(response) {

                                // Remove the note
                                post.remove();

                                // Close the modal
                                modal.hide();
                            }
                        });
                    },
                },
            },
            function(modal,component){

                // Show the modal
                modal.show();
            },
        );
    }
});
