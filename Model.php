<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Base\BaseModel;

class NotesModel extends BaseModel {

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the parent constructor
        parent::__construct();

        // Initialize the Model
        $this->init('notes');
    }

    /**
     * Process a record
     *
     * @param array $record
     * @return array
     */
    protected function process(array $record): array
    {
        // Call the parent constructor
        $record = parent::process($record);

        // Process the JSON fields
        if(!is_array($record['sharedWith'])){
            $record['sharedWith'] = json_decode($record['sharedWith'] ?? "[]", true);
        }

        // Return the processed record
        return $record;
    }
}
