import argparse
import json
import os
import time
from typing import Dict, List, Optional, Tuple

# Defaults (can be overridden via CLI flags)
DEFAULT_IMAGE_DIRS = ["src/images", "images"]
DEFAULT_OUTPUT_FILE = "src/js/gallery_data.js"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def _title_from_filename(filename: str) -> str:
    """Create a human-ish title from filename (e.g., 'my-photo_01.jpg' -> 'My Photo 01')."""
    base = os.path.splitext(os.path.basename(filename))[0]
    return base.replace("-", " ").replace("_", " ").strip().title()


def choose_image_dir(preferred: Optional[str] = None) -> str:
    """
    Pick an images directory.
    - If preferred is provided, use it if it exists.
    - Otherwise pick the first existing directory in DEFAULT_IMAGE_DIRS.
    - If both exist, prefer the one with more image files.
    """
    if preferred:
        if os.path.isdir(preferred):
            return preferred
        raise FileNotFoundError(f"Image directory not found: {preferred}")

    existing: List[str] = [d for d in DEFAULT_IMAGE_DIRS if os.path.isdir(d)]
    if not existing:
        raise FileNotFoundError(
            f"No images directory found. Create one of: {', '.join(DEFAULT_IMAGE_DIRS)}"
        )

    if len(existing) == 1:
        return existing[0]

    counts: List[Tuple[int, str]] = [(count_images(d), d) for d in existing]
    counts.sort(reverse=True)
    return counts[0][1]


def count_images(image_dir: str) -> int:
    count = 0
    for root, _, files in os.walk(image_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ALLOWED_EXTENSIONS:
                count += 1
    return count


def get_images(image_dir: str) -> List[Dict[str, str]]:
    images: List[Dict[str, str]] = []

    # Walk through the directory (supports subfolders too)
    for root, _, files in os.walk(image_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                continue

            rel_path = os.path.relpath(os.path.join(root, file), image_dir).replace("\\", "/")
            images.append({"filename": rel_path, "title": _title_from_filename(file)})

    # Deterministic output
    images.sort(key=lambda x: x["filename"].lower())
    return images


def generate_js_file(images: List[Dict[str, str]], output_file: str) -> None:
    header = (
        "// AUTO-GENERATED FILE. DO NOT EDIT BY HAND.\n"
        "// Run: python update_gallery.py\n\n"
    )
    js_content = header + f"const galleryImages = {json.dumps(images, indent=4)};\n"

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"Generated {output_file} with {len(images)} images.")


def _dir_state(image_dir: str) -> Tuple[int, float]:
    """
    Lightweight fingerprint for changes: (image_count, newest_mtime).
    Good enough for a simple watch loop without extra dependencies.
    """
    image_count = 0
    newest = 0.0
    for root, _, files in os.walk(image_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                continue
            image_count += 1
            try:
                mtime = os.path.getmtime(os.path.join(root, file))
                newest = max(newest, mtime)
            except OSError:
                # File might be mid-copy; ignore and catch it next tick.
                pass
    return image_count, newest


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate src/js/gallery_data.js from images in src/images (or images/)."
    )
    parser.add_argument(
        "--images",
        dest="images_dir",
        default=None,
        help="Path to images directory (defaults to auto-detect: src/images or images).",
    )
    parser.add_argument(
        "--output",
        dest="output_file",
        default=DEFAULT_OUTPUT_FILE,
        help=f"Output JS file (default: {DEFAULT_OUTPUT_FILE}).",
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Watch the images directory and re-generate on changes.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Watch polling interval seconds (default: 1.0).",
    )

    args = parser.parse_args()

    image_dir = choose_image_dir(args.images_dir)
    print(f"Using images directory: {image_dir}")

    def build_once() -> None:
        images = get_images(image_dir)
        generate_js_file(images, args.output_file)

    build_once()

    if not args.watch:
        return 0

    print("Watching for changes... (Ctrl+C to stop)")
    last_state = _dir_state(image_dir)
    try:
        while True:
            time.sleep(max(args.interval, 0.25))
            state = _dir_state(image_dir)
            if state != last_state:
                last_state = state
                build_once()
    except KeyboardInterrupt:
        print("\nStopped watching.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
