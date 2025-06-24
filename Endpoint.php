<?php

/**
 * Core Framework - NotesEndpoint
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Endpoint;

class NotesEndpoint extends Endpoint {

    /**
     * Constructor
     */
    public function __construct()
    {

        // Call Parent Constructor
        parent::__construct();

        // Retrieve the namespace
        $namespace = $this->Request->getNamespace();

        // Set Global access
        $this->Public = false;

        // Set Properties
        switch($namespace){
            case "/notes/details":
                $this->Level = 1;
                break;
            case "/notes/create":
                $this->Level = 2;
                break;
            case "/notes/update":
            case "/notes/share":
                $this->Level = 3;
                break;
            case "/notes/delete":
            case "/notes/archive":
            case "/notes/recover":
                $this->Level = 4;
                break;
        }
    }

    /**
     * Retrieve Note's Details
     */
    public function detailsAction(): array
    {
        $message = ["status" => 200, "message" => "OK", "data" => []];
        $note = $this->Model->Notes->get(intval($this->Request->getParams('GET','id')));
        if(empty($note)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested note."];
        } else {
            if($note['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
            }
            if(!$note['isPublic'] && $note['owner']['id'] != $this->Auth->user()->id){
                if(!in_array($this->Auth->user()->id,$note['sharedWith'])){
                    $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
                } else {
                    $roles = $this->Auth->user()->roles();
                    if(!in_array('Administrator',$roles) && !in_array('Marketing Manager',$roles)){
                        $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
                    }
                }
            }
        }
        if($message['status'] == 200){
            $message['data'] = [
                "record" => $note,
                "relationships" => $this->Model->Relationship->get('notes', $note['id']),
            ];
        }
        return $message;
    }

    /**
     * Update a Note
     */
    public function updateAction(): array
    {
        // Import Global Variables
        global $CSRF;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Retrieve the Note id
        $id = intval($this->Request->getParams('REQUEST','id'));

        // Retrieve the Note
        $Note = $this->Model->Notes->get($id);

        // Check if the Note exists
        if(empty($Note)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested Note."];
        } else {
            if($Note['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
            }
            if($Note['owner']['id'] != $this->Auth->user()->id){
                if(!in_array($this->Auth->user()->id,$Note['sharedWith'])){
                    $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
                } else {
                    $roles = $this->Auth->user()->roles();
                    if(!in_array('Administrator',$roles) && !in_array('Marketing Manager',$roles)){
                        $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
                    }
                }
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Set Required Fields
                $required = ['subject','content'];

                // Set Optional Fields
                $optional = ['isPublic','sharedWith'];

                // Set Unique Fields
                $unique = ['id','created','modified','owner','organization','targetTable','targetId'];

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Initialize the Events
                    $message['data']['events'] = [];

                    // Initialize the Note
                    $data = [];

                    // Update the Note
                    foreach($required as $key){
                        if(isset($parameters[$key])){
                            $data[$key] = $parameters[$key];
                        }
                    }
                    foreach($optional as $key){
                        if(isset($parameters[$key])){
                            $data[$key] = $parameters[$key];
                        }
                    }
                    foreach($unique as $key){
                        if(isset($data[$key])){
                            unset($data[$key]);
                        }
                    }

                    // Intval the isPublic field
                    if(isset($data['isPublic'])){
                        $data['isPublic'] = intval($data['isPublic']);
                    }

                    // Update the Note
                    $affectedRows = $this->Model->Notes->update($id, $data);

                    // Check if a target object has been assigned on the task
                    if($affectedRows){

                        // Retrieve the user's username and vCard
                        $owner = $this->Auth->user()->username;
                        $vCard = $this->Auth->user()->vcard();

                        // Create the an event
                        $message['data']['events'][] = $this->Model->Event->create($owner, $Note['targetTable'], $Note['targetId'], 'Note', '<vcard>'.$vCard['id'].':'.$this->Auth->user()->username.'</vcard> has updated <note>'.($data['subject'] ?? $Note['subject']).'</note>.');
                    }

                    // Retrieve the final lead
                    $message['data']['record'] = $this->Model->Notes->get($id);
                } else {
                    $message['status'] = 400;
                    $message['message'] = "Bad Request";
                    $message['data']['error'] = "Some required fields are missing.";
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        return $message;
    }

    /**
     * Create a Note
     */
    public function createAction(): array
    {
        // Import Global Variables
        global $CSRF;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Set Required Fields
                $required = ['subject','content','targetTable','targetId'];

                // Set Optional Fields
                $optional = ['isPublic','sharedWith'];

                // Set Unique Fields
                $unique = ['id','created','modified','owner','organization'];

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Initialize the Events
                    $message['data']['events'] = [];

                    // Retrieve the user's username and vCard
                    $owner = $this->Auth->user()->username;
                    $organization = $this->Auth->user()->organization()->id;
                    $vCard = $this->Auth->user()->vcard();

                    // Initialize the Note
                    $data = [];

                    // Update the Note
                    foreach($required as $key){
                        if(isset($parameters[$key])){
                            $data[$key] = $parameters[$key];
                        }
                    }
                    foreach($optional as $key){
                        if(isset($parameters[$key])){
                            $data[$key] = $parameters[$key];
                        }
                    }

                    // Set Unique Values
                    $data['owner'] = $owner;
                    $data['organization'] = $organization;

                    // Intval the isPublic field
                    if(isset($data['isPublic'])){
                        $data['isPublic'] = intval($data['isPublic']);
                    }

                    // Update the Note
                    $id = $this->Model->Notes->create($data);

                    // Check if a target object has been assigned on the task
                    if($id){

                        // Create the an event
                        $message['data']['events'][] = $this->Model->Event->create($owner, $data['targetTable'], $data['targetId'], 'Note', '<vcard>'.$vCard['id'].':'.$this->Auth->user()->username.'</vcard> wrote <note>'.$data['subject'].'</note>.');
                    }

                    // Retrieve the final lead
                    $message['data']['record'] = $this->Model->Notes->get($id);
                } else {
                    $message['status'] = 400;
                    $message['message'] = "Bad Request";
                    $message['data']['error'] = "Some required fields are missing.";
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        return $message;
    }

    /**
     * Delete a Note
     */
    public function deleteAction(): array
    {
        // Import Global Variables
        global $CSRF;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Retrieve the Note id
        $id = intval($this->Request->getParams('REQUEST','id'));

        // Retrieve the Note
        $Note = $this->Model->Notes->get($id);

        // Check if the Note exists
        if(empty($Note)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested Note."];
        } else {
            if($Note['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
            }
            if($Note['owner']['id'] != $this->Auth->user()->id){
                if(!in_array($this->Auth->user()->id,$Note['sharedWith'])){
                    $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
                } else {
                    $roles = $this->Auth->user()->roles();
                    if(!in_array('Administrator',$roles) && !in_array('Marketing Manager',$roles)){
                        $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
                    }
                }
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Initialize the Events
            $message['data']['events'] = [];

            // Delete the Note
            $affectedRows = $this->Model->Notes->delete($id);

            // Check if a target object has been assigned on the task
            if($affectedRows){

                // Retrieve the user's username and vCard
                $owner = $this->Auth->user()->username;
                $vCard = $this->Auth->user()->vcard();

                // Create the an event
                $message['data']['events'][] = $this->Model->Event->create($owner, $Note['targetTable'], $Note['targetId'], 'Note', '<vcard>'.$vCard['id'].':'.$this->Auth->user()->username.'</vcard> has deleted <note>'.$Note['subject'].'</note>.');
            }

            // Retrieve the final lead
            $message['data']['affectedRows'] = $affectedRows;
        }

        return $message;
    }

    /**
     * Archive a Note
     */
    public function archiveAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the Note
        $note = $this->Model->Notes->get(intval($this->Request->getParams('GET','id')));

        // Check if the Note is accessible
        if(empty($note)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested note."];
        } else {
            if($note['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Update the Note
                $affectedRows = $this->Model->Notes->update($note['id'], ["isArchived" => 1]);

                // Retrieve the Updated Note
                $message["data"]["record"] = $this->Model->Notes->get($note['id']);
            } else {
                $message = ["status" => 400, "message" => "Bad Request", "data" => "Invalid Request Method"];
            }
        }

        return $message;
    }

    /**
     * Recover a Note
     */
    public function recoverAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the Note
        $note = $this->Model->Notes->get(intval($this->Request->getParams('GET','id')));

        // Check if the Note is accessible
        if(empty($note)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested note."];
        } else {
            if($note['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Update the Note
                $affectedRows = $this->Model->Notes->update($note['id'], ["isArchived" => 0]);

                // Retrieve the Updated Note
                $message["data"]["record"] = $this->Model->Notes->get($note['id']);
            } else {
                $message = ["status" => 400, "message" => "Bad Request", "data" => "Invalid Request Method"];
            }
        }

        return $message;
    }

    /**
     * Share a Note
     */
    public function shareAction(): array
    {
        // Import Global Variables
        global $CSRF;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Retrieve the Note id
        $id = intval($this->Request->getParams('REQUEST','id'));

        // Retrieve the Note
        $Note = $this->Model->Notes->get($id);

        // Check if the Note exists
        if(empty($Note)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested Note."];
        } else {
            if($Note['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
            }
            if($Note['owner']['id'] != $this->Auth->user()->id){
                if(!in_array($this->Auth->user()->id,$Note['sharedWith'])){
                    $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
                } else {
                    $roles = $this->Auth->user()->roles();
                    if(!in_array('Administrator',$roles) && !in_array('Marketing Manager',$roles)){
                        $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this note."];
                    }
                }
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Initialize the Events
                $message['data']['events'] = [];

                // Retrieve the parameters
                $sharedWith = $this->Request->getParams('REQUEST','sharedWith') ?? [];

                // Sanitize the sharedWith field
                foreach($sharedWith as $key => $value){
                    $sharedWith[$key] = intval($value);
                }

                // Update the Note
                $affectedRows = $this->Model->Notes->update($id, ['sharedWith' => $sharedWith]);

                // Check if a target object has been assigned on the task
                if($affectedRows){

                    // Retrieve the user's username and vCard
                    $owner = $this->Auth->user()->username;
                    $vCard = $this->Auth->user()->vcard();

                    // Create the an event
                    if(!empty($sharedWith)){
                        $message['data']['events'][] = $this->Model->Event->create($owner, $Note['targetTable'], $Note['targetId'], 'Note', '<vcard>'.$vCard['id'].':'.$this->Auth->user()->username.'</vcard> has shared <note>'.$Note['subject'].'</note>.');
                    } else {
                        $message['data']['events'][] = $this->Model->Event->create($owner, $Note['targetTable'], $Note['targetId'], 'Note', '<vcard>'.$vCard['id'].':'.$this->Auth->user()->username.'</vcard> has unshared <note>'.$Note['subject'].'</note>.');
                    }
                }

                // Retrieve the final lead
                $message['data']['record'] = $this->Model->Notes->get($id);
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        return $message;
    }
}
