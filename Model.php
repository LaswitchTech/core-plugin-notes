<?php

/**
 * Core Framework - NotesModel
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Model;

class NotesModel extends Model {

    /**
     * Retrieve Notes's Details
     *
     * @param int $id
     * @return array
     */
    public function get(int $id): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('notes')
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->filter()
            ->where('id', $id)
            ->limit(1);

        // Retrieve the Results
        $result = $Query->result();

        // Decode JSON Fields
        foreach($result as $key => $record){

            // Decode the sharedWith Field
            $result[$key]['sharedWith'] = json_decode($record['sharedWith'] ?? '[]', true);

            // Retrieve the Target
            if(!empty($record['targetTable']) && !empty($record['targetId'])){
                $Query = $this->Database->query()
                    ->table($record['targetTable'])
                    ->select('*')
                    ->where('id', $record['targetId'])
                    ->limit(1);
                $target = $Query->result();
                $result[$key]['target'] = $target[0] ?? [];
            } else {
                $result[$key]['target'] = [];
            }
        }

        // Return the Results
        return $result[array_key_first($result)] ?? [];
    }

    /**
     * Create a new Note and return the id
     *
     * @param array $data
     * @return int
     */
    public function create(array $data): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('notes')
            ->insert($data);

        // Execute the Query
        $affectedRows = $Query->execute();

        // Execute the Query
        return $Query->lastId();
    }

    /**
     * Update a Note
     *
     * @param int $id
     * @param array $data
     * @return int
     */
    public function update(int $id, array $data): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('notes')
            ->update($data)
            ->where('id', $id);

        // Execute the Query
        return $Query->execute();
    }

    /**
     * Delete a Note
     *
     * @param int $id
     * @return int
     */
    public function delete(int $id): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('notes')
            ->delete()
            ->where('id', $id);

        // Execute the Query
        return $Query->execute();
    }
}
