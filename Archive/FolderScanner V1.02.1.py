import os
import json
import tkinter as tk
from tkinter import filedialog
from collections import deque
import concurrent.futures
import sys
from datetime import datetime # Import the datetime module for time conversion

def create_folder_structure_json_bfs(path):
    """
    Scans a folder structure using a Breadth-First Search (BFS) approach
    and returns a JSON-compatible dictionary representation, including
    modification times.

    Args:
        path (str): The root path of the folder to scan.

    Returns:
        dict: A dictionary representing the folder structure, including
              files, their sizes, subfolders, and their modification times.
    """
    result = {
        'path': os.path.normpath(path),
        'name': os.path.basename(path),
        'type': 'folder',
        'value': '1', # Placeholder value for folders
        'children': []
    }

    if not os.path.isdir(path) or os.path.islink(path):
        if not os.path.exists(path):
            result['error'] = "Path does not exist."
        elif os.path.islink(path):
            result['error'] = "Symbolic link skipped."
        elif not os.path.isdir(path):
            result['error'] = "Not a directory."
        return result

    # Try to get modification time for the root folder itself
    try:
        root_stat = os.stat(path)
        result['last_modified_unix'] = root_stat.st_mtime
        result['last_modified_iso'] = datetime.fromtimestamp(root_stat.st_mtime).isoformat()
    except Exception as e:
        result['last_modified_unix'] = None
        result['last_modified_iso'] = None
        result['error_mod_time'] = str(e)


    queue = deque()
    queue.append((path, result['children']))

    while queue:
        current_dir_path, parent_children_list = queue.popleft()

        try:
            with os.scandir(current_dir_path) as entries:
                for entry in entries:
                    if entry.is_symlink():
                        continue

                    try:
                        entry_stat = entry.stat() # Get stat object once for efficiency
                        mod_time_unix = entry_stat.st_mtime
                        mod_time_iso = datetime.fromtimestamp(mod_time_unix).isoformat()
                    except Exception as e:
                        mod_time_unix = None
                        mod_time_iso = None
                        print(f"Warning: Could not get stat for '{entry.path}': {e}", file=sys.stderr)


                    if entry.is_dir():
                        folder_node = {
                            'path': os.path.normpath(entry.path),
                            'name': entry.name,
                            'type': 'folder',
                            'value': '1',
                            'last_modified_unix': mod_time_unix,
                            'last_modified_iso': mod_time_iso,
                            'children': []
                        }
                        parent_children_list.append(folder_node)
                        queue.append((entry.path, folder_node['children']))
                    elif entry.is_file():
                        try:
                            file_size = entry_stat.st_size # Use the already fetched stat object
                            ext = os.path.splitext(entry.name)[1][1:].strip()
                            parent_children_list.append({
                                'path': os.path.normpath(current_dir_path),
                                'name': entry.name,
                                'type': ext,
                                'value': file_size,
                                'last_modified_unix': mod_time_unix,
                                'last_modified_iso': mod_time_iso
                            })
                        except Exception as e:
                            parent_children_list.append({
                                'path': os.path.normpath(current_dir_path),
                                'name': entry.name,
                                'type': os.path.splitext(entry.name)[1][1:].strip(),
                                'value': '0',
                                'error': str(e),
                                'last_modified_unix': mod_time_unix, # Still include if available
                                'last_modified_iso': mod_time_iso
                            })
        except Exception as e:
            print(f"Error accessing directory '{current_dir_path}': {e}", file=sys.stderr)

    return result

def scan_folder_concurrently(root_path):
    """
    Scans a folder structure, potentially using concurrent processing for
    top-level subdirectories.

    Args:
        root_path (str): The root path of the folder to scan.

    Returns:
        dict: A dictionary representing the entire folder structure.
    """
    overall_result = {
        'path': os.path.normpath(root_path),
        'name': os.path.basename(root_path),
        'type': 'folder',
        'value': '1',
        'children': []
    }

    if not os.path.isdir(root_path):
        overall_result['error'] = "Root path is not a valid directory."
        return overall_result

    # Get modification time for the overall root
    try:
        root_stat = os.stat(root_path)
        overall_result['last_modified_unix'] = root_stat.st_mtime
        overall_result['last_modified_iso'] = datetime.fromtimestamp(root_stat.st_mtime).isoformat()
    except Exception as e:
        overall_result['last_modified_unix'] = None
        overall_result['last_modified_iso'] = None
        overall_result['error_mod_time'] = str(e)


    top_level_items = []
    try:
        with os.scandir(root_path) as entries:
            for entry in entries:
                top_level_items.append(entry)
    except Exception as e:
        overall_result['error'] = f"Error accessing root directory '{root_path}': {e}"
        return overall_result

    sub_dirs_to_scan = []
    files_at_root = []

    for entry in top_level_items:
        if entry.is_symlink():
            continue
        if entry.is_dir():
            sub_dirs_to_scan.append(entry.path)
        elif entry.is_file():
            files_at_root.append(entry)

    # Add files directly at the root level first
    for file_entry in files_at_root:
        try:
            file_stat = file_entry.stat()
            file_size = file_stat.st_size
            ext = os.path.splitext(file_entry.name)[1][1:].strip()
            mod_time_unix = file_stat.st_mtime
            mod_time_iso = datetime.fromtimestamp(mod_time_unix).isoformat()

            overall_result['children'].append({
                'path': os.path.normpath(root_path),
                'name': file_entry.name,
                'type': ext,
                'value': file_size,
                'last_modified_unix': mod_time_unix,
                'last_modified_iso': mod_time_iso
            })
        except Exception as e:
            # Attempt to get mod time even if size fails
            mod_time_unix = None
            mod_time_iso = None
            try:
                temp_stat = file_entry.stat()
                mod_time_unix = temp_stat.st_mtime
                mod_time_iso = datetime.fromtimestamp(mod_time_unix).isoformat()
            except:
                pass # Still couldn't get stat

            overall_result['children'].append({
                'path': os.path.normpath(root_path),
                'name': file_entry.name,
                'type': os.path.splitext(file_entry.name)[1][1:].strip(),
                'value': '0',
                'error': str(e),
                'last_modified_unix': mod_time_unix,
                'last_modified_iso': mod_time_iso
            })

    # Use ThreadPoolExecutor for I/O-bound tasks (like file system traversal)
    with concurrent.futures.ThreadPoolExecutor(max_workers=os.cpu_count() * 2) as executor:
        future_to_dir = {executor.submit(create_folder_structure_json_bfs, sub_dir): sub_dir for sub_dir in sub_dirs_to_scan}

        for future in concurrent.futures.as_completed(future_to_dir):
            sub_dir_path = future_to_dir[future]
            try:
                data = future.result()
                overall_result['children'].append(data)
                print(f"Finished scanning: {sub_dir_path}")
            except Exception as exc:
                print(f'Scanning {sub_dir_path} generated an exception: {exc}', file=sys.stderr)
                overall_result['children'].append({
                    'path': os.path.normpath(sub_dir_path),
                    'name': os.path.basename(sub_dir_path),
                    'type': 'folder',
                    'value': '1',
                    'error': str(exc),
                    'children': [],
                    'last_modified_unix': None, # Cannot get if scan failed
                    'last_modified_iso': None
                })
    return overall_result

# --- Main execution ---
if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()

    print("Please select the folder to scan...")
    folder_path = filedialog.askdirectory(title="Select Folder to Scan")

    if folder_path:
        print(f"Selected folder: {folder_path}")
        print("Please select where to save the JSON output file...")
        output_file = filedialog.asksaveasfilename(
            initialfile=os.path.basename(folder_path) + '.json',
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All Files", "*.*")],
            title="Save JSON Output"
        )

        if output_file:
            print("Scanning folder (BFS with potential parallelism and modification times)...")
            folder_json = scan_folder_concurrently(folder_path)
            
            print("Converting to JSON string...")
            folder_json_str = json.dumps(folder_json, indent=2, ensure_ascii=False)

            try:
                print(f"Saving JSON to {output_file}...")
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(folder_json_str)
                print("Scan complete! JSON saved successfully.")
            except Exception as e:
                print(f"Error saving file: {e}", file=sys.stderr)
        else:
            print("No output file selected. Aborting scan.")
    else:
        print("No folder selected. Aborting scan.")

