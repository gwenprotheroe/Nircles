import os
import json
import sys
import argparse
from collections import deque
from datetime import datetime

def canonical(path: str) -> str:
    try:
        return os.path.realpath(path)
    except Exception:
        return os.path.abspath(path)

def stat_times(path: str):
    try:
        st = os.stat(path)
        return st.st_mtime, datetime.fromtimestamp(st.st_mtime).isoformat()
    except Exception:
        return None, None

def get_size(path: str) -> int:
    try:
        return os.path.getsize(path)
    except Exception:
        return 0

def scan_folder(root_path: str, max_depth: int, follow_links: bool):
    root_path = os.path.abspath(root_path)
    root_canonical = canonical(root_path)
    
    mtime, mtime_iso = stat_times(root_path)
    root_node = {
        "name": os.path.basename(root_path) or root_path,
        "type": "folder",
        "path": root_path,
        "last_modified_unix": mtime,
        "last_modified_iso": mtime_iso,
        "value": 1,
        "children": []
    }

    path_to_node = {root_path: root_node}
    visited_canonicals = {root_canonical}
    queue = deque([(root_path, 0)])
    
    folder_count = 0

    while queue:
        curr_path, depth = queue.popleft()
        if depth >= max_depth: continue

        try:
            with os.scandir(curr_path) as it:
                for entry in it:
                    try:
                        entry_path = entry.path
                        entry_canonical = canonical(entry_path)
                        
                        if entry_canonical in visited_canonicals: continue
                        
                        m_unix, m_iso = stat_times(entry_path)
                        
                        if entry.is_dir(follow_symlinks=follow_links):
                            visited_canonicals.add(entry_canonical)
                            new_node = {
                                "name": entry.name,
                                "type": "folder",
                                "path": entry_path,
                                "last_modified_unix": m_unix,
                                "last_modified_iso": m_iso,
                                "value": 1,
                                "children": []
                            }
                            path_to_node[curr_path]["children"].append(new_node)
                            path_to_node[entry_path] = new_node
                            queue.append((entry_path, depth + 1))
                            
                            # Progress pulse for Neutralino
                            folder_count += 1
                            if folder_count % 50 == 0:
                                print(f"SCAN_PROGRESS: {folder_count} folders found...", flush=True)
                        else:
                            ext = os.path.splitext(entry.name)[1][1:].lower() or "file"
                            file_node = {
                                "name": entry.name,
                                "type": ext,
                                "path": entry_path,
                                "value": get_size(entry_path),
                                "last_modified_unix": m_unix,
                                "last_modified_iso": m_iso
                            }
                            path_to_node[curr_path]["children"].append(file_node)
                    except: continue
        except: continue

    return root_node

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan a directory into a JSON structure.")
    parser.add_argument("path", help="The directory path to scan")
    parser.add_argument("--depth", type=int, default=18, help="Maximum scan depth (default: 18)")
    parser.add_argument("--follow", action="store_true", help="Follow symbolic links (default: False)")
    
    args = parser.parse_args()
    
    target_dir = args.path
    if not os.path.exists(target_dir):
        print(f"ERROR: {target_dir} not found", file=sys.stderr)
        sys.exit(1)

    # 1. Run Scan (Progress updates will print to stdout here)
    result = scan_folder(target_dir, args.depth, args.follow)
    
    # 2. Enclose the final JSON in clean markers
    print("RESULT_START", flush=True)
    print(json.dumps(result), flush=True)
    print("RESULT_END", flush=True)