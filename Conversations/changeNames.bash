#!/bin/bash

# Define the directory containing your JSON files (replace with your directory path)
directory="./vCon"

# Loop through all JSON files in the directory
for current_file in "$directory"/*.json; do
    # Extract the UUID from the JSON file using jq
    uuid=$(jq -r '.uuid' "$current_file")
    
    # Check if jq command worked
    if [ -z "$uuid" ]; then
        echo "Error: UUID not found in the JSON file $current_file."
        continue
    fi

    # Define the new filename using the UUID
    new_file="${directory}/${uuid}.json"

    # Rename the file
    mv "$current_file" "$new_file"

    # Confirmation message
    echo "Renamed $current_file to $new_file"
done
