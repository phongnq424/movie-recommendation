import argparse
import csv
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


TMDB_API_BASE = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

IMAGE_FIELDS = [
    "posterPath",
    "posterUrl",
    "backdropPath",
    "backdropUrl",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Enrich MovieLens movies.csv using TMDb tmdbId from links.csv."
    )

    parser.add_argument(
        "--dataDir",
        required=True,
        help="Path to MovieLens dataset directory containing movies.csv and links.csv.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output CSV path. Default: <dataDir>/movie_metadata_enriched.csv",
    )
    parser.add_argument(
        "--language",
        default="en-US",
        help="TMDb metadata language. Default: en-US.",
    )
    parser.add_argument(
        "--sleepSeconds",
        type=float,
        default=0.25,
        help="Sleep after each worker request. Default: 0.25 seconds.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Max movies to process. 0 means no limit.",
    )
    parser.add_argument(
        "--topCast",
        type=int,
        default=8,
        help="Number of top cast members to keep. Default: 8.",
    )
    parser.add_argument(
        "--retryErrors",
        action="store_true",
        help="Retry rows previously written with status ERROR.",
    )
    parser.add_argument(
        "--forceRefresh",
        action="store_true",
        help="Ignore existing output rows and fetch all movies again.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="Number of parallel workers. Default: 8.",
    )
    parser.add_argument(
        "--checkpointEvery",
        type=int,
        default=50,
        help="Save checkpoint after this many completed movies. Default: 50.",
    )
    parser.add_argument(
        "--posterSize",
        default="w500",
        help="TMDb poster image size. Default: w500.",
    )
    parser.add_argument(
        "--backdropSize",
        default="w1280",
        help="TMDb backdrop image size. Default: w1280.",
    )

    return parser.parse_args()


def get_token() -> str:
    token = os.environ.get("TMDB_READ_ACCESS_TOKEN", "").strip()

    if not token:
        raise RuntimeError(
            "Missing TMDB_READ_ACCESS_TOKEN environment variable. "
            "Run: export TMDB_READ_ACCESS_TOKEN='your_token_here'"
        )

    return token


def build_tmdb_image_url(path: str | None, size: str) -> str:
    value = str(path or "").strip()

    if not value:
        return ""

    if not value.startswith("/"):
        value = f"/{value}"

    return f"{TMDB_IMAGE_BASE}/{size}{value}"


def read_movies(movies_path: Path) -> dict[str, dict[str, str]]:
    movies: dict[str, dict[str, str]] = {}

    with movies_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            movie_id = (row.get("movieId") or "").strip()

            if not movie_id:
                continue

            movies[movie_id] = {
                "movieId": movie_id,
                "title": row.get("title") or "",
                "genres": row.get("genres") or "",
            }

    return movies


def normalize_imdb_id(imdb_id: str) -> str:
    value = (imdb_id or "").strip()

    if not value:
        return ""

    if value.startswith("tt"):
        return value

    return f"tt{value.zfill(7)}"


def read_links(links_path: Path) -> dict[str, dict[str, str]]:
    links: dict[str, dict[str, str]] = {}

    with links_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            movie_id = (row.get("movieId") or "").strip()

            if not movie_id:
                continue

            imdb_id = normalize_imdb_id(row.get("imdbId") or "")
            tmdb_id = (row.get("tmdbId") or "").strip()

            links[movie_id] = {
                "movieId": movie_id,
                "imdbId": imdb_id,
                "tmdbId": tmdb_id,
            }

    return links


def read_existing_output(output_path: Path) -> dict[str, dict[str, str]]:
    if not output_path.exists():
        return {}

    existing: dict[str, dict[str, str]] = {}

    with output_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            movie_id = (row.get("movieId") or "").strip()

            if movie_id:
                existing[movie_id] = row

    return existing


def write_all_rows(output_path: Path, rows: dict[str, dict[str, Any]]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "movieId",
        "imdbId",
        "tmdbId",
        "movielensTitle",
        "movielensGenres",
        "tmdbTitle",
        "tmdbOriginalTitle",
        "overview",
        "posterPath",
        "posterUrl",
        "backdropPath",
        "backdropUrl",
        "tmdbGenres",
        "topCast",
        "directors",
        "keywords",
        "runtime",
        "releaseDate",
        "voteAverage",
        "voteCount",
        "popularity",
        "source",
        "status",
        "error",
    ]

    with output_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()

        for movie_id in sorted(rows.keys(), key=lambda value: int(value)):
            row = rows[movie_id]
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def tmdb_get_json(
    token: str,
    path: str,
    params: dict[str, str],
    max_retries: int = 5,
) -> dict[str, Any]:
    query = urlencode(params)
    url = f"{TMDB_API_BASE}{path}?{query}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "MovieRecommendationOfflineEvaluation/1.0",
    }

    attempt = 0

    while True:
        request = Request(url, headers=headers, method="GET")

        try:
            with urlopen(request, timeout=30) as response:
                body = response.read().decode("utf-8")
                return json.loads(body)

        except HTTPError as error:
            status = error.code

            if status == 429 and attempt < max_retries:
                retry_after = error.headers.get("Retry-After")

                if retry_after:
                    wait_seconds = float(retry_after)
                else:
                    wait_seconds = min(60.0, 2.0 ** attempt)

                print(f"429 rate limited. Sleeping {wait_seconds:.1f}s", file=sys.stderr)
                time.sleep(wait_seconds)
                attempt += 1
                continue

            if 500 <= status < 600 and attempt < max_retries:
                wait_seconds = min(60.0, 2.0 ** attempt)
                print(f"TMDb server error {status}. Sleeping {wait_seconds:.1f}s", file=sys.stderr)
                time.sleep(wait_seconds)
                attempt += 1
                continue

            error_body = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"TMDb HTTP {status}: {error_body}") from error

        except URLError as error:
            if attempt < max_retries:
                wait_seconds = min(60.0, 2.0 ** attempt)
                print(f"Network error. Sleeping {wait_seconds:.1f}s: {error}", file=sys.stderr)
                time.sleep(wait_seconds)
                attempt += 1
                continue

            raise RuntimeError(f"Network error: {error}") from error


def join_names(items: list[dict[str, Any]], key: str = "name", limit: int | None = None) -> str:
    values: list[str] = []

    for item in items:
        value = str(item.get(key) or "").strip()

        if value and value not in values:
            values.append(value)

        if limit is not None and len(values) >= limit:
            break

    return "|".join(values)


def extract_directors(crew: list[dict[str, Any]]) -> str:
    directors = []

    for person in crew:
        job = str(person.get("job") or "").strip()
        name = str(person.get("name") or "").strip()

        if job == "Director" and name and name not in directors:
            directors.append(name)

    return "|".join(directors)


def build_enriched_row(
    movie: dict[str, str],
    link: dict[str, str],
    details: dict[str, Any],
    top_cast: int,
    poster_size: str,
    backdrop_size: str,
) -> dict[str, Any]:
    credits = details.get("credits") or {}
    keywords_object = details.get("keywords") or {}

    cast = credits.get("cast") or []
    crew = credits.get("crew") or []
    keyword_items = keywords_object.get("keywords") or []

    genres = details.get("genres") or []

    poster_path = details.get("poster_path") or ""
    backdrop_path = details.get("backdrop_path") or ""

    return {
        "movieId": movie["movieId"],
        "imdbId": link.get("imdbId") or "",
        "tmdbId": link.get("tmdbId") or "",
        "movielensTitle": movie.get("title") or "",
        "movielensGenres": movie.get("genres") or "",
        "tmdbTitle": details.get("title") or "",
        "tmdbOriginalTitle": details.get("original_title") or "",
        "overview": details.get("overview") or "",
        "posterPath": poster_path,
        "posterUrl": build_tmdb_image_url(poster_path, poster_size),
        "backdropPath": backdrop_path,
        "backdropUrl": build_tmdb_image_url(backdrop_path, backdrop_size),
        "tmdbGenres": join_names(genres),
        "topCast": join_names(cast, limit=top_cast),
        "directors": extract_directors(crew),
        "keywords": join_names(keyword_items),
        "runtime": details.get("runtime") or "",
        "releaseDate": details.get("release_date") or "",
        "voteAverage": details.get("vote_average") or "",
        "voteCount": details.get("vote_count") or "",
        "popularity": details.get("popularity") or "",
        "source": "TMDB",
        "status": "FOUND",
        "error": "",
    }


def build_missing_tmdb_row(movie: dict[str, str], link: dict[str, str]) -> dict[str, Any]:
    return {
        "movieId": movie["movieId"],
        "imdbId": link.get("imdbId") or "",
        "tmdbId": link.get("tmdbId") or "",
        "movielensTitle": movie.get("title") or "",
        "movielensGenres": movie.get("genres") or "",
        "tmdbTitle": "",
        "tmdbOriginalTitle": "",
        "overview": "",
        "posterPath": "",
        "posterUrl": "",
        "backdropPath": "",
        "backdropUrl": "",
        "tmdbGenres": "",
        "topCast": "",
        "directors": "",
        "keywords": "",
        "runtime": "",
        "releaseDate": "",
        "voteAverage": "",
        "voteCount": "",
        "popularity": "",
        "source": "MOVIELENS",
        "status": "NO_TMDB_ID",
        "error": "",
    }


def build_error_row(movie: dict[str, str], link: dict[str, str], error: Exception) -> dict[str, Any]:
    message = str(error)

    if len(message) > 1000:
        message = message[:1000]

    return {
        "movieId": movie["movieId"],
        "imdbId": link.get("imdbId") or "",
        "tmdbId": link.get("tmdbId") or "",
        "movielensTitle": movie.get("title") or "",
        "movielensGenres": movie.get("genres") or "",
        "tmdbTitle": "",
        "tmdbOriginalTitle": "",
        "overview": "",
        "posterPath": "",
        "posterUrl": "",
        "backdropPath": "",
        "backdropUrl": "",
        "tmdbGenres": "",
        "topCast": "",
        "directors": "",
        "keywords": "",
        "runtime": "",
        "releaseDate": "",
        "voteAverage": "",
        "voteCount": "",
        "popularity": "",
        "source": "TMDB",
        "status": "ERROR",
        "error": message,
    }


def has_image_columns(row: dict[str, str]) -> bool:
    return all(field in row for field in IMAGE_FIELDS)


def should_skip_existing(
    row: dict[str, str],
    retry_errors: bool,
    require_image_columns: bool,
) -> bool:
    status = (row.get("status") or "").strip()

    if status == "ERROR" and retry_errors:
        return False

    if status == "FOUND" and require_image_columns and not has_image_columns(row):
        return False

    return status in {"FOUND", "NO_TMDB_ID", "ERROR", "NOT_FOUND"}


def process_movie(
    task: dict[str, Any],
    token: str,
    language: str,
    top_cast: int,
    sleep_seconds: float,
    poster_size: str,
    backdrop_size: str,
) -> tuple[int, str, str, dict[str, Any], str]:
    index = task["index"]
    movie = task["movie"]
    link = task["link"]

    movie_id = movie["movieId"]
    tmdb_id = (link.get("tmdbId") or "").strip()

    if not tmdb_id:
        row = build_missing_tmdb_row(movie, link)
        message = f"[{index}] movieId={movie_id} NO_TMDB_ID {movie.get('title')}"
        return index, movie_id, "NO_TMDB_ID", row, message

    try:
        details = tmdb_get_json(
            token=token,
            path=f"/movie/{tmdb_id}",
            params={
                "language": language,
                "append_to_response": "credits,keywords",
            },
        )

        row = build_enriched_row(
            movie=movie,
            link=link,
            details=details,
            top_cast=top_cast,
            poster_size=poster_size,
            backdrop_size=backdrop_size,
        )

        message = f"[{index}] movieId={movie_id} tmdbId={tmdb_id} FOUND {movie.get('title')}"
        status = "FOUND"

    except Exception as error:
        row = build_error_row(movie, link, error)
        message = f"[{index}] movieId={movie_id} tmdbId={tmdb_id} ERROR {error}"
        status = "ERROR"

    if sleep_seconds > 0:
        time.sleep(sleep_seconds)

    return index, movie_id, status, row, message


def build_pending_tasks(
    movies: dict[str, dict[str, str]],
    links: dict[str, dict[str, str]],
    existing_rows: dict[str, dict[str, Any]],
    retry_errors: bool,
    limit: int,
    force_refresh: bool,
) -> tuple[list[dict[str, Any]], int]:
    tasks: list[dict[str, Any]] = []
    skipped = 0

    for movie_id in sorted(movies.keys(), key=lambda value: int(value)):
        if limit > 0 and len(tasks) >= limit:
            break

        existing = existing_rows.get(movie_id)

        if (
            not force_refresh
            and existing
            and should_skip_existing(
                row=existing,
                retry_errors=retry_errors,
                require_image_columns=True,
            )
        ):
            skipped += 1
            continue

        movie = movies[movie_id]
        link = links.get(movie_id, {"movieId": movie_id, "imdbId": "", "tmdbId": ""})

        tasks.append(
            {
                "index": len(tasks) + 1,
                "movie_id": movie_id,
                "movie": movie,
                "link": link,
            }
        )

    return tasks, skipped


def main() -> None:
    args = parse_args()
    token = get_token()

    data_dir = Path(args.dataDir)
    movies_path = data_dir / "movies.csv"
    links_path = data_dir / "links.csv"
    output_path = Path(args.output) if args.output else data_dir / "movie_metadata_enriched.csv"

    if not movies_path.exists():
        raise FileNotFoundError(f"Missing movies.csv: {movies_path}")

    if not links_path.exists():
        raise FileNotFoundError(f"Missing links.csv: {links_path}")

    movies = read_movies(movies_path)
    links = read_links(links_path)

    if args.forceRefresh:
        rows: dict[str, dict[str, Any]] = {}
    else:
        rows = read_existing_output(output_path)

    tasks, skipped = build_pending_tasks(
        movies=movies,
        links=links,
        existing_rows=rows,
        retry_errors=args.retryErrors,
        limit=args.limit,
        force_refresh=args.forceRefresh,
    )

    print(f"Movies loaded : {len(movies)}")
    print(f"Links loaded  : {len(links)}")
    print(f"Existing rows : {len(rows)}")
    print(f"Pending tasks : {len(tasks)}")
    print(f"Workers       : {args.workers}")
    print(f"Poster size   : {args.posterSize}")
    print(f"Backdrop size : {args.backdropSize}")
    print(f"Force refresh : {args.forceRefresh}")
    print(f"Output        : {output_path}")

    processed = 0
    found = 0
    errors = 0
    no_tmdb = 0

    if not tasks:
        write_all_rows(output_path, rows)
        print("Done. Nothing to process.")
        print(f"processed={processed}")
        print(f"found={found}")
        print(f"no_tmdb={no_tmdb}")
        print(f"errors={errors}")
        print(f"skipped_existing={skipped}")
        print(f"output={output_path}")
        return

    max_workers = max(1, args.workers)
    checkpoint_every = max(1, args.checkpointEvery)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_task = {
            executor.submit(
                process_movie,
                task,
                token,
                args.language,
                args.topCast,
                args.sleepSeconds,
                args.posterSize,
                args.backdropSize,
            ): task
            for task in tasks
        }

        for future in as_completed(future_to_task):
            task = future_to_task[future]
            movie = task["movie"]
            link = task["link"]
            movie_id = task["movie_id"]

            try:
                _, completed_movie_id, status, row, message = future.result()

            except Exception as error:
                completed_movie_id = movie_id
                status = "ERROR"
                row = build_error_row(movie, link, error)
                message = f"[{task['index']}] movieId={movie_id} ERROR {error}"

            rows[completed_movie_id] = row
            processed += 1

            if status == "FOUND":
                found += 1
                print(f"[{processed}/{len(tasks)}] {message}")

            elif status == "NO_TMDB_ID":
                no_tmdb += 1
                print(f"[{processed}/{len(tasks)}] {message}")

            else:
                errors += 1
                print(f"[{processed}/{len(tasks)}] {message}", file=sys.stderr)

            if processed % checkpoint_every == 0:
                write_all_rows(output_path, rows)
                print(
                    "Checkpoint saved. "
                    f"rows={len(rows)} "
                    f"processed={processed} "
                    f"found={found} "
                    f"no_tmdb={no_tmdb} "
                    f"errors={errors}"
                )

    write_all_rows(output_path, rows)

    print("Done.")
    print(f"processed={processed}")
    print(f"found={found}")
    print(f"no_tmdb={no_tmdb}")
    print(f"errors={errors}")
    print(f"skipped_existing={skipped}")
    print(f"output={output_path}")


if __name__ == "__main__":
    main()