import http from "k6/http";
import { check, group, sleep } from "k6";

export const options = {
    stages: [
        { duration: "30s", target: 20 },
        { duration: "1m", target: 20 },

        { duration: "30s", target: 50 },
        { duration: "1m", target: 50 },

        { duration: "30s", target: 100 },
        { duration: "2m", target: 100 },

        { duration: "30s", target: 0 },
    ],
    thresholds: {
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(95)<1000"],
        checks: ["rate>=0.95"],
    },
    summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

const TEST_EMAIL = __ENV.TEST_EMAIL || "";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "";

const DEFAULT_SEARCH_QUERY = __ENV.SEARCH_QUERY || "a";
const DEFAULT_MOVIE_SLUG = __ENV.MOVIE_SLUG || "";

function parseJson(response) {
    try {
        return response.json();
    } catch (error) {
        return null;
    }
}

function extractAccessToken(loginJson) {
    if (!loginJson) return "";

    return (
        loginJson.accessToken ||
        loginJson.access_token ||
        loginJson.token ||
        loginJson.data?.accessToken ||
        loginJson.data?.access_token ||
        loginJson.data?.token ||
        ""
    );
}

function extractMovieList(json) {
    if (!json) return [];

    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.content)) return json.content;
    if (Array.isArray(json.items)) return json.items;

    if (Array.isArray(json.data?.content)) return json.data.content;
    if (Array.isArray(json.data?.items)) return json.data.items;
    if (Array.isArray(json.data?.movies)) return json.data.movies;

    return [];
}

function extractSlug(movie) {
    if (!movie) return "";

    return (
        movie.slug ||
        movie.movieSlug ||
        movie.data?.slug ||
        ""
    );
}

export function setup() {
    let accessToken = "";
    let movieSlug = DEFAULT_MOVIE_SLUG;

    if (TEST_EMAIL && TEST_PASSWORD) {
        const loginResponse = http.post(
            `${BASE_URL}/api/auth/login`,
            JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const loginJson = parseJson(loginResponse);
        accessToken = extractAccessToken(loginJson);

        check(loginResponse, {
            "login status is 200": (r) => r.status === 200,
            "login returns access token": () => accessToken !== "",
        });
    }

    if (!movieSlug) {
        const moviesResponse = http.get(`${BASE_URL}/api/movies/published?limit=10`);
        const moviesJson = parseJson(moviesResponse);
        const movies = extractMovieList(moviesJson);

        movieSlug = extractSlug(movies[0]);

        check(moviesResponse, {
            "setup movies status is 200": (r) => r.status === 200,
        });
    }

    return {
        accessToken,
        movieSlug,
    };
}

export default function (data) {
    const authHeaders = data.accessToken
        ? {
            Authorization: `Bearer ${data.accessToken}`,
        }
        : {};

    group("Movies APIs", function () {
        const moviesResponse = http.get(`${BASE_URL}/api/movies/published?limit=20`);

        check(moviesResponse, {
            "published movies status is 200": (r) => r.status === 200,
            "published movies response time < 1000ms": (r) => r.timings.duration < 1000,
        });

        const searchResponse = http.get(
            `${BASE_URL}/api/movies/published/search?keyword=${encodeURIComponent(DEFAULT_SEARCH_QUERY)}&limit=20`
        );

        check(searchResponse, {
            "movie search status is 200": (r) => r.status === 200,
            "movie search response time < 1000ms": (r) => r.timings.duration < 1000,
        });

        if (data.movieSlug) {
            const detailResponse = http.get(
                `${BASE_URL}/api/movies/slug/${data.movieSlug}/detail`
            );

            check(detailResponse, {
                "movie detail status is 200": (r) => r.status === 200,
                "movie detail response time < 1000ms": (r) => r.timings.duration < 1000,
            });
        }
    });

    group("Recommendation APIs", function () {
        const publicRecommendationResponse = http.get(
            `${BASE_URL}/api/recommendations/public?limit=20`
        );

        check(publicRecommendationResponse, {
            "public recommendation status is 200": (r) => r.status === 200,
            "public recommendation response time < 1000ms": (r) => r.timings.duration < 1000,
        });

        if (data.accessToken) {
            const personalRecommendationResponse = http.get(
                `${BASE_URL}/api/recommendations/me?limit=20`,
                {
                    headers: authHeaders,
                }
            );

            check(personalRecommendationResponse, {
                "personal recommendation status is 200": (r) => r.status === 200,
                "personal recommendation response time < 1000ms": (r) => r.timings.duration < 1000,
            });
        }
    });

    sleep(1);
}