import os
import json
import tkinter as tk
from tkinter import filedialog
from collections import deque
import concurrent.futures
import sys
from datetime import datetime

# --- Configuration ---
maxdepth = 18  # existing depth cap
maxcount = 1000000
maxsize = 1000000
follow_symlinks = False
follow_windows_shortcuts = True

# For cycle protection when following links
def canonical(path: str) -> str:
    try:
        # realpath resolves symlinks and dot components; on Windows, works since Py 3.8
        return os.path.realpath(path)
    except Exception:
        return os.path.abspath(path)

def stat_times(path: str):
    """Return (unix, iso) modified times or (None, None) if not available."""
    try:
        st = os.stat(path)
        return st.st_mtime, datetime.fromtimestamp(st.st_mtime).isoformat()
    except Exception:
        return None, None

# --- Windows .lnk resolver (tries pylnk3, winshell, then win32com) ---
def resolve_windows_lnk(lnk_path: str):
    """
    Try multiple strategies to resolve a .lnk shortcut target.
    Returns (target_path, resolver_name) or (None, None).
    """
    if not sys.platform.startswith("win"):
        return None, None

    # Try pylnk3
    try:
        import pylnk3  # type: ignore
        # pylnk3.parse accepts a file-like or a filename; try filename first
        try:
            link_obj = pylnk3.parse(lnk_path)
        except Exception:
            with open(lnk_path, "rb") as f:
                link_obj = pylnk3.parse(f)
        target = getattr(link_obj, "path", None)
        if not target:
            # Some builds expose header.target; use if present
            header = getattr(link_obj, "header", None)
            target = getattr(header, "target", None)
        if target:
            return target, "pylnk3"
    except Exception:
        pass

    # Try winshell
    try:
        import winshell  # type: ignore
        sc = winshell.shortcut(lnk_path)
        target = getattr(sc, "path", None)
        if target:
            return target, "winshell"
    except Exception:
        pass

    # Try Windows Script Host via pywin32
    try:
        import win32com.client  # type: ignore
        shell = win32com.client.Dispatch("WScript.Shell")
        shortcut = shell.CreateShortCut(lnk_path)
        target = getattr(shortcut, "Targetpath", None)
        if target:
            return target, "win32com"
    except Exception:
        pass

    return None, None

def append_file_node(parent_children_list, dir_path, name, entry_stat, mod_unix, mod_iso, via_link_info=None):
    try:
        file_size = entry_stat.st_size
        ext = os.path.splitext(name)[1][1:].strip()
        node = {
            'path': os.path.normpath(dir_path),
            'name': name,
            'type': ext,
            'value': file_size,
            'last_modified_unix': mod_unix,
            'last_modified_iso': mod_iso
        }
        if via_link_info:
            node['via_link'] = via_link_info
        parent_children_list.append(node)
    except Exception as e:
        node = {
            'path': os.path.normpath(dir_path),
            'name': name,
            'type': os.path.splitext(name)[1][1:].strip(),
            'value': '0',
            'error': str(e),
            'last_modified_unix': mod_unix,
            'last_modified_iso': mod_iso
        }
        if via_link_info:
            node['via_link'] = via_link_info
        parent_children_list.append(node)

def create_folder_structure_json_bfs(path, current_depth=0, visited_paths=None):
    """
    Scans a folder structure using BFS and returns a JSON-compatible dictionary.
    Adds explicit nodes for symlinks and Windows .lnk shortcuts; then (optionally)
    follows their targets and inserts the target as a separate node, marking it
    with `via_link` metadata. Depth limit and basic cycle protection apply.
    """
    if visited_paths is None:
        visited_paths = set()

    root_canon = canonical(path)
    result = {
        'path': os.path.normpath(path),
        'name': os.path.basename(path),
        'type': 'folder',
        'value': '0',  # Placeholder
        'children': []
    }

    if not os.path.isdir(path):
        if not os.path.exists(path):
            result['error'] = "Path does not exist."
        elif not os.path.isdir(path):
            result['error'] = "Not a directory."
        return result

    mod_unix, mod_iso = stat_times(path)
    result['last_modified_unix'] = mod_unix
    result['last_modified_iso'] = mod_iso

    queue = deque()
    queue.append((path, result['children'], current_depth))

    # Mark the starting directory visited to reduce repeated scans via links
    visited_paths.add(root_canon)

    while queue:
        current_dir_path, parent_children_list, current_level = queue.popleft()
        try:
            with os.scandir(current_dir_path) as entries:
                for entry in entries:
                    # Get stat without following symlinks to avoid unexpected recursion
                    try:
                        entry_stat = entry.stat(follow_symlinks=False)
                        mod_time_unix = entry_stat.st_mtime
                        mod_time_iso = datetime.fromtimestamp(mod_time_unix).isoformat()
                    except Exception as e:
                        entry_stat = None
                        mod_time_unix = None
                        mod_time_iso = None
                        print(f"Warning: Could not get stat for '{entry.path}': {e}", file=sys.stderr)

                    # --- Handle symlinks explicitly ---
                    if entry.is_symlink():
                        print(f"Following shortcut: {entry.path}")
                        link_target = None
                        try:
                            # realpath gives a canonical absolute path (resolves relative readlink)
                            link_target = canonical(entry.path)
                        except Exception:
                            # fallback: raw readlink + abspath relative to current dir
                            try:
                                raw = os.readlink(entry.path)
                                link_target = os.path.abspath(os.path.join(os.path.dirname(entry.path), raw))
                            except Exception:
                                link_target = None

                        symlink_node = {
                            'path': os.path.normpath(current_dir_path),
                            'name': entry.name,
                            'type': 'symlink',
                            'value': '0',
                            'link_target': link_target,
                            'target_exists': (os.path.exists(link_target) if link_target else False),
                            'last_modified_unix': mod_time_unix,
                            'last_modified_iso': mod_time_iso
                        }
                        parent_children_list.append(symlink_node)

                        # Optionally follow the symlink to its destination (extra node), respecting depth
                        if follow_symlinks and link_target and os.path.exists(link_target):
                            tgt_canon = canonical(link_target)
                            via = {'type': 'symlink', 'source': os.path.normpath(entry.path)}
                            if os.path.isdir(link_target):
                                # Add folder node and enqueue (if depth allows and not visited)
                                folder_node = {
                                    'path': os.path.normpath(link_target),
                                    'name': os.path.basename(link_target),
                                    'type': 'shortcut',
                                    'value': '1',
                                    'children': [],
                                    'last_modified_unix': stat_times(link_target),
                                }
                                # The above returns a tuple; split to assign properly:
                                lmu, lmi = stat_times(link_target)
                                folder_node['last_modified_unix'] = lmu
                                folder_node['last_modified_iso'] = lmi
                                folder_node['via_link'] = via
                                parent_children_list.append(folder_node)
                                if current_level < maxdepth and tgt_canon not in visited_paths:
                                    visited_paths.add(tgt_canon)
                                    queue.append((link_target, folder_node['children'], current_level + 1))
                            else:
                                # File target: append a file node
                                try:
                                    tstat = os.stat(link_target)
                                except Exception:
                                    tstat = None
                                append_file_node(
                                    parent_children_list,
                                    os.path.dirname(link_target),
                                    os.path.basename(link_target),
                                    tstat or entry_stat,
                                    mod_time_unix, mod_time_iso,
                                    via_link_info=via
                                )
                        continue  # proceed to next entry

                    # --- Handle folders ---
                    if entry.is_dir(follow_symlinks=False):
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
                        if current_level < maxdepth:
                            canon_sub = canonical(entry.path)
                            if canon_sub not in visited_paths:
                                visited_paths.add(canon_sub)
                                queue.append((entry.path, folder_node['children'], current_level + 1))
                        continue

                    # --- Handle files (including .lnk) ---
                    if entry.is_file(follow_symlinks=False):
                        name_lower = entry.name.lower()
                        is_lnk = name_lower.endswith(".lnk")
                        if is_lnk and follow_windows_shortcuts:
                            target, resolver = resolve_windows_lnk(entry.path)
                            # Record the shortcut itself as a node
                            shortcut_node = {
                                'path': os.path.normpath(current_dir_path),
                                'name': entry.name,
                                'type': 'shortcut',
                                'shortcut_kind': 'lnk',
                                'value': '0',
                                'last_modified_unix': mod_time_unix,
                                'last_modified_iso': mod_time_iso,
                                'link_target': target,
                                'target_exists': (os.path.exists(target) if target else False),
                                'resolver': resolver
                            }
                            parent_children_list.append(shortcut_node)

                            # Follow target (extra node) if we resolved it
                            if target and os.path.exists(target):
                                print(f"Following shortcut: {target}")
                                tgt_canon = canonical(target)
                                via = {'type': 'lnk', 'source': os.path.normpath(entry.path), 'resolver': resolver}
                                if os.path.isdir(target):
                                    folder_node = {
                                        'path': os.path.normpath(target),
                                        'name': os.path.basename(target),
                                        'type': 'folder',
                                        'value': '1',
                                        'via_link': via,
                                        'children': []
                                    }
                                    lmu, lmi = stat_times(target)
                                    folder_node['last_modified_unix'] = lmu
                                    folder_node['last_modified_iso'] = lmi
                                    parent_children_list.append(folder_node)
                                    if current_level < maxdepth and tgt_canon not in visited_paths:
                                        visited_paths.add(tgt_canon)
                                        queue.append((target, folder_node['children'], current_level + 1))
                                else:
                                    try:
                                        tstat = os.stat(target)
                                        tmu, tmi = tstat.st_mtime, datetime.fromtimestamp(tstat.st_mtime).isoformat()
                                    except Exception:
                                        tstat = None
                                        tmu, tmi = None, None
                                    append_file_node(
                                        parent_children_list,
                                        os.path.dirname(target),
                                        os.path.basename(target),
                                        tstat or entry_stat,
                                        tmu, tmi,
                                        via_link_info=via
                                    )
                            else:
                                # If unresolved, still include the original file node as a .lnk (for completeness)
                                append_file_node(
                                    parent_children_list,
                                    os.path.normpath(current_dir_path),
                                    entry.name,
                                    entry_stat,
                                    mod_time_unix, mod_time_iso,
                                    via_link_info={'type': 'lnk', 'source': os.path.normpath(entry.path), 'resolver': resolver or 'unresolved'}
                                )
                        else:
                            # Normal file
                            append_file_node(
                                parent_children_list,
                                os.path.normpath(current_dir_path),
                                entry.name,
                                entry_stat,
                                mod_time_unix, mod_time_iso
                            )
                        continue

        except Exception as e:
            print(f"Error accessing directory '{current_dir_path}': {e}", file=sys.stderr)

    return result

def scan_folder_concurrently(root_path):
    """
    Scans a folder structure; top-level subdirectories are scanned concurrently.
    Link following happens inside each BFS worker with its own visited set.
    """
    overall_result = {
        'path': os.path.normpath(root_path),
        'name': os.path.basename(root_path),
        'type': 'folder',
        'value': '0',
        'children': []
    }
    if not os.path.isdir(root_path):
        overall_result['error'] = "Root path is not a valid directory."
        return overall_result

    lmu, lmi = stat_times(root_path)
    overall_result['last_modified_unix'] = lmu
    overall_result['last_modified_iso'] = lmi

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
        # We no longer skip symlinks entirely; they are handled below.
        if entry.is_dir(follow_symlinks=False):
            sub_dirs_to_scan.append(entry.path)
        elif entry.is_file(follow_symlinks=False):
            files_at_root.append(entry)
        elif entry.is_symlink():
            files_at_root.append(entry)  # handle symlink node inclusion uniformly

    # Handle files & shortcuts at root
    for file_entry in files_at_root:
        try:
            entry_stat = file_entry.stat(follow_symlinks=False)
            file_size = entry_stat.st_size if not file_entry.is_symlink() else 0
            ext = os.path.splitext(file_entry.name)[1][1:].strip()
            m_unix = entry_stat.st_mtime
            m_iso = datetime.fromtimestamp(m_unix).isoformat()

            if file_entry.is_symlink():
                # Symlink node + follow target (extra node)
                link_target = canonical(file_entry.path)
                symlink_node = {
                    'path': os.path.normpath(root_path),
                    'name': file_entry.name,
                    'type': 'symlink',
                    'value': '0',
                    'link_target': link_target,
                    'target_exists': (os.path.exists(link_target) if link_target else False),
                    'last_modified_unix': m_unix,
                    'last_modified_iso': m_iso
                }
                overall_result['children'].append(symlink_node)
                if follow_symlinks and link_target and os.path.exists(link_target):
                    via = {'type': 'symlink', 'source': os.path.normpath(file_entry.path)}
                    if os.path.isdir(link_target):
                        folder_node = {
                            'path': os.path.normpath(link_target),
                            'name': os.path.basename(link_target),
                            'type': 'folder',
                            'value': '1',
                            'children': [],
                            'via_link': via
                        }
                        lmu, lmi = stat_times(link_target)
                        folder_node['last_modified_unix'] = lmu
                        folder_node['last_modified_iso'] = lmi
                        overall_result['children'].append(folder_node)
                        # Enqueue if depth allows (depth 1 for top-level)
                        if 1 <= maxdepth:
                            sub_dirs_to_scan.append(link_target)
                    else:
                        append_file_node(
                            overall_result['children'],
                            os.path.dirname(link_target),
                            os.path.basename(link_target),
                            entry_stat,
                            m_unix, m_iso,
                            via_link_info=via
                        )
            else:
                # Normal or .lnk file at root
                name_lower = file_entry.name.lower()
                if name_lower.endswith(".lnk") and follow_windows_shortcuts:
                    target, resolver = resolve_windows_lnk(file_entry.path)
                    shortcut_node = {
                        'path': os.path.normpath(root_path),
                        'name': file_entry.name,
                        'type': 'shortcut',
                        'shortcut_kind': 'lnk',
                        'value': '0',
                        'last_modified_unix': m_unix,
                        'last_modified_iso': m_iso,
                        'link_target': target,
                        'target_exists': (os.path.exists(target) if target else False),
                        'resolver': resolver
                    }
                    overall_result['children'].append(shortcut_node)
                    if target and os.path.exists(target):
                        via = {'type': 'lnk', 'source': os.path.normpath(file_entry.path), 'resolver': resolver}
                        if os.path.isdir(target):
                            folder_node = {
                                'path': os.path.normpath(target),
                                'name': os.path.basename(target),
                                'type': 'folder',
                                'value': '1',
                                'children': [],
                                'via_link': via
                            }
                            lmu, lmi = stat_times(target)
                            folder_node['last_modified_unix'] = lmu
                            folder_node['last_modified_iso'] = lmi
                            overall_result['children'].append(folder_node)
                            if 1 <= maxdepth:
                                sub_dirs_to_scan.append(target)
                        else:
                            try:
                                tstat = os.stat(target)
                                tmu, tmi = tstat.st_mtime, datetime.fromtimestamp(tstat.st_mtime).isoformat()
                            except Exception:
                                tstat = None
                                tmu, tmi = None, None
                            append_file_node(
                                overall_result['children'],
                                os.path.dirname(target),
                                os.path.basename(target),
                                tstat or entry_stat,
                                tmu, tmi,
                                via_link_info=via
                            )
                else:
                    # Regular file at root
                    overall_result['children'].append({
                        'path': os.path.normpath(root_path),
                        'name': file_entry.name,
                        'type': ext,
                        'value': file_size,
                        'last_modified_unix': m_unix,
                        'last_modified_iso': m_iso
                    })
        except Exception as e:
            m_unix = None
            m_iso = None
            overall_result['children'].append({
                'path': os.path.normpath(root_path),
                'name': file_entry.name,
                'type': os.path.splitext(file_entry.name)[1][1:].strip(),
                'value': '0',
                'error': str(e),
                'last_modified_unix': m_unix,
                'last_modified_iso': m_iso
            })

    # Concurrently scan subdirectories (and any followed link-folders we added)
    with concurrent.futures.ThreadPoolExecutor(max_workers=os.cpu_count() * 2) as executor:
        # Each BFS gets its own visited set. If you remove depth limits later and want
        # global cycle prevention, consider sharing a thread-safe set.
        future_to_dir = {executor.submit(create_folder_structure_json_bfs, sub_dir, 1, set()): sub_dir
                         for sub_dir in sub_dirs_to_scan}
        for future in concurrent.futures.as_completed(future_to_dir):
            sub_dir_path = future_to_dir[future]
            try:
                data = future.result()
                overall_result['children'].append(data)
                print(f"Finished scanning: {sub_dir_path}")
            except Exception as exc:
                print(f"Scanning {sub_dir_path} generated an exception: {exc}", file=sys.stderr)
                overall_result['children'].append({
                    'path': os.path.normpath(sub_dir_path),
                    'name': os.path.basename(sub_dir_path),
                    'type': 'folder',
                    'value': '1',
                    'error': str(exc),
                    'children': [],
                    'last_modified_unix': None,
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
        # print('This script will follow all paths. Set the maximum depth:')
        # maxdepth = input()
        if output_file:
            print("Scanning folder, this may take a minute...")
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
