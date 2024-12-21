#!/bin/bash

# Directory containing the .mov files
input_dir="./public/video"
output_dir="./public/output_videos"

# Create the output directory if it doesn't exist
mkdir -p "$output_dir"

# Loop through all .mov files in the input directory
for input_file in "$input_dir"/*.mp4; do
  # Get the base name of the file (without extension)
  base_name=$(basename "$input_file" .mp4)
  
  # Define the output file path
  output_file="$output_dir/${base_name}.mp4"
  
  # Convert the file with optimized settings for web
  ffmpeg -i "$input_file" -vcodec libx264 -crf 28 -preset medium -acodec aac -b:a 96k -movflags +faststart -vf "scale=-2:720" "$output_file"
  
  echo "Converted $input_file to $output_file"
done

echo "Batch conversion complete!"
