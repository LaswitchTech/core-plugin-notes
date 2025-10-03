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
