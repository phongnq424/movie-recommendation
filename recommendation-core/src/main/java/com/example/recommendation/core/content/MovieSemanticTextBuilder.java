package com.example.recommendation.core.content;

public final class MovieSemanticTextBuilder {

    private MovieSemanticTextBuilder() {
    }

    public static String build(
            String title,
            String originalTitle,
            String description,
            Integer releaseYear,
            String genres,
            String mainCast) {
        StringBuilder builder = new StringBuilder();

        appendLine(builder, "Title", title);
        appendLine(builder, "Original title", originalTitle);

        if (releaseYear != null) {
            appendLine(builder, "Release year", String.valueOf(releaseYear));
        }

        appendLine(builder, "Genres", genres);
        appendLine(builder, "Main cast", mainCast);
        appendLine(builder, "Description", description);

        return normalizeWhitespace(builder.toString());
    }

    private static void appendLine(StringBuilder builder, String label, String value) {
        if (value == null || value.isBlank()) {
            return;
        }

        builder.append(label)
                .append(": ")
                .append(value.trim())
                .append('.')
                .append('\n');
    }

    private static String normalizeWhitespace(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll("\\s+", " ").trim();
    }
}