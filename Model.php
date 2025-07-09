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
     * Retrieve multiple records
     *
     * @param array $conditions
     * @return array
     */
    public function fetchAll(array $conditions = [], string $conjunction = 'AND'): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table($this->table)
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->where('organization', $this->Auth->user()->organization()->id);

        // Check if the conditions are empty
        if(!empty($conditions)){

            // Add a Filter
            $Query->filter();

            // Add the Conditions
            foreach($conditions as $key => $condition){

                // Check if the key exists in the definition
                if(!array_key_exists($condition['key'], $this->definition)){

                    // Remove the key from the data
                    unset($conditions[$key]);
                    continue;
                }

                // Add the condition to the Query
                $Query->where($condition["key"], $condition["value"], $condition["operator"], $conjunction);
            }
        }

        // Retrieve the Results
        $records = $Query->fetch();

        // Loop through the records to process them
        foreach($records as $key => $record){

            // Process the record
            $record = $this->process($record);

            // Check if the note is private
            if(!filter_var($record['isPublic'], FILTER_VALIDATE_BOOLEAN)){

                // Check if the sharedWith field is an array
                if(!is_array($record['sharedWith']) || empty($record['sharedWith'])){

                    // If not, set it to an empty array
                    $record['sharedWith'] = [];
                }

                // Convert all IDs in sharedWith to integers
                $record['sharedWith'] = array_map('intval', $record['sharedWith']);

                // Check if the user is the owner or has access to the note
                if($record['owner']['id'] !== $this->Auth->user()->id && !in_array($this->Auth->user()->id,$record['sharedWith'])){

                    // Remove the private note from the results
                    unset($records[$key]);
                    continue;
                }
            }

            // Overwrite the record with the processed one
            $records[$key] = $record;
        }

        // Return the Results
        return $records;
    }

    /**
     * Retrieve a single record
     *
     * @param int $id
     * @return array
     */
    public function fetch(int $id): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table($this->table)
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->filter()
            ->where($this->primary, $id)
            ->limit(1);

        // Retrieve the record
        $records = $Query->fetch();

        // Loop through the records to process them
        foreach($records as $key => $record){

            // Overwrite the record with the processed one
            $records[$key] = $this->process($record);
        }

        // Return the record or an empty array if not found
        return $records[array_key_first($records)] ?? [];
    }
}
